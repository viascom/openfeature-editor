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
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500"
        >
          + Add Flag
        </button>
      </div>
      {flags.length === 0 && (
        <p className="text-sm text-gray-500">No flags yet. Add one to get started.</p>
      )}
      <div className="space-y-1">
        {flags.map((flag, i) => (
          <div
            key={i}
            className={`flex cursor-pointer items-center justify-between rounded px-3 py-2 text-sm ${
              selectedIndex === i
                ? "bg-blue-600/20 text-blue-400"
                : "text-gray-300 hover:bg-gray-800"
            }`}
            onClick={() => onSelect(i)}
          >
            <span className="truncate">{flag.id || "(unnamed)"}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(i);
              }}
              className="ml-2 shrink-0 rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-400/10"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
