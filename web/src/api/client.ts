import type { ApiErrorBody } from "@app/shared";

export type FieldError = { path: string; message: string };

export class ApiError extends Error {
  status: number;
  code: ApiErrorBody["error"]["code"] | "network_error";
  fields: FieldError[];

  constructor(
    status: number,
    code: ApiError["code"],
    message: string,
    fields: FieldError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(0, "network_error", "No se pudo conectar con el servidor");
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "internal_error",
      err?.message ?? "Error inesperado del servidor",
      err?.fields,
    );
  }
  return data as T;
}