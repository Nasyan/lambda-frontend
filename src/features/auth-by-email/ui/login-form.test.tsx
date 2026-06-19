import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/entities/user/model/user-store";

import { LoginForm } from "./login-form";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    push.mockClear();
    useUserStore.getState().clear();
  });

  it("renders email and password fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
  });

  it("shows validation error on empty submit", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(screen.getByText("Введите email.")).toBeInTheDocument();
    expect(screen.getByText("Введите пароль.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
