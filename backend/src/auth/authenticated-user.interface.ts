import { UserRole } from './user-role.enum';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}
