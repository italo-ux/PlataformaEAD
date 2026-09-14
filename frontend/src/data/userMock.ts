export type UserRole = "aluno" | "professor" | "admin";
export type UserId = number | string;

export interface User {
  id: UserId;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  role: UserRole;
  mustChangeEmail?: boolean;
  mustChangePassword?: boolean;
  profileType?: "cidadao" | "estagiario" | "funcionario";
  verificationStatus?: "nao_aplicavel" | "pendente";
}

export interface UserPermissions {
  canAccessCourses: boolean;
  canAccessPerformance: boolean;
  canCreateCourses: boolean;
  canCreateTeachers: boolean;
}

// Permissões de interface. O backend continua sendo a autoridade.
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
