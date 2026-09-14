export function extractYoutubeVideoId(videoUrl: string): string | null {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    let candidate: string | null = null;
    if (host === 'youtu.be') {
      candidate = url.pathname.split('/').filter(Boolean)[0] ?? null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') candidate = url.searchParams.get('v');
      else {
        const parts = url.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live'].includes(parts[0])) {
          candidate = parts[1] ?? null;
        }
      }
    }
    return candidate && /^[A-Za-z0-9_-]{11}$/.test(candidate)
      ? candidate
      : null;
  } catch {
    return null;
  }
}
