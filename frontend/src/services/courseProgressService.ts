const STORAGE_PREFIX = "ead.started-courses";

function storageKey(userId: string | number) {
  return `${STORAGE_PREFIX}.${userId}`;
}

export function getStartedCourseIds(userId: string | number): string[] {
  try {
    const value = JSON.parse(
      localStorage.getItem(storageKey(userId)) ?? "[]",
    ) as unknown;
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function isCourseStarted(userId: string | number, courseId: string) {
  return getStartedCourseIds(userId).includes(courseId);
}

export function markCourseAsStarted(userId: string | number, courseId: string) {
  const startedCourseIds = new Set(getStartedCourseIds(userId));
  startedCourseIds.add(courseId);
  localStorage.setItem(storageKey(userId), JSON.stringify([...startedCourseIds]));
}
