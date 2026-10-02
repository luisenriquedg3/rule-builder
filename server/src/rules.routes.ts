import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z, type ZodError } from "zod";
import { ruleInputSchema, type ApiErrorBody } from "@app/shared";
import type { Db } from "./db";
import { createRulesRepo, NameTakenError } from "./rules.repo";

const body = (code: ApiErrorBody["error"]["code"], message: string, fields?: { path: string; message: string }[]): ApiErrorBody => ({
  error: { code, message, ...(fields && { fields }) },
});

const notFound = body("not_found", "La regla no existe");
const nameTaken = body("name_taken", "Ya existe una regla con ese nombre", [
  { path: "name", message: "Ya existe una regla con ese nombre" },
]);

const fromZod = (err: ZodError) =>
  body(
    "validation_error",
    "La regla no es válida",
    err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
  );

const validate = <T extends z.ZodTypeAny>(schema: T) =>
  zValidator("json", schema, (result, c) => {
    if (!result.success) return c.json(fromZod(result.error), 422);
  });

export function rulesRoutes(db: Db) {
  const repo = createRulesRepo(db);
  const app = new Hono();

  app.get("/", (c) => c.json(repo.list()));

  app.get("/:id", (c) => {
    const rule = repo.get(c.req.param("id"));
    return rule ? c.json(rule) : c.json(notFound, 404);
  });

  app.post("/", validate(ruleInputSchema), (c) => {
    try {
      const rule = repo.create(c.req.valid("json"));
      c.header("Location", `/api/rules/${rule.id}`);
      return c.json(rule, 201);
    } catch (e) {
      if (e instanceof NameTakenError) return c.json(nameTaken, 409);
      throw e;
    }
  });

  app.put("/:id", validate(ruleInputSchema), (c) => {
    try {
      const rule = repo.update(c.req.param("id"), c.req.valid("json"));
      return rule ? c.json(rule) : c.json(notFound, 404);
    } catch (e) {
      if (e instanceof NameTakenError) return c.json(nameTaken, 409);
      throw e;
    }
  });

  app.patch("/:id/enabled", validate(z.object({ enabled: z.boolean() })), (c) => {
    const rule = repo.setEnabled(c.req.param("id"), c.req.valid("json").enabled);
    return rule ? c.json(rule) : c.json(notFound, 404);
  });

  app.delete("/:id", (c) => (repo.remove(c.req.param("id")) ? c.body(null, 204) : c.json(notFound, 404)));

  return app;
}