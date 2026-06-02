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

/*
========================================================
função alterada (está usando backend real)
========================================================
- Faz requisição HTTP
- Usa JWT
- Depende do backend rodando
*/
export async function loginUser(email: string, password: string): Promise<User> {
  const response = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  // erro de autenticação
  if (!response.ok) {
    throw new Error("Email ou senha incorretos");
  }

  const data = await response.json();

  /*
  salvando token JWT 
  */
  localStorage.setItem("token", data.access_token);

  /*
  backend NÃO manda name nem role
  então estamos adaptando pro formato esperado pelo frontend
  */
  return {
    id: Number(data.user.id),
    name: data.user.email, //  gambiarra temporária
    email: data.user.email,
    role: "aluno", //  fixo por enquanto
  };
}

/*
esta parte ainda está mockada
*/
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

export function clearAuthenticatedUser() {
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}