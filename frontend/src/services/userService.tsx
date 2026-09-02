import {
  isUserRole,
  mockUserCredentials,
  type User,
  type UserId,
} from "../data/userMock";
import { API_URL } from "./api";

const AUTH_USER_STORAGE_KEY = "ead.auth.user";
const AUTH_TOKEN_STORAGE_KEY = "token";
const PROFILE_METADATA_STORAGE_KEY = "ead.profile.metadata";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  cpf: string;
  profileType?: User["profileType"];
  verificationProof?: string;
}

export type UpdateUserProfileInput = Pick<
  User,
  "name" | "email" | "cpf" | "phone" | "avatar"
>;

interface AuthResponse {
  access_token?: unknown;
  user?: {
    id?: unknown;
    name?: unknown;
    email?: unknown;
    role?: unknown;
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
    avatar: user.avatar,
    cpf: user.cpf,
    phone: user.phone,
    role: user.role,
    profileType: user.profileType,
    verificationStatus: user.verificationStatus,
  };
}

// Institutional information is only a browser demonstration, never authorization.
function readProfileMetadata(): Record<string, User["profileType"]> {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(PROFILE_METADATA_STORAGE_KEY) ?? "{}",
    );
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(([, type]) =>
        type === "cidadao" || type === "estagiario" || type === "funcionario",
      ),
    );
  } catch {
    return {};
  }
}

function institutionalMetadata(profileType: User["profileType"]): Partial<User> {
  return profileType ? {
    profileType,
    verificationStatus: profileType === "cidadao" ? "nao_aplicavel" : "pendente",
  } : {};
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
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalizeEmail(email), password }),
  });

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
    role: data.user.role,
    ...institutionalMetadata(readProfileMetadata()[String(data.user.id)]),
  };
}

export async function createUser(userData: RegisterUserInput): Promise<User> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: userData.name.trim(),
      email: normalizeEmail(userData.email),
      password: userData.password,
      cpf: userData.cpf.replace(/\D/g, ""),
    }),
  });

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
    localStorage.setItem(PROFILE_METADATA_STORAGE_KEY, JSON.stringify({
      ...readProfileMetadata(),
      [String(data.id)]: userData.profileType,
    }));
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
    JSON.stringify(sanitizeUser(user)),
  );
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

// These helpers remain local until the backend exposes profile and role APIs.
export function getRegisteredTeachers(): User[] {
  return mockUserCredentials
    .filter(({ user }) => user.role === "professor")
    .map(({ user }) => sanitizeUser(user));
}

export async function updateAuthenticatedUserProfile(
  userId: UserId,
  profile: UpdateUserProfileInput,
): Promise<User> {
  const currentUser = getAuthenticatedUser();

  if (!currentUser || currentUser.id !== userId) {
    throw new Error("Sessao invalida");
  }

  const updatedUser = sanitizeUser({ ...currentUser, ...profile });
  saveAuthenticatedUser(updatedUser);
  return updatedUser;
}

export async function changeAuthenticatedUserPassword(
  userId: UserId,
  currentPassword: string,
  nextPassword: string,
): Promise<void> {
  if (getAuthenticatedUser()?.id !== userId) {
    throw new Error("Sessao invalida");
  }
  const credential = mockUserCredentials.find(({ user }) => user.id === userId);

  if (!credential) {
    throw new Error('Alteração apenas demonstrativa. Para sua conta real, use "Esqueci a senha" na tela de login.');
  }
  if (credential.password !== currentPassword) {
    throw new Error("Senha atual invalida");
  }

  credential.password = nextPassword;
}

// Removes browser data only; the account remains on the server.
export function deleteAuthenticatedUser(userId: UserId) {
  if (getAuthenticatedUser()?.id !== userId) {
    throw new Error("Sessao invalida");
  }
  const metadata = readProfileMetadata();
  delete metadata[String(userId)];
  localStorage.setItem(PROFILE_METADATA_STORAGE_KEY, JSON.stringify(metadata));
  clearAuthenticatedUser();
}

export function clearAuthenticatedUser() {
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
