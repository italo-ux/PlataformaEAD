import { useState, useEffect, useRef } from "react";
import logo from "../assets/navbar/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faChevronDown } from "@fortawesome/free-solid-svg-icons";

function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const feedbackRef = useRef(null);

  const toggleFeedback = () => {
    setIsFeedbackOpen(!isFeedbackOpen);
  };

  const closeFeedback = () => {
    setIsFeedbackOpen(false);
  };

  return (
    <nav className="navbar bg-gradient-to-r from-white to-blue-50   flex items-center justify-between w-full px-20 py-4 ">
      {/* Logo */}
      <div className="logo flex-shrink-0">
        <img className="h-auto w-55" src={logo} alt="Logo" />
      </div>

      {/* Links centralizados */}
      <ul className="nav-links flex items-center space-x-8 ml-25">
        <li>
          <a
            href="#"
            className="text-blue-500 text-lg font-semibold border-b-2 "
          >
            HOME
          </a>
        </li>
        <li>
          <a
            href="#"
            className="text-blue-500 text-lg font-semibold border-b-2  "
          >
            QUEM SOMOS
          </a>
        </li>
        <li>
          <a
            href="#"
            className="text-blue-500 text-lg font-semibold border-b-2  "
          >
            CURSOS
          </a>
        </li>
        <li className="relative" ref={feedbackRef}>
          <button
            onClick={toggleFeedback}
            className="flex items-center text-blue-500 text-lg focus:outline-none font-semibold border-b-2  "
          >
            FEEDBACKS
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`w-4 h-4 ml-2 transition-transform duration-300 ${
                isFeedbackOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isFeedbackOpen && (
            <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-md shadow-lg py-2 w-48 z-50">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  closeFeedback();
                }}
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition"
              >
                Feedback 1
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  closeFeedback();
                }}
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition"
              >
                Feedback 2
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  closeFeedback();
                }}
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition"
              >
                Feedback 3
              </a>
            </div>
          )}
        </li>
      </ul>

      {/* Botão Contato */}
      <div className="flex space-x-2">
        <button className="bg-transparent border border-blue-500 text-lg text-blue-500 px-7 py-2   rounded-md hover:bg-blue-500 hover:text-white transition flex items-center space-x-2 ">
          <span>Contato</span>
          <FontAwesomeIcon icon={faEnvelope} />
        </button>
        {/*meu desempenho*/}
        {isLoggedIn ? (
          <button className="bg-transparent border border-blue-500 text-lg text-blue-500 px-7 py-2   rounded-md hover:bg-blue-500 hover:text-white transition flex items-center  ">
            <span>Meu Desempenho</span>
          </button>
        ) : (
          <button className="bg-transparent border border-blue-500 text-lg text-blue-500 px-7 py-2    rounded-md hover:bg-blue-500 hover:text-white transition flex items-center ">
            <span>Login</span>
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
