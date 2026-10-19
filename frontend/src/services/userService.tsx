/*------------------------------------------------------- */ //saveAuthenticatedUser(user)
import {
  isUserRole,
  type User,
} from "../data/userMock";
import { AUTH_CHANGED_EVENT, apiFetch, clearStoredSession } from "./api";

const AUTH_USER_STORAGE_KEY = "ead.auth.user";  //nome da chave

// Interface atualizada com o campo CPF 
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
  "name" | "email" | "cpf" | "phone" | "municipality"
>;

interface AuthResponse {
  access_token?: unknown;
  user?: {
    id?: unknown;
    name?: unknown;
    email?: unknown;
    cpf?: unknown;
    phone?: unknown;
    municipality?: unknown;
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

// cria um objeto novo sem informações sensíveis vindas do back-end
function sanitizeUser(user: User): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: user.cpf,
    phone: user.phone,
    municipality: user.municipality,
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
    throw new Error("Email ou senha incorretos");
  }

  const data = await response.json();
  
console.log("RESPOSTA DO LOGIN DO NESTJS:", data);

  //salva token JWT
  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
  }

  //extrai as informações do usuário
  const userPayload = data.user || data;

  return {
    id: data.user.id,
    name: typeof data.user.name === "string" ? data.user.name : data.user.email,
    email: data.user.email,
    cpf: typeof data.user.cpf === "string" ? data.user.cpf : undefined,
    phone: typeof data.user.phone === "string" ? data.user.phone : undefined,
    municipality: typeof data.user.municipality === "string" ? data.user.municipality : undefined,
    role: data.user.role,
    mustChangeEmail: data.user.mustChangeEmail === true,
    mustChangePassword: data.user.mustChangePassword === true,
    ...institutionalMetadata(readProfileMetadata()[String(data.user.id)]),
  };

  //atualiza a sessão no localStorage
  saveAuthenticatedUser(userToSave);
  console.log("USUÁRIO SALVO NO LOCALSTORAGE:", userToSave);

  return userToSave;
}

/*--------------------------------------- Função de cadastro --------------------------------------- */

export async function createUser(userData: RegisterUserInput): Promise<User> {
  const response = await apiFetch("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // Passa exatamente o que 'auth.controller.ts' espera receber no body
    body: JSON.stringify({  //transformaobjeto de código em tetxo puro
      name: userData.name.trim(),
      email: normalizeEmail(userData.email),
      password: userData.password,
      cpf: userData.cpf.replace(/\D/g, ""),
      cep: userData.cep.replace(/\D/g, ""),
    }),
  }, false);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Erro ao realizar o cadastro no banco.");
  }

  const data = await response.json();  //peg o ID real e transforma em data

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
    name: data.name || userData.name.trim(),
    email: data.email,
    role: "aluno",
  };

  return newUser;
}
/*--------------------------------------- Gerenciamento de localstorage --------------------------------------- */

//essa função pega o user, passa pelo sanity pra limpar, transforma em texto e tranca no storage
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
  if (!storedUser) return null;

  try { //tenta executar oque ta no storage
    const parsedUser = JSON.parse(storedUser) as Partial<User>;
    if (!parsedUser.id || !parsedUser.name || !parsedUser.email) {
      throw new Error("Sessão inválida");
    }
    return sanitizeUser(parsedUser as User);
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

export async function updateAuthenticatedUserProfile(
  data: UpdateUserProfileInput
): Promise<User> {
  const token = localStorage.getItem("token");

  const response = await fetch("http://localhost:3000/profile/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao atualizar o perfil.");
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
      municipality: profile.municipality ?? currentUser.municipality,
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

// Salva as alterações feitas no formulário
export async function updateProfile(data: { name?: string; phone?: string; avatar?: string; cpf?: string }): Promise<User> {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:3000/profile/me', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Erro ao atualizar o perfil.');
  }

  const backendData = await response.json();
  const currentUser = getAuthenticatedUser() || ({} as User);

  // Garante que o ID e Email antigos não sumam se o backend responder só com os campos alterados
  const updatedUser: User = {
    ...currentUser,
    ...(backendData.user || backendData), // Trata caso o NestJS devolva { user: {...} } ou o objeto direto
  };

  saveAuthenticatedUser(updatedUser);

  return updatedUser;
}