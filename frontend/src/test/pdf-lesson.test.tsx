import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PdfLesson from "../components/PdfLesson";
import journeyService from "../services/journeyService";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("exibe o PDF autenticado e só conclui após confirmação", async () => {
  const createObjectURL = vi.fn(() => "blob:material");
  const revokeObjectURL = vi.fn();
  vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
  vi.spyOn(journeyService, "getLessonPdf").mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" }));
  const complete = vi.spyOn(journeyService, "completePdfLesson").mockResolvedValue({} as Awaited<ReturnType<typeof journeyService.completePdfLesson>>);
  const onCompleted = vi.fn();
  const view = render(<PdfLesson courseId="course" lessonId="lesson" filename="material.pdf" canComplete onCompleted={onCompleted} />);

  expect(screen.getByText("Carregando PDF...")).toBeTruthy();
  expect(await screen.findByTitle("PDF da aula: material.pdf")).toBeTruthy();
  expect(complete).not.toHaveBeenCalled();
  await userEvent.setup().click(screen.getByRole("button", { name: "Li o PDF — concluir aula" }));
  await waitFor(() => expect(complete).toHaveBeenCalledWith("course", "lesson"));
  expect(onCompleted).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:material");
});

it("informa erro de carregamento sem permitir concluir", async () => {
  vi.spyOn(journeyService, "getLessonPdf").mockRejectedValue(new Error("PDF indisponível"));
  const complete = vi.spyOn(journeyService, "completePdfLesson");
  render(<PdfLesson courseId="course" lessonId="lesson" filename="material.pdf" canComplete onCompleted={() => undefined} />);
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "PDF indisponível");
  expect(screen.queryByRole("button", { name: "Li o PDF — concluir aula" })).toBeNull();
  expect(complete).not.toHaveBeenCalled();
});
