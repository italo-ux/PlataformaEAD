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

  it('não conta intervalos pequenos que não foram assistidos', () => {
    expect(mergeWatchedRanges([[0, 40]], [40.2, 90])).toEqual([
      [0, 40],
      [40.2, 90],
    ]);
  });

  it('normalizes invalid negative boundaries without adding coverage', () => {
    expect(mergeWatchedRanges([], [-5, 4])).toEqual([[0, 4]]);
  });
});

describe('trusted progress policy', () => {
  it('não conclui uma aula de vídeo pela cobertura assistida', () => {
    const progress = {
      intervalos_assistidos: [[0, 89.999]],
      concluida: false,
      concluida_em: null,
    } as import('./progresso-aula.entity').ProgressoAula;
    updateLessonCoverage(progress, 100);
    expect(progress.percentual).toBe(89.99);
    expect(progress.concluida).toBe(false);
    progress.intervalos_assistidos = [[0, 90]];
    updateLessonCoverage(progress, 100);
    expect(progress.concluida).toBe(false);
    expect(progress.percentual).toBe(90);
  });

  it('trims legacy ranges without automatically completing the lesson', () => {
    const progress = {
      intervalos_assistidos: trimWatchedRanges([[0, 120]], 100),
      concluida: false,
      concluida_em: null,
    } as import('./progresso-aula.entity').ProgressoAula;
    expect(updateLessonCoverage(progress, 100)).toBe(100);
    expect(progress.percentual).toBe(99);
    expect(progress.concluida).toBe(false);
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
