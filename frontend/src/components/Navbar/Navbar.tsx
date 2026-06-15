import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faChevronDown,
  faEnvelope,
  faRightFromBracket,
  faUserPen,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/navbar/logo.png";
import {
  canCreateCourses,
  type User,
} from "../../data/userMock";
import { clearAuthenticatedUser } from "../../services/userService";
import Navlinks from "./NavLinks";

const transparentActionClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md border border-blue-500 bg-transparent px-4 py-2 text-sm font-semibold text-blue-500 transition hover:bg-blue-500 hover:text-white xl:px-7 xl:text-lg";

const mobileLinkClass =
  "flex w-full items-center justify-between rounded-md px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700";

const mobileActionClass =
  "inline-flex w-full items-center justify-center rounded-md border border-blue-500 px-4 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50";

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
  const navigate = useNavigate();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isLoggedIn = Boolean(user);
  const showCreateCourseLink = canCreateCourses(user);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isUserMenuOpen]);

  const closeFeedback = () => {
    setIsFeedbackOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsFeedbackOpen(false);
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  const handleToggleUserMenu = () => {
    setIsFeedbackOpen(false);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen((current) => !current);
  };

  const handleToggleMobileMenu = () => {
    setIsFeedbackOpen(false);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen((current) => !current);
  };

  const handleLogout = () => {
    clearAuthenticatedUser();
    closeUserMenu();
    closeMobileMenu();
    navigate("/login");
  };

  const toggleFeedback = () => {
    setIsFeedbackOpen((current) => !current);
  };

  return (
    <nav className="navbar relative z-40 w-full border-b border-blue-100 bg-gradient-to-r from-white to-blue-50">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/home"
          className="logo flex-shrink-0"
          aria-label="Ir para home"
          onClick={closeMobileMenu}
        >
          <img
            className="h-auto w-40 sm:w-48 xl:w-55"
            src={logo}
            alt="Logo"
          />
        </Link>

        <ul className="nav-links hidden items-center gap-5 lg:flex xl:gap-8">
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
              onClick={toggleFeedback}
              className="flex items-center border-b-2 text-sm font-semibold text-blue-500 transition hover:text-blue-700 focus:outline-none xl:text-lg"
              aria-expanded={isFeedbackOpen}
              aria-haspopup="menu"
            >
              FEEDBACKS
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`ml-2 h-4 w-4 transition-transform duration-300 ${
                  isFeedbackOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isFeedbackOpen && (
              <div
                className="absolute left-0 top-full z-50 mt-2 w-56 rounded-md border border-gray-200 bg-white py-2 shadow-lg"
                role="menu"
              >
                <Link
                  to="/feedback"
                  onClick={closeFeedback}
                  className="block px-4 py-2 text-gray-700 transition hover:bg-blue-50"
                >
                  Pagina de feedback
                </Link>
                <Link
                  to="/home#quem-somos"
                  onClick={closeFeedback}
                  className="block px-4 py-2 text-gray-700 transition hover:bg-blue-50"
                >
                  Experiencia da plataforma
                </Link>
                <Link
                  to="/home#cursos"
                  onClick={closeFeedback}
                  className="block px-4 py-2 text-gray-700 transition hover:bg-blue-50"
                >
                  Cursos em andamento
                </Link>
                <Link
                  to="/home#contato"
                  onClick={closeFeedback}
                  className="block px-4 py-2 text-gray-700 transition hover:bg-blue-50"
                >
                  Enviar contato
                </Link>
              </div>
            )}
          </li>
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/home#contato" className={transparentActionClass}>
            <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
            Contato
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              {showCreateCourseLink && (
                <Link
                  to="/professor/cursos/novo"
                  className={transparentActionClass}
                >
                  Adicionar curso
                </Link>
              )}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={handleToggleUserMenu}
                  className="flex items-center gap-2 rounded-full border border-blue-100 bg-white p-1 pr-3 text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Abrir menu do usuario"
                >
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-600 font-semibold text-white">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.name} avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{user ? getInitials(user.name) : "US"}</span>
                    )}
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`h-3 w-3 transition-transform duration-300 ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isUserMenuOpen && user && (
                  <div
                    className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
                    role="menu"
                  >
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-bold text-[#25304a]">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user.email}
                      </p>
                    </div>
                    <div className="py-2">
                      <Link
                        to="/perfil"
                        onClick={closeUserMenu}
                        className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                        role="menuitem"
                      >
                        <FontAwesomeIcon icon={faUserPen} className="h-4 w-4" />
                        Editar perfil
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-600"
                        role="menuitem"
                      >
                        <FontAwesomeIcon
                          icon={faRightFromBracket}
                          className="h-4 w-4"
                        />
                        Sair
                      </button>
                    </div>
                  </div>
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

        <button
          type="button"
          onClick={handleToggleMobileMenu}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-blue-200 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navbar-menu"
          aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          <FontAwesomeIcon
            icon={isMobileMenuOpen ? faXmark : faBars}
            className="h-5 w-5"
          />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          id="mobile-navbar-menu"
          className="border-t border-blue-100 bg-white px-4 pb-5 pt-3 shadow-lg lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {user && (
              <div className="mb-2 flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-sm font-bold text-white">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.name} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(user.name)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#25304a]">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            <Link
              to="/home"
              onClick={closeMobileMenu}
              className={mobileLinkClass}
            >
              HOME
            </Link>
            <Link
              to="/quem-somos"
              onClick={closeMobileMenu}
              className={mobileLinkClass}
            >
              QUEM SOMOS
            </Link>
            <Link
              to="/courses"
              onClick={closeMobileMenu}
              className={mobileLinkClass}
            >
              CURSOS
            </Link>

            <div>
              <button
                type="button"
                onClick={toggleFeedback}
                className={mobileLinkClass}
                aria-expanded={isFeedbackOpen}
                aria-haspopup="menu"
              >
                FEEDBACKS
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`h-4 w-4 transition-transform duration-300 ${
                    isFeedbackOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isFeedbackOpen && (
                <div className="mt-1 rounded-md border border-blue-100 bg-blue-50/60 py-2">
                  <Link
                    to="/feedback"
                    onClick={closeMobileMenu}
                    className="block px-5 py-2 text-sm font-medium text-slate-700"
                  >
                    Pagina de feedback
                  </Link>
                  <Link
                    to="/home#quem-somos"
                    onClick={closeMobileMenu}
                    className="block px-5 py-2 text-sm font-medium text-slate-700"
                  >
                    Experiencia da plataforma
                  </Link>
                  <Link
                    to="/home#cursos"
                    onClick={closeMobileMenu}
                    className="block px-5 py-2 text-sm font-medium text-slate-700"
                  >
                    Cursos em andamento
                  </Link>
                  <Link
                    to="/home#contato"
                    onClick={closeMobileMenu}
                    className="block px-5 py-2 text-sm font-medium text-slate-700"
                  >
                    Enviar contato
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-3 grid gap-3 border-t border-slate-100 pt-4">
              <Link
                to="/home#contato"
                onClick={closeMobileMenu}
                className={mobileActionClass}
              >
                <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                Contato
              </Link>

              {isLoggedIn ? (
                <>
                  {showCreateCourseLink && (
                    <Link
                      to="/professor/cursos/novo"
                      onClick={closeMobileMenu}
                      className={mobileActionClass}
                    >
                      Adicionar curso
                    </Link>
                  )}
                  <Link
                    to="/perfil"
                    onClick={closeMobileMenu}
                    className={mobileActionClass}
                  >
                    <FontAwesomeIcon icon={faUserPen} className="mr-2 h-4 w-4" />
                    Editar perfil
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex w-full items-center justify-center rounded-md border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    <FontAwesomeIcon
                      icon={faRightFromBracket}
                      className="mr-2 h-4 w-4"
                    />
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className={mobileActionClass}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className={mobileActionClass}
                  >
                    Cadastre-se
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
