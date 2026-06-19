"use client";

import { useState, type FormEvent } from "react";

import { ApiError } from "@/shared/api/api-client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { resendRegistrationCode } from "../api/resend";

export function ResendForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!email.trim()) {
      setError("Введите email.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resendRegistrationCode({ email });
      setMessage("Код подтверждения отправлен повторно.");
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Не удалось отправить код.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="resend-email">Email</Label>
        <Input
          autoComplete="email"
          id="resend-email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="user@example.com"
          type="email"
          value={email}
        />
      </div>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button className="w-full" isLoading={isSubmitting} type="submit">
        Отправить код повторно
      </Button>
    </form>
  );
}
