import { z } from "zod";
import { TRIGGERS, FIELDS_BY_TRIGGER, OPERATORS_BY_TYPE } from "./catalog";

const httpUrl = z
  .string()
  .trim()
  .url("URL inválida")
  .refine((v) => /^https?:\/\//i.test(v), "Debe empezar con http:// o https://");

export const conditionSchema = z.object({
  field: z.string().min(1, "Elige un campo"),
  operator: z.enum(["eq", "contains", "gt", "lt"]),
  value: z.union([z.string(), z.number()]),
});

export const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("email"),
    to: z.string().trim().email("Email inválido"),
    subject: z.string().trim().min(1, "El asunto es obligatorio"),
    body: z.string().trim().min(1, "El cuerpo es obligatorio"),
  }),
  z.object({
    type: z.literal("sms"),
    phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/, "Teléfono inválido (7 a 15 dígitos, con + opcional)"),
    message: z.string().min(1, "El mensaje es obligatorio").max(160, "Máximo 160 caracteres"),
  }),
  z.object({
    type: z.literal("webhook"),
    url: httpUrl,
    method: z.enum(["POST", "PUT"]),
  }),
]);

export const ruleInputSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
    trigger: z.enum(TRIGGERS, { errorMap: () => ({ message: "Elige un disparador" }) }),
    matchMode: z.enum(["all", "any"]),
    conditions: z.array(conditionSchema),
    actions: z.array(actionSchema).min(1, "Agrega al menos una acción"),
  })
  .superRefine((rule, ctx) => {
    const fields = FIELDS_BY_TRIGGER[rule.trigger];
    rule.conditions.forEach((c, i) => {
      const issue = (key: string, message: string) =>
        ctx.addIssue({ code: "custom", path: ["conditions", i, key], message });

      const type = fields[c.field];
      if (!type) return issue("field", `El campo "${c.field}" no existe para este disparador`);

      if (!(OPERATORS_BY_TYPE[type] as readonly string[]).includes(c.operator))
        issue("operator", "Operador no válido para este campo");

      if (type === "number") {
        if (typeof c.value !== "number" || !Number.isFinite(c.value)) issue("value", "Debe ser un número");
      } else if (typeof c.value !== "string" || c.value.trim() === "") {
        issue("value", "El valor es obligatorio");
      }
    });
  });

export type ConditionInput = z.infer<typeof conditionSchema>;
export type ActionInput = z.infer<typeof actionSchema>;
export type RuleInput = z.infer<typeof ruleInputSchema>;

export type Rule = RuleInput & {
  id: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiErrorCode =
  | "validation_error"
  | "name_taken"
  | "not_found"
  | "bad_request"
  | "internal_error";

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: { path: string; message: string }[];
  };
};