interface ProgressSectionProps {
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

export default function ProgressSection({
  progress,
  completedLessons,
  totalLessons
}: ProgressSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Title with Progress Percentage */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Seu Progresso</h3>
        <span className="text-2xl font-bold text-blue-600">{progress}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-4">
        <div
          className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Progress Text */}
      <p className="text-gray-700 text-sm font-medium">
        <span className="text-blue-600 font-bold">{completedLessons}</span> de{" "}
        <span className="text-blue-600 font-bold">{totalLessons}</span> aulas
        concluídas
      </p>
    </div>
  );
}
