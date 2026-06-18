import { LoginForm } from "@/features/auth-by-email/ui/login-form";
import { RegisterForm } from "@/features/auth-by-email/ui/register-form";
import { VerifyForm } from "@/features/auth-by-email/ui/verify-form";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-950">
      <div className="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-[minmax(0,380px)_1fr]">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Lambda CRM</p>
          <h1 className="mt-2 text-2xl font-semibold">Вход в CRM</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Авторизуйтесь по email, чтобы перейти в рабочее пространство.
          </p>
          <div className="mt-6">
            <LoginForm />
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <a className="font-medium text-zinc-900 underline" href="#register">
              Регистрация
            </a>
            <a className="font-medium text-zinc-900 underline" href="#verify">
              Подтвердить email
            </a>
          </div>
        </section>

        <div className="grid gap-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm" id="register">
            <h2 className="text-xl font-semibold">Регистрация</h2>
            <div className="mt-5">
              <RegisterForm />
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm" id="verify">
            <h2 className="text-xl font-semibold">Подтверждение email</h2>
            <div className="mt-5">
              <VerifyForm />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
