import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrazilMap } from "../components/dashboard/BrazilMap";

afterEach(cleanup);

it("renderiza os estados com cores e permite filtrar pelo teclado", async () => {
  const onUfClick = vi.fn();
  render(<BrazilMap data={[{ uf: "SP", nome: "São Paulo", alunos: 15, participacao: 100 }]} selectedUf="SP" onUfClick={onUfClick} />);
  const state = await screen.findByRole("button", { name: "Filtrar por São Paulo" });
  expect(state.style.getPropertyValue("--state-fill")).toBe("#93c5fd");
  expect(state.style.getPropertyValue("--state-stroke")).toBe("#1e3a8a");
  state.focus();
  await userEvent.setup().keyboard("{Enter}");
  expect(onUfClick).toHaveBeenCalledWith("SP");
});
