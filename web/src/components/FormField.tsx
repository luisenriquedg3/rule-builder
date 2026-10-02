import { useId, type ReactNode } from "react";
import { get, useFormContext } from "react-hook-form";

export function errorMessage(errors: object, name: string): string | undefined {
  const e = get(errors, name);
  return e?.message ?? e?.root?.message;
}

const control =
  "w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-indigo-600";

type Common = {
  name: string;
  label: string;
  hint?: string;
  hideLabel?: boolean;
  className?: string;
};

function Shell(props: Common & { id: string; error?: string; children: ReactNode }) {
  const { id, label, hideLabel, hint, error, className = "", children } = props;
  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "mb-1 block text-sm font-medium"}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type FieldProps = Common & {
  type?: "text" | "email" | "url" | "tel" | "number";
  multiline?: boolean;
  placeholder?: string;
  rows?: number;
};

export function FormField({ type = "text", multiline, placeholder, rows = 4, ...common }: FieldProps) {
  const { register, formState: { errors } } = useFormContext();
  const id = useId();
  const error = errorMessage(errors, common.name);

  const props = {
    id,
    placeholder,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
    className: `${control} ${error ? "border-red-500" : "border-slate-300"}`,
    ...register(
      common.name,
      type === "number" ? { setValueAs: (v: unknown) => (v === "" || v == null ? "" : Number(v)) } : undefined,
    ),
  };

  return (
    <Shell id={id} error={error} {...common}>
      {multiline ? (
        <textarea rows={rows} {...props} />
      ) : (
        <input type={type} step={type === "number" ? "any" : undefined} {...props} />
      )}
    </Shell>
  );
}

type Option = { value: string; label: string };

export function SelectField({
  options,
  placeholder,
  onValueChange,
  ...common
}: Common & {
  options: readonly Option[];
  placeholder?: string;
  onValueChange?: (value: string) => void;
}) {
  const { register, formState: { errors } } = useFormContext();
  const id = useId();
  const error = errorMessage(errors, common.name);

  return (
    <Shell id={id} error={error} {...common}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${control} ${error ? "border-red-500" : "border-slate-300"}`}
        {...register(common.name, { onChange: (e) => onValueChange?.(e.target.value) })}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}