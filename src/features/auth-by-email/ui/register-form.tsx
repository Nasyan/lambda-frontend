"use client";

import { useState, type FormEvent } from "react";

import { ApiError } from "@/shared/api/api-client";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { registerByEmail } from "../api/register";
import { VerifyForm } from "./verify-form";

type RegisterFormErrors = {
  email?: string;
  name?: string;
  password?: string;
};

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateRegisterForm(email, name, password);
    setErrors(validationErrors);
    setFormError(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await registerByEmail({ email, name, password });
      setPendingEmail(email);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Не удалось зарегистрироваться.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="register-name">Имя</Label>
          <Input
            aria-describedby={errors.name ? "register-name-error" : undefined}
            aria-invalid={Boolean(errors.name)}
            autoComplete="name"
            id="register-name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Иван Иванов"
            value={name}
          />
          {errors.name ? (
            <p className="text-sm text-red-600" id="register-name-error">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            aria-describedby={errors.email ? "register-email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            id="register-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            type="email"
            value={email}
          />
          {errors.email ? (
            <p className="text-sm text-red-600" id="register-email-error">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Пароль</Label>
          <Input
            aria-describedby={errors.password ? "register-password-error" : undefined}
            aria-invalid={Boolean(errors.password)}
            autoComplete="new-password"
            id="register-password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Минимум 6 символов"
            type="password"
            value={password}
          />
          {errors.password ? (
            <p className="text-sm text-red-600" id="register-password-error">
              {errors.password}
            </p>
          ) : null}
        </div>

        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

        <Button className="w-full" isLoading={isSubmitting} type="submit">
          Зарегистрироваться
        </Button>
      </form>

      <Dialog
        description="Введите код из письма, чтобы завершить регистрацию."
        onClose={() => setPendingEmail(null)}
        open={Boolean(pendingEmail)}
        title="Подтверждение email"
      >
        <VerifyForm initialEmail={pendingEmail ?? email} />
      </Dialog>
    </>
  );
}

function validateRegisterForm(
  email: string,
  name: string,
  password: string,
): RegisterFormErrors {
  const errors: RegisterFormErrors = {};
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.name = "Введите имя.";
  } else if (trimmedName.length < 2 || trimmedName.length > 50) {
    errors.name = "Имя должно быть от 2 до 50 символов.";
  }

  if (!email.trim()) {
    errors.email = "Введите email.";
  }

  if (!password) {
    errors.password = "Введите пароль.";
  } else if (password.length < 6) {
    errors.password = "Пароль должен быть не короче 6 символов.";
  }

  return errors;
}
