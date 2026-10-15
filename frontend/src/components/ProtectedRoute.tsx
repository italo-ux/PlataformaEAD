import { Navigate, Outlet } from "react-router-dom";
import type { UserRole, User } from "../data/userMock";
import { useAuth } from "../context/auth-context";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  allowedProfileTypes?: User["profileType"][];
}

export const ProtectedRoute = ({
  allowedRoles,
  allowedProfileTypes,
}: ProtectedRouteProps) => {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-slate-600">Restaurando sessão...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasRole = allowedRoles.includes(user.role);
  const hasProfileType =
    allowedProfileTypes?.includes(user.profileType as "cidadao" | "estagiario" | "funcionario") ??
    false;

  if (!hasRole && !hasProfileType) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};
