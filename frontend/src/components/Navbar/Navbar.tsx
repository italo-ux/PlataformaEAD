import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faChevronDown,
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
  "flex min-h-11 w-full items-center justify-between rounded-md px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700";

const mobileActionClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md border border-blue-500 px-4 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50";

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

function Navbar({
  hideLoginLink = false,
  user,
}: {
  hideLoginLink?: boolean;
  user: null | User;
}) {
  const navigate = useNavigate();
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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  const handleToggleUserMenu = () => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen((current) => !current);
  };

  const handleToggleMobileMenu = () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen((current) => !current);
  };

  const handleLogout = () => {
    clearAuthenticatedUser();
    closeUserMenu();
    closeMobileMenu();
    navigate("/login");
  };

  return (
    <nav className="navbar sticky top-0 z-40 w-full border-b border-blue-100 bg-gradient-to-r from-white to-blue-50">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3 lg:px-8">
        <Link
          to={isLoggedIn ? "/home" : "#"}
          className="logo flex-shrink-0"
          aria-label={isLoggedIn ? "Ir para home" : "Logo Inovação Barueri"}
          onClick={(event) => {
            if (!isLoggedIn) {
              event.preventDefault();
            }

            closeMobileMenu();
          }}
        >
          <img
            className="h-auto w-32 sm:w-44 xl:w-55"
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
          <li>
            <Navlinks to="/feedback">FEEDBACKS</Navlinks>
          </li>
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className={transparentActionClass}>
                Meu Desempenho
              </Link>
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
                  aria-label="Abrir menu do usuário"
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
                        Meu perfil
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
              {!hideLoginLink && (
                <Link to="/login" className={transparentActionClass}>
                  Login
                </Link>
              )}
              <Link to="/register" className={transparentActionClass}>
                Cadastre-se
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleMobileMenu}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-blue-200 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:h-11 sm:w-11 lg:hidden"
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
          className="max-h-[calc(100vh-57px)] overflow-y-auto border-t border-blue-100 bg-white px-3 pb-5 pt-3 shadow-lg sm:px-6 lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1.5">
            {user && (
              <div className="mb-2 flex min-w-0 items-center gap-3 rounded-lg bg-blue-50 p-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-sm font-bold text-white">
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

            <Link
              to="/feedback"
              onClick={closeMobileMenu}
              className={mobileLinkClass}
            >
              FEEDBACKS
            </Link>

            <div className="mt-3 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
              {isLoggedIn ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={closeMobileMenu}
                    className={mobileActionClass}
                  >
                    Meu Desempenho
                  </Link>
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
                    Meu perfil
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
                  {!hideLoginLink && (
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className={mobileActionClass}
                    >
                      Login
                    </Link>
                  )}
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
