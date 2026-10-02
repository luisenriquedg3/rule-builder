import { Hono } from "hono";
import { logger } from "hono/logger";
import type { Db } from "./db";

export function createApp(db: Db) {
  const app = new Hono().basePath("/api");
  app.use(logger());

  app.get("/health", (c) => c.json({ ok: true }));
  // Fase 1: app.route("/rules", rulesRoutes(db));

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: { code: "internal_error", message: "Error inesperado" } }, 500);
  });
  return app;
}