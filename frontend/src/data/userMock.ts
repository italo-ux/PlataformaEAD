export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export const mockUser: User = {
  id: 1,
  name: "João Silva",
  email: "joao.silva@exemplo.com",
  avatar:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
};
