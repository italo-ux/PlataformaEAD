/*------------------------------------------------------- */
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

//cria um objeto novo sem informações sensiveis vindas do back-end
function sanitizeUser(user: User): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role, //identifica se é func, aluno ou prof
  };
}

/*--------------------------------------- Função de login real --------------------------------------- */

//usa promise para garantir que se o login der certo, essa função vai devolver o novo objeto User (Limpo)
export async function loginUser(email: string, password: string): Promise<User> { 
  const response = await fetch("http://localhost:3000/auth/login", {
    method: "POST", //criar sessão segura
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Email ou senha incorretos"); //interrompe o processo
  }

  const data = await response.json(); //torna texto puro em legível e dentro de data esta o JWT e dados básicos do usuário

  // Salva o Token de acesso gerado pelo NestJS no navegador
  localStorage.setItem("token", data.access_token);

  return {
    id: data.user.id, 
    name: data.user.name || data.user.email, 
    email: data.user.email,
    role: data.user.role || "aluno", 
  };
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

  return {
    id: data.id,
    name: userData.name.trim(),
    email: data.email,
    role: "aluno", 
  };
}

/*--------------------------------------- Gerenciamento de localstorage --------------------------------------- */

//essa função pega o user, passa pelo sanity pra limpar, transforma em texto e tranca no storage
export function saveAuthenticatedUser(user: User) {
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(sanitizeUser(user)));
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
}