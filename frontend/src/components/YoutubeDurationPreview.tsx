import { useEffect, useRef, useState } from "react";
import { getYoutubeVideoId, loadYoutubeApi, type YoutubePlayer } from "../utils/youtube";

export default function YoutubeDurationPreview({ videoUrl, onDuration }: {
  videoUrl: string;
  onDuration: (seconds: number) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onDuration);
  const [message, setMessage] = useState("Carregando prévia do YouTube...");
  useEffect(() => { callback.current = onDuration; }, [onDuration]);
  useEffect(() => {
    const videoId = getYoutubeVideoId(videoUrl);
    if (!videoId || !/^[\w-]{11}$/.test(videoId)) return;
    let disposed = false;
    let player: YoutubePlayer | undefined;
    let poll: number | undefined;
    let captured = false;
    const capture = (target: YoutubePlayer) => {
      if (disposed || captured) return;
      const seconds = target.getDuration();
      if (!Number.isFinite(seconds) || seconds <= 0) return;
      captured = true;
      window.clearInterval(poll);
      callback.current(Math.round(seconds));
      setMessage("Duração preenchida automaticamente pelo YouTube.");
    };
    const timer = window.setTimeout(() => {
      void loadYoutubeApi().then((YT) => {
        if (disposed || !container.current) return;
        const element = document.createElement("div");
        container.current.replaceChildren(element);
        player = new YT.Player(element, {
          videoId,
          playerVars: { controls: 1, rel: 0, playsinline: 1 },
          events: {
            onReady: ({ target }) => {
              if (disposed) return;
              setMessage("Se a duração não aparecer, inicie o vídeo nesta prévia.");
              capture(target);
              if (!captured) poll = window.setInterval(() => capture(target), 500);
            },
            onStateChange: ({ target }) => capture(target),
            onError: () => {
              if (disposed) return;
              window.clearInterval(poll);
              setMessage("Não foi possível ler este vídeo. Confira o link e a permissão de incorporação ou informe a duração manualmente.");
            },
          },
        });
      }).catch(() => {
        if (!disposed) setMessage("Não foi possível carregar o YouTube. Informe a duração manualmente ou tente novamente com o link.");
      });
    }, 600);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      window.clearInterval(poll);
      player?.destroy();
    };
  }, [videoUrl]);
  const videoId = getYoutubeVideoId(videoUrl);
  if (!videoId || !/^[\w-]{11}$/.test(videoId)) return null;
  return (
    <div className="sm:col-span-2">
      <div ref={container} aria-label="Prévia do vídeo para obter a duração" className="aspect-video overflow-hidden rounded-lg bg-slate-100 [&_iframe]:h-full [&_iframe]:w-full" />
      <p role="status" className="mt-2 text-xs text-slate-600">{message}</p>
    </div>
  );
}
