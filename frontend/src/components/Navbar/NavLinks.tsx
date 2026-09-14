import type { ReactNode } from "react";
import { NavLink as RouterNavLink } from "react-router-dom";

function NavLink({ children, to }: { children: ReactNode; to: string }) {
  return (
    <RouterNavLink
      to={to}
      className="border-b border-transparent text-sm font-medium tracking-wide text-slate-600 transition hover:border-blue-500 hover:text-blue-700 xl:text-base"
    >
      {children}
    </RouterNavLink>
  );
}

export default NavLink;
