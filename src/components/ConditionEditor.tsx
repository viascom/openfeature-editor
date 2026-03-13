import { OPERATOR_LABELS, OPERATORS, type Condition, type Operator } from "../types/flags";
import CustomSelect from "./CustomSelect";

interface Props {
  condition: Condition;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
}

const OPERATOR_OPTIONS = OPERATORS.map((op) => ({
  value: op,
  label: OPERATOR_LABELS[op],
}));

export default function ConditionEditor({ condition, onChange, onRemove }: Props) {
  return (
    <div className="flex flex-col gap-1.5 rounded bg-gray-800 px-3 py-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="attribute"
          value={condition.attribute}
          onChange={(e) => onChange({ ...condition, attribute: e.target.value })}
          className="min-w-0 flex-1 rounded bg-gray-700 px-2 py-1 text-sm text-gray-100 placeholder-gray-400"
          aria-label="Condition attribute"
        />
        <div className="shrink-0">
          <CustomSelect
            value={condition.operator}
            options={OPERATOR_OPTIONS}
            onChange={(val: Operator) => onChange({ ...condition, operator: val })}
            ariaLabel="Condition operator"
            variant="compact"
          />
        </div>
        <button
          onClick={onRemove}
          className="shrink-0 rounded px-2 py-1 text-sm text-red-400 hover:bg-red-400/10 focus-visible:ring-red-400"
        >
          Remove
        </button>
      </div>
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
        className="w-full rounded bg-gray-700 px-2 py-1 text-sm text-gray-100 placeholder-gray-400"
        aria-label="Condition values"
      />
    </div>
  );
}
