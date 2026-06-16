export type UserRole = "aluno" | "professor" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  cpf?: string;
  phone?: string;
  role: UserRole;
}

export interface MockUserCredential {
  user: User;
  password: string;
}

export interface UserPermissions {
  canAccessCourses: boolean;
  canAccessPerformance: boolean;
  canCreateCourses: boolean;
  canCreateTeachers: boolean;
}

// Usuarios fixos usados apenas no frontend enquanto o backend de autenticacao
// nao estiver pronto. No futuro, esta lista deve ser substituida pela API.
export const mockUserCredentials: MockUserCredential[] = [
  {
    user: {
      id: 1,
      name: "Aluno Inovação",
      email: "aluno@plataforma.com",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      cpf: "123.456.789-00",
      phone: "(11) 99999-0001",
      role: "aluno",
    },
    password: "aluno123",
  },
  {
    user: {
      id: 2,
      name: "Professor Tecnologia",
      email: "professor@plataforma.com",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      cpf: "234.567.890-11",
      phone: "(11) 99999-0002",
      role: "professor",
    },
    password: "professor123",
  },
  {
    user: {
      id: 3,
      name: "Admin Plataforma",
      email: "admin@plataforma.com",
      avatar:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
      cpf: "345.678.901-22",
      phone: "(11) 99999-0003",
      role: "admin",
    },
    password: "admin123",
  },
];

// As permissoes ficam centralizadas para facilitar a troca por regras vindas
// do backend depois, sem espalhar verificacoes de role pelas telas.
export const rolePermissions: Record<UserRole, UserPermissions> = {
  aluno: {
    canAccessCourses: true,
    canAccessPerformance: true,
    canCreateCourses: false,
    canCreateTeachers: false,
  },
  professor: {
    canAccessCourses: true,
    canAccessPerformance: false,
    canCreateCourses: true,
    canCreateTeachers: false,
  },
  admin: {
    canAccessCourses: true,
    canAccessPerformance: false,
    canCreateCourses: true,
    canCreateTeachers: true,
  },
};

export function isUserRole(role: unknown): role is UserRole {
  return role === "aluno" || role === "professor" || role === "admin";
}

export function canAccessCourses(user: User | null) {
  return Boolean(user && rolePermissions[user.role].canAccessCourses);
}

export function canAccessPerformance(user: User | null) {
  return Boolean(user && rolePermissions[user.role].canAccessPerformance);
}

export function canCreateCourses(user: User | null) {
  return Boolean(user && rolePermissions[user.role].canCreateCourses);
}

export function canCreateTeachers(user: User | null) {
  return Boolean(user && rolePermissions[user.role].canCreateTeachers);
}

export const mockUser = mockUserCredentials[0].user;
