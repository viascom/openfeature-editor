import { createCondition, type Condition, type TargetingRule } from "../types/flags";
import ConditionEditor from "./ConditionEditor";

interface Props {
  rule: TargetingRule;
  ruleIndex: number;
  onUpdateRule: (rule: TargetingRule) => void;
  onRemoveRule: () => void;
  onAddCondition: () => void;
  onUpdateCondition: (condIndex: number, condition: Condition) => void;
  onRemoveCondition: (condIndex: number) => void;
}

export default function TargetingRuleEditor({
  rule,
  ruleIndex,
  onUpdateRule,
  onRemoveRule,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
}: Props) {
  const hasPercentage = rule.percentage !== null;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">Rule {ruleIndex + 1}</h4>
        <button
          onClick={onRemoveRule}
          className="rounded px-2 py-1 text-sm text-red-400 hover:bg-red-400/10"
        >
          Remove Rule
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-gray-400">Description</label>
          <input
            type="text"
            placeholder="Optional"
            value={rule.description ?? ""}
            onChange={(e) =>
              onUpdateRule({ ...rule, description: e.target.value || null })
            }
            className="w-full rounded bg-gray-800 px-2 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Value</label>
          <input
            type="text"
            value={rule.value}
            onChange={(e) => onUpdateRule({ ...rule, value: e.target.value })}
            className="w-full rounded bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={hasPercentage}
            onChange={(e) =>
              onUpdateRule({
                ...rule,
                percentage: e.target.checked ? 100 : null,
                percentageSeed: e.target.checked ? "userId" : null,
              })
            }
            className="rounded accent-blue-500"
          />
          Percentage Rollout
        </label>
        {hasPercentage && (
          <>
            <input
              type="number"
              min={0}
              max={100}
              value={rule.percentage ?? 100}
              onChange={(e) =>
                onUpdateRule({ ...rule, percentage: Number(e.target.value) })
              }
              className="w-20 rounded bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-400">%</span>
            <input
              type="text"
              placeholder="percentageSeed"
              value={rule.percentageSeed ?? "userId"}
              onChange={(e) =>
                onUpdateRule({ ...rule, percentageSeed: e.target.value || null })
              }
              className="w-36 rounded bg-gray-800 px-2 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Conditions (AND){rule.conditions.length === 0 && " - none"}
          </span>
          <button
            onClick={onAddCondition}
            className="rounded px-2 py-1 text-xs text-blue-400 hover:bg-blue-400/10"
          >
            + Add Condition
          </button>
        </div>
        {rule.conditions.map((cond, ci) => (
          <ConditionEditor
            key={ci}
            condition={cond}
            onChange={(c) => onUpdateCondition(ci, c)}
            onRemove={() => onRemoveCondition(ci)}
          />
        ))}
      </div>
    </div>
  );
}
