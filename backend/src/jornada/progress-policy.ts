import { ProgressoAula, WatchedRange } from './progresso-aula.entity';

export const COMPLETION_THRESHOLD = 90;
export const MAX_PLAYBACK_RATE = 2;
export const GLOBAL_JITTER_SECONDS = 1.5;

export type PlaybackCreditReason =
  | 'continuo'
  | 'repeticao'
  | 'salto'
  | 'ancora'
  | 'sem_movimento';

export function mergeWatchedRanges(
  ranges: WatchedRange[],
  nextRange?: WatchedRange,
): WatchedRange[] {
  const sorted = [...ranges, ...(nextRange ? [nextRange] : [])]
    .map(
      ([start, end]) =>
        [Math.max(0, start), Math.max(start, end)] as WatchedRange,
    )
    .sort((a, b) => a[0] - b[0]);
  const merged: WatchedRange[] = [];
  for (const range of sorted) {
    const previous = merged.at(-1);
    if (!previous || range[0] > previous[1] + 0.25) {
      merged.push([...range]);
    } else {
      previous[1] = Math.max(previous[1], range[1]);
    }
  }
  return merged;
}

export function trimWatchedRanges(ranges: WatchedRange[], duration: number) {
  return mergeWatchedRanges(
    ranges
      .map(
        ([start, end]) =>
          [
            Math.max(0, Math.min(start, duration)),
            Math.max(0, Math.min(end, duration)),
          ] as WatchedRange,
      )
      .filter(([start, end]) => end > start),
  );
}

export function watchedSeconds(ranges: WatchedRange[]) {
  return ranges.reduce((total, [start, end]) => total + (end - start), 0);
}

export function evaluatePlaybackAdvance(input: {
  ranges: WatchedRange[];
  previousPosition: number;
  currentPosition: number;
  elapsedSeconds: number;
  trustedPlaybackSeconds: number;
  wasPlaying: boolean;
}): {
  ranges: WatchedRange[];
  credited: boolean;
  reason: PlaybackCreditReason;
} {
  if (!input.wasPlaying) {
    return { ranges: input.ranges, credited: false, reason: 'ancora' };
  }
  const delta = input.currentPosition - input.previousPosition;
  if (delta < -0.01) {
    return { ranges: input.ranges, credited: false, reason: 'salto' };
  }
  if (delta < 0.25) {
    return { ranges: input.ranges, credited: false, reason: 'sem_movimento' };
  }
  const plausibleDelta =
    delta <= input.elapsedSeconds * MAX_PLAYBACK_RATE + GLOBAL_JITTER_SECONDS;
  if (!plausibleDelta) {
    return { ranges: input.ranges, credited: false, reason: 'salto' };
  }
  const candidate = mergeWatchedRanges(input.ranges, [
    input.previousPosition,
    input.currentPosition,
  ]);
  const withinCumulativeBudget =
    watchedSeconds(candidate) <=
    input.trustedPlaybackSeconds * MAX_PLAYBACK_RATE + GLOBAL_JITTER_SECONDS;
  if (!withinCumulativeBudget) {
    return { ranges: input.ranges, credited: false, reason: 'salto' };
  }
  const credited = watchedSeconds(candidate) > watchedSeconds(input.ranges);
  return {
    ranges: candidate,
    credited,
    reason: credited ? 'continuo' : 'repeticao',
  };
}

export function updateLessonCoverage(
  progress: ProgressoAula,
  duration: number,
  now: Date,
) {
  progress.duracao_segundos = duration;
  const uniqueSeconds = watchedSeconds(progress.intervalos_assistidos ?? []);
  progress.percentual = Math.min(
    100,
    Math.round((uniqueSeconds / duration) * 10000) / 100,
  );
  const completed = Number(progress.percentual) >= COMPLETION_THRESHOLD;
  if (completed && !progress.concluida) progress.concluida_em = now;
  if (!completed) progress.concluida_em = null;
  progress.concluida = completed;
  return uniqueSeconds;
}
