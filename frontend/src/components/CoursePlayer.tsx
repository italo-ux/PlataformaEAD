import { ArrowLeft, Play } from "lucide-react";

interface CoursePlayerProps {
  title: string;
  currentLesson: string;
  lessonContent: string;
  lessonDuration: string;
  image: string;
  onBack?: () => void;
}

export default function CoursePlayer({
  title,
  currentLesson,
  lessonContent,
  lessonDuration,
  image,
  onBack,
}: CoursePlayerProps) {
  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onBack}
        className="flex w-fit items-center gap-2 text-xs font-medium text-gray-700 transition hover:text-blue-600"
      >
        <ArrowLeft size={14} />
        Voltar para cursos
      </button>

      <div className="relative w-full overflow-hidden rounded-md bg-black shadow-sm">
        <div className="aspect-[16/8.2] min-h-[240px]">
          <img src={image} alt={title} className="h-full w-full object-cover" />
        </div>

        <div className="absolute inset-0 bg-black/40" />

        <button
          className="absolute inset-0 flex items-center justify-center transition hover:bg-black/20 group"
          aria-label={`Reproduzir aula ${currentLesson}`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 transition group-hover:scale-105 group-hover:bg-blue-700">
            <Play size={30} className="ml-1 fill-white text-white" />
          </div>
        </button>

        <div className="absolute bottom-5 left-5 max-w-[75%] text-white">
          <p className="text-xs font-bold">Aula atual</p>
          <p className="text-lg font-black leading-tight">{currentLesson}</p>
          <p className="mt-1 text-xs font-semibold text-blue-100">
            {lessonDuration}
          </p>
        </div>

        <div className="absolute right-5 top-5 max-w-xs rounded-md bg-white/95 px-4 py-2 backdrop-blur">
          <p className="text-xs font-black text-gray-900">{title}</p>
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-black text-gray-900">Conteudo da aula</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">{lessonContent}</p>
      </div>
    </div>
  );
}
