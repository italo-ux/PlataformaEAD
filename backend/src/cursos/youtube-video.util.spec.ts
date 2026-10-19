import { extractYoutubeVideoId } from './youtube-video.util';

describe('extractYoutubeVideoId', () => {
  it.each([
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('extracts the video id from %s', (url, expected) => {
    expect(extractYoutubeVideoId(url)).toBe(expected);
  });

  it('rejects malformed and unsupported URLs', () => {
    expect(extractYoutubeVideoId('https://example.com/dQw4w9WgXcQ')).toBeNull();
    expect(extractYoutubeVideoId('https://youtu.be/short')).toBeNull();
  });
});
