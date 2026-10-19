import {
  mergeWatchedRanges,
  evaluatePlaybackAdvance,
  trimWatchedRanges,
  updateLessonCoverage,
} from './progress-policy';

describe('mergeWatchedRanges', () => {
  it('does not count repeated or overlapping playback twice', () => {
    expect(
      mergeWatchedRanges(
        [
          [0, 10],
          [20, 30],
        ],
        [5, 25],
      ),
    ).toEqual([[0, 30]]);
  });

  it('preserves real gaps created by a seek', () => {
    expect(mergeWatchedRanges([[0, 8]], [20, 28])).toEqual([
      [0, 8],
      [20, 28],
    ]);
  });

  it('normalizes invalid negative boundaries without adding coverage', () => {
    expect(mergeWatchedRanges([], [-5, 4])).toEqual([[0, 4]]);
  });
});

describe('trusted progress policy', () => {
  it('trims legacy ranges to the official duration and recalculates completion', () => {
    const progress = {
      intervalos_assistidos: trimWatchedRanges([[0, 120]], 100),
      concluida: false,
      concluida_em: null,
    } as import('./progresso-aula.entity').ProgressoAula;
    expect(updateLessonCoverage(progress, 100, new Date())).toBe(100);
    expect(progress.percentual).toBe(100);
    expect(progress.concluida).toBe(true);
  });

  it('accepts continuous playback up to 2x and rejects faster advances', () => {
    expect(
      evaluatePlaybackAdvance({
        ranges: [],
        previousPosition: 0,
        currentPosition: 10,
        elapsedSeconds: 5,
        trustedPlaybackSeconds: 5,
        wasPlaying: true,
      }),
    ).toMatchObject({ credited: true, reason: 'continuo' });
    expect(
      evaluatePlaybackAdvance({
        ranges: [],
        previousPosition: 0,
        currentPosition: 12,
        elapsedSeconds: 5,
        trustedPlaybackSeconds: 5,
        wasPlaying: true,
      }),
    ).toMatchObject({ credited: false, reason: 'salto' });
  });

  it('does not renew the global tolerance through rapid small requests', () => {
    let ranges: [number, number][] = [];
    for (let position = 1; position <= 10; position += 1) {
      ranges = evaluatePlaybackAdvance({
        ranges,
        previousPosition: position - 1,
        currentPosition: position,
        elapsedSeconds: 0.01,
        trustedPlaybackSeconds: position * 0.01,
        wasPlaying: true,
      }).ranges;
    }
    expect(ranges).toEqual([[0, 1]]);
  });
});
