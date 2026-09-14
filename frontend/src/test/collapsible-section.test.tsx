import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import CollapsibleSection from "../components/CollapsibleSection";

afterEach(cleanup);

describe("CollapsibleSection", () => {
  it("mounts its content only while the menu is open", async () => {
    render(
      <CollapsibleSection title="Gerenciar trilhas" description="Descrição">
        <p>Conteúdo administrativo</p>
      </CollapsibleSection>,
    );

    const trigger = screen.getByRole("button", { name: /Gerenciar trilhas/ });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Conteúdo administrativo")).toBeNull();

    const user = userEvent.setup();
    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Conteúdo administrativo")).toBeTruthy();

    await user.click(trigger);
    expect(screen.queryByText("Conteúdo administrativo")).toBeNull();
  });
});
