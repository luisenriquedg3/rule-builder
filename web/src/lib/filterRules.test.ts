import { describe, it, expect } from "vitest";
import type { Rule } from "@app/shared";
import { filterRules } from "./filterRules";

const rule = (name: string, enabled: boolean): Rule => ({
  id: name,
  name,
  enabled,
  trigger: "payment_received",
  matchMode: "all",
  conditions: [],
  actions: [],
  createdAt: "",
  updatedAt: "",
});

const rules = [rule("Pago grande", true), rule("Conversión baja", false), rule("Cliente VIP", true)];
const names = (r: Rule[]) => r.map((x) => x.name);

describe("filterRules", () => {
  it("sin filtros devuelve todo", () => {
    expect(filterRules(rules, { query: "", status: "all" })).toHaveLength(3);
  });

  it("ignora mayúsculas y acentos", () => {
    expect(names(filterRules(rules, { query: "CONVERSION", status: "all" }))).toEqual(["Conversión baja"]);
  });

  it("filtra por estado", () => {
    expect(names(filterRules(rules, { query: "", status: "inactive" }))).toEqual(["Conversión baja"]);
    expect(filterRules(rules, { query: "", status: "active" })).toHaveLength(2);
  });

  it("combina texto y estado", () => {
    expect(filterRules(rules, { query: "cliente", status: "inactive" })).toEqual([]);
  });

  it("ignora espacios alrededor de la búsqueda", () => {
    expect(filterRules(rules, { query: "  pago ", status: "all" })).toHaveLength(1);
  });
});