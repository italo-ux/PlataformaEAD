import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TrackedYoutubePlayer from "../components/TrackedYoutubePlayer";
import type { PlaybackUpdate } from "../services/journeyService";

let playerPosition = 0;
let playerState = 1;
let getPlayerState = vi.fn<() => number>();
let playerEvents: {
  onReady: (event: { target: unknown }) => void;
  onStateChange: (event: { data: number; target: unknown }) => void;
  onError: () => void;
};

const update = (sequence: number): PlaybackUpdate => ({
  sequencia: sequence,
  creditado: sequence > 1,
  motivo: sequence > 1 ? "continuo" : "sem_movimento",
  aula: { percentual: sequence > 1 ? 50 : 0, posicao_segundos: playerPosition, concluida: false },
  matricula: { progresso: sequence > 1 ? 25 : 0, conclusao: false },
  proxima_aula_id: "lesson-1",
});

beforeEach(() => {
  playerPosition = 0;
  playerState = 1;
  getPlayerState = vi.fn(() => playerState);
  class PlayerMock {
    constructor(_element: HTMLElement, options: { events: typeof playerEvents }) {
      playerEvents = options.events;
      playerEvents.onReady({ target: this });
    }
    destroy() {}
    getCurrentTime() {
      return playerPosition;
    }
    getPlayerState() {
      return getPlayerState();
    }
    seekTo(seconds: number) {
      playerPosition = seconds;
    }
  }
  Object.defineProperty(window, "YT", {
    configurable: true,
    value: {
      Player: PlayerMock,
      PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
    },
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "YT");
});

describe("TrackedYoutubePlayer", () => {
  it("sends periodic heartbeats without consulting an unready player method", async () => {
    vi.useFakeTimers();
    getPlayerState.mockImplementation(() => {
      throw new TypeError("getPlayerState is not ready");
    });
    const onStart = vi.fn().mockResolvedValue({
      id: "session-1",
      sequencia: 0,
      duracao_segundos: 10,
      heartbeat_segundos: 5,
      expira_em: "2026-09-13T12:00:20.000Z",
    });
    const onHeartbeat = vi
      .fn()
      .mockImplementation((_id: string, input: { sequencia: number }) =>
        Promise.resolve(update(input.sequencia)),
      );

    render(
      <TrackedYoutubePlayer
        videoUrl="https://youtu.be/dQw4w9WgXcQ"
        title="Aula"
        resumeAt={0}
        completed={false}
        onStart={onStart}
        onHeartbeat={onHeartbeat}
        onEnd={vi.fn().mockResolvedValue(update(3))}
        onUpdate={vi.fn()}
        onError={vi.fn()}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      playerEvents.onStateChange({ data: 1, target: {} });
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(onHeartbeat).toHaveBeenCalledTimes(1);

    playerPosition = 5;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(onHeartbeat).toHaveBeenCalledTimes(2);
    expect(getPlayerState).not.toHaveBeenCalled();
  });

  it("opens a session, serializes heartbeats and closes on pagehide", async () => {
    const onStart = vi.fn().mockResolvedValue({
      id: "session-1",
      sequencia: 0,
      duracao_segundos: 10,
      heartbeat_segundos: 5,
      expira_em: "2026-09-13T12:00:20.000Z",
    });
    const onHeartbeat = vi
      .fn()
      .mockImplementation((_id: string, input: { sequencia: number }) =>
        Promise.resolve(update(input.sequencia)),
      );
    const onEnd = vi
      .fn()
      .mockImplementation((_id: string, input: { sequencia: number }) =>
        Promise.resolve(update(input.sequencia)),
      );
    const onUpdate = vi.fn();

    render(
      <TrackedYoutubePlayer
        videoUrl="https://youtu.be/dQw4w9WgXcQ"
        title="Aula"
        resumeAt={0}
        completed={false}
        onStart={onStart}
        onHeartbeat={onHeartbeat}
        onEnd={onEnd}
        onUpdate={onUpdate}
        onError={vi.fn()}
      />,
    );

    await waitFor(() => expect(playerEvents).toBeDefined());
    await act(async () => playerEvents.onStateChange({ data: 1, target: {} }));
    await waitFor(() => expect(onHeartbeat).toHaveBeenCalledTimes(1));
    expect(onStart).toHaveBeenCalledWith(0);
    expect(onHeartbeat.mock.calls[0][1]).toMatchObject({ sequencia: 1, estado: "playing" });

    playerPosition = 5;
    playerState = 2;
    await act(async () => playerEvents.onStateChange({ data: 2, target: {} }));
    await waitFor(() => expect(onHeartbeat).toHaveBeenCalledTimes(2));
    expect(onHeartbeat.mock.calls[1][1]).toMatchObject({
      sequencia: 2,
      posicao_segundos: 5,
      estado: "paused",
    });

    window.dispatchEvent(new Event("pagehide"));
    await waitFor(() => expect(onEnd).toHaveBeenCalledTimes(1));
    expect(onEnd.mock.calls[0][1]).toMatchObject({ sequencia: 3, posicao_segundos: 5 });
    expect(onUpdate).toHaveBeenCalledTimes(2);
  });
});
