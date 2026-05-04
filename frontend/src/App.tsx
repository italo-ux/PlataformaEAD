import Navbar from "./components/Navbar/navbar.tsx";
import LoginForm from "./components/login/LoginForm.tsx"; // Mude "loginForm" para "LoginForm"

function App() {
  return (
    <>
      <Navbar isLoggedIn={false} /> {/* Adicione a prop isLoggedIn */}
      <LoginForm />
    </>
  );
}

export default App;
