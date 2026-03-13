import { useId } from "react";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { type Condition, type TargetingRule } from "../types/flags";
import ConditionEditor from "./ConditionEditor";

interface Props {
  rule: TargetingRule;
  ruleIndex: number;
  onUpdateRule: (rule: TargetingRule) => void;
  onRemoveRule: () => void;
  onAddCondition: () => void;
  onUpdateCondition: (condIndex: number, condition: Condition) => void;
  onRemoveCondition: (condIndex: number) => void;
  dragListeners?: SyntheticListenerMap;
}

export default function TargetingRuleEditor({
  rule,
  ruleIndex,
  onUpdateRule,
  onRemoveRule,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  dragListeners,
}: Props) {
  const uid = useId();
  const hasPercentage = rule.percentage !== null;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {dragListeners && (
            <button
              type="button"
              className="cursor-grab touch-none rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={`Reorder rule ${ruleIndex + 1}`}
              {...dragListeners}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <circle cx="5.5" cy="2.5" r="1.5" />
                <circle cx="10.5" cy="2.5" r="1.5" />
                <circle cx="5.5" cy="7.5" r="1.5" />
                <circle cx="10.5" cy="7.5" r="1.5" />
                <circle cx="5.5" cy="12.5" r="1.5" />
                <circle cx="10.5" cy="12.5" r="1.5" />
              </svg>
            </button>
          )}
          <h4 className="text-sm font-medium text-gray-300">Rule {ruleIndex + 1}</h4>
        </div>
        <button
          onClick={onRemoveRule}
          className="rounded px-2 py-1 text-sm text-red-400 hover:bg-red-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          Remove Rule
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <label htmlFor={`${uid}-description`} className="mb-1 block text-xs text-gray-400">Description</label>
          <input
            id={`${uid}-description`}
            type="text"
            placeholder="Optional"
            value={rule.description ?? ""}
            onChange={(e) =>
              onUpdateRule({ ...rule, description: e.target.value || null })
            }
            className="w-full rounded bg-gray-800 px-2 py-1.5 text-sm text-gray-100 placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${uid}-value`} className="mb-1 block text-xs text-gray-400">Value</label>
          <input
            id={`${uid}-value`}
            type="text"
            value={rule.value}
            onChange={(e) => onUpdateRule({ ...rule, value: e.target.value })}
            className="w-full rounded bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
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
            <label className="sr-only" htmlFor={`${uid}-percentage`}>Percentage</label>
            <input
              id={`${uid}-percentage`}
              type="number"
              min={0}
              max={100}
              value={rule.percentage ?? 100}
              onChange={(e) =>
                onUpdateRule({ ...rule, percentage: Number(e.target.value) })
              }
              className="w-20 rounded bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
            <span className="text-sm text-gray-400" aria-hidden="true">%</span>
            <label className="sr-only" htmlFor={`${uid}-seed`}>Percentage seed</label>
            <input
              id={`${uid}-seed`}
              type="text"
              placeholder="e.g. userId"
              value={rule.percentageSeed ?? "userId"}
              onChange={(e) =>
                onUpdateRule({ ...rule, percentageSeed: e.target.value || null })
              }
              className="w-36 rounded bg-gray-800 px-2 py-1.5 text-sm text-gray-100 placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
            className="rounded px-2 py-1 text-xs text-blue-400 hover:bg-blue-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
