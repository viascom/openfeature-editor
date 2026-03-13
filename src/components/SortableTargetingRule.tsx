import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Condition, TargetingRule } from "../types/flags";
import TargetingRuleEditor from "./TargetingRuleEditor";

interface Props {
  rule: TargetingRule;
  ruleIndex: number;
  onUpdateRule: (rule: TargetingRule) => void;
  onRemoveRule: () => void;
  onAddCondition: () => void;
  onUpdateCondition: (condIndex: number, condition: Condition) => void;
  onRemoveCondition: (condIndex: number) => void;
}

export default function SortableTargetingRule({ rule, ...props }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rule.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TargetingRuleEditor rule={rule} dragListeners={listeners} {...props} />
    </div>
  );
}
