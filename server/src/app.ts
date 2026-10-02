import { Hono } from "hono";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import type { ApiErrorBody } from "@app/shared";
import type { Db } from "./db";
import { rulesRoutes } from "./rules.routes";

export function createApp(db: Db) {
  const app = new Hono().basePath("/api");
  app.use(logger());

  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/rules", rulesRoutes(db));

  app.notFound((c) =>
    c.json<ApiErrorBody>({ error: { code: "not_found", message: "Ruta no encontrada" } }, 404),
  );

  app.onError((err, c) => {
    // p. ej. JSON malformado: Hono lanza un HTTPException 400
    if (err instanceof HTTPException && err.status === 400) {
      return c.json<ApiErrorBody>({ error: { code: "bad_request", message: "Petición mal formada" } }, 400);
    }
    console.error(err);
    return c.json<ApiErrorBody>({ error: { code: "internal_error", message: "Error inesperado" } }, 500);
  });

  return app;
}