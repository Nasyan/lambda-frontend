"use client";

import { useState, type FormEvent } from "react";

import { ApiError } from "@/shared/api/api-client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import {
  deactivateUser,
  demoteToUser,
  inviteUser,
  promoteToCreator,
  updatePermissions,
} from "../api/user-actions";

type Status = { kind: "success" | "error"; text: string } | null;

function useAction() {
  const [status, setStatus] = useState<Status>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function run(action: () => Promise<{ message?: string }>, fallback: string) {
    setStatus(null);
    setIsSubmitting(true);
    try {
      const result = await action();
      setStatus({ kind: "success", text: result.message ?? "Готово." });
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof ApiError ? error.message : fallback,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { status, isSubmitting, run };
}

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p className={status.kind === "success" ? "text-sm text-green-700" : "text-sm text-red-600"}>
      {status.text}
    </p>
  );
}

function InviteUserForm() {
  const [email, setEmail] = useState("");
  const { status, isSubmitting, run } = useAction();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    void run(() => inviteUser(email), "Не удалось пригласить пользователя.");
  }

  return (
    <form className="space-y-3" noValidate onSubmit={handleSubmit}>
      <Label htmlFor="invite-user-email">Email сотрудника</Label>
      <Input
        id="invite-user-email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="user@example.com"
        type="email"
        value={email}
      />
      <Button isLoading={isSubmitting} type="submit">
        Пригласить
      </Button>
      <StatusLine status={status} />
    </form>
  );
}

function UuidAction({
  label,
  action,
  fallback,
  variant = "primary",
  inputId,
}: {
  label: string;
  action: (uuid: string) => Promise<{ message?: string }>;
  fallback: string;
  variant?: "primary" | "danger";
  inputId: string;
}) {
  const [uuid, setUuid] = useState("");
  const { status, isSubmitting, run } = useAction();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uuid.trim()) return;
    void run(() => action(uuid.trim()), fallback);
  }

  return (
    <form className="space-y-3" noValidate onSubmit={handleSubmit}>
      <Label htmlFor={inputId}>UUID пользователя</Label>
      <Input
        id={inputId}
        onChange={(event) => setUuid(event.target.value)}
        placeholder="00000000-0000-0000-0000-000000000000"
        value={uuid}
      />
      <Button isLoading={isSubmitting} type="submit" variant={variant}>
        {label}
      </Button>
      <StatusLine status={status} />
    </form>
  );
}

function UpdatePermissionsForm() {
  const [uuid, setUuid] = useState("");
  const [tools, setTools] = useState("");
  const { status, isSubmitting, run } = useAction();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uuid.trim()) return;
    const allowedTools = tools
      .split(",")
      .map((tool) => tool.trim())
      .filter(Boolean);
    void run(() => updatePermissions(uuid.trim(), allowedTools), "Не удалось обновить права.");
  }

  return (
    <form className="space-y-3" noValidate onSubmit={handleSubmit}>
      <Label htmlFor="perm-uuid">UUID пользователя</Label>
      <Input
        id="perm-uuid"
        onChange={(event) => setUuid(event.target.value)}
        placeholder="00000000-0000-0000-0000-000000000000"
        value={uuid}
      />
      <Label htmlFor="perm-tools">Доступы (через запятую)</Label>
      <Input
        id="perm-tools"
        onChange={(event) => setTools(event.target.value)}
        placeholder="orders, analytics, triggers"
        value={tools}
      />
      <Button isLoading={isSubmitting} type="submit">
        Обновить права
      </Button>
      <StatusLine status={status} />
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      {children}
    </section>
  );
}

export function UserActionsPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Пригласить пользователя">
        <InviteUserForm />
      </Card>
      <Card title="Повысить до креатора">
        <UuidAction
          action={promoteToCreator}
          fallback="Не удалось повысить пользователя."
          inputId="promote-uuid"
          label="Повысить"
        />
      </Card>
      <Card title="Понизить до пользователя">
        <UuidAction
          action={demoteToUser}
          fallback="Не удалось понизить пользователя."
          inputId="demote-uuid"
          label="Понизить"
        />
      </Card>
      <Card title="Деактивировать пользователя">
        <UuidAction
          action={deactivateUser}
          fallback="Не удалось деактивировать пользователя."
          inputId="deactivate-uuid"
          label="Деактивировать"
          variant="danger"
        />
      </Card>
      <Card title="Изменить права">
        <UpdatePermissionsForm />
      </Card>
    </div>
  );
}
