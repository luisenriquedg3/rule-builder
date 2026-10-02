import { useFormContext, useWatch } from "react-hook-form";
import type { RuleInput } from "@app/shared";
import { describeRule, type Draft } from "../../lib/describeRule";

export function RuleSummary() {
  const { control } = useFormContext<RuleInput>();
  const values = useWatch({ control }) as Draft;
  return (
    <aside aria-label="Resumen de la regla" className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
      <h2 className="mb-1 text-sm font-semibold text-indigo-900">Resumen</h2>
      <p className="text-sm text-indigo-950">{describeRule(values)}</p>
    </aside>
  );
}