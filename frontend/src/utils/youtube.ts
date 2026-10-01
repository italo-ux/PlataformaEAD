export interface YoutubePlayer {
  destroy: () => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
}
interface YoutubeNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, number>;
      events: {
        onReady: (event: { target: YoutubePlayer }) => void;
        onStateChange: (event: { data: number; target: YoutubePlayer }) => void;
        onError: () => void;
      };
    },
  ) => YoutubePlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}

declare global {
  interface Window {
    YT?: YoutubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YoutubeNamespace> | null = null;

export function loadYoutubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(
      () => reject(new Error("Tempo esgotado ao carregar o player do YouTube.")),
      10000,
    );
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      previous?.();
      resolve(window.YT!);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeout);
        youtubeApiPromise = null;
        reject(new Error("Não foi possível carregar o player do YouTube."));
      };
      document.head.appendChild(script);
    }
  });
  return youtubeApiPromise;
}

export function getYoutubeVideoId(videoUrl: string) {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (host !== "youtube.com" && host !== "m.youtube.com") return null;
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const parts = url.pathname.split("/").filter(Boolean);
    return ["embed", "shorts", "live"].includes(parts[0]) ? parts[1] ?? null : null;
  } catch {
    return null;
  }
}
