import type { ActionInput } from "@app/shared";

export type ActionType = ActionInput["type"];

export const ACTION_LABELS: Record<ActionType, string> = {
  email: "Email",
  sms: "SMS",
  webhook: "Webhook",
};

export function defaultAction(type: ActionType): ActionInput {
  switch (type) {
    case "email":
      return { type, to: "", subject: "", body: "" };
    case "sms":
      return { type, phone: "", message: "" };
    case "webhook":
      return { type, url: "", method: "POST" };
  }
}