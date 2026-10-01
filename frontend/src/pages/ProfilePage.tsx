import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  KeyRound,
  Layers3,
  Lock,
  Mail,
  Phone,
  Save,
  Shield,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import AdminUserManagement from "../components/AdminUserManagement";
import AdminTrailManagement from "../components/AdminTrailManagement";
import StudentLearningProfile from "../components/StudentLearningProfile";
import type { User } from "../data/userMock";
import { useAuth } from "../context/auth-context";
import journeyService, {
  type EnrollmentSummary,
} from "../services/journeyService";
import trailService, { type Trilha } from "../services/trailService";
import {
  changeAuthenticatedUserPassword,
  updateAuthenticatedUserProfile,
} from "../services/userService";

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
}

interface PasswordFormValues {
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof ProfileFormValues, string>>;
type PasswordErrors = Partial<Record<keyof PasswordFormValues, string>>;

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

function splitFullName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function mapUserToFormValues(user: User | null): ProfileFormValues {
  const { firstName, lastName } = splitFullName(user?.name ?? "");

  return {
    firstName,
    lastName,
    email: user?.email ?? "",
    cpf: user?.cpf ?? "",
    phone: user?.phone ?? "",
  };
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function validateProfile(values: ProfileFormValues): FormErrors {
  const errors: FormErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cpfDigits = onlyDigits(values.cpf);
  const phoneDigits = onlyDigits(values.phone);

  if (!values.firstName.trim()) {
    errors.firstName = "Informe o nome.";
  }

  if (!values.lastName.trim()) {
    errors.lastName = "Informe o sobrenome.";
  }

  if (!emailPattern.test(values.email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }

  if (cpfDigits.length !== 11) {
    errors.cpf = "Informe um CPF com 11 dígitos.";
  }

  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    errors.phone = "Informe um celular com DDD.";
  }

  return errors;
}

function validatePassword(values: PasswordFormValues): PasswordErrors {
  const errors: PasswordErrors = {};

  if (!values.currentPassword) {
    errors.currentPassword = "Informe a senha atual.";
  }

  if (values.nextPassword.length < 8) {
    errors.nextPassword = "A nova senha deve ter pelo menos 8 caracteres.";
  } else if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[\s\S]+$/.test(
      values.nextPassword,
    )
  ) {
    errors.nextPassword =
      "Use maiúscula, minúscula, número e caractere especial.";
  }

  if (values.nextPassword !== values.confirmPassword) {
    errors.confirmPassword = "As senhas nao conferem.";
  }

  return errors;
}

function TextInput({
  error,
  icon: Icon,
  label,
  name,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  error?: string;
  icon: typeof UserRound;
  label: string;
  name: keyof ProfileFormValues;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
  value: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`h-11 w-full rounded-md border bg-white px-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            error ? "border-red-400" : "border-slate-200"
          }`}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

function PasswordInput({
  error,
  label,
  name,
  onChange,
  value,
}: {
  error?: string;
  label: string;
  name: keyof PasswordFormValues;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        <Lock
          aria-hidden="true"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          id={name}
          name={name}
          type="password"
          value={value}
          onChange={onChange}
          className={`h-11 w-full rounded-md border bg-white px-10 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            error ? "border-red-400" : "border-slate-200"
          }`}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: sessionUser } = useAuth();
  const [user, setUser] = useState<User | null>(sessionUser);
  const [formValues, setFormValues] = useState<ProfileFormValues>(() =>
    mapUserToFormValues(sessionUser),
  );

  useEffect(() => {
    setUser(sessionUser);
    setFormValues(mapUserToFormValues(sessionUser));
  }, [sessionUser]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isTrailManagementOpen, setIsTrailManagementOpen] = useState(false);
  const [passwordValues, setPasswordValues] = useState<PasswordFormValues>({
    currentPassword: "",
    nextPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordGeneralError, setPasswordGeneralError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [studentEnrollments, setStudentEnrollments] = useState<
    EnrollmentSummary[]
  >([]);
  const [followedTrails, setFollowedTrails] = useState<
    Array<Trilha & { enrolledCourseCount: number }>
  >([]);
  const [learningLoading, setLearningLoading] = useState(false);
  const [learningError, setLearningError] = useState("");

  useEffect(() => {
    if (user?.role !== "aluno") {
      setStudentEnrollments([]);
      setFollowedTrails([]);
      setLearningLoading(false);
      return;
    }

    let cancelled = false;
    setLearningLoading(true);
    setLearningError("");
    Promise.all([
      journeyService.listEnrollments(),
      trailService.listFollowing(),
    ])
      .then(([enrollments, trails]) => {
        if (cancelled) return;
        const enrolledCourseIds = new Set(
          enrollments.map((item) => item.curso.id),
        );
        const following = trails.map((trail) => ({
          ...trail,
          enrolledCourseCount: trail.cursos.filter((course) =>
            enrolledCourseIds.has(course.id),
          ).length,
        }));
        setStudentEnrollments(enrollments);
        setFollowedTrails(following);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setLearningError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar seus cursos e trilhas.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLearningLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const displayName =
    `${formValues.firstName} ${formValues.lastName}`.trim() || user.name;

  const handleProfileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setStatusMessage("");
    setGeneralError("");
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
    setErrors((current) => {
      if (!(name in current)) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[name as keyof ProfileFormValues];
      return nextErrors;
    });
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordStatus("");
    setPasswordGeneralError("");
    setPasswordValues((current) => ({
      ...current,
      [name]: value,
    }));
    setPasswordErrors((current) => {
      if (!(name in current)) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[name as keyof PasswordFormValues];
      return nextErrors;
    });
  };

  const handleSubmitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage("");
    setGeneralError("");

    const validationErrors = validateProfile(formValues);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      const updatedUser = await updateAuthenticatedUserProfile(user.id, {
        name: `${formValues.firstName.trim()} ${formValues.lastName.trim()}`,
        email: formValues.email,
        cpf: formValues.cpf,
        phone: formValues.phone,
      });

      setUser(updatedUser);
      setFormValues(mapUserToFormValues(updatedUser));
      setStatusMessage("Perfil atualizado com sucesso.");
    } catch (error) {
      setGeneralError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o perfil.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordStatus("");
    setPasswordGeneralError("");

    const validationErrors = validatePassword(passwordValues);

    if (Object.keys(validationErrors).length > 0) {
      setPasswordErrors(validationErrors);
      return;
    }

    setPasswordErrors({});
    setIsChangingPassword(true);

    try {
      const updatedUser = await changeAuthenticatedUserPassword(
        user.id,
        passwordValues.currentPassword,
        passwordValues.nextPassword,
      );

      setUser(updatedUser);
      setFormValues(mapUserToFormValues(updatedUser));
      setPasswordValues({
        currentPassword: "",
        nextPassword: "",
        confirmPassword: "",
      });
      setIsPasswordModalOpen(false);
      setStatusMessage("Senha alterada com sucesso.");
    } catch (error) {
      setPasswordGeneralError(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a senha.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordValues({
      currentPassword: "",
      nextPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    setPasswordStatus("");
    setPasswordGeneralError("");
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <Navbar user={user} />

      <main className="bg-white">
        <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50/90 p-5 lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)] lg:border-b-0 lg:border-r lg:p-6">
            <p className="px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Configurações
            </p>
            <nav className="mt-4 grid gap-1 sm:grid-cols-3 lg:grid-cols-1">
              <a
                href="#editar-perfil"
                className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 text-sm font-bold text-blue-700 shadow-sm ring-1 ring-slate-200"
              >
                <UserRound className="h-4 w-4" /> Editar perfil
              </a>
              <button
                type="button"
                onClick={openPasswordModal}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
              >
                <KeyRound className="h-4 w-4" /> Segurança da conta
              </button>
              {user.role === "admin" && (
                <>
                  <a
                    href="#gerenciar-trilhas"
                    onClick={() => setIsTrailManagementOpen(true)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
                  >
                    <Layers3 className="h-4 w-4" /> Gerenciar trilhas
                  </a>
                  <a
                    href="#cadastrar-equipe"
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
                  >
                    <UsersRound className="h-4 w-4" /> Cadastrar equipe
                  </a>
                </>
              )}
              {user.role === "aluno" && (
                <a
                  href="#cursos-e-trilhas"
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
                >
                  <BookOpen className="h-4 w-4" /> Cursos e trilhas
                </a>
              )}
            </nav>
            <p className="mt-6 hidden border-t border-slate-200 px-3 pt-6 text-xs leading-5 text-slate-500 lg:block">
              Gerencie seus dados, a segurança da conta e os recursos da
              plataforma.
            </p>
          </aside>

          <div className="min-w-0">
            <section
              id="editar-perfil"
              className="px-5 py-8 sm:px-8 lg:px-12 lg:py-10"
            >
              <form
                onSubmit={handleSubmitProfile}
                className="mx-auto max-w-3xl"
              >
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  Dados pessoais
                </span>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                  Editar perfil
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Atualize as informações usadas na sua conta e na sua
                  experiência de aprendizagem.
                </p>
                {(generalError || statusMessage) && (
                  <div
                    className={`mt-6 rounded-xl px-4 py-3 text-sm font-semibold ${generalError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
                  >
                    {generalError || (
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {statusMessage}
                      </span>
                    )}
                  </div>
                )}
                <div className="my-8 flex items-center gap-4 border-y border-slate-100 py-6">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-black text-white shadow-lg shadow-blue-200">
                    {getInitials(displayName)}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Foto do perfil
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {displayName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Suas iniciais são atualizadas junto com o nome.
                    </p>
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <TextInput
                    icon={UserRound}
                    label="Nome"
                    name="firstName"
                    placeholder="Seu nome"
                    value={formValues.firstName}
                    onChange={handleProfileChange}
                    error={errors.firstName}
                  />
                  <TextInput
                    icon={UserRound}
                    label="Sobrenome"
                    name="lastName"
                    placeholder="Seu sobrenome"
                    value={formValues.lastName}
                    onChange={handleProfileChange}
                    error={errors.lastName}
                  />
                  <div className="md:col-span-2">
                    <TextInput
                      icon={Mail}
                      label="E-mail"
                      name="email"
                      placeholder="voce@exemplo.com"
                      type="email"
                      value={formValues.email}
                      onChange={handleProfileChange}
                      error={errors.email}
                    />
                  </div>
                  <TextInput
                    icon={Shield}
                    label="CPF"
                    name="cpf"
                    placeholder="000.000.000-00"
                    value={formValues.cpf}
                    onChange={handleProfileChange}
                    error={errors.cpf}
                  />
                  <TextInput
                    icon={Phone}
                    label="Celular"
                    name="phone"
                    placeholder="(00) 00000-0000"
                    value={formValues.phone}
                    onChange={handleProfileChange}
                    error={errors.phone}
                  />
                </div>
                <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setFormValues(mapUserToFormValues(user));
                      setErrors({});
                      setGeneralError("");
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-100 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Redefinir
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />{" "}
                    {isSaving ? "Salvando..." : "Salvar alterações"}
                  </button>
                </div>
              </form>
            </section>

            {user.role === "aluno" && (
              <div id="cursos-e-trilhas" className="scroll-mt-20">
                <StudentLearningProfile
                  enrollments={studentEnrollments}
                  trails={followedTrails}
                  loading={learningLoading}
                  error={learningError}
                  onOpenCourse={(courseId) => navigate("/courses/" + courseId)}
                  onOpenTrail={(trailId) => navigate("/trilhas/" + trailId)}
                />
              </div>
            )}

            {user.role === "admin" && (
              <div className="border-t border-slate-200 bg-white px-5 py-10 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-3xl space-y-10">
                  <section id="gerenciar-trilhas" className="scroll-mt-24">
                    <div className="mb-6">
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">
                        Administração
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-[#25304a]">
                        <button
                          type="button"
                          aria-expanded={isTrailManagementOpen}
                          aria-controls="trail-management-content"
                          onClick={() => setIsTrailManagementOpen((current) => !current)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg py-2 text-left focus-visible:outline-2 focus-visible:outline-blue-600"
                        >
                          Gerenciar trilhas
                          <ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 transition-transform ${isTrailManagementOpen ? "rotate-180" : ""}`} />
                        </button>
                      </h2>
                      <p hidden={!isTrailManagementOpen} className="mt-2 text-sm text-slate-600">
                        Crie trilhas e organize os cursos disponíveis.
                      </p>
                    </div>
                    <div id="trail-management-content" hidden={!isTrailManagementOpen}>
                      <AdminTrailManagement embedded />
                    </div>
                  </section>
                  <section
                    id="cadastrar-equipe"
                    className="scroll-mt-24 border-t border-slate-200 pt-10"
                  >
                    <div className="mb-6">
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">
                        Administração
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-[#25304a]">
                        Cadastrar equipe
                      </h2>
                      <p className="mt-2 text-sm text-slate-600">
                        Cadastre professores e outros administradores.
                      </p>
                    </div>
                    <AdminUserManagement embedded />
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-modal-title"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="password-modal-title"
                  className="text-xl font-black text-[#25304a]"
                >
                  Alterar senha
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Informe a senha atual e escolha uma nova senha segura.
                </p>
              </div>
              <button
                type="button"
                onClick={closePasswordModal}
                className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {(passwordGeneralError || passwordStatus) && (
              <div
                className={`mb-4 rounded-md px-4 py-3 text-sm font-semibold ${
                  passwordGeneralError
                    ? "bg-red-50 text-red-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {passwordGeneralError || passwordStatus}
              </div>
            )}

            <form onSubmit={handleSubmitPassword} className="space-y-4">
              <PasswordInput
                label="Senha atual"
                name="currentPassword"
                value={passwordValues.currentPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.currentPassword}
              />
              <PasswordInput
                label="Nova senha"
                name="nextPassword"
                value={passwordValues.nextPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.nextPassword}
              />
              <PasswordInput
                label="Confirmar nova senha"
                name="confirmPassword"
                value={passwordValues.confirmPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.confirmPassword}
              />

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isChangingPassword ? "Alterando..." : "Salvar senha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
