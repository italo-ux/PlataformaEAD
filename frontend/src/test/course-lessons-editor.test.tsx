import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import CourseLessonsEditor from "../components/CourseLessonsEditor";
import ProfessorCourseCreatePage from "../pages/ProfessorCourseCreatePage";
import courseService, { type Aula, type Curso } from "../services/courseService";

vi.mock("../components/Navbar/Navbar", () => ({ default: () => null }));
vi.mock("../components/Footer/Footer", () => ({ default: () => null }));

const courseId = "11111111-1111-4111-8111-111111111111";
const lesson: Aula = {
  id: "22222222-2222-4222-8222-222222222222",
  titulo: "Aula inicial",
  descricao: "Descrição inicial",
  url_video: "https://youtu.be/dQw4w9WgXcQ",
  duracao_minutos: 10,
  ordem: 1,
};
const course: Curso = {
  id: courseId,
  nome: "Curso de testes",
  descricao: null,
  url_foto: null,
  carga_horaria: null,
  categoria: null,
  nivel: null,
  id_instrutor: "professor-1",
};

function LocationMarker() {
  const location = useLocation();
  return <p>{location.pathname + location.search}</p>;
}

beforeEach(() => {
  const entries = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => {
      entries.delete(key);
    },
    setItem: (key, value) => {
      entries.set(key, String(value));
    },
  };
  vi.stubGlobal("localStorage", storage);
  localStorage.setItem("token", "jwt-test-token");
  localStorage.setItem(
    "ead.auth.user",
    JSON.stringify({
      id: "professor-1",
      name: "Professor",
      email: "professor@example.com",
      role: "professor",
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("CourseLessonsEditor", () => {
  it("creates a lesson and refreshes the ordered list", async () => {
    vi.spyOn(courseService, "listLessons")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([lesson]);
    const createLesson = vi
      .spyOn(courseService, "createLesson")
      .mockResolvedValue(lesson);
    render(<CourseLessonsEditor courseId={courseId} />);
    await screen.findByText(/Nenhuma aula cadastrada/);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Título da aula"), lesson.titulo);
    await user.type(
      screen.getByLabelText("URL do vídeo no YouTube"),
      lesson.url_video,
    );
    await user.type(screen.getByLabelText("Descrição da aula"), lesson.descricao!);
    await user.type(screen.getByLabelText("Duração (minutos)"), "10");
    await user.click(screen.getByRole("button", { name: "Adicionar aula" }));

    await waitFor(() =>
      expect(createLesson).toHaveBeenCalledWith(courseId, {
        titulo: lesson.titulo,
        descricao: lesson.descricao,
        url_video: lesson.url_video,
        duracao_minutos: 10,
      }),
    );
    expect(await screen.findByText("Aula adicionada com sucesso.")).toBeTruthy();
    expect(screen.getByText(lesson.titulo)).toBeTruthy();
  });

  it("edits and deletes an existing lesson", async () => {
    const updatedLesson = { ...lesson, titulo: "Aula atualizada" };
    vi.spyOn(courseService, "listLessons")
      .mockResolvedValueOnce([lesson])
      .mockResolvedValueOnce([updatedLesson])
      .mockResolvedValueOnce([]);
    const updateLesson = vi
      .spyOn(courseService, "updateLesson")
      .mockResolvedValue(updatedLesson);
    const deleteLesson = vi
      .spyOn(courseService, "deleteLesson")
      .mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<CourseLessonsEditor courseId={courseId} />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: `Editar ${lesson.titulo}` }));
    const title = screen.getByLabelText("Título da aula");
    await user.clear(title);
    await user.type(title, updatedLesson.titulo);
    await user.click(screen.getByRole("button", { name: "Salvar aula" }));
    await waitFor(() =>
      expect(updateLesson).toHaveBeenCalledWith(
        courseId,
        lesson.id,
        expect.objectContaining({ titulo: updatedLesson.titulo }),
      ),
    );

    await user.click(
      await screen.findByRole("button", {
        name: `Excluir ${updatedLesson.titulo}`,
      }),
    );
    await waitFor(() =>
      expect(deleteLesson).toHaveBeenCalledWith(courseId, lesson.id),
    );
    expect(await screen.findByText("Aula excluída com sucesso.")).toBeTruthy();
  });

  it("keeps the form available and shows mutation errors", async () => {
    vi.spyOn(courseService, "listLessons").mockResolvedValue([]);
    vi.spyOn(courseService, "createLesson").mockRejectedValue(
      new Error("Falha ao salvar aula."),
    );
    render(<CourseLessonsEditor courseId={courseId} />);
    await screen.findByText(/Nenhuma aula cadastrada/);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Título da aula"), lesson.titulo);
    await user.type(
      screen.getByLabelText("URL do vídeo no YouTube"),
      lesson.url_video,
    );
    await user.click(screen.getByRole("button", { name: "Adicionar aula" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Falha ao salvar aula.",
    );
    expect(
      (screen.getByLabelText("Título da aula") as HTMLInputElement).value,
    ).toBe(lesson.titulo);
  });
});

describe("ProfessorCourseCreatePage", () => {
  it("keeps a newly created course in the lesson-management flow", async () => {
    vi.spyOn(courseService, "createCourse").mockResolvedValue(course);
    render(
      <MemoryRouter initialEntries={["/professor/cursos/novo"]}>
        <Routes>
          <Route
            path="/professor/cursos/novo"
            element={<ProfessorCourseCreatePage />}
          />
          <Route path="*" element={<LocationMarker />} />
        </Routes>
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome do curso"), course.nome);
    await user.click(screen.getByRole("button", { name: "Salvar curso" }));
    expect(
      await screen.findByText(`/courses/${courseId}/editar?created=1`),
    ).toBeTruthy();
  });
});
