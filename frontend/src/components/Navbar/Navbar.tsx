import { useEffect, useState } from "react";
import {
  Award,
  FilePenLine,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/navbar/logo.png";
import sidebarLogo from "../../assets/navbar/logo-sidebar.png";
import type { User } from "../../data/userMock";
import { clearAuthenticatedUser } from "../../services/userService";

import courseService from "../../services/courseService";
import certificateService from "../../services/certificateService";
import journeyService, {
  type EnrollmentSummary,
} from "../../services/journeyService";

const mainItems = [
  { to: "/home", label: "HOME", icon: Home },
  { to: "/courses", label: "CURSOS", icon: BookOpen },
  { to: "/feedback", label: "FEEDBACKS", icon: MessageSquareText },
  { to: "/quem-somos", label: "QUEM SOMOS", icon: UsersRound },
];

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

function AuthenticatedNavigation({ user }: { user: User }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [nextCourse, setNextCourse] = useState<EnrollmentSummary | null>(null);
  const [certificateCount, setCertificateCount] = useState<number | null>(null);
  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const [summaryUnavailable, setSummaryUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refreshSummary = async () => {
      if (user.role === "aluno") {
        const results = await Promise.allSettled([
          journeyService.listEnrollments(),
          certificateService.list(),
        ]);
        if (cancelled) return;
        const [enrollments, certificates] = results;
        setSummaryUnavailable(enrollments.status === "rejected");
        if (enrollments.status === "fulfilled") {
          const active = enrollments.value
            .filter((item) => !item.conclusao)
            .sort(
              (a, b) =>
                Date.parse(b.data_matricula) - Date.parse(a.data_matricula),
            );
          setNextCourse(active[0] ?? null);
        }
        if (certificates.status === "fulfilled")
          setCertificateCount(certificates.value.length);
      } else if (user.role === "professor") {
        try {
          const courses = await courseService.listCourses();
          if (cancelled) return;
          const owned = courses.filter(
            (course) => String(course.id_instrutor) === String(user.id),
          );
          setCourseCount(owned.length);
          setDraftCount(
            owned.filter((course) => course.status === "rascunho").length,
          );
          setSummaryUnavailable(false);
        } catch {
          if (!cancelled) setSummaryUnavailable(true);
        }
      }
    };
    void refreshSummary();
    window.addEventListener("ead.sidebar.refresh", refreshSummary);
    return () => {
      cancelled = true;
      window.removeEventListener("ead.sidebar.refresh", refreshSummary);
    };
  }, [user.id, user.role, location.pathname, location.search]);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("ead.sidebar.collapsed") === "true",
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminCoursesOpen, setAdminCoursesOpen] = useState(true);

  useEffect(() => {
    document.body.classList.add("authenticated-layout");
    return () => {
      document.body.classList.remove("authenticated-layout");
      document.documentElement.style.removeProperty("--auth-sidebar-width");
    };
  }, []);

  useEffect(() => {
    const width = collapsed ? "76px" : "248px";
    document.documentElement.style.setProperty("--auth-sidebar-width", width);
    localStorage.setItem("ead.sidebar.collapsed", String(collapsed));
  }, [collapsed]);

  const closeMobile = () => setMobileOpen(false);
  const handleLogout = () => {
    clearAuthenticatedUser();
    navigate("/login");
  };

  const roleLabel =
    user.role === "aluno"
      ? "Aluno"
      : user.role === "professor"
        ? "Professor"
        : "Administrador";

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    `group flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
      collapsed ? "lg:justify-center" : ""
    } ${
      isActive
        ? "bg-[#4d87dc] text-white shadow-lg shadow-blue-950/20"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  const labelClass = collapsed ? "lg:sr-only" : "";

  return (
    <div className="h-[72px]">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
          aria-label="Fechar menu lateral"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col overflow-hidden bg-[#172033] text-white shadow-2xl transition-[width,transform] duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-[76px]" : "lg:w-[248px]"}`}
        aria-label="Navegação principal"
      >
        <div
          className={`flex h-[72px] shrink-0 items-center border-b border-white/10 px-3 ${collapsed ? "lg:justify-center" : "justify-between"}`}
        >
          <Link
            to="/home"
            onClick={closeMobile}
            className={
              "flex min-w-0 items-center rounded-xl px-1 py-2 " +
              (collapsed ? "lg:hidden" : "")
            }
            aria-label="Ir para home"
          >
            <img
              src={sidebarLogo}
              alt="Inovação Barueri"
              className="h-11 w-[176px] object-contain"
            />
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCollapsed((current) => !current)}
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white lg:flex"
              aria-label={
                collapsed ? "Expandir menu lateral" : "Recolher menu lateral"
              }
              aria-expanded={!collapsed}
              title={
                collapsed ? "Expandir menu lateral" : "Recolher menu lateral"
              }
            >
              {collapsed ? (
                <PanelLeftOpen size={20} />
              ) : (
                <PanelLeftClose size={20} />
              )}
            </button>
            <button
              type="button"
              onClick={closeMobile}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto">
          <div className={`px-3 pt-5 ${collapsed ? "lg:px-3" : ""}`}>
            <p
              className={`px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 ${labelClass}`}
            >
              Navegação
            </p>
            <nav className="nav-links mt-3 space-y-1.5">
              {mainItems.map((item) => {
                const Icon = item.icon;
                const isAdminCourses =
                  item.to === "/courses" && user.role === "admin";

                return (
                  <div key={item.to}>
                    <div className="relative">
                      <NavLink
                        to={item.to}
                        end={item.to === "/home"}
                        onClick={closeMobile}
                        className={({ isActive }) =>
                          `${itemClass({ isActive })} ${isAdminCourses ? "pr-11" : ""}`
                        }
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon size={20} className="shrink-0" />
                        <span className={labelClass}>{item.label}</span>
                      </NavLink>
                      {isAdminCourses && (
                        <button
                          type="button"
                          onClick={() =>
                            setAdminCoursesOpen((current) => !current)
                          }
                          className={`absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white ${collapsed ? "lg:hidden" : ""}`}
                          aria-label={
                            adminCoursesOpen
                              ? "Fechar submenu de cursos"
                              : "Abrir submenu de cursos"
                          }
                          aria-expanded={adminCoursesOpen}
                          aria-controls="admin-courses-submenu"
                        >
                          <ChevronDown
                            size={17}
                            className={`transition-transform duration-200 ${adminCoursesOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      )}
                    </div>
                    {isAdminCourses && adminCoursesOpen && (
                      <div
                        id="admin-courses-submenu"
                        className={collapsed ? "lg:hidden" : ""}
                      >
                        <NavLink
                          to="/professor/cursos/novo"
                          onClick={closeMobile}
                          className={({ isActive }) =>
                            `group mt-1 flex min-h-10 items-center gap-2 rounded-r-xl border-l-2 px-3 text-xs font-semibold transition ${
                              collapsed
                                ? "lg:justify-center lg:border-l-0"
                                : "ml-6 pl-4"
                            } ${
                              isActive
                                ? "border-blue-300 bg-blue-500/20 text-blue-100"
                                : "border-slate-600 text-slate-400 hover:border-blue-300 hover:bg-white/10 hover:text-white"
                            }`
                          }
                          title={collapsed ? "Adicionar curso" : undefined}
                        >
                          <PlusCircle size={16} className="shrink-0" />
                          <span className={labelClass}>Adicionar curso</span>
                        </NavLink>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="mt-6 px-3">
            <p
              className={`px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 ${labelClass}`}
            >
              Minha área
            </p>
            <div className="mt-3 space-y-1.5">
              {user.role === "aluno" && (
                <>
                  <Link
                    to="/dashboard?aba=certificados"
                    onClick={closeMobile}
                    className={itemClass({
                      isActive:
                        location.pathname === "/dashboard" &&
                        new URLSearchParams(location.search).get("aba") ===
                          "certificados",
                    })}
                    title="Certificados"
                    aria-label="Certificados"
                  >
                    <Award size={20} className="shrink-0" />
                    <span className={labelClass}>Certificados</span>
                    {certificateCount !== null && (
                      <span
                        aria-hidden="true"
                        className={`ml-auto rounded-lg bg-white/10 px-2 py-0.5 text-xs ${collapsed ? "lg:hidden" : ""}`}
                      >
                        {certificateCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
              {user.role === "professor" && (
                <div
                  className={`space-y-1 rounded-2xl border border-white/10 bg-white/5 p-1 ${collapsed ? "lg:border-transparent lg:bg-transparent lg:p-0" : ""}`}
                  aria-label="Gestão dos meus cursos"
                >
                  <Link
                    to="/courses?filtro=meus"
                    onClick={closeMobile}
                    className={itemClass({
                      isActive:
                        location.pathname === "/courses" &&
                        new URLSearchParams(location.search).get("filtro") ===
                          "meus",
                    })}
                    title="Meus cursos"
                    aria-label="Meus cursos"
                  >
                    <BookOpen size={20} className="shrink-0" />
                    <span className={labelClass}>Meus cursos</span>
                    {courseCount !== null && (
                      <span
                        aria-hidden="true"
                        className={`ml-auto rounded-lg bg-white/10 px-2 py-0.5 text-xs ${collapsed ? "lg:hidden" : ""}`}
                      >
                        {courseCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/courses?filtro=rascunhos"
                    onClick={closeMobile}
                    className={itemClass({
                      isActive:
                        location.pathname === "/courses" &&
                        new URLSearchParams(location.search).get("filtro") ===
                          "rascunhos",
                    })}
                    title="Rascunhos"
                    aria-label="Rascunhos"
                  >
                    <FilePenLine size={20} className="shrink-0" />
                    <span className={labelClass}>Rascunhos</span>
                    {draftCount !== null && (
                      <span
                        aria-hidden="true"
                        className={`ml-auto rounded-lg bg-white/10 px-2 py-0.5 text-xs ${collapsed ? "lg:hidden" : ""}`}
                      >
                        {draftCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}
              {user.role === "aluno" && (
                <NavLink
                  to="/dashboard"
                  onClick={closeMobile}
                  className={() =>
                    itemClass({
                      isActive:
                        location.pathname === "/dashboard" &&
                        new URLSearchParams(location.search).get("aba") !==
                          "certificados",
                    })
                  }
                  title={collapsed ? "Meu Desempenho" : undefined}
                >
                  <BarChart3 size={20} className="shrink-0" />
                  <span className={labelClass}>Meu Desempenho</span>
                </NavLink>
              )}
              {user.role === "professor" && (
                <NavLink
                  to="/professor/cursos/novo"
                  onClick={closeMobile}
                  className={itemClass}
                  title={collapsed ? "Adicionar curso" : undefined}
                >
                  <PlusCircle size={20} className="shrink-0" />
                  <span className={labelClass}>Adicionar curso</span>
                </NavLink>
              )}
              {user.role === "admin" && (
                <NavLink
                  to="/admin/estatisticas"
                  onClick={closeMobile}
                  className={itemClass}
                  title={collapsed ? "Estatísticas" : undefined}
                >
                  <BarChart3 size={20} className="shrink-0" />
                  <span className={labelClass}>Estatísticas</span>
                </NavLink>
              )}
            </div>
          </div>

          <div
            className={`mx-3 mb-5 rounded-2xl border border-white/10 bg-white/5 p-4 ${collapsed ? "lg:hidden" : ""}`}
          >
            {user.role === "aluno" ? (
              <>
                <p className="text-xs font-semibold text-blue-300">
                  Sua próxima aula
                </p>
                <p className="mt-2 line-clamp-2 text-sm font-bold">
                  {summaryUnavailable
                    ? "Explore sua jornada"
                    : (nextCourse?.curso.nome ?? "Comece uma nova jornada")}
                </p>
                {nextCourse && (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-blue-400"
                      style={{ width: `${nextCourse.progresso}%` }}
                    />
                  </div>
                )}
                <Link
                  to={
                    nextCourse ? `/courses/${nextCourse.curso.id}` : "/courses"
                  }
                  onClick={closeMobile}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-blue-300 hover:text-white"
                >
                  {nextCourse ? "Continuar curso" : "Explorar cursos"}
                  <ChevronRight size={14} />
                </Link>
              </>
            ) : user.role === "professor" ? (
              <>
                <p className="text-xs font-semibold text-blue-300">
                  Sua sala de criação
                </p>
                <p className="mt-2 text-sm font-bold">
                  {summaryUnavailable || courseCount === null
                    ? "Organize seus próximos cursos"
                    : `${courseCount} cursos · ${draftCount ?? 0} rascunhos`}
                </p>
                <Link
                  to="/professor/cursos/novo"
                  onClick={closeMobile}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-blue-300 hover:text-white"
                >
                  Criar curso
                  <PlusCircle size={14} />
                </Link>
              </>
            ) : (
              <p className="text-xs text-slate-400">
                Gerencie sua plataforma pelo perfil.
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 border-t border-white/10 p-3">
          <div
            className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-2 ${collapsed ? "lg:hidden" : ""}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-xs font-bold text-blue-200">
              {getInitials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.name}</p>
              <p className="text-xs text-slate-400">{roleLabel}</p>
            </div>
          </div>
          <NavLink
            to="/perfil"
            onClick={closeMobile}
            className={itemClass}
            title={collapsed ? "Meu perfil" : undefined}
          >
            <UserRound size={20} className="shrink-0" />
            <span className={labelClass}>Meu perfil</span>
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className={`mt-1.5 flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-300 transition hover:bg-red-500/15 hover:text-red-200 ${collapsed ? "lg:justify-center" : ""}`}
            title={collapsed ? "Sair" : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            <span className={labelClass}>Sair</span>
          </button>
        </div>
      </aside>

      <header className="authenticated-topbar fixed right-0 top-0 z-30 h-[72px] border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-[left] duration-300">
        <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
              aria-label="Abrir menu lateral"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                Ambiente de aprendizagem
              </p>
              <p className="hidden text-sm text-slate-500 sm:block">
                Continue de onde parou
              </p>
            </div>
          </div>

          <Link
            to="/perfil"
            className="flex min-w-0 items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-slate-100"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-200">
              {getInitials(user.name)}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-44 truncate text-sm font-bold text-[#25304a]">
                {user.name}
              </span>
              <span className="block text-xs text-slate-500">{roleLabel}</span>
            </span>
            <ChevronRight
              size={17}
              className="hidden text-slate-400 sm:block"
            />
          </Link>
        </div>
      </header>
    </div>
  );
}

function PublicNavigation({ hideLoginLink }: { hideLoginLink: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <img
            className="h-auto w-36 sm:w-44"
            src={logo}
            alt="Inovação Barueri"
          />
        </div>
        <div className="nav-links hidden items-center gap-7 lg:flex">
          {mainItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          {!hideLoginLink && (
            <Link
              to="/login"
              className="rounded-lg border border-blue-200 px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              Login
            </Link>
          )}
          <Link
            to="/register"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Cadastre-se
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg lg:hidden">
          <div className="space-y-1">
            {mainItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="flex rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
            {!hideLoginLink && (
              <Link
                to="/login"
                className="rounded-lg border border-blue-200 px-4 py-3 text-center text-sm font-semibold text-blue-700"
              >
                Login
              </Link>
            )}
            <Link
              to="/register"
              className="rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Cadastre-se
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function Navbar({
  hideLoginLink = false,
  user,
}: {
  hideLoginLink?: boolean;
  user: User | null;
}) {
  return user ? (
    <AuthenticatedNavigation user={user} />
  ) : (
    <PublicNavigation hideLoginLink={hideLoginLink} />
  );
}
