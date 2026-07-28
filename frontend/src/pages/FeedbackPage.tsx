// Importação hooks do React
import { useMemo, useState } from "react";

//Importação de components
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

//Importação dos dados do usuário(simulação)
import { getAuthenticatedUser } from "../services/userService";

//Ícones da lucide-react
import {
  CheckCircle2,
  GraduationCap,
  MessageSquareText,
  Send,
  Star,
  ThumbsUp
} from "lucide-react";

//Categorias para feedback
const categories = ["Curso", "Plataforma", "Professor", "Suporte"];

//Feedbacks de simulação para a página
const feedbacks = [
  {
    name: "Mariana Costa",
    course: "Web Development Avançaado",
    rating: 5,
    text: "As aulas são objetivas e o progresso ajuda muito a manter o ritmo de estudo!"
  },
  {
    name: "Rafael Lima",
    course: "Curso de Game Development",
    rating: 4,
    text: "Gostei da didática e dos exemplos práticos. Seria ótimo ter mais exercícios ao final dos módulos."
  },
  {
    name: "Camila Rocha",
    course: "Introdução a Programação",
    rating: 5,
    text: "A plataforma ficou simples de navegar e consigo retomar exatamente de onde parei!"
  }
];

// Component principal feedback
export default function FeedbackPage() {
  const user = getAuthenticatedUser();

  //Nota dada pelo usuário
  const [rating, setRating] = useState(0);
  //Categoria do feedback
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  //Exibição da mensagem depois de enviada
  const [submitted, setSubmitted] = useState(false);

  //Cálculo das avaliações
  const averageRating = useMemo(() => {
    const total = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    return (total / feedbacks.length).toFixed(1);
  }, []);

  //Envio do formulário/feedback
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    //Container principal
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/*Navbar */}
      <Navbar user={user} />

      <main className="flex-1">
        {/*Cabeçalho */}
        <section className="bg-white border-y border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/*Grid principal */}
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              {/*Texto inicial */}
              <div>
                {/*Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                  {/*Ícone */}
                  <MessageSquareText size={16} />
                  Feedback da plataforma
                </div>
                {/*Título */}
                <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-950">
                  Conte como foi sua experiência de aprendizado!
                </h1>
                {/*Descrição */}
                <p className="mt-3 max-w-2xl text-lg text-gray-600">
                  Sua opinião ajuda a melhorar cursos, aulas e recursos para a
                  comunidade de alunos.
                </p>
              </div>
              {/*Cards estatísticas */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <Star className="text-amber-500 fill-amber-500" size={24} />
                  <p className="mt-3 text-2xl font-bold text-gray-950">
                    {averageRating}
                  </p>
                  <p className="text-sm text-gray-500">média geral</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <ThumbsUp className="text-emerald-600" size={24} />
                  <p className="mt-3 text-2xl font-bold text-gray-950">97%</p>
                  <p className="text-sm text-gray-500">satisfação</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <GraduationCap className="text-blue-600" size={24} />
                  <p className="mt-3 text-2xl font-bold text-gray-950">18</p>
                  <p className="text-sm text-gray-500">cursos avaliados</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*Principal */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">

            {/*Formulário */}
            <form
              onSubmit={handleSubmit}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-950">
                  Enviar feedback
                </h2>
                <p className="mt-1 text-gray-600">
                  Preencha os campos para registrar sua avaliação.
                </p>
              </div>
              {/*Nota */}
              <label className="block text-sm font-semibold text-gray-700">
                Nota
              </label>
              {/*Estrelas de avaliação */}
              <div className="mt-2 flex gap-2" aria-label="Selecionar nota">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="h-11 w-11 rounded-lg border border-gray-200 flex items-center justify-center hover:border-amber-400 transition"
                    aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
                  >
                    {/*Estado da estrela (preenchida ou vazia) */}
                    <Star
                      size={22}
                      className={
                        value <= rating
                          ? "fill-amber-500 text-amber-500"
                          : "text-gray-300"
                      }
                    />
                  </button>
                ))}
              </div>

              {/*Categoria */}
              <label className="mt-5 block text-sm font-semibold text-gray-700">
                Categoria
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                      selectedCategory === category
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-blue-300"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {/*Input do nome */}
              <label
                htmlFor="feedback-name"
                className="mt-5 block text-sm font-semibold text-gray-700"
              >
                Nome
              </label>
              <input
                id="feedback-name"
                name="name"
                type="text"
                placeholder="Seu nome"
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required
              />

              {/*Input do comentário/feedback */}
              <label
                htmlFor="feedback-message"
                className="mt-5 block text-sm font-semibold text-gray-700"
              >
                Comentário
              </label>
              <textarea
                id="feedback-message"
                name="message"
                rows={5}
                placeholder="Escreva sua sugestão, elogio ou dificuldade..."
                className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required
              />
              {/*Botão de envio */}
              <button
                type="submit"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 transition"
              >
                <Send size={18} />
                Enviar feedback
              </button>

              {/*Mensagem pós envio */}
              {submitted && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                  <CheckCircle2 className="mt-0.5 flex-shrink-0" size={20} />
                  <p className="text-sm font-medium">
                    Obrigado pelo feedback! Sua mensagem foi registrada para
                    análise da equipe da plataforma.
                  </p>
                </div>
              )}
            </form>

            {/*Lista de outros feedbacks */}
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-950">
                  Feedbacks recentes
                </h2>
                <p className="mt-1 text-gray-600">
                  Veja o que outros alunos estão comentando!
                </p>
              </div>

              {feedbacks.map((feedback) => (
                <article
                  key={`${feedback.name}-${feedback.course}`}
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {/*Dados dos alunos */}
                    <div>
                      <h3 className="font-bold text-gray-950">
                        {feedback.name}
                      </h3>
                      <p className="text-sm text-gray-500">{feedback.course}</p>
                    </div>
                    {/*Estrelas dadas pelo aluno */}
                    <div className="flex gap-1" aria-label={`${feedback.rating} estrelas`}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          size={18}
                          className={
                            value <= feedback.rating
                              ? "fill-amber-500 text-amber-500"
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  {/*Comentário/feedback do aluno */}
                  <p className="mt-4 text-gray-700">{feedback.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/*Rodapé */}
      <Footer />
    </div>
  );
}
