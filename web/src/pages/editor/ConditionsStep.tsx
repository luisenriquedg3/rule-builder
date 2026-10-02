import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import {
  FIELDS_BY_TRIGGER,
  OPERATORS_BY_TYPE,
  OPERATOR_LABELS,
  TRIGGER_LABELS,
  type ConditionInput,
  type FieldType,
  type RuleInput,
  type Trigger,
} from "@app/shared";
import { FormField, SelectField, errorMessage } from "../../components/FormField";
import { emptyCondition } from "../../lib/conditions";

type Operator = ConditionInput["operator"];

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm hover:bg-slate-100 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function ConditionsStep() {
  const { control, register, formState: { errors } } = useFormContext<RuleInput>();
  const trigger = useWatch({ control, name: "trigger" });
  const { fields, append, remove, move } = useFieldArray({ control, name: "conditions" });
  const rootError = errorMessage(errors, "conditions");

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Disparador: <strong>{trigger ? TRIGGER_LABELS[trigger] : "—"}</strong>. Las condiciones son opcionales:
        sin ninguna, la regla se aplica siempre.
      </p>

      {fields.length > 1 && (
        <fieldset className="rounded-md border border-slate-200 bg-white p-3 text-sm">
          <legend className="px-1 font-medium">Las condiciones se combinan con</legend>
          <label className="mr-6">
            <input type="radio" value="all" {...register("matchMode")} className="mr-2" />
            <strong>Y</strong>: todas deben cumplirse
          </label>
          <label>
            <input type="radio" value="any" {...register("matchMode")} className="mr-2" />
            <strong>O</strong>: basta con una
          </label>
        </fieldset>
      )}

      {fields.length === 0 && (
        <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Sin condiciones.
        </p>
      )}

      <ul className="space-y-3">
        {fields.map((f, i) => (
          <ConditionRow
            key={f.id}
            index={i}
            count={fields.length}
            onUp={() => move(i, i - 1)}
            onDown={() => move(i, i + 1)}
            onRemove={() => remove(i)}
          />
        ))}
      </ul>

      {rootError && <p role="alert" className="text-xs text-red-600">{rootError}</p>}

      <button
        type="button"
        onClick={() => append(emptyCondition())}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100"
      >
        + Agregar condición
      </button>
    </div>
  );
}

function ConditionRow({ index, count, onUp, onDown, onRemove }: {
  index: number;
  count: number;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  const { control, setValue } = useFormContext();
  const trigger = useWatch({ control, name: "trigger" }) as Trigger | undefined;
  const field = (useWatch({ control, name: `conditions.${index}.field` }) as string | undefined) ?? "";

  const fieldTypes: Record<string, FieldType> = trigger ? FIELDS_BY_TRIGGER[trigger] : {};
  const type = fieldTypes[field];
  const operators: readonly Operator[] = OPERATORS_BY_TYPE[type ?? "text"];
  const base = `conditions.${index}`;

  return (
    <li className="grid items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <SelectField
        name={`${base}.field`}
        label={`Campo de la condición ${index + 1}`}
        hideLabel
        placeholder="Campo…"
        options={Object.entries(fieldTypes).map(([name, t]) => ({
          value: name,
          label: `${name} · ${t === "number" ? "número" : "texto"}`,
        }))}
        onValueChange={() => {
          setValue(`${base}.operator`, "eq");
          setValue(`${base}.value`, "");
        }}
      />
      <SelectField
        name={`${base}.operator`}
        label={`Operador de la condición ${index + 1}`}
        hideLabel
        options={operators.map((o) => ({ value: o, label: OPERATOR_LABELS[o] }))}
      />
      <FormField
        key={type ?? "text"} /* remonta el input al cambiar entre texto y número */
        name={`${base}.value`}
        label={`Valor de la condición ${index + 1}`}
        hideLabel
        type={type === "number" ? "number" : "text"}
        placeholder="Valor"
      />
      <div className="flex gap-1">
        <IconButton label={`Subir condición ${index + 1}`} onClick={onUp} disabled={index === 0}>↑</IconButton>
        <IconButton label={`Bajar condición ${index + 1}`} onClick={onDown} disabled={index === count - 1}>↓</IconButton>
        <IconButton label={`Eliminar condición ${index + 1}`} onClick={onRemove}>✕</IconButton>
      </div>
    </li>
  );
}