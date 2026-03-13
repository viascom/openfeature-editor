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
  validateValue,
} from "../types/flags";
import CustomSelect from "./CustomSelect";
import SortableTargetingRule from "./SortableTargetingRule";

interface Props {
  flag: FeatureFlag;
  duplicateId: boolean;
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
  duplicateId,
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

  const defaultValueError = validateValue(flag.defaultValue, flag.flagType);

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
            className={`w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 ${duplicateId ? "ring-2 ring-red-500" : ""}`}
          />
          {duplicateId && <p className="mt-1 text-xs text-red-400">A flag with this ID already exists</p>}
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
            className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-400"
          />
        </div>
        <div className="min-w-0">
          <label id={`${uid}-type-label`} className="mb-1 block text-xs text-gray-400">Type</label>
          <CustomSelect
            value={flag.flagType}
            options={FLAG_TYPES.map((t) => ({ value: t, label: t }))}
            onChange={(val) => {
              const defaults: Record<FlagType, string> = { BOOLEAN: "false", STRING: "", INTEGER: "0", DOUBLE: "0.0" };
              const newDefault = val === "BOOLEAN" || validateValue(flag.defaultValue, val) ? defaults[val] : flag.defaultValue;
              const newRules = flag.targetingRules.map((r) => {
                if (val === "BOOLEAN" || validateValue(r.value, val)) {
                  return { ...r, value: defaults[val] };
                }
                return r;
              });
              onUpdateFlag({ ...flag, flagType: val, defaultValue: newDefault, targetingRules: newRules });
            }}
            ariaLabel="Type"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${uid}-default-value`} className="mb-1 block text-xs text-gray-400">Default Value</label>
          {flag.flagType === "BOOLEAN" ? (
            <CustomSelect
              id={`${uid}-default-value`}
              value={flag.defaultValue === "true" ? "true" : "false"}
              options={[{ value: "true", label: "true" }, { value: "false", label: "false" }]}
              onChange={(val) => onUpdateFlag({ ...flag, defaultValue: val })}
              ariaLabel="Default value"
            />
          ) : (
            <>
              <input
                id={`${uid}-default-value`}
                type="text"
                value={flag.defaultValue}
                onChange={(e) => onUpdateFlag({ ...flag, defaultValue: e.target.value })}
                className={`w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 ${defaultValueError ? "ring-2 ring-red-500" : ""}`}
              />
              {defaultValueError && <p className="mt-1 text-xs text-red-400">{defaultValueError}</p>}
            </>
          )}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-300 select-none">
        <span className="relative inline-flex items-center justify-center">
          <input
            type="checkbox"
            checked={flag.enabled}
            onChange={(e) => onUpdateFlag({ ...flag, enabled: e.target.checked })}
            className="peer sr-only"
          />
          <span className="h-4 w-4 rounded-[3px] border border-gray-600 bg-gray-800 transition-colors peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-gray-950" />
          <svg
            className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="2.5 6 5 8.5 9.5 3.5" />
          </svg>
        </span>
        Enabled
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-300">Targeting Rules</h3>
          <button
            onClick={onAddRule}
            className="rounded bg-emerald-700 px-3 py-1 text-sm text-white hover:bg-emerald-600"
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
                flagType={flag.flagType}
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
