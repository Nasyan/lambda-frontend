"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/src/shared/api/api-client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await apiClient.post<{ access_token: string }>("/auth/login/", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("access_token", response.data.access_token);
      router.push("/"); // Кидаем на главную CRM
    } catch {
      setError("Ошибка входа. Проверьте почту и пароль.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-md rounded flex flex-col gap-4 w-96">
        <h1 className="text-2xl font-bold text-center">Вход в CRM</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <input
          type="email" placeholder="Email"
          className="border p-2 rounded"
          value={email} onChange={(e) => setEmail(e.target.value)} required
        />
        <input
          type="password" placeholder="Пароль"
          className="border p-2 rounded"
          value={password} onChange={(e) => setPassword(e.target.value)} required
        />
        
        <button type="submit" className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">
          Войти
        </button>
        <div className="text-sm text-center mt-2">
          Нет аккаунта? <Link href="/register" className="text-blue-500 hover:underline">Регистрация по инвайту</Link>
        </div>
      </form>
    </div>
  );
}
