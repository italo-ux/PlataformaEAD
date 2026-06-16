import { useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Save,
  Shield,
  UserRound,
  X,
} from "lucide-react";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import AdminDashboard from "../components/AdminDashboard";
import type { User } from "../data/userMock";
import {
  changeAuthenticatedUserPassword,
  clearAuthenticatedUser,
  getAuthenticatedUser,
  updateAuthenticatedUserProfile,
} from "../services/userService";

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
  avatar: string;
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
    avatar: user?.avatar ?? "",
  };
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function isValidImageUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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

  if (!isValidImageUrl(values.avatar)) {
    errors.avatar = "Use uma URL de imagem iniciada por http ou https.";
  }

  return errors;
}

function validatePassword(values: PasswordFormValues): PasswordErrors {
  const errors: PasswordErrors = {};

  if (!values.currentPassword) {
    errors.currentPassword = "Informe a senha atual.";
  }

  if (values.nextPassword.length < 6) {
    errors.nextPassword = "A nova senha deve ter pelo menos 6 caracteres.";
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
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
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
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => getAuthenticatedUser());
  const [formValues, setFormValues] = useState<ProfileFormValues>(() =>
    mapUserToFormValues(getAuthenticatedUser()),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordValues, setPasswordValues] = useState<PasswordFormValues>({
    currentPassword: "",
    nextPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordGeneralError, setPasswordGeneralError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
        avatar: formValues.avatar,
      });

      setUser(updatedUser);
      setFormValues(mapUserToFormValues(updatedUser));
      setStatusMessage("Perfil atualizado no mock com sucesso.");
      setIsAvatarEditorOpen(false);
      setIsEditingProfile(false);
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
      await changeAuthenticatedUserPassword(
        user.id,
        passwordValues.currentPassword,
        passwordValues.nextPassword,
      );

      setPasswordValues({
        currentPassword: "",
        nextPassword: "",
        confirmPassword: "",
      });
      setPasswordStatus("Senha alterada no mock com sucesso.");
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

  const handleLogout = () => {
    clearAuthenticatedUser();
    navigate("/login");
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/home");
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

  const openProfileEditor = () => {
    setStatusMessage("");
    setGeneralError("");
    setIsEditingProfile(true);
  };

  const closeProfileEditor = () => {
    setFormValues(mapUserToFormValues(user));
    setErrors({});
    setGeneralError("");
    setIsAvatarEditorOpen(false);
    setIsEditingProfile(false);
  };

  return (
    <div className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <Navbar user={user} />

      <main className="bg-white">
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 border-b-2 border-slate-600 pb-3">
            <h1 className="text-3xl font-black text-slate-950">Meu perfil</h1>
          </div>

          <div className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <span>Dados pessoais</span>
            <UserRound className="h-4 w-4" />
          </div>

          {(generalError || statusMessage) && (
            <div
              className={`mb-6 rounded-md px-4 py-3 text-sm font-semibold ${
                generalError
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {generalError || (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {statusMessage}
                </span>
              )}
            </div>
          )}

          {!isEditingProfile && (
            <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-4xl font-bold text-white shadow-lg shadow-blue-600/20">
                  {formValues.avatar ? (
                    <img
                      src={formValues.avatar}
                      alt={`${displayName} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(displayName)}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-black text-slate-950">
                    {displayName}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-blue-600">
                    {user.role === "admin"
                      ? "Administrador"
                      : user.role === "professor"
                        ? "Professor"
                        : "Aluno"}
                  </p>
                  <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <p>
                      <span className="block font-bold text-slate-900">
                        E-mail
                      </span>
                      {formValues.email || "Não informado"}
                    </p>
                    <p>
                      <span className="block font-bold text-slate-900">
                        CPF
                      </span>
                      {formValues.cpf || "Não informado"}
                    </p>
                    <p>
                      <span className="block font-bold text-slate-900">
                        Celular
                      </span>
                      {formValues.phone || "Não informado"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={openProfileEditor}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <UserRound className="h-4 w-4" />
                  Editar perfil
                </button>
                <button
                  type="button"
                  onClick={openPasswordModal}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-blue-500 px-6 text-sm font-bold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Alterar senha
                </button>
              </div>
            </div>
          )}

          {isEditingProfile && (
            <form onSubmit={handleSubmitProfile}>
              <div className="mb-10 flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-4xl font-bold text-white shadow-lg shadow-blue-600/20">
                    {formValues.avatar ? (
                      <img
                        src={formValues.avatar}
                        alt={`${displayName} avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(displayName)}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAvatarEditorOpen((current) => !current)}
                    className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 shadow transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Editar imagem do perfil"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                {isAvatarEditorOpen && (
                  <div className="w-full max-w-xl">
                    <TextInput
                      icon={Camera}
                      label="URL da imagem"
                      name="avatar"
                      placeholder="https://exemplo.com/avatar.jpg"
                      value={formValues.avatar}
                      onChange={handleProfileChange}
                      error={errors.avatar}
                    />
                  </div>
                )}
              </div>

              <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2">
                <TextInput
                  icon={UserRound}
                  label="Nome"
                  name="firstName"
                  placeholder="Fulano"
                  value={formValues.firstName}
                  onChange={handleProfileChange}
                  error={errors.firstName}
                />
                <TextInput
                  icon={UserRound}
                  label="Sobrenome"
                  name="lastName"
                  placeholder="Silcrano Beltrano"
                  value={formValues.lastName}
                  onChange={handleProfileChange}
                  error={errors.lastName}
                />
                <TextInput
                  icon={Mail}
                  label="E-mail"
                  name="email"
                  placeholder="fulano@example.com"
                  type="email"
                  value={formValues.email}
                  onChange={handleProfileChange}
                  error={errors.email}
                />
                <TextInput
                  icon={Shield}
                  label="CPF"
                  name="cpf"
                  placeholder="xxx.xxx.xxx-xx"
                  value={formValues.cpf}
                  onChange={handleProfileChange}
                  error={errors.cpf}
                />
                <TextInput
                  icon={Phone}
                  label="Celular"
                  name="phone"
                  placeholder="(xx) xxxxx-xxxx"
                  value={formValues.phone}
                  onChange={handleProfileChange}
                  error={errors.phone}
                />
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={openPasswordModal}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-blue-500 px-4 text-sm font-bold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <KeyRound className="h-4 w-4" />
                    Alterar senha
                  </button>
                </div>
              </div>

              <div className="mx-auto mt-16 flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={closeProfileEditor}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-blue-500 px-6 text-sm font-bold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-blue-500 px-6 text-sm font-bold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Salvando..." : "Salvar edicoes"}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="mx-auto mt-10 flex max-w-3xl justify-between gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 items-center justify-center rounded-md border border-blue-500 px-6 text-sm font-bold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Sair
            </button>

            {!isEditingProfile && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-10 items-center justify-center rounded-md border border-blue-500 px-6 text-sm font-bold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Voltar
              </button>
            )}
              </div>
        </section>

        {user.role === "admin" && <AdminDashboard />}
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
                  Atualização válida apenas no mock desta sessão.
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
