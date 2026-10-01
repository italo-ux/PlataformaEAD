import { useEffect, useRef, useState } from "react";
import type {
  PlaybackSessionInfo,
  PlaybackState,
  PlaybackUpdate,
} from "../services/journeyService";
import { JourneyRequestError } from "../services/journeyService";

import { loadYoutubeApi, getYoutubeVideoId, type YoutubePlayer } from "../utils/youtube";

interface TrackedYoutubePlayerProps {
  videoUrl: string;
  title: string;
  resumeAt: number;
  completed: boolean;
  onStart: (position: number) => Promise<PlaybackSessionInfo>;
  onHeartbeat: (
    sessionId: string,
    input: { sequencia: number; posicao_segundos: number; estado: PlaybackState },
  ) => Promise<PlaybackUpdate>;
  onEnd: (
    sessionId: string,
    input: { sequencia: number; posicao_segundos: number },
  ) => Promise<PlaybackUpdate>;
  onUpdate: (update: PlaybackUpdate) => void;
  onError: (message: string) => void;
}

export default function TrackedYoutubePlayer({
  videoUrl,
  title,
  resumeAt,
  completed,
  onStart,
  onHeartbeat,
  onEnd,
  onUpdate,
  onError,
}: TrackedYoutubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YoutubePlayer | null>(null);
  const sessionRef = useRef<PlaybackSessionInfo | null>(null);
  const queueRef = useRef(Promise.resolve());
  const requestInFlightRef = useRef(false);
  const playingRef = useRef(false);
  const callbacksRef = useRef({ onStart, onHeartbeat, onEnd, onUpdate, onError });
  const resumeAtRef = useRef(resumeAt);
  const completedRef = useRef(completed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    callbacksRef.current = { onStart, onHeartbeat, onEnd, onUpdate, onError };
    completedRef.current = completed;
  }, [completed, onEnd, onError, onHeartbeat, onStart, onUpdate]);

  useEffect(() => {
    const videoId = getYoutubeVideoId(videoUrl);
    if (!videoId || !containerRef.current) {
      callbacksRef.current.onError("A URL desta aula não é um vídeo válido do YouTube.");
      return;
    }
    let disposed = false;
    let interval: number | undefined;

    const ensureSession = async (position: number) => {
      if (sessionRef.current) return sessionRef.current;
      const session = await callbacksRef.current.onStart(position);
      if (!disposed) sessionRef.current = session;
      return session;
    };

    const submit = (state: PlaybackState, close = false) => {
      const player = playerRef.current;
      if (!player || completedRef.current) return;
      const position = player.getCurrentTime();
      queueRef.current = queueRef.current
        .then(async () => {
          requestInFlightRef.current = true;
          let session = await ensureSession(position);
          const sequence = session.sequencia + 1;
          try {
            const update = close
              ? await callbacksRef.current.onEnd(session.id, {
                  sequencia: sequence,
                  posicao_segundos: position,
                })
              : await callbacksRef.current.onHeartbeat(session.id, {
                  sequencia: sequence,
                  posicao_segundos: position,
                  estado: state,
                });
            session = { ...session, sequencia: update.sequencia };
            sessionRef.current = close || state === "ended" ? null : session;
            callbacksRef.current.onUpdate(update);
          } catch (reason) {
            if (reason instanceof JourneyRequestError && reason.status === 409) {
              sessionRef.current = null;
              if (!close && state === "playing" && !disposed) {
                await ensureSession(position);
              }
              return;
            }
            throw reason;
          } finally {
            requestInFlightRef.current = false;
          }
        })
        .catch((reason: unknown) =>
          callbacksRef.current.onError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível salvar o progresso.",
          ),
        );
    };

    void loadYoutubeApi()
      .then((YT) => {
        if (disposed || !containerRef.current) return;
        playerRef.current = new YT.Player(containerRef.current, {
          videoId,
          playerVars: { controls: 1, rel: 0, modestbranding: 1, enablejsapi: 1 },
          events: {
            onReady: ({ target }) => {
              if (resumeAtRef.current > 0 && !completedRef.current) {
                target.seekTo(resumeAtRef.current, true);
              }
              setReady(true);
            },
            onStateChange: ({ data }) => {
              playingRef.current = data === YT.PlayerState.PLAYING;
              if (data === YT.PlayerState.PLAYING) submit("playing");
              if (data === YT.PlayerState.PAUSED) submit("paused");
              if (data === YT.PlayerState.ENDED) submit("ended");
            },
            onError: () => {
              playingRef.current = false;
              callbacksRef.current.onError(
                "O vídeo está indisponível ou não permite reprodução incorporada.",
              );
            },
          },
        });
        interval = window.setInterval(() => {
          if (playingRef.current) {
            submit("playing");
          }
        }, 5000);
      })
      .catch((reason: unknown) =>
        callbacksRef.current.onError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar o player do YouTube.",
        ),
      );

    const flush = () => {
      const player = playerRef.current;
      const session = sessionRef.current;
      if (!player || !session || requestInFlightRef.current || completedRef.current) return;
      requestInFlightRef.current = true;
      void callbacksRef.current
        .onEnd(session.id, {
          sequencia: session.sequencia + 1,
          posicao_segundos: player.getCurrentTime(),
        })
        .catch(() => undefined);
      sessionRef.current = null;
    };
    window.addEventListener("pagehide", flush);
    return () => {
      disposed = true;
      playingRef.current = false;
      if (interval) window.clearInterval(interval);
      window.removeEventListener("pagehide", flush);
      const player = playerRef.current;
      if (player && sessionRef.current && !completedRef.current) {
        const position = player.getCurrentTime();
        void queueRef.current.then(() => {
          const latestSession = sessionRef.current;
          if (!latestSession) return;
          sessionRef.current = null;
          return callbacksRef.current
            .onEnd(latestSession.id, {
              sequencia: latestSession.sequencia + 1,
              posicao_segundos: position,
            })
            .catch(() => undefined);
        });
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoUrl]);

  return (
    <div className="relative aspect-video bg-slate-950" aria-label={title}>
      <div ref={containerRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-sm font-semibold text-white">
          Preparando vídeo e sessão segura...
        </div>
      )}
    </div>
  );
}
