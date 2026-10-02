import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { ACTION_TYPES, type RuleInput } from "@app/shared";
import { FormField, SelectField, errorMessage } from "../../components/FormField";
import { ACTION_LABELS, defaultAction, type ActionType } from "../../lib/actions";

export function ActionsStep() {
  const { control, formState: { errors } } = useFormContext<RuleInput>();
  const { fields, append, remove, update } = useFieldArray({ control, name: "actions" });
  const rootError = errorMessage(errors, "actions");

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {fields.map((f, i) => (
          <ActionRow
            key={f.id}
            index={i}
            onTypeChange={(type) => update(i, defaultAction(type))}
            onRemove={() => remove(i)}
          />
        ))}
      </ul>

      {rootError && <p role="alert" className="text-sm text-red-600">{rootError}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600">Agregar:</span>
        {ACTION_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => append(defaultAction(t))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100"
          >
            + {ACTION_LABELS[t]}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActionRow({ index, onTypeChange, onRemove }: {
  index: number;
  onTypeChange: (type: ActionType) => void;
  onRemove: () => void;
}) {
  const { control } = useFormContext();
  const type = useWatch({ control, name: `actions.${index}.type` }) as ActionType;
  const n = (key: string) => `actions.${index}.${key}`;

  return (
    <li className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          Acción {index + 1}
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value as ActionType)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          >
            {ACTION_TYPES.map((t) => (
              <option key={t} value={t}>{ACTION_LABELS[t]}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={onRemove} className="text-sm text-red-600 underline">
          Eliminar acción {index + 1}
        </button>
      </div>

      {type === "email" && (
        <>
          <FormField name={n("to")} label="Destinatario" type="email" placeholder="persona@empresa.com" />
          <FormField name={n("subject")} label="Asunto" />
          <FormField name={n("body")} label="Cuerpo" multiline />
        </>
      )}

      {type === "sms" && (
        <>
          <FormField name={n("phone")} label="Número telefónico" type="tel" placeholder="+5217471234567" />
          <FormField name={n("message")} label="Mensaje" multiline rows={3} />
          <SmsCounter name={n("message")} />
        </>
      )}

      {type === "webhook" && (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <FormField name={n("url")} label="URL" type="url" placeholder="https://ejemplo.com/hook" />
          <SelectField name={n("method")} label="Método" options={[{ value: "POST", label: "POST" }, { value: "PUT", label: "PUT" }]} />
        </div>
      )}
    </li>
  );
}

function SmsCounter({ name }: { name: string }) {
  const { control } = useFormContext();
  const len = String(useWatch({ control, name }) ?? "").length;
  return (
    <p className={`text-right text-xs ${len > 160 ? "font-medium text-red-600" : "text-slate-500"}`}>{len}/160</p>
  );
}