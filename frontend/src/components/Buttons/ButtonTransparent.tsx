function ButtonTransparent({ children }: { children: React.ReactNode }) {
  return (
    <button className="bg-transparent border border-blue-500 text-lg text-blue-500 px-7 py-2 rounded-md hover:bg-blue-500 hover:text-white transition">
      {children}
    </button>
  );
}
export default ButtonTransparent;