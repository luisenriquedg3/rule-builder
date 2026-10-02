export const TRIGGERS = ["customer_created", "payment_received", "ticket_unanswered"] as const;
export type Trigger = (typeof TRIGGERS)[number];

export const TRIGGER_LABELS: Record<Trigger, string> = {
  customer_created: "Cliente creado",
  payment_received: "Pago recibido",
  ticket_unanswered: "Ticket sin respuesta",
};

export type FieldType = "text" | "number";

export const FIELDS_BY_TRIGGER: Record<Trigger, Record<string, FieldType>> = {
  customer_created: { pais: "text", plan: "text" },
  payment_received: { monto: "number", moneda: "text" },
  ticket_unanswered: { horas_sin_respuesta: "number", prioridad: "text" },
};

export const OPERATORS_BY_TYPE = {
  text: ["eq", "contains"],
  number: ["eq", "gt", "lt"],
} as const;

export const OPERATOR_LABELS = {
  eq: "es igual a",
  contains: "contiene",
  gt: "mayor que",
  lt: "menor que",
} as const;

export const ACTION_TYPES = ["email", "sms", "webhook"] as const;