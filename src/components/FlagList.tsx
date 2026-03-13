import type { FeatureFlag } from "../types/flags";

interface Props {
  flags: FeatureFlag[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export default function FlagList({
  flags,
  selectedIndex,
  onSelect,
  onAdd,
  onRemove,
}: Props) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300">Flags</h2>
        <button
          onClick={onAdd}
          className="rounded bg-emerald-700 px-3 py-1 text-sm text-white hover:bg-emerald-600"
        >
          + Add Flag
        </button>
      </div>
      {flags.length === 0 && (
        <p className="text-sm text-gray-400">No flags yet. Add one to get started.</p>
      )}
      <div className="max-h-[30vh] space-y-1 overflow-y-auto">
        {flags.map((flag, i) => (
          <div key={i} className="flex items-center gap-1">
            <button
              onClick={() => onSelect(i)}
              className={`min-w-0 flex-1 truncate rounded px-3 py-2 text-left text-sm transition-colors duration-150 ${
                selectedIndex === i
                  ? "bg-emerald-600/20 text-emerald-400"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
              aria-current={selectedIndex === i ? "true" : undefined}
            >
              {flag.id || "(unnamed)"}
            </button>
            <button
              onClick={() => onRemove(i)}
              className="shrink-0 rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-400/10 focus-visible:ring-red-400"
              aria-label={`Remove flag ${flag.id || "unnamed"}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
