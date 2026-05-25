
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

function NavLink({ children, to }: { children: ReactNode; to: string }) {
  return (
    <Link to={to} className="text-blue-500 text-lg font-semibold border-b-2">
      {children}
    </Link>
  );
}
export default NavLink;
