interface ProgressSectionProps {
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

export default function ProgressSection({
  progress,
  completedLessons,
  totalLessons,
}: ProgressSectionProps) {
  return (
    <div className="pt-2">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Seu Progresso</h3>
        <span className="text-sm font-semibold text-gray-900">{progress}%</span>
      </div>

      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs font-medium text-gray-600">
        <span className="text-blue-600">{completedLessons}</span> de{" "}
        {totalLessons} aulas concluídas
      </p>
    </div>
  );
}
