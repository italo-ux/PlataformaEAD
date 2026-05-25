import logo from "../../assets/navbar/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import Navlinks from "./NavLinks.tsx";
import ButtonTransparent from "../Buttons/ButtonTransparent.tsx";
import type { User } from "../../data/userMock.ts";
import { Link } from "react-router-dom";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Navbar({ user }: { user: null | User }) {
  const isLoggedIn = Boolean(user);

  return (
    <nav className="navbar bg-gradient-to-r from-white to-blue-50 flex items-center justify-between w-full px-20 py-4">
      {/* Logo */}
      <div className="logo flex-shrink-0">
        <img className="h-auto w-55" src={logo} alt="Logo" />
      </div>

      {/* Links centralizados */}
      <ul className="nav-links flex items-center space-x-8 ml-25">
        <li>
          <Navlinks to="/home">HOME</Navlinks>
        </li>
        <li>
          <Navlinks to="/quem-somos">QUEM SOMOS</Navlinks>
        </li>
        <li>
          <Navlinks to="/courses">CURSOS</Navlinks>
        </li>
        <li>
          <Navlinks to="/feedback">FEEDBACKS</Navlinks>
        </li>
      </ul>

      {/* Botões do lado direito */}
      <div className="flex items-center gap-3">
        <ButtonTransparent>
          <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
          Contato
        </ButtonTransparent>

        {isLoggedIn ? (
          <div className="flex items-center gap-3">
           
            <ButtonTransparent>
              <span>Meu Desempenho</span>
            </ButtonTransparent>
             <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.name} avatar`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user ? getInitials(user.name) : "US"}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
           <Link to="/login"> 
            <ButtonTransparent>Login</ButtonTransparent>
           </Link>
           <Link to="/register">
            <ButtonTransparent>Cadastre-se</ButtonTransparent>
            </Link>
          </div>
          
        )}
      </div>
    </nav>
  );
}

export default Navbar;
