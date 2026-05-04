
function NavLink({ children }: { children: React.ReactNode }) {
  return (
    <a className="text-blue-500 text-lg font-semibold border-b-2">
      {children}
    </a>
  );
}
export default NavLink;