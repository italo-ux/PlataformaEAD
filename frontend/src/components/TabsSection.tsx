import { useState } from "react";
import type { Instructor } from "../data/courseData";

interface TabsSectionProps {
  about: string;
  instructors: Instructor[];
}

type TabType = "about" | "instructors";

export default function TabsSection({ about, instructors }: TabsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("about");
  const tabLabel = instructors.length > 1 ? "Professores" : "Professor";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Cabecalho das abas */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("about")}
          className={`flex-1 px-6 py-4 font-medium text-center transition ${
            activeTab === "about"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Sobre
        </button>
        <button
          onClick={() => setActiveTab("instructors")}
          className={`flex-1 px-6 py-4 font-medium text-center transition ${
            activeTab === "instructors"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {tabLabel}
        </button>
      </div>

      {/* Conteudo das abas */}
      <div className="p-6">
        {activeTab === "about" && (
          <div className="animate-fadeIn">
            <p className="text-gray-700 leading-relaxed text-base">{about}</p>
          </div>
        )}

        {activeTab === "instructors" && (
          <div className="animate-fadeIn grid gap-4">
            {instructors.map((instructor) => (
              <div
                key={`${instructor.id ?? instructor.name}-${instructor.email ?? ""}`}
                className="flex flex-col gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center"
              >
                {instructor.image && (
                  <img
                    src={instructor.image}
                    alt={instructor.name}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                )}

                <div>
                  <h4 className="text-xl font-bold text-gray-900">
                    {instructor.name}
                  </h4>
                  {instructor.email && (
                    <p className="mt-1 text-sm font-semibold text-blue-600">
                      {instructor.email}
                    </p>
                  )}
                  <p className="mt-3 text-base leading-relaxed text-gray-700">
                    {instructor.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
