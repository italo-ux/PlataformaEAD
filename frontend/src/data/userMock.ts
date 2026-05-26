export type UserRole = "student" | "instructor" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

export interface MockUserCredential {
  user: User;
  password: string;
}

// Mock credentials only for local/frontend development.
// Replace this list with backend authentication when the API is ready.
export const mockUserCredentials: MockUserCredential[] = [
  {
    user: {
      id: 1,
      name: "Joao Silva",
      email: "joao.silva@exemplo.com",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      role: "student",
    },
    password: "123456",
  },
];

export const mockUser = mockUserCredentials[0].user;
