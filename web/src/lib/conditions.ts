import { FIELDS_BY_TRIGGER, type ConditionInput, type Trigger } from "@app/shared";

export const emptyCondition = (): ConditionInput => ({ field: "", operator: "eq", value: "" });

export function keepCompatibleConditions(conditions: ConditionInput[], trigger: Trigger) {
  const fields = FIELDS_BY_TRIGGER[trigger];
  const kept = conditions.filter((c) => c.field in fields);
  return { kept, dropped: conditions.length - kept.length };
}