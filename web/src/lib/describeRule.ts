import {
  OPERATOR_LABELS,
  TRIGGER_LABELS,
  type ActionInput,
  type ConditionInput,
  type RuleInput,
} from "@app/shared";

export type Draft = {
  trigger?: RuleInput["trigger"];
  matchMode?: RuleInput["matchMode"];
  conditions?: (Partial<ConditionInput> | undefined)[];
  actions?: (Partial<ActionInput> | undefined)[];
};

function describeCondition(c?: Partial<ConditionInput>): string | null {
  if (!c?.field || !c.operator) return null;
  const value = typeof c.value === "number" ? String(c.value) : c.value ? `"${c.value}"` : "…";
  return `${c.field} ${OPERATOR_LABELS[c.operator]} ${value}`;
}

function describeAction(a?: Partial<ActionInput>): string | null {
  switch (a?.type) {
    case "email":
      return `enviar email a ${a.to || "…"}`;
    case "sms":
      return `enviar SMS a ${a.phone || "…"}`;
    case "webhook":
      return `llamar ${a.method ?? "POST"} ${a.url || "…"}`;
    default:
      return null;
  }
}

export function describeRule(r: Draft): string {
  const trigger = r.trigger ? TRIGGER_LABELS[r.trigger] : "…";
  const conditions = (r.conditions ?? []).map(describeCondition).filter(Boolean) as string[];
  const actions = (r.actions ?? []).map(describeAction).filter(Boolean) as string[];

  const cond = conditions.length ? `, si ${conditions.join(r.matchMode === "any" ? " o " : " y ")}` : "";
  return `Cuando ${trigger}${cond}, entonces ${actions.length ? actions.join("; ") : "…"}.`;
}