type Props = {
  steps: string[];
  current: number;
  furthest: number;
  onSelect: (index: number) => void;
};

export function Stepper({ steps, current, furthest, onSelect }: Props) {
  return (
    <ol className="mb-8 flex gap-2">
      {steps.map((label, i) => (
        <li key={label} className="flex-1">
          <button
            type="button"
            onClick={() => onSelect(i)}
            disabled={i > furthest}
            aria-current={i === current ? "step" : undefined}
            className={`w-full rounded-md border px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50
              ${i === current ? "border-indigo-600 bg-indigo-50" : "border-slate-300 bg-white"}`}
          >
            <span className="block text-xs text-slate-500">Paso {i + 1}</span>
            <span className="font-medium">{label}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}