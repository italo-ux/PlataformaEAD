//Importação LucideIcon
import type { LucideIcon } from "lucide-react";
import { BookOpenCheck, GraduationCap, UsersRound } from "lucide-react";
//Importação de components
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
//Importação dos dados simulados
import { mockUser } from "../data/userMock";
//Importação da imagem do robô
import smilingRobot from "../assets/login/smilingRobot.png";

//Array dos valores usados
const values: Array<{
  title: string;
  text: string;
  icon: LucideIcon;
}> = [

  //Cards da página
  {
    title: "Aprendizado prático",
    text: "Cursos organizados para que cada aluno avance com clareza, pratique no caminho e acompanhe sua própria evolução.",
    icon: BookOpenCheck
  },
  {
    title: "Tecnologia acessível",
    text: "Uma experiência digital simples, objetiva e pensada para aproximar mais pessoas das oportunidades de formação.",
    icon: GraduationCap
  },
  {
    title: "Comunidade em movimento",
    text: "Alunos, instrutores e parceiros colaboram para tornar o aprendizado mais próximo da realidade do mercado.",
    icon: UsersRound
  }
];

//Component principal
export default function AboutPage() {
  return (
    //Container principal
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/*Navbar */}
      <Navbar user={mockUser} />
      {/*Conteúdo principal */}
      <main className="flex-1">
        {/*Apresentação */}
        <section className="bg-white border-y border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="max-w-3xl">
                {/*Mini título */}
              <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                Quem somos
              </p>
              {/*Título */}
              <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-950">
                Uma plataforma EAD para aprender no seu ritmo
              </h1>
              {/*Texto de descrição */}
              <p className="mt-4 text-lg text-gray-600">
                Somos um espaço que favorece o desenvolvimento da pesquisa
                científica, tecnológica e de inovação. Nossa proposta é ser um
                espaço de interação entre empresas e acadêmicos, buscando
                soluções que tragam benefícios socioeconômicos, melhorem a
                qualidade de vida e impulsionem o desenvolvimento econômico.
                <br></br><br></br>
                Incentivamos o uso de tecnologias avançadas e o empreendedorismo,
                bem como a criação de soluções criativas para os desafios da
                cidade.
                Nosso foco é nas pesquisas tecnológicas que atendam às
                necessidades do município, das instituições de ensino, indústrias
                locais e comunidade em geral.
              </p>
              </div>

              {/*Imagem do robô */}
              <div className="flex justify-center lg:justify-end">
                <img
                  src={smilingRobot}
                  alt="Robo sorridente da Plataforma EAD"
                  className="w-full max-w-[340px] object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/*Área dos cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid gap-5 md:grid-cols-3">
            {values.map(({ title, text, icon: Icon }) => (
              <article
                key={title}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="h-11 w-11 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Icon size={23} />
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-950">
                  {title}
                </h2>
                <p className="mt-2 text-gray-600">{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/*Rodapé */}
      <Footer />
    </div>
  );
}
