import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import YoutubeDurationPreview from "../components/YoutubeDurationPreview";
import * as youtube from "../utils/youtube";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("waits for metadata and captures duration once, then destroys the preview", async () => {
  let options: ConstructorParameters<NonNullable<Window["YT"]>["Player"]>[1];
  const destroy = vi.fn();
  const getDuration = vi.fn().mockReturnValue(0);
  class Player {
    destroy = destroy;
    getDuration = getDuration;
    getCurrentTime = () => 0;
    seekTo = vi.fn();
    constructor(_element: HTMLElement, config: typeof options) { options = config; }
  }
  vi.spyOn(youtube, "loadYoutubeApi").mockResolvedValue({
    Player, PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
  });
  const onDuration = vi.fn();
  const view = render(<YoutubeDurationPreview videoUrl="https://youtu.be/dQw4w9WgXcQ" onDuration={onDuration} />);
  await waitFor(() => expect(options).toBeDefined());
  const target = new Player(document.createElement("div"), options!);
  act(() => options!.events.onReady({ target }));
  expect(onDuration).not.toHaveBeenCalled();
  getDuration.mockReturnValue(125);
  await waitFor(() => expect(onDuration).toHaveBeenCalledWith(125));
  act(() => options!.events.onStateChange({ target, data: 1 }));
  expect(onDuration).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(destroy).toHaveBeenCalledTimes(1);
});

it("ignores a pending player load after the video is removed", async () => {
  let resolve!: (value: NonNullable<Window["YT"]>) => void;
  const load = vi.spyOn(youtube, "loadYoutubeApi").mockReturnValue(new Promise((done) => { resolve = done; }));
  const onDuration = vi.fn();
  const view = render(<YoutubeDurationPreview videoUrl="https://youtu.be/dQw4w9WgXcQ" onDuration={onDuration} />);
  await waitFor(() => expect(load).toHaveBeenCalled());
  view.unmount();
  const Player = vi.fn();
  resolve({ Player, PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 } });
  await Promise.resolve();
  expect(Player).not.toHaveBeenCalled();
  expect(onDuration).not.toHaveBeenCalled();
});
