export const FLAG_TYPES = ["BOOLEAN", "STRING", "INTEGER", "DOUBLE"] as const;
export type FlagType = (typeof FLAG_TYPES)[number];

export const OPERATORS = [
  "IN",
  "NOT_IN",
  "EQUALS",
  "NOT_EQUALS",
  "CONTAINS",
  "STARTS_WITH",
  "GREATER_THAN",
  "GREATER_THAN_OR_EQUAL",
  "LESS_THAN",
  "LESS_THAN_OR_EQUAL",
  "IS_NULL",
  "IS_ONE_OF",
  "IS_NOT_ONE_OF",
] as const;
export type Operator = (typeof OPERATORS)[number];

export interface Condition {
  attribute: string;
  operator: Operator;
  values: string[];
}

export interface TargetingRule {
  description: string | null;
  conditions: Condition[];
  percentage: number | null;
  percentageSeed: string | null;
  value: string;
}

export interface FeatureFlag {
  id: string;
  description: string | null;
  flagType: FlagType;
  defaultValue: string;
  enabled: boolean;
  targetingRules: TargetingRule[];
}

export function createFlag(): FeatureFlag {
  return {
    id: "new.flag",
    description: null,
    flagType: "BOOLEAN",
    defaultValue: "false",
    enabled: true,
    targetingRules: [],
  };
}

export function createRule(): TargetingRule {
  return {
    description: null,
    conditions: [],
    percentage: null,
    percentageSeed: null,
    value: "",
  };
}

export function createCondition(): Condition {
  return {
    attribute: "",
    operator: "IN",
    values: [],
  };
}
