import {
  isUserRole,
  mockUserCredentials,
  type User,
  type UserId,
} from "../data/userMock";

const AUTH_USER_STORAGE_KEY = "ead.auth.user";
const AUTH_TOKEN_STORAGE_KEY = "token";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  cpf: string;
  profileType?: "cidadao" | "estagiario" | "funcionario";
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

function getResponseErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object" || !("message" in data)) {
    return fallback;
  }

  const { message } = data as { message?: unknown };

  if (typeof message === "string") {
    return message;
  }

  if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
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

export async function loginUser(email: string, password: string): Promise<User> {
  const response = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalizeEmail(email), password }),
  });

  if (!response.ok) {
    throw new Error(await readResponseError(response, "Email ou senha incorretos."));
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
  };
}

export async function createUser(userData: RegisterUserInput): Promise<User> {
  const response = await fetch("http://localhost:3000/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: userData.name.trim(),
      email: normalizeEmail(userData.email),
      password: userData.password,
      cpf: userData.cpf,
      profileType: userData.profileType,
      verificationProof: userData.verificationProof,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await readResponseError(response, "Erro ao realizar o cadastro no banco."),
    );
  }

  const data = (await response.json()) as RegisterResponse;

  if (!isUserId(data.id) || typeof data.email !== "string") {
    throw new Error("Resposta de cadastro invalida.");
  }

  return {
    id: data.id,
    name: userData.name.trim(),
    email: data.email,
    role: "aluno",
    profileType: userData.profileType,
    verificationStatus:
      userData.profileType && userData.profileType !== "cidadao"
        ? "pendente"
        : "nao_aplicavel",
  };
}

export function saveAuthenticatedUser(user: User) {
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(sanitizeUser(user)));
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
  const credential = mockUserCredentials.find(
    ({ user }) => user.id === userId,
  );

  if (!credential || credential.password !== currentPassword) {
    throw new Error("Senha atual invalida");
  }

  credential.password = nextPassword;
}

export function clearAuthenticatedUser() {
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
