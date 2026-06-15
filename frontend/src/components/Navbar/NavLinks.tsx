import type { ReactNode } from "react";
import { NavLink as RouterNavLink } from "react-router-dom";

function NavLink({ children, to }: { children: ReactNode; to: string }) {
  return (
    <RouterNavLink
      to={to}
      className="border-b-2 text-sm font-semibold text-blue-500 transition hover:text-blue-700 xl:text-lg"
    >
      {children}
    </RouterNavLink>
  );
}

export default NavLink;
