import type { ReactNode } from "react";
import { NavLink as RouterNavLink } from "react-router-dom";

function NavLink({ children, to }: { children: ReactNode; to: string }) {
  return (
    <RouterNavLink
      to={to}
      className="text-blue-500 text-lg font-semibold border-b-2 transition hover:text-blue-700"
    >
      {children}
    </RouterNavLink>
  );
}

export default NavLink;
