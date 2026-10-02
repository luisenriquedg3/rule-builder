import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormProvider, useForm, type FieldErrors, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ruleInputSchema, type Rule, type RuleInput } from "@app/shared";
import { useSaveRule } from "../../api/rules";
import type { ApiError } from "../../api/client";
import { Stepper } from "../../components/Stepper";
import { TriggerStep } from "./TriggerStep";
import { ConditionsStep } from "./ConditionsStep";
import { ActionsStep } from "./ActionsStep";
import { RuleSummary } from "./RuleSummary";

const STEPS: { label: string; fields: Path<RuleInput>[] }[] = [
  { label: "Disparador", fields: ["name", "trigger"] },
  { label: "Condiciones", fields: ["conditions", "matchMode"] },
  { label: "Acciones", fields: ["actions"] },
];
const LAST = STEPS.length - 1;


function stepOfPath(path: string): number {
  if (path.startsWith("conditions") || path.startsWith("matchMode")) return 1;
  if (path.startsWith("actions")) return 2;
  return 0;
}

const toFormValues = (r: Rule): RuleInput => ({
  name: r.name,
  trigger: r.trigger,
  matchMode: r.matchMode,
  conditions: r.conditions,
  actions: r.actions,
});

export default function RuleEditor({ initial }: { initial?: Rule }) {
  const navigate = useNavigate();
  const save = useSaveRule(initial?.id);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(initial ? LAST : 0);
  const [banner, setBanner] = useState<string | null>(null);

  const methods = useForm<RuleInput>({
    resolver: zodResolver(ruleInputSchema),
    mode: "onTouched",
    defaultValues: initial
      ? toFormValues(initial)
      : { name: "", matchMode: "all", conditions: [], actions: [] },
  });
  const { isDirty } = methods.formState;


  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const next = async () => {
    
    if (!(await methods.trigger(STEPS[step]!.fields))) return;
    setStep(step + 1);
    setFurthest((f) => Math.max(f, step + 1));
  };

  const applyServerError = (err: ApiError) => {
    const isFieldError = (err.status === 409 || err.status === 422) && err.fields.length > 0;
    if (!isFieldError) {
      setBanner(err.message); 
      return;
    }
    for (const f of err.fields) {
     
      const path = f.path === "actions" || f.path === "conditions" ? `${f.path}.root` : f.path;
      methods.setError(path as Path<RuleInput>, { type: "server", message: f.message });
    }
    setStep(Math.min(...err.fields.map((f) => stepOfPath(f.path))));
    setFurthest(LAST);
    setBanner(err.status === 409 ? err.message : "El servidor rechazó la regla. Revisa los campos marcados.");
  };

  const onSubmit = (data: RuleInput) => {
    setBanner(null);
    save.mutate(data, {
      onSuccess: () => navigate("/"),
      onError: applyServerError,
    });
  };

  const onInvalid = (errors: FieldErrors<RuleInput>) => {
    setStep(Math.min(...Object.keys(errors).map(stepOfPath)));
    setBanner("Hay campos con errores. Revisa los pasos.");
  };

  
  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === LAST) void methods.handleSubmit(onSubmit, onInvalid)(e);
    else void next();
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={onFormSubmit}>
        <h1 className="mb-6 text-2xl font-semibold">{initial ? "Editar regla" : "Nueva regla"}</h1>

        <Stepper steps={STEPS.map((s) => s.label)} current={step} furthest={furthest} onSelect={setStep} />

        {banner && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {banner}
          </p>
        )}

        <section aria-label={STEPS[step]!.label} className="space-y-6">
          {step === 0 && <TriggerStep />}
          {step === 1 && <ConditionsStep />}
          {step === 2 && (
            <>
              <ActionsStep />
              <RuleSummary />
            </>
          )}
        </section>

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4">
          <Link to="/" className="text-sm text-slate-600 underline">Cancelar</Link>
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100">
                Atrás
              </button>
            )}
            {step < LAST ? (
              <button key="next" type="button" onClick={() => void next()} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Siguiente
              </button>
            ) : (
              <button key="save" type="submit" disabled={save.isPending} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                {save.isPending ? "Guardando…" : "Guardar regla"}
              </button>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}