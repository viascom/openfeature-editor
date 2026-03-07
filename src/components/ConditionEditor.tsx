import { OPERATORS, type Condition, type Operator } from "../types/flags";

interface Props {
  condition: Condition;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
}

export default function ConditionEditor({ condition, onChange, onRemove }: Props) {
  return (
    <div className="flex items-center gap-2 rounded bg-gray-800 px-3 py-2">
      <input
        type="text"
        placeholder="attribute"
        value={condition.attribute}
        onChange={(e) => onChange({ ...condition, attribute: e.target.value })}
        className="w-36 rounded bg-gray-700 px-2 py-1 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <select
        value={condition.operator}
        onChange={(e) => onChange({ ...condition, operator: e.target.value as Operator })}
        className="rounded bg-gray-700 px-2 py-1 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {OPERATORS.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="val1, val2, ..."
        value={condition.values.join(", ")}
        onChange={(e) =>
          onChange({
            ...condition,
            values: e.target.value
              .split(",")
              .map((v) => v.trim())
              .filter((v) => v !== ""),
          })
        }
        className="min-w-0 flex-1 rounded bg-gray-700 px-2 py-1 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        onClick={onRemove}
        className="shrink-0 rounded px-2 py-1 text-sm text-red-400 hover:bg-red-400/10"
      >
        Remove
      </button>
    </div>
  );
}
