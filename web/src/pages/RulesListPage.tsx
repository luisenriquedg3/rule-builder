import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { TRIGGER_LABELS, type Rule } from "@app/shared";
import { useRules, useToggleRule } from "../api/rules";
import { Switch } from "../components/Switch";
import { filterRules, type StatusFilter } from "../lib/filterRules";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Activas" },
  { value: "inactive", label: "Inactivas" },
];

const parseStatus = (v: string | null): StatusFilter =>
  v === "active" || v === "inactive" ? v : "all";

export default function RulesListPage() {
  const { data: rules, isPending, isError, error, refetch, isFetching } = useRules();
  const toggle = useToggleRule();

  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const status = parseStatus(params.get("status"));
  const hasFilters = query !== "" || status !== "all";

  const setFilter = (key: "q" | "status", value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === "" || value === "all") next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true }, 
    );

  const visible = useMemo(
    () => (rules ? filterRules(rules, { query, status }) : []),
    [rules, query, status],
  );

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
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setFilter("q", e.target.value)}
              placeholder="Buscar por nombre…"
              aria-label="Buscar reglas por nombre"
              className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-indigo-600"
            />
            <select
              value={status}
              onChange={(e) => setFilter("status", e.target.value)}
              aria-label="Filtrar por estado"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <p className="mb-2 text-sm text-slate-500" aria-live="polite">
            {hasFilters ? `${visible.length} de ${rules.length}` : plural(rules.length, "regla", "reglas")}
          </p>

          {visible.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500">
              <p>Ninguna regla coincide con los filtros.</p>
              <button
                type="button"
                onClick={() => setParams({}, { replace: true })}
                className="mt-2 font-medium text-indigo-600 underline"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
              {visible.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  pending={toggle.isPending && toggle.variables?.id === rule.id}
                  onToggle={(enabled) => toggle.mutate({ id: rule.id, enabled })}
                />
              ))}
            </ul>
          )}
        </>
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