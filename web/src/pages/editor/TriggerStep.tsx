import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { TRIGGERS, TRIGGER_LABELS, type ConditionInput, type RuleInput, type Trigger } from "@app/shared";
import { FormField } from "../../components/FormField";
import { keepCompatibleConditions } from "../../lib/conditions";

type Pending = { trigger: Trigger; kept: ConditionInput[]; dropped: number };

export function TriggerStep() {
  const { control, getValues, setValue, clearErrors, formState: { errors } } = useFormContext<RuleInput>();
  const [pending, setPending] = useState<Pending | null>(null);

  const apply = (trigger: Trigger, kept: ConditionInput[]) => {
    setValue("conditions", kept, { shouldDirty: true });
    clearErrors("conditions");
    setValue("trigger", trigger, { shouldDirty: true, shouldValidate: true });
    setPending(null);
  };

  const choose = (next: Trigger) => {
    const current = getValues("trigger");
    if (current === next) return;
    const { kept, dropped } = keepCompatibleConditions(getValues("conditions"), next);
    if (!current || dropped === 0) apply(next, kept);
    else setPending({ trigger: next, kept, dropped }); 
  };

  return (
    <div className="space-y-6">
      <FormField name="name" label="Nombre de la regla" placeholder="Ej. Pago grande recibido" />

      <Controller
        control={control}
        name="trigger"
        render={({ field }) => (
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Cuando ocurra…</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {TRIGGERS.map((t) => (
                <label
                  key={t}
                  className={`cursor-pointer rounded-lg border p-4 text-sm
                    ${field.value === t ? "border-indigo-600 bg-indigo-50" : "border-slate-300 bg-white hover:border-slate-400"}`}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={t}
                    checked={field.value === t}
                    onChange={() => choose(t)}
                    onBlur={field.onBlur}
                    className="mr-2"
                  />
                  {TRIGGER_LABELS[t]}
                </label>
              ))}
            </div>
            {errors.trigger && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.trigger.message}
              </p>
            )}
          </fieldset>
        )}
      />

      {pending && (
        <div role="alertdialog" aria-label="Confirmar cambio de disparador" className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm">
          <p>
            Al cambiar a <strong>{TRIGGER_LABELS[pending.trigger]}</strong> se descartarán{" "}
            {pending.dropped} {pending.dropped === 1 ? "condición" : "condiciones"}, porque sus campos no existen
            en el nuevo disparador.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => apply(pending.trigger, pending.kept)}
              className="rounded-md bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-700"
            >
              Cambiar y descartar
            </button>
            <button type="button" onClick={() => setPending(null)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}