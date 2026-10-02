import { randomUUID } from "node:crypto";
import type { Rule, RuleInput } from "@app/shared";
import type { Db } from "./db";

type Row = {
  id: string;
  name: string;
  enabled: number;
  trigger: Rule["trigger"];
  match_mode: Rule["matchMode"];
  conditions: string;
  actions: string;
  created_at: string;
  updated_at: string;
};

const toRule = (r: Row): Rule => ({
  id: r.id,
  name: r.name,
  enabled: r.enabled === 1,
  trigger: r.trigger,
  matchMode: r.match_mode,
  conditions: JSON.parse(r.conditions),
  actions: JSON.parse(r.actions),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export class NameTakenError extends Error {}

const isUniqueViolation = (e: unknown) =>
  typeof e === "object" && e !== null && (e as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE";

export function createRulesRepo(db: Db) {
  const q = {
    list: db.prepare("SELECT * FROM rules ORDER BY created_at DESC, rowid DESC"),
    get: db.prepare("SELECT * FROM rules WHERE id = ?"),
    insert: db.prepare(`
      INSERT INTO rules (id, name, enabled, "trigger", match_mode, conditions, actions, created_at, updated_at)
      VALUES (@id, @name, 1, @trigger, @matchMode, @conditions, @actions, @now, @now)`),
    update: db.prepare(`
      UPDATE rules SET name=@name, "trigger"=@trigger, match_mode=@matchMode,
        conditions=@conditions, actions=@actions, updated_at=@now
      WHERE id=@id`),
    setEnabled: db.prepare("UPDATE rules SET enabled=?, updated_at=? WHERE id=?"),
    remove: db.prepare("DELETE FROM rules WHERE id = ?"),
  };

  const serialize = (input: RuleInput) => ({
    name: input.name,
    trigger: input.trigger,
    matchMode: input.matchMode,
    conditions: JSON.stringify(input.conditions),
    actions: JSON.stringify(input.actions),
    now: new Date().toISOString(),
  });

  const get = (id: string): Rule | null => {
    const row = q.get.get(id) as Row | undefined;
    return row ? toRule(row) : null;
  };

  return {
    list: (): Rule[] => (q.list.all() as Row[]).map(toRule),
    get,

    create(input: RuleInput): Rule {
      const id = randomUUID();
      try {
        q.insert.run({ id, ...serialize(input) });
      } catch (e) {
        if (isUniqueViolation(e)) throw new NameTakenError();
        throw e;
      }
      return get(id)!;
    },

    update(id: string, input: RuleInput): Rule | null {
      try {
        const res = q.update.run({ id, ...serialize(input) });
        if (res.changes === 0) return null;
      } catch (e) {
        if (isUniqueViolation(e)) throw new NameTakenError();
        throw e;
      }
      return get(id);
    },

    setEnabled(id: string, enabled: boolean): Rule | null {
      const res = q.setEnabled.run(enabled ? 1 : 0, new Date().toISOString(), id);
      return res.changes === 0 ? null : get(id);
    },

    remove: (id: string): boolean => q.remove.run(id).changes > 0,
  };
}