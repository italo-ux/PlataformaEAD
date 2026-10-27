import {
  isUserRole,
  type User,
  type UserId,
} from "../data/userMock";
import { AUTH_CHANGED_EVENT, apiFetch, clearStoredSession } from "./api";

const AUTH_USER_STORAGE_KEY = "ead.auth.user";
const AUTH_TOKEN_STORAGE_KEY = "token";
const PROFILE_METADATA_STORAGE_KEY = "ead.profile.metadata";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  cpf: string;
  cep: string;
  profileType?: User["profileType"];
  verificationProof?: string;
}

export interface CreateManagedUserInput {
  name: string;
  email: string;
  password: string;
  cpf: string;
  role: "professor" | "admin";
}

export type UpdateUserProfileInput = Pick<
  User,
  "name" | "email" | "cpf" | "phone"
>;

interface AuthResponse {
  access_token?: unknown;
  user?: {
    id?: unknown;
    name?: unknown;
    email?: unknown;
    cpf?: unknown;
    phone?: unknown;
    role?: unknown;
    mustChangeEmail?: unknown;
    mustChangePassword?: unknown;
  };
}

interface RegisterResponse {
  id?: unknown;
  email?: unknown;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isUserId(value: unknown): value is UserId {
  return typeof value === "string" || typeof value === "number";
}

function sanitizeUser(user: User): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: user.cpf,
    phone: user.phone,
    role: user.role,
    mustChangeEmail: user.mustChangeEmail,
    mustChangePassword: user.mustChangePassword,
    profileType: user.profileType,
    verificationStatus: user.verificationStatus,
  };
}

function persistableUser(user: User): User {
  const sanitized = sanitizeUser(user);
  delete sanitized.cpf;
  delete sanitized.phone;
  return sanitized;
}

// Institutional information is only a browser demonstration, never authorization.
function readProfileMetadata(): Record<string, User["profileType"]> {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(PROFILE_METADATA_STORAGE_KEY) ?? "{}",
    );
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([, type]) =>
          type === "cidadao" || type === "estagiario" || type === "funcionario",
      ),
    );
  } catch {
    return {};
  }
}

function institutionalMetadata(
  profileType: User["profileType"],
): Partial<User> {
  return profileType
    ? {
        profileType,
        verificationStatus:
          profileType === "cidadao" ? "nao_aplicavel" : "pendente",
      }
    : {};
}

function getResponseErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object" || !("message" in data)) {
    return fallback;
  }

  const { message } = data as { message?: unknown };

  if (typeof message === "string") {
    return message;
  }

  if (
    Array.isArray(message) &&
    message.every((item) => typeof item === "string")
  ) {
    return message.join(" ");
  }

  return fallback;
}

async function readResponseError(response: Response, fallback: string) {
  try {
    return getResponseErrorMessage(await response.json(), fallback);
  } catch {
    return fallback;
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<User> {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalizeEmail(email), password }),
  }, false);

  if (!response.ok) {
    throw new Error(
      await readResponseError(response, "Email ou senha incorretos."),
    );
  }

  const data = (await response.json()) as AuthResponse;

  if (
    typeof data.access_token !== "string" ||
    !data.user ||
    !isUserId(data.user.id) ||
    typeof data.user.email !== "string" ||
    !isUserRole(data.user.role)
  ) {
    throw new Error("Resposta de autenticacao invalida.");
  }

  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.access_token);

  return {
    id: data.user.id,
    name: typeof data.user.name === "string" ? data.user.name : data.user.email,
    email: data.user.email,
    cpf: typeof data.user.cpf === "string" ? data.user.cpf : undefined,
    phone: typeof data.user.phone === "string" ? data.user.phone : undefined,
    role: data.user.role,
    mustChangeEmail: data.user.mustChangeEmail === true,
    mustChangePassword: data.user.mustChangePassword === true,
    ...institutionalMetadata(readProfileMetadata()[String(data.user.id)]),
  };
}

export async function createUser(userData: RegisterUserInput): Promise<User> {
  const response = await apiFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: userData.name.trim(),
      email: normalizeEmail(userData.email),
      password: userData.password,
      cpf: userData.cpf.replace(/\D/g, ""),
      cep: userData.cep.replace(/\D/g, ""),
    }),
  }, false);

  if (!response.ok) {
    throw new Error(
      await readResponseError(
        response,
        "Erro ao realizar o cadastro no banco.",
      ),
    );
  }

  const data = (await response.json()) as RegisterResponse;

  if (!isUserId(data.id) || typeof data.email !== "string") {
    throw new Error("Resposta de cadastro invalida.");
  }

  if (userData.profileType) {
    localStorage.setItem(
      PROFILE_METADATA_STORAGE_KEY,
      JSON.stringify({
        ...readProfileMetadata(),
        [String(data.id)]: userData.profileType,
      }),
    );
  }

  return {
    id: data.id,
    name: userData.name.trim(),
    email: data.email,
    role: "aluno",
    ...institutionalMetadata(userData.profileType),
  };
}

export function saveAuthenticatedUser(user: User) {
  localStorage.setItem(
    AUTH_USER_STORAGE_KEY,
    JSON.stringify(persistableUser(user)),
  );
  window.dispatchEvent(
    new CustomEvent<User>(AUTH_CHANGED_EVENT, { detail: sanitizeUser(user) }),
  );
}

export async function refreshAuthenticatedUser(): Promise<User> {
  const response = await apiFetch("/usuarios/me");
  if (!response.ok) {
    throw new Error(
      await readResponseError(response, "Não foi possível restaurar a sessão."),
    );
  }
  const user = sanitizeUser((await response.json()) as User);
  saveAuthenticatedUser(user);
  return user;
}

export function getAuthenticatedUser(): User | null {
  const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser) as Partial<User>;

    if (
      !isUserId(parsedUser.id) ||
      typeof parsedUser.name !== "string" ||
      typeof parsedUser.email !== "string" ||
      (parsedUser.role !== "aluno" &&
        parsedUser.role !== "professor" &&
        parsedUser.role !== "admin")
    ) {
      throw new Error("Sessao invalida");
    }

    return sanitizeUser(parsedUser as User);
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

export async function updateAuthenticatedUserProfile(
  userId: UserId,
  profile: UpdateUserProfileInput,
): Promise<User> {
  const currentUser = getAuthenticatedUser();

  if (!currentUser || currentUser.id !== userId) {
    throw new Error("Sessao invalida");
  }

  const response = await apiFetch("/usuarios/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: profile.name.trim(),
      email: normalizeEmail(profile.email ?? currentUser.email),
      cpf: profile.cpf?.replace(/\D/g, ""),
      phone: profile.phone?.replace(/\D/g, ""),
    }),
  });

  if (!response.ok) {
    throw new Error(
      await readResponseError(response, "Não foi possível salvar o perfil."),
    );
  }

  const updatedUser = sanitizeUser({
    ...currentUser,
    ...((await response.json()) as User),
  });
  saveAuthenticatedUser(updatedUser);
  return updatedUser;
}

export async function changeAuthenticatedUserPassword(
  userId: UserId,
  currentPassword: string,
  nextPassword: string,
): Promise<User> {
  if (getAuthenticatedUser()?.id !== userId) {
    throw new Error("Sessao invalida");
  }

  const response = await apiFetch("/usuarios/me/password", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currentPassword, newPassword: nextPassword }),
  });

  if (!response.ok) {
    throw new Error(
      await readResponseError(response, "Não foi possível alterar a senha."),
    );
  }

  const currentUser = getAuthenticatedUser()!;
  const updatedUser = sanitizeUser({
    ...currentUser,
    ...((await response.json()) as User),
  });
  saveAuthenticatedUser(updatedUser);
  return updatedUser;
}

export async function createManagedUser(input: CreateManagedUserInput) {
  const response = await apiFetch("/usuarios", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...input,
      email: normalizeEmail(input.email),
      cpf: input.cpf.replace(/\D/g, ""),
    }),
  });

  if (!response.ok) {
    throw new Error(
      await readResponseError(response, "Não foi possível criar o usuário."),
    );
  }

  return response.json() as Promise<{
    id: string;
    name: string;
    email: string;
    role: "professor" | "admin";
  }>;
}

export function clearAuthenticatedUser() {
  clearStoredSession();
}
