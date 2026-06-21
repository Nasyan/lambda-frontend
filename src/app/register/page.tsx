"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/src/shared/api/api-client";

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<"register" | "verify">("register");
  
  // Стейты регистрации
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  
  // Стейты верификации
  const [code, setCode] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/auth/register/", { email, name, password });
      setStep("verify"); // Переключаем на экран ввода кода
    } catch (err) {
      alert("Ошибка регистрации. Возможно инвайт протух или почта неверная.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/auth/verify-registration/", { email, code });
      alert("Успешно! Теперь вы можете войти.");
      router.push("/login");
    } catch (err) {
      alert("Неверный код.");
    }
  };

  const handleResendCode = async () => {
    try {
      await apiClient.post("/auth/resend-code/", { email });
      alert("Новый код отправлен!");
    } catch (err) {
      alert("Ошибка отправки кода.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white shadow-md rounded w-96">
        {step === "register" ? (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <h1 className="text-xl font-bold">Регистрация по инвайту</h1>
            <input className="border p-2 rounded" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="border p-2 rounded" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} required />
            <input className="border p-2 rounded" placeholder="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="bg-green-600 text-white p-2 rounded">Зарегистрироваться</button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <h1 className="text-xl font-bold">Введите код из письма</h1>
            <input className="border p-2 rounded" placeholder="6-значный код" value={code} onChange={e => setCode(e.target.value)} required />
            <button type="submit" className="bg-blue-600 text-white p-2 rounded">Подтвердить</button>
            <button type="button" onClick={handleResendCode} className="text-sm text-gray-500 hover:underline mt-2">Отправить код еще раз</button>
          </form>
        )}
      </div>
    </div>
  );
}