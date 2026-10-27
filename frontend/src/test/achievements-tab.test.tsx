import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AchievementsTab } from "../components/studentDashboard/AchievementsTab";
import { mockStudentDashboardService } from "../data/mocks/studentDashboardMock";

afterEach(cleanup);

describe("Conquistas demonstrativas", () => {
  it("mantém exatamente uma conquista em cada estado, inclusive em Todas", async () => {
    const all = await mockStudentDashboardService.getAchievements("todas");
    expect(all.achievements).toHaveLength(3);
    expect(all.achievements.map((achievement) => achievement.status).sort()).toEqual([
      "bloqueada",
      "conquistada",
      "em_progresso",
    ]);
    expect(all.stats).toEqual({ total: 3, conquered: 1, locked: 1 });

    for (const [filter, expectedStatus] of [
      ["conquistadas", "conquistada"],
      ["em_progresso", "em_progresso"],
      ["bloqueadas", "bloqueada"],
    ] as const) {
      const result = await mockStudentDashboardService.getAchievements(filter);
      expect(result.achievements).toHaveLength(1);
      expect(result.achievements[0].status).toBe(expectedStatus);
    }
  });

  it("mostra os três cartões em Todas e um por filtro na interface", async () => {
    const user = userEvent.setup();
    render(<AchievementsTab />);

    expect(await screen.findByText("Primeiro Passo")).toBeTruthy();
    expect(screen.getByText("Especialista")).toBeTruthy();
    expect(screen.getByText("Trilheiro")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Em progresso" }));
    expect(await screen.findByText("Especialista")).toBeTruthy();
    expect(screen.queryByText("Primeiro Passo")).toBeNull();
    expect(screen.queryByText("Trilheiro")).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Bloqueadas" }));
    expect(await screen.findByText("Trilheiro")).toBeTruthy();
    expect(screen.queryByText("Especialista")).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Conquistadas" }));
    expect(await screen.findByText("Primeiro Passo")).toBeTruthy();
    expect(screen.queryByText("Trilheiro")).toBeNull();
  });
});
