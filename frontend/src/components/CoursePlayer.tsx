import { Play, ArrowLeft } from "lucide-react";

interface CoursePlayerProps {
  title: string;
  currentLesson: string;
  image: string;
  onBack?: () => void;
}

export default function CoursePlayer({
  title,
  currentLesson,
  image,
  onBack
}: CoursePlayerProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium transition w-fit"
      >
        <ArrowLeft size={20} />
        Voltar para cursos
      </button>

      {/* Video Player Area */}
      <div className="relative w-full bg-black rounded-2xl overflow-hidden aspect-video shadow-lg">
        {/* Thumbnail Image */}
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Play Button */}
        <button className="absolute inset-0 flex items-center justify-center hover:bg-black/20 transition group">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-700 transition transform group-hover:scale-110">
            <Play size={40} className="text-white fill-white ml-1" />
          </div>
        </button>

        {/* Current Lesson Info - Bottom Left */}
        <div className="absolute bottom-6 left-6 text-white">
          <p className="text-sm opacity-90 font-medium">Aula atual</p>
          <p className="text-xl font-bold">{currentLesson}</p>
        </div>

        {/* Course Title - Top Right */}
        <div className="absolute top-6 right-6 bg-white/95 backdrop-blur px-4 py-2 rounded-lg max-w-xs">
          <p className="text-gray-900 font-bold text-sm">{title}</p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-2">
        <button className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium flex items-center justify-center gap-2">
          ← Item anterior
        </button>
        <button className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2">
          Próximo item →
        </button>
      </div>
    </div>
  );
}
