import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InviteCreatorForm } from "./invite-creator-form";

const inviteCreator = vi.hoisted(() => vi.fn());

vi.mock("../api/invite-creator", () => ({
  inviteCreator,
}));

describe("InviteCreatorForm", () => {
  beforeEach(() => {
    inviteCreator.mockReset();
  });

  it("renders email and instance UUID fields", () => {
    render(<InviteCreatorForm />);

    expect(screen.getByLabelText(/email креатора/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/uuid инстанса/i)).toBeInTheDocument();
  });

  it("shows a validation error and does not call the API on empty submit", async () => {
    const user = userEvent.setup();

    render(<InviteCreatorForm />);

    await user.click(screen.getByRole("button", { name: "Отправить инвайт" }));

    expect(screen.getByText("Укажите email и UUID инстанса.")).toBeInTheDocument();
    expect(inviteCreator).not.toHaveBeenCalled();
  });

  it("calls the API with email and instance id on valid submit", async () => {
    inviteCreator.mockResolvedValue({ message: "ok" });
    const user = userEvent.setup();

    render(<InviteCreatorForm />);

    await user.type(screen.getByLabelText(/email креатора/i), "creator@example.com");
    await user.type(
      screen.getByLabelText(/uuid инстанса/i),
      "11111111-1111-1111-1111-111111111111",
    );
    await user.click(screen.getByRole("button", { name: "Отправить инвайт" }));

    expect(inviteCreator).toHaveBeenCalledWith({
      email: "creator@example.com",
      instance_id: "11111111-1111-1111-1111-111111111111",
    });
  });
});
