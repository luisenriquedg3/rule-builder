import type { Rule } from "@app/shared";

export type StatusFilter = "all" | "active" | "inactive";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function filterRules(
  rules: Rule[],
  { query, status }: { query: string; status: StatusFilter },
): Rule[] {
  const q = normalize(query.trim());
  return rules.filter((r) => {
    const matchesStatus = status === "all" || (status === "active") === r.enabled;
    const matchesQuery = q === "" || normalize(r.name).includes(q);
    return matchesStatus && matchesQuery;
  });
}