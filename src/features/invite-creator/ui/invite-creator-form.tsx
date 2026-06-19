"use client";

import { useState, type FormEvent } from "react";

import { ApiError } from "@/shared/api/api-client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { inviteCreator } from "../api/invite-creator";

export function InviteCreatorForm() {
  const [email, setEmail] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!email.trim() || !instanceId.trim()) {
      setError("Укажите email и UUID инстанса.");
      return;
    }

    setIsSubmitting(true);
    try {
      await inviteCreator({ email, instance_id: instanceId });
      setMessage(`Инвайт для ${email} отправлен.`);
      setEmail("");
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Не удалось отправить инвайт.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="invite-creator-email">Email креатора</Label>
        <Input
          autoComplete="email"
          id="invite-creator-email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="creator@example.com"
          type="email"
          value={email}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-creator-instance">UUID инстанса</Label>
        <Input
          id="invite-creator-instance"
          onChange={(event) => setInstanceId(event.target.value)}
          placeholder="00000000-0000-0000-0000-000000000000"
          value={instanceId}
        />
      </div>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button className="w-full" isLoading={isSubmitting} type="submit">
        Отправить инвайт
      </Button>
    </form>
  );
}
