/*------------------------------------------------------- */ //saveAuthenticatedUser(user)
import {
  type User,
} from "../data/userMock";

const AUTH_USER_STORAGE_KEY = "ead.auth.user";  //nome da chave

// Interface atualizada com o campo CPF 
export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  cpf: string; 
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// cria um objeto novo sem informações sensíveis vindas do back-end
function sanitizeUser(user: User): User {
  return {
    id: user?.id,
    name: user?.name ?? "",
    email: user?.email ?? "",
    avatar: user?.avatar ?? "",
    role: user?.role ?? "aluno",
    phone: user?.phone ?? "",
    cpf: user?.cpf ?? "",
  };
}

/*--------------------------------------- Função de login real --------------------------------------- */
export async function loginUser(email: string, password: string): Promise<User> { 
  const response = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

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

  const userToSave: User = {
    id: userPayload.id, 
    name: userPayload.name,
    email: userPayload.email,
    role: userPayload.role || "aluno", 
  };

  //atualiza a sessão no localStorage
  saveAuthenticatedUser(userToSave);
  console.log("USUÁRIO SALVO NO LOCALSTORAGE:", userToSave);

  return userToSave;
}

/*--------------------------------------- Função de cadastro --------------------------------------- */

export async function createUser(userData: RegisterUserInput): Promise<User> {
  const response = await fetch("http://localhost:3000/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // Passa exatamente o que 'auth.controller.ts' espera receber no body
    body: JSON.stringify({  //transformaobjeto de código em tetxo puro
      name: userData.name.trim(),
      email: normalizeEmail(userData.email),
      password: userData.password, 
      cpf: userData.cpf, // Passando o CPF digitado na tela
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Erro ao realizar o cadastro no banco.");
  }

  const data = await response.json();  //peg o ID real e transforma em data

 const newUser: User = {
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
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(sanitizeUser(user)));
  window.dispatchEvent(new Event("auth-change"));
}

//essa função recupera sessão ativa para verificar se tem alguém logado
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


//essa função é responsável pelo logout
export function clearAuthenticatedUser() {
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  localStorage.removeItem("token");
  window.dispatchEvent(new Event("auth-change"));
}

/*--------------------------------------- Alterar Senha --------------------------------------- */

export async function changeAuthenticatedUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const token = localStorage.getItem("token");

  const response = await fetch("http://localhost:3000/profile/change-password", {
    method: "PATCH", 
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // Envia o token JWT para saber qual usuário é
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao alterar a senha.");
  }
}

/*--------------------------------------- Atualizar Perfil --------------------------------------- */

export interface UpdateUserProfileInput {
  name?: string;
  email?: string;
  avatar?: string;
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

  const updatedUser = await response.json();

  // Atualiza também as informações salvas no localStorage
  saveAuthenticatedUser(updatedUser);

  return updatedUser;
}

/*--------------------------------------- Buscar Professores --------------------------------------- */

export async function getRegisteredTeachers(): Promise<User[]> {
  
  const token = localStorage.getItem("token");

  const response = await fetch("http://localhost:3000/users/teachers", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao buscar a lista de professores.");
  }

  return await response.json();
}

/*----------------------------------------------- CRUD - PERFIL -----------------------------------------------*/

// Define o tipo para os dados que podem ser atualizados no perfil
export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  cpf?: string;
  [key: string]: unknown; // Permite outros campos dinâmicos sem usar 'any'
}

//  Busca os dados reais
export async function getProfile() {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3000/profile/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
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