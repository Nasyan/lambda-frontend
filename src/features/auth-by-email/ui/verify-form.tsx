"use client";

import { useState, type FormEvent } from "react";

import { ApiError } from "@/shared/api/api-client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { resendRegistrationCode } from "../api/resend";
import { verifyRegistration } from "../api/verify";

type VerifyFormProps = {
  initialEmail?: string;
};

type VerifyFormErrors = {
  code?: string;
  email?: string;
};

export function VerifyForm({ initialEmail = "" }: VerifyFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<VerifyFormErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateVerifyForm(email, code);
    setErrors(validationErrors);
    setMessage(null);
    setFormError(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await verifyRegistration({ code, email });
      setMessage(`${response.message} Пользователь: ${response.user.email}`);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Не удалось подтвердить email.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    const validationErrors: VerifyFormErrors = {};

    if (!email.trim()) {
      validationErrors.email = "Введите email.";
      setErrors(validationErrors);
      return;
    }

    setIsResending(true);
    setFormError(null);
    setMessage(null);

    try {
      const response = await resendRegistrationCode({ email });
      setMessage(response.message);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Не удалось отправить код.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="verify-email">Email</Label>
        <Input
          aria-describedby={errors.email ? "verify-email-error" : undefined}
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          id="verify-email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="user@example.com"
          type="email"
          value={email}
        />
        {errors.email ? (
          <p className="text-sm text-red-600" id="verify-email-error">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="verify-code">Код</Label>
        <Input
          aria-describedby={errors.code ? "verify-code-error" : undefined}
          aria-invalid={Boolean(errors.code)}
          id="verify-code"
          inputMode="numeric"
          maxLength={6}
          onChange={(event) => setCode(event.target.value)}
          placeholder="000000"
          value={code}
        />
        {errors.code ? (
          <p className="text-sm text-red-600" id="verify-code-error">
            {errors.code}
          </p>
        ) : null}
      </div>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" isLoading={isSubmitting} type="submit">
          Подтвердить
        </Button>
        <Button
          className="flex-1"
          isLoading={isResending}
          onClick={handleResend}
          variant="secondary"
        >
          Отправить код
        </Button>
      </div>
    </form>
  );
}

function validateVerifyForm(email: string, code: string): VerifyFormErrors {
  const errors: VerifyFormErrors = {};

  if (!email.trim()) {
    errors.email = "Введите email.";
  }

  if (!/^\d{6}$/.test(code)) {
    errors.code = "Введите код из 6 цифр.";
  }

  return errors;
}
