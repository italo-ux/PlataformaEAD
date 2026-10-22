import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "../data/userMock";
import { useAuth } from "../context/auth-context";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-slate-600">Restaurando sessão...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};
