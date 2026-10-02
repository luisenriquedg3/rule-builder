import { Link } from "react-router-dom";
import { TRIGGER_LABELS, type Rule } from "@app/shared";
import { useRules, useToggleRule } from "../api/rules";
import { Switch } from "../components/Switch";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function RulesListPage() {
  const { data: rules, isPending, isError, error, refetch, isFetching } = useRules();
  const toggle = useToggleRule();

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reglas de notificación</h1>
        <Link
          to="/rules/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Nueva regla
        </Link>
      </div>

      {toggle.isError && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudo cambiar el estado de la regla: {toggle.error.message}. Se restauró el valor anterior.
        </p>
      )}

      {isPending && <p className="text-slate-500">Cargando reglas…</p>}

      {isError && (
        <div role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>No se pudieron cargar las reglas: {error.message}</p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-2 font-medium underline disabled:opacity-60"
          >
            Reintentar
          </button>
        </div>
      )}

      {rules && rules.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500">
          <p>Aún no hay reglas.</p>
          <Link to="/rules/new" className="mt-2 inline-block font-medium text-indigo-600 underline">
            Crea la primera
          </Link>
        </div>
      )}

      {rules && rules.length > 0 && (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              pending={toggle.isPending && toggle.variables?.id === rule.id}
              onToggle={(enabled) => toggle.mutate({ id: rule.id, enabled })}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function RuleRow({
  rule,
  pending,
  onToggle,
}: {
  rule: Rule;
  pending: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <Link to={`/rules/${rule.id}`} className="block truncate font-medium hover:text-indigo-600">
          {rule.name}
        </Link>
        <p className="text-sm text-slate-500">
          {TRIGGER_LABELS[rule.trigger]} · {plural(rule.conditions.length, "condición", "condiciones")} ·{" "}
          {plural(rule.actions.length, "acción", "acciones")}
        </p>
      </div>
      <span className={`text-sm ${rule.enabled ? "text-green-700" : "text-slate-500"}`}>
        {rule.enabled ? "Activa" : "Inactiva"}
      </span>
      <Switch
        checked={rule.enabled}
        onChange={onToggle}
        disabled={pending}
        label={`${rule.enabled ? "Desactivar" : "Activar"} regla ${rule.name}`}
      />
    </li>
  );
}