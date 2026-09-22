import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizLesson from "../components/QuizLesson";
import journeyService, { type JourneyLesson } from "../services/journeyService";

const lesson: JourneyLesson = {
  id: "11111111-1111-4111-8111-111111111111",
  titulo: "Avaliação",
  descricao: null,
  duracao_minutos: null,
  duracao_segundos: null,
  ordem: 1,
  url_video: null,
  tipo: "questionario",
  status: "disponivel",
  percentual: 0,
  posicao_segundos: 0,
  questionario: {
    id: "22222222-2222-4222-8222-222222222222",
    nota_minima: 70,
    max_tentativas: 3,
    pontos_base: 0,
    perguntas: [
      {
        id: "33333333-3333-4333-8333-333333333333",
        enunciado: "Qual é a correta?",
        ordem: 1,
        pontos: 1,
        alternativas: [
          { id: "44444444-4444-4444-8444-444444444444", texto: "Correta", ordem: 1 },
          { id: "55555555-5555-4555-8555-555555555555", texto: "Incorreta", ordem: 2 },
        ],
      },
    ],
  },
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("QuizLesson", () => {
  it("mantém o gabarito oculto antes da terceira tentativa", async () => {
    vi.spyOn(journeyService, "submitQuiz").mockResolvedValue({
      tentativa_id: "attempt-1",
      numero: 1,
      acertos: 0,
      total_perguntas: 1,
      percentual: 0,
      aprovado: false,
      pontos_obtidos: 0,
      tentativas_restantes: 2,
      gabarito_disponivel: false,
      respostas: [
        {
          pergunta_id: lesson.questionario!.perguntas[0].id,
          alternativa_selecionada_id: lesson.questionario!.perguntas[0].alternativas[1].id,
          alternativa_correta_id: null,
          correta: false,
        },
      ],
    });
    const user = userEvent.setup();
    render(<QuizLesson courseId="course" lesson={lesson} canSubmit onCompleted={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: "Incorreta" }));
    await user.click(screen.getByRole("button", { name: "Finalizar questionário" }));

    expect(await screen.findByText(/gabarito permanece oculto/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Nova tentativa" })).toBeTruthy();
    expect(screen.getByText("Correta").closest("label")?.className).not.toContain("emerald");
  });

  it("libera o gabarito após a terceira reprovação e encerra tentativas", async () => {
    vi.spyOn(journeyService, "submitQuiz").mockResolvedValue({
      tentativa_id: "attempt-3",
      numero: 3,
      acertos: 0,
      total_perguntas: 1,
      percentual: 0,
      aprovado: false,
      pontos_obtidos: 0,
      tentativas_restantes: 0,
      gabarito_disponivel: true,
      respostas: [
        {
          pergunta_id: lesson.questionario!.perguntas[0].id,
          alternativa_selecionada_id: lesson.questionario!.perguntas[0].alternativas[1].id,
          alternativa_correta_id: lesson.questionario!.perguntas[0].alternativas[0].id,
          correta: false,
        },
      ],
    });
    const user = userEvent.setup();
    render(<QuizLesson courseId="course" lesson={lesson} canSubmit onCompleted={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: "Incorreta" }));
    await user.click(screen.getByRole("button", { name: "Finalizar questionário" }));

    expect(await screen.findByText(/gabarito foi liberado/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Nova tentativa" })).toBeNull();
    expect(screen.getByText("Correta").closest("label")?.className).toContain("emerald");
  });
});
