"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { userFromAccessToken } from "@/entities/user/model/token-user";
import { useUserStore } from "@/entities/user/model/user-store";
import { ApiError } from "@/shared/api/api-client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { loginByEmail } from "../api/login";

type LoginFormErrors = {
  email?: string;
  password?: string;
};

export function LoginForm() {
  const router = useRouter();
  const setAuth = useUserStore((state) => state.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateLoginForm(email, password);
    setErrors(validationErrors);
    setFormError(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await loginByEmail({ email, password });
      const user = userFromAccessToken(token.access_token);

      if (!user) {
        setFormError("Не удалось определить пользователя из токена доступа.");
        return;
      }

      setAuth({ accessToken: token.access_token, user });
      router.push(`/instances/${user.instance_id}`);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Не удалось войти.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          aria-describedby={errors.email ? "login-email-error" : undefined}
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          id="login-email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="user@example.com"
          type="email"
          value={email}
        />
        {errors.email ? (
          <p className="text-sm text-red-600" id="login-email-error">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Пароль</Label>
        <Input
          aria-describedby={errors.password ? "login-password-error" : undefined}
          aria-invalid={Boolean(errors.password)}
          autoComplete="current-password"
          id="login-password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Минимум 6 символов"
          type="password"
          value={password}
        />
        {errors.password ? (
          <p className="text-sm text-red-600" id="login-password-error">
            {errors.password}
          </p>
        ) : null}
      </div>

      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

      <Button className="w-full" isLoading={isSubmitting} type="submit">
        Войти
      </Button>
    </form>
  );
}

function validateLoginForm(email: string, password: string): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!email.trim()) {
    errors.email = "Введите email.";
  }

  if (!password) {
    errors.password = "Введите пароль.";
  }

  return errors;
}
