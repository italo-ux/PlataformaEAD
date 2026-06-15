import {
  isUserRole,
  mockUserCredentials,
  type MockUserCredential,
  type User,
} from "../data/userMock";

const AUTH_USER_STORAGE_KEY = "ead.auth.user";
const MOCK_DELAY_MS = 300;

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserProfileInput {
  name: string;
  email: string;
  avatar?: string;
  cpf?: string;
  phone?: string;
}

const mockUserStore: MockUserCredential[] = [...mockUserCredentials];
let nextMockUserId = mockUserStore.length + 1;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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
  };
}

function waitForMock<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), MOCK_DELAY_MS);
  });
}

async function failMock(message: string): Promise<never> {
  await waitForMock(null);
  throw new Error(message);
}

// Servico de autenticacao mockado. Quando o backend estiver pronto, mantenha as
// mesmas assinaturas publicas e troque apenas o conteudo destas funcoes por
// chamadas HTTP reais.
export async function loginUser(email: string, password: string): Promise<User> {
  const normalizedEmail = normalizeEmail(email);
  const foundUser = mockUserStore.find(
    ({ user }) => normalizeEmail(user.email) === normalizedEmail,
  );

  if (!foundUser || foundUser.password !== password) {
    return failMock("Email ou senha incorretos");
  }

  return waitForMock(sanitizeUser(foundUser.user));
}

export async function createUser(userData: RegisterUserInput): Promise<User> {
  const normalizedEmail = normalizeEmail(userData.email);
  const emailAlreadyExists = mockUserStore.some(
    ({ user }) => normalizeEmail(user.email) === normalizedEmail,
  );

  if (emailAlreadyExists) {
    return failMock("Este email ja esta cadastrado no mock");
  }

  const createdUser: User = {
    id: nextMockUserId,
    name: userData.name.trim(),
    email: normalizedEmail,
    role: "aluno",
  };

  nextMockUserId += 1;
  mockUserStore.push({
    user: createdUser,
    password: userData.password,
  });

  return waitForMock(sanitizeUser(createdUser));
}

export async function updateAuthenticatedUserProfile(
  userId: number,
  userData: UpdateUserProfileInput,
): Promise<User> {
  const storedUser = getAuthenticatedUser();

  if (!storedUser || storedUser.id !== userId) {
    return failMock("Sessao expirada. Faca login novamente.");
  }

  const normalizedEmail = normalizeEmail(userData.email);
  const emailAlreadyExists = mockUserStore.some(
    ({ user }) =>
      user.id !== userId && normalizeEmail(user.email) === normalizedEmail,
  );

  if (emailAlreadyExists) {
    return failMock("Este email ja esta cadastrado no mock");
  }

  const updatedUser: User = {
    ...storedUser,
    name: userData.name.trim(),
    email: normalizedEmail,
    avatar: userData.avatar?.trim() || undefined,
    cpf: userData.cpf?.trim() || undefined,
    phone: userData.phone?.trim() || undefined,
  };

  const storedCredential = mockUserStore.find(({ user }) => user.id === userId);
  if (storedCredential) {
    storedCredential.user = updatedUser;
  }

  saveAuthenticatedUser(updatedUser);
  return waitForMock(sanitizeUser(updatedUser));
}

export async function changeAuthenticatedUserPassword(
  userId: number,
  currentPassword: string,
  nextPassword: string,
): Promise<void> {
  const storedUser = getAuthenticatedUser();

  if (!storedUser || storedUser.id !== userId) {
    return failMock("Sessao expirada. Faca login novamente.");
  }

  const storedCredential = mockUserStore.find(({ user }) => user.id === userId);

  if (!storedCredential) {
    return failMock("Senha disponivel apenas durante a sessao mock atual.");
  }

  if (storedCredential.password !== currentPassword) {
    return failMock("Senha atual incorreta");
  }

  storedCredential.password = nextPassword;
  await waitForMock(null);
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
      typeof parsedUser.id !== "number" ||
      typeof parsedUser.name !== "string" ||
      typeof parsedUser.email !== "string" ||
      !isUserRole(parsedUser.role)
    ) {
      throw new Error("Invalid mock session");
    }

    return sanitizeUser(parsedUser as User);
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

export function getRegisteredTeachers(): User[] {
  return mockUserStore
    .map(({ user }) => user)
    .filter((user) => user.role === "professor")
    .map(sanitizeUser);
}

export function clearAuthenticatedUser() {
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}
