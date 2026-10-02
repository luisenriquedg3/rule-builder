import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "./app";
import { createDb } from "./db";

const validRule = (over: Record<string, unknown> = {}) => ({
  name: "Pago grande",
  trigger: "payment_received",
  matchMode: "all",
  conditions: [{ field: "monto", operator: "gt", value: 500 }],
  actions: [{ type: "email", to: "a@b.com", subject: "Hola", body: "Pago recibido" }],
  ...over,
});

let app: ReturnType<typeof createApp>;
const send = (path: string, method: string, json?: unknown) =>
  app.request(`/api/rules${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: json === undefined ? undefined : JSON.stringify(json),
  });

beforeEach(() => {
  app = createApp(createDb(":memory:"));
});

describe("POST /api/rules", () => {
  it("crea una regla activa y responde 201 con Location", async () => {
    const res = await send("", "POST", validRule());
    expect(res.status).toBe(201);
    const rule = await res.json();
    expect(rule.enabled).toBe(true);
    expect(res.headers.get("Location")).toBe(`/api/rules/${rule.id}`);
  });

  it("rechaza un nombre repetido (sin importar mayúsculas) con 409", async () => {
    await send("", "POST", validRule());
    const res = await send("", "POST", validRule({ name: "pago GRANDE" }));
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("name_taken");
  });

  it("responde 422 sin acciones y sin nombre, indicando los campos", async () => {
    const res = await send("", "POST", validRule({ name: " ", actions: [] }));
    expect(res.status).toBe(422);
    const paths = (await res.json()).error.fields.map((f: { path: string }) => f.path);
    expect(paths).toEqual(expect.arrayContaining(["name", "actions"]));
  });

  it("responde 422 si una condición no corresponde al disparador", async () => {
    const res = await send("", "POST", validRule({ conditions: [{ field: "pais", operator: "eq", value: "MX" }] }));
    expect(res.status).toBe(422);
    expect((await res.json()).error.fields[0].path).toBe("conditions.0.field");
  });

  it("responde 422 si el operador no aplica al tipo de campo", async () => {
    const res = await send("", "POST", validRule({ conditions: [{ field: "moneda", operator: "gt", value: "USD" }] }));
    expect(res.status).toBe(422);
  });

  it("valida los campos de cada tipo de acción", async () => {
    const sms = { type: "sms", phone: "+5217471234567", message: "x".repeat(161) };
    const hook = { type: "webhook", url: "ftp://x.com", method: "POST" };
    expect((await send("", "POST", validRule({ actions: [sms] }))).status).toBe(422);
    expect((await send("", "POST", validRule({ actions: [hook] }))).status).toBe(422);
  });

  it("responde 400 con JSON mal formado", async () => {
    const res = await app.request("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{no es json",
    });
    expect(res.status).toBe(400);
  });
});

describe("PUT / PATCH / DELETE", () => {
  it("permite guardar una regla con su propio nombre", async () => {
    const { id } = await (await send("", "POST", validRule())).json();
    const res = await send(`/${id}`, "PUT", validRule({ conditions: [] }));
    expect(res.status).toBe(200);
    expect((await res.json()).conditions).toEqual([]);
  });

  it("PUT con el nombre de otra regla responde 409", async () => {
    await send("", "POST", validRule({ name: "Una" }));
    const { id } = await (await send("", "POST", validRule({ name: "Otra" }))).json();
    expect((await send(`/${id}`, "PUT", validRule({ name: "Una" }))).status).toBe(409);
  });

  it("PATCH alterna enabled sin tocar el resto", async () => {
    const { id } = await (await send("", "POST", validRule())).json();
    const res = await send(`/${id}/enabled`, "PATCH", { enabled: false });
    const rule = await res.json();
    expect(rule.enabled).toBe(false);
    expect(rule.name).toBe("Pago grande");
  });

  it("responde 404 para ids inexistentes", async () => {
    expect((await send("/nope", "GET")).status).toBe(404);
    expect((await send("/nope", "PUT", validRule())).status).toBe(404);
    expect((await send("/nope/enabled", "PATCH", { enabled: true })).status).toBe(404);
    expect((await send("/nope", "DELETE")).status).toBe(404);
  });

  it("DELETE responde 204 y la regla desaparece", async () => {
    const { id } = await (await send("", "POST", validRule())).json();
    expect((await send(`/${id}`, "DELETE")).status).toBe(204);
    expect((await send(`/${id}`, "GET")).status).toBe(404);
  });
});