import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import logo from "../../assets/navbar/logo.png";
import type { User } from "../../data/userMock";
import Navlinks from "./NavLinks";

const transparentActionClass =
  "bg-transparent border border-blue-500 text-lg text-blue-500 px-7 py-2 rounded-md hover:bg-blue-500 hover:text-white transition";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Navbar({ user }: { user: null | User }) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const isLoggedIn = Boolean(user);

  const closeFeedback = () => {
    setIsFeedbackOpen(false);
  };

  return (
    <nav className="navbar bg-gradient-to-r from-white to-blue-50 flex items-center justify-between w-full px-20 py-4">
      <Link to="/home" className="logo flex-shrink-0" aria-label="Ir para home">
        <img className="h-auto w-55" src={logo} alt="Logo" />
      </Link>

      <ul className="nav-links flex items-center space-x-8 ml-25">
        <li>
          <Navlinks to="/home">HOME</Navlinks>
        </li>
        <li>
          <Navlinks to="/quem-somos">QUEM SOMOS</Navlinks>
        </li>
        <li>
          <Navlinks to="/courses">CURSOS</Navlinks>
        </li>
        <li className="relative">
          <button
            type="button"
            onClick={() => setIsFeedbackOpen((current) => !current)}
            className="flex items-center text-blue-500 text-lg focus:outline-none font-semibold border-b-2 transition hover:text-blue-700"
            aria-expanded={isFeedbackOpen}
          >
            FEEDBACKS
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`w-4 h-4 ml-2 transition-transform duration-300 ${
                isFeedbackOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isFeedbackOpen && (
            <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-md shadow-lg py-2 w-56 z-50">
              <Link
                to="/feedback"
                onClick={closeFeedback}
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition"
              >
                Pagina de feedback
              </Link>
              <Link
                to="/home#quem-somos"
                onClick={closeFeedback}
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition"
              >
                Experiencia da plataforma
              </Link>
              <Link
                to="/home#cursos"
                onClick={closeFeedback}
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition"
              >
                Cursos em andamento
              </Link>
              <Link
                to="/home#contato"
                onClick={closeFeedback}
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition"
              >
                Enviar contato
              </Link>
            </div>
          )}
        </li>
      </ul>

      <div className="flex items-center gap-3">
        <Link to="/home#contato" className={transparentActionClass}>
          <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
          Contato
        </Link>

        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <Link to="/home#cursos" className={transparentActionClass}>
              Meu Desempenho
            </Link>
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.name} avatar`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user ? getInitials(user.name) : "US"}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className={transparentActionClass}>
              Login
            </Link>
            <Link to="/register" className={transparentActionClass}>
              Cadastre-se
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
