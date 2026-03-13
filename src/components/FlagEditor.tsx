import { useId } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  FLAG_TYPES,
  type Condition,
  type FeatureFlag,
  type FlagType,
  type TargetingRule,
} from "../types/flags";
import SortableTargetingRule from "./SortableTargetingRule";

interface Props {
  flag: FeatureFlag;
  onUpdateFlag: (flag: FeatureFlag) => void;
  onAddRule: () => void;
  onReorderRules: (fromIndex: number, toIndex: number) => void;
  onRemoveRule: (ruleIndex: number) => void;
  onUpdateRule: (ruleIndex: number, rule: TargetingRule) => void;
  onAddCondition: (ruleIndex: number) => void;
  onRemoveCondition: (ruleIndex: number, condIndex: number) => void;
  onUpdateCondition: (ruleIndex: number, condIndex: number, condition: Condition) => void;
}

export default function FlagEditor({
  flag,
  onUpdateFlag,
  onAddRule,
  onReorderRules,
  onRemoveRule,
  onUpdateRule,
  onAddCondition,
  onRemoveCondition,
  onUpdateCondition,
}: Props) {
  const uid = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = flag.targetingRules.findIndex((r) => r.id === active.id);
    const newIndex = flag.targetingRules.findIndex((r) => r.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderRules(oldIndex, newIndex);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label htmlFor={`${uid}-flag-id`} className="mb-1 block text-xs text-gray-400">Flag ID</label>
          <input
            id={`${uid}-flag-id`}
            type="text"
            value={flag.id}
            onChange={(e) => onUpdateFlag({ ...flag, id: e.target.value })}
            className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
        <div className="col-span-2">
          <label htmlFor={`${uid}-description`} className="mb-1 block text-xs text-gray-400">Description</label>
          <input
            id={`${uid}-description`}
            type="text"
            placeholder="Optional"
            value={flag.description ?? ""}
            onChange={(e) =>
              onUpdateFlag({ ...flag, description: e.target.value || null })
            }
            className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${uid}-type`} className="mb-1 block text-xs text-gray-400">Type</label>
          <select
            id={`${uid}-type`}
            value={flag.flagType}
            onChange={(e) => onUpdateFlag({ ...flag, flagType: e.target.value as FlagType })}
            className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {FLAG_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor={`${uid}-default-value`} className="mb-1 block text-xs text-gray-400">Default Value</label>
          <input
            id={`${uid}-default-value`}
            type="text"
            value={flag.defaultValue}
            onChange={(e) => onUpdateFlag({ ...flag, defaultValue: e.target.value })}
            className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={flag.enabled}
          onChange={(e) => onUpdateFlag({ ...flag, enabled: e.target.checked })}
          className="rounded accent-blue-500"
        />
        Enabled
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-300">Targeting Rules</h3>
          <button
            onClick={onAddRule}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            + Add Rule
          </button>
        </div>
        {flag.targetingRules.length === 0 && (
          <p className="text-sm text-gray-400">No targeting rules. Flag will serve the default value.</p>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={flag.targetingRules.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            {flag.targetingRules.map((rule, ri) => (
              <SortableTargetingRule
                key={rule.id}
                rule={rule}
                ruleIndex={ri}
                onUpdateRule={(r) => onUpdateRule(ri, r)}
                onRemoveRule={() => onRemoveRule(ri)}
                onAddCondition={() => onAddCondition(ri)}
                onUpdateCondition={(ci, c) => onUpdateCondition(ri, ci, c)}
                onRemoveCondition={(ci) => onRemoveCondition(ri, ci)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
