import { Bell, Menu, Settings } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function CourseHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EA</span>
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:inline">
              EadPlatform
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/home"
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Home
            </Link>
            <Link
              to="/home#quem-somos"
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Quem Somos
            </Link>
            <Link
              to="/home#cursos"
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Cursos
            </Link>
            <Link
              to="/home#contato"
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Feedbacks
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Bell size={20} className="text-gray-700" />
            </button>

            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Settings size={20} className="text-gray-700" />
            </button>

            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:shadow-md transition">
              <span className="text-white font-bold text-sm">JD</span>
            </div>

            <button
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Menu size={20} className="text-gray-700" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-2">
            <Link
              to="/home"
              className="text-gray-700 hover:text-blue-600 font-medium py-2 px-2 rounded hover:bg-gray-50 transition"
            >
              Home
            </Link>
            <Link
              to="/home#quem-somos"
              className="text-gray-700 hover:text-blue-600 font-medium py-2 px-2 rounded hover:bg-gray-50 transition"
            >
              Quem Somos
            </Link>
            <Link
              to="/home#cursos"
              className="text-gray-700 hover:text-blue-600 font-medium py-2 px-2 rounded hover:bg-gray-50 transition"
            >
              Cursos
            </Link>
            <Link
              to="/home#contato"
              className="text-gray-700 hover:text-blue-600 font-medium py-2 px-2 rounded hover:bg-gray-50 transition"
            >
              Feedbacks
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
