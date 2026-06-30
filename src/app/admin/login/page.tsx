"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/src/shared/api/api-client";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Для OAuth2PasswordRequestForm отправляем как x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await apiClient.post<{ access_token: string }>(
        "/admin/login",
        formData,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
      );

      // Сохраняем токен и редиректим в админку
      localStorage.setItem("access_token", response.data.access_token);
      router.push("/admin");
    } catch {
      setError("Ошибка входа. Проверьте логин и пароль.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="p-8 bg-white shadow-md rounded flex flex-col gap-4 w-96"
      >
        <h1 className="text-2xl font-bold text-center">Вход Админа</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Войти
        </button>
      </form>
    </div>
  );
}
