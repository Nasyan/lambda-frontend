"use client";

import { useState, type FormEvent } from "react";

import { ApiError } from "@/shared/api/api-client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { adminLogin } from "../api/admin-login";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!email.trim() || !password) {
      setError("Введите email и пароль.");
      return;
    }

    setIsSubmitting(true);

    try {
      await adminLogin({ email, password });
      setMessage("Администратор авторизован.");
    } catch (loginError) {
      setError(loginError instanceof ApiError ? loginError.message : "Не удалось войти.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="admin-email">Email</Label>
        <Input
          autoComplete="email"
          id="admin-email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
          type="email"
          value={email}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-password">Пароль</Label>
        <Input
          autoComplete="current-password"
          id="admin-password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Пароль администратора"
          type="password"
          value={password}
        />
      </div>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button className="w-full" isLoading={isSubmitting} type="submit">
        Войти в админ-панель
      </Button>
    </form>
  );
}
