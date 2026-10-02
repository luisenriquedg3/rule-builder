import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Rule, RuleInput } from "@app/shared";
import { request, type ApiError } from "./client";

export const ruleKeys = {
  all: ["rules"] as const,
  list: ["rules", "list"] as const,
  detail: (id: string) => ["rules", "detail", id] as const,
};

const json = (body: unknown) => JSON.stringify(body);

export const rulesApi = {
  list: () => request<Rule[]>("/rules"),
  get: (id: string) => request<Rule>(`/rules/${id}`),
  create: (input: RuleInput) => request<Rule>("/rules", { method: "POST", body: json(input) }),
  update: (id: string, input: RuleInput) =>
    request<Rule>(`/rules/${id}`, { method: "PUT", body: json(input) }),
  setEnabled: (id: string, enabled: boolean) =>
    request<Rule>(`/rules/${id}/enabled`, { method: "PATCH", body: json({ enabled }) }),
  remove: (id: string) => request<void>(`/rules/${id}`, { method: "DELETE" }),
};

export const useRules = () =>
  useQuery<Rule[], ApiError>({ queryKey: ruleKeys.list, queryFn: rulesApi.list });

export function useToggleRule() {
  const qc = useQueryClient();

  const setRow = (id: string, enabled: boolean) =>
    qc.setQueryData<Rule[]>(ruleKeys.list, (old) =>
      old?.map((r) => (r.id === id ? { ...r, enabled } : r)),
    );

  return useMutation<Rule, ApiError, { id: string; enabled: boolean }>({
    mutationFn: ({ id, enabled }) => rulesApi.setEnabled(id, enabled),
    onMutate: async ({ id, enabled }) => {
      await qc.cancelQueries({ queryKey: ruleKeys.list });
      setRow(id, enabled);
    },
    onError: (_err, { id, enabled }) => setRow(id, !enabled),
    onSettled: () => qc.invalidateQueries({ queryKey: ruleKeys.all }),
  });
}