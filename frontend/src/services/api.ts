import axios, { type InternalAxiosRequestConfig } from "axios";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export const AUTH_CHANGED_EVENT = "ead:auth-changed";
export const INTERNAL_ERROR_MESSAGE =
  "Não foi possível concluir esta operação agora. Tente novamente em instantes.";
export const CONNECTION_ERROR_MESSAGE =
  "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";

export function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("ead.auth.user");
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) clearStoredSession();
      if ((error.response?.status ?? 0) >= 500) {
        console.error("Falha interna na API", {
          method: error.config?.method?.toUpperCase(),
          path: error.config?.url,
          status: error.response?.status,
        });
      }
    }
    return Promise.reject(error);
  },
);

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  authenticated = true,
) {
  const token = localStorage.getItem("token");
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    console.error("Falha de conexão com a API", {
      method: options.method ?? "GET",
      path,
      error,
    });
    throw new Error(CONNECTION_ERROR_MESSAGE);
  }
  if (response.status === 401 && authenticated) clearStoredSession();
  if (response.status >= 500) {
    console.error("Falha interna na API", {
      method: options.method ?? "GET",
      path,
      status: response.status,
    });
    return new Response(
      JSON.stringify({
        statusCode: response.status,
        message: INTERNAL_ERROR_MESSAGE,
      }),
      {
        status: response.status,
        statusText: response.statusText,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  return response;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    if ((error.response?.status ?? 0) >= 500) return INTERNAL_ERROR_MESSAGE;
    if (!error.response) return CONNECTION_ERROR_MESSAGE;
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
  }

  return error instanceof Error
    ? error.message
    : "Erro ao processar solicitação";
}
