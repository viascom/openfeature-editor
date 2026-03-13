import { useReducer, useState } from "react";
import {
  createCondition,
  createFlag,
  createRule,
  type Condition,
  type FeatureFlag,
  type TargetingRule,
} from "../types/flags";
import FlagEditor from "./FlagEditor";
import FlagList from "./FlagList";
import JsonOutput from "./JsonOutput";
import ResizablePanels from "./ResizablePanels";

type Action =
  | { type: "SET_FLAGS"; flags: FeatureFlag[] }
  | { type: "ADD_FLAG" }
  | { type: "REMOVE_FLAG"; flagIndex: number }
  | { type: "UPDATE_FLAG"; flagIndex: number; flag: FeatureFlag }
  | { type: "ADD_RULE"; flagIndex: number }
  | { type: "REORDER_RULES"; flagIndex: number; fromIndex: number; toIndex: number }
  | { type: "REMOVE_RULE"; flagIndex: number; ruleIndex: number }
  | { type: "UPDATE_RULE"; flagIndex: number; ruleIndex: number; rule: TargetingRule }
  | { type: "ADD_CONDITION"; flagIndex: number; ruleIndex: number }
  | { type: "REMOVE_CONDITION"; flagIndex: number; ruleIndex: number; condIndex: number }
  | {
      type: "UPDATE_CONDITION";
      flagIndex: number;
      ruleIndex: number;
      condIndex: number;
      condition: Condition;
    };

function updateFlag(flags: FeatureFlag[], fi: number, updater: (f: FeatureFlag) => FeatureFlag): FeatureFlag[] {
  return flags.map((f, i) => (i === fi ? updater(f) : f));
}

function updateRule(flag: FeatureFlag, ri: number, updater: (r: TargetingRule) => TargetingRule): FeatureFlag {
  return {
    ...flag,
    targetingRules: flag.targetingRules.map((r, i) => (i === ri ? updater(r) : r)),
  };
}

function reducer(state: FeatureFlag[], action: Action): FeatureFlag[] {
  switch (action.type) {
    case "SET_FLAGS":
      return action.flags;
    case "ADD_FLAG":
      return [...state, createFlag()];
    case "REMOVE_FLAG":
      return state.filter((_, i) => i !== action.flagIndex);
    case "UPDATE_FLAG":
      return updateFlag(state, action.flagIndex, () => action.flag);
    case "ADD_RULE":
      return updateFlag(state, action.flagIndex, (f) => ({
        ...f,
        targetingRules: [...f.targetingRules, createRule()],
      }));
    case "REORDER_RULES":
      return updateFlag(state, action.flagIndex, (f) => {
        const rules = [...f.targetingRules];
        const [moved] = rules.splice(action.fromIndex, 1);
        rules.splice(action.toIndex, 0, moved);
        return { ...f, targetingRules: rules };
      });
    case "REMOVE_RULE":
      return updateFlag(state, action.flagIndex, (f) => ({
        ...f,
        targetingRules: f.targetingRules.filter((_, i) => i !== action.ruleIndex),
      }));
    case "UPDATE_RULE":
      return updateFlag(state, action.flagIndex, (f) =>
        updateRule(f, action.ruleIndex, () => action.rule)
      );
    case "ADD_CONDITION":
      return updateFlag(state, action.flagIndex, (f) =>
        updateRule(f, action.ruleIndex, (r) => ({
          ...r,
          conditions: [...r.conditions, createCondition()],
        }))
      );
    case "REMOVE_CONDITION":
      return updateFlag(state, action.flagIndex, (f) =>
        updateRule(f, action.ruleIndex, (r) => ({
          ...r,
          conditions: r.conditions.filter((_, i) => i !== action.condIndex),
        }))
      );
    case "UPDATE_CONDITION":
      return updateFlag(state, action.flagIndex, (f) =>
        updateRule(f, action.ruleIndex, (r) => ({
          ...r,
          conditions: r.conditions.map((c, i) =>
            i === action.condIndex ? action.condition : c
          ),
        }))
      );
    default:
      return state;
  }
}

export default function App() {
  const [flags, dispatch] = useReducer(reducer, []);
  const [selectedFlagIndex, setSelectedFlagIndex] = useState<number | null>(null);

  const selectedFlag = selectedFlagIndex !== null ? flags[selectedFlagIndex] ?? null : null;

  const handleRemoveFlag = (index: number) => {
    dispatch({ type: "REMOVE_FLAG", flagIndex: index });
    if (selectedFlagIndex === index) {
      setSelectedFlagIndex(null);
    } else if (selectedFlagIndex !== null && selectedFlagIndex > index) {
      setSelectedFlagIndex(selectedFlagIndex - 1);
    }
  };

  const handleAddFlag = () => {
    dispatch({ type: "ADD_FLAG" });
    setSelectedFlagIndex(flags.length);
  };

  const leftPanel = (
    <div className="flex h-full flex-col">
      <h1 className="flex shrink-0 items-center gap-2.5 px-6 pt-6 pb-4 text-2xl font-semibold tracking-tight text-gray-100">
        <svg className="h-7 w-7 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="2" y="9" width="28" height="14" rx="7" fill="#059669"/>
          <circle cx="23" cy="16" r="5" fill="#fff"/>
          <path d="M10 9 L14 16 L10 23" stroke="#065f46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
        </svg>
        OpenFeature Config Editor
      </h1>
      <div className="shrink-0 px-6">
        <FlagList
          flags={flags}
          selectedIndex={selectedFlagIndex}
          onSelect={setSelectedFlagIndex}
          onAdd={handleAddFlag}
          onRemove={handleRemoveFlag}
        />
      </div>
      {selectedFlag && selectedFlagIndex !== null && (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6" style={{ animation: "fade-in 200ms cubic-bezier(0.25,1,0.5,1)" }} key={selectedFlagIndex}>
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-5">
            <FlagEditor
              flag={selectedFlag}
              onUpdateFlag={(f) =>
                dispatch({ type: "UPDATE_FLAG", flagIndex: selectedFlagIndex, flag: f })
              }
              onAddRule={() => dispatch({ type: "ADD_RULE", flagIndex: selectedFlagIndex })}
              onReorderRules={(fromIndex, toIndex) =>
                dispatch({
                  type: "REORDER_RULES",
                  flagIndex: selectedFlagIndex,
                  fromIndex,
                  toIndex,
                })
              }
              onRemoveRule={(ri) =>
                dispatch({ type: "REMOVE_RULE", flagIndex: selectedFlagIndex, ruleIndex: ri })
              }
              onUpdateRule={(ri, r) =>
                dispatch({
                  type: "UPDATE_RULE",
                  flagIndex: selectedFlagIndex,
                  ruleIndex: ri,
                  rule: r,
                })
              }
              onAddCondition={(ri) =>
                dispatch({ type: "ADD_CONDITION", flagIndex: selectedFlagIndex, ruleIndex: ri })
              }
              onRemoveCondition={(ri, ci) =>
                dispatch({
                  type: "REMOVE_CONDITION",
                  flagIndex: selectedFlagIndex,
                  ruleIndex: ri,
                  condIndex: ci,
                })
              }
              onUpdateCondition={(ri, ci, c) =>
                dispatch({
                  type: "UPDATE_CONDITION",
                  flagIndex: selectedFlagIndex,
                  ruleIndex: ri,
                  condIndex: ci,
                  condition: c,
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );

  const rightPanel = (
    <div className="h-full overflow-y-auto p-6">
      <JsonOutput
        flags={flags}
        onImport={(imported) => {
          dispatch({ type: "SET_FLAGS", flags: imported });
          setSelectedFlagIndex(null);
        }}
      />
    </div>
  );

  return (
    <ResizablePanels
      left={leftPanel}
      right={rightPanel}
      leftLabel="Flag editor"
      rightLabel="Output and import"
    />
  );
}
