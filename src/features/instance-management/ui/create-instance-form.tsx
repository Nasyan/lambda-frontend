"use client";

import { useState, type FormEvent } from "react";

import { ApiError } from "@/shared/api/api-client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type { Instance } from "@/entities/instance/types";

import { createInstance } from "../api/instances";

type CreateInstanceFormProps = {
  onCreated?: (instance: Instance) => void;
};

export function CreateInstanceForm({ onCreated }: CreateInstanceFormProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!title.trim()) {
      setError("Введите название инстанса.");
      return;
    }

    setIsSubmitting(true);
    try {
      const instance = await createInstance({ title: title.trim() });
      setMessage(`Инстанс «${instance.title}» создан.`);
      setTitle("");
      onCreated?.(instance);
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Не удалось создать инстанс.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate onSubmit={handleSubmit}>
      <div className="flex-1 space-y-2">
        <Label htmlFor="create-instance-title">Название инстанса</Label>
        <Input
          id="create-instance-title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Acme Corp"
          value={title}
        />
      </div>
      <Button isLoading={isSubmitting} type="submit">
        Создать
      </Button>

      {message ? <p className="text-sm text-green-700 sm:basis-full">{message}</p> : null}
      {error ? <p className="text-sm text-red-600 sm:basis-full">{error}</p> : null}
    </form>
  );
}
