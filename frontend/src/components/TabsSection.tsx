import { useState } from "react";
import type { Instructor } from "../data/courseData";

interface TabsSectionProps {
  about: string;
  instructor: Instructor;
}

type TabType = "about" | "instructor";

export default function TabsSection({ about, instructor }: TabsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("about");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Tabs Header */}
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
          onClick={() => setActiveTab("instructor")}
          className={`flex-1 px-6 py-4 font-medium text-center transition ${
            activeTab === "instructor"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Instrutor
        </button>
      </div>

      {/* Tabs Content */}
      <div className="p-6">
        {activeTab === "about" && (
          <div className="animate-fadeIn">
            <p className="text-gray-700 leading-relaxed text-base">{about}</p>
          </div>
        )}

        {activeTab === "instructor" && (
          <div className="animate-fadeIn flex flex-col gap-4">
            {/* Instructor Image */}
            {instructor.image && (
              <img
                src={instructor.image}
                alt={instructor.name}
                className="w-32 h-32 rounded-full object-cover"
              />
            )}

            {/* Instructor Name */}
            <div>
              <h4 className="text-xl font-bold text-gray-900">
                {instructor.name}
              </h4>
            </div>

            {/* Instructor Bio */}
            <p className="text-gray-700 leading-relaxed text-base">
              {instructor.bio}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
