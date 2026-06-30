"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/src/shared/api/api-client";

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Создаем формат application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    // FastAPI OAuth2 форма ждет поле именно с именем "username"
    formData.append("username", email);
    formData.append("password", password);

    try {
      // Отправляем запрос без слэша на конце
      const response = await apiClient.post<LoginResponse>(
        "/auth/login",
        formData,
      );

      const { access_token } = response.data;

      if (access_token) {
        // 1. Сохраняем токен в localStorage для будущих запросов
        localStorage.setItem("access_token", access_token);

        // 2. Перенаправляем пользователя на главную страницу (панель CRM)
        router.push("/");
      } else {
        setError(
          "Сервер не вернул токен авторизации. Обратитесь к администратору.",
        );
      }
    } catch (err: any) {
      console.error("Ошибка входа:", err);

      // Если бэкенд вернул ошибку, выводим сообщение для пользователя
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError("Неверный email или пароль");
      } else {
        setError("Произошла ошибка при попытке входа. Попробуйте позже.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-950">
      <form
        onSubmit={handleLogin}
        className="p-8 bg-white shadow-md rounded flex flex-col gap-4 w-96 border border-gray-200"
      >
        <h1 className="text-2xl font-bold text-center">Вход в CRM</h1>

        {error && (
          <p className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200 text-center">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Email</label>
          <input
            type="email"
            placeholder="example@company.com"
            className="border p-2 rounded focus:outline-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Пароль</label>
          <input
            type="password"
            placeholder="••••••••"
            className="border p-2 rounded focus:outline-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed mt-2 font-semibold"
        >
          {isLoading ? "Вход..." : "Войти"}
        </button>

        <div className="text-sm text-center mt-2 text-gray-600">
          Нет аккаунта?{" "}
          <Link
            href="/register"
            className="text-indigo-600 font-medium hover:underline"
          >
            Регистрация по инвайту
          </Link>
        </div>
      </form>
    </div>
  );
}
