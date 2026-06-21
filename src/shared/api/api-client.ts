import axios from "axios";

// Базовый урл бэкенда (FastAPI обычно висит на 8000 порту)
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_URL,
  // Важно! Разрешаем браузеру отправлять и сохранять куки (для Refresh токена)
  withCredentials: true, 
});

// Перехватчик ЗАПРОСОВ: достаем токен из localStorage и клеим в заголовок
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Перехватчик ОТВЕТОВ: ловим 401 ошибку и пытаемся обновить токен
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка 401 (Токен истек) и мы еще не пытались его обновить
    if (error.response?.status === 401 && !originalRequest._isRetry) {
      originalRequest._isRetry = true;
      try {
        // Дергаем твой эндпоинт рефреша (кука улетит сама)
        const response = await axios.post(`${API_URL}/auth/refresh/`, {}, { withCredentials: true });
        
        // Сохраняем новый токен
        const newAccessToken = response.data.access_token;
        localStorage.setItem("access_token", newAccessToken);
        
        // Повторяем оригинальный запрос с новым токеном
        return apiClient.request(originalRequest);
      } catch (e) {
        // Если рефреш не удался (кука протухла), выкидываем на логин
        localStorage.removeItem("access_token");
        if (typeof window !== "undefined") {
          window.location.href = "/admin/login";
        }
      }
    }
    return Promise.reject(error);
  }
);