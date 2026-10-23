import { Minus, Plus } from "lucide-react";

export function QtyStepper({ value, onChange, max, min = 1 }: { value: number; onChange: (n: number) => void; max: number; min?: number }) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card">
      <button
        aria-label="Decrease quantity"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className="grid size-8 place-items-center rounded-full disabled:opacity-40"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="grid size-8 place-items-center rounded-full disabled:opacity-40"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
