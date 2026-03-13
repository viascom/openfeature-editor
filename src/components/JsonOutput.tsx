import { useState } from "react";
import type { FeatureFlag, FlagType, TargetingRule } from "../types/flags";
import { FLAG_TYPES } from "../types/flags";

type OutputFormat = "json" | "sql_insert" | "sql_update";

function escSql(val: string): string {
  return val.replace(/'/g, "''");
}

function stripRuleIds(rules: TargetingRule[]): Omit<TargetingRule, "id">[] {
  return rules.map(({ id: _id, ...rest }) => rest);
}

function flagToSqlInsert(flag: FeatureFlag): string {
  const id = escSql(flag.id);
  const description = flag.description ? `'${escSql(flag.description)}'` : "NULL";
  const flagType = escSql(flag.flagType);
  const defaultValue = escSql(flag.defaultValue);
  const enabled = flag.enabled ? "true" : "false";
  const targetingRules = escSql(JSON.stringify(stripRuleIds(flag.targetingRules)));

  return `INSERT INTO public.feature_flags (id, description, flag_type, default_value, enabled, targeting_rules)
VALUES ('${id}', ${description}, '${flagType}', '${defaultValue}', ${enabled}, '${targetingRules}'::jsonb);`;
}

function flagToSqlUpdate(flag: FeatureFlag): string {
  const id = escSql(flag.id);
  const description = flag.description ? `'${escSql(flag.description)}'` : "NULL";
  const flagType = escSql(flag.flagType);
  const defaultValue = escSql(flag.defaultValue);
  const enabled = flag.enabled ? "true" : "false";
  const targetingRules = escSql(JSON.stringify(stripRuleIds(flag.targetingRules)));

  return `UPDATE public.feature_flags
SET description = ${description},
    flag_type = '${flagType}',
    default_value = '${defaultValue}',
    enabled = ${enabled},
    targeting_rules = '${targetingRules}'::jsonb,
    updated_at = now()
WHERE id = '${id}';`;
}

function generateOutput(flags: FeatureFlag[], format: OutputFormat): string {
  switch (format) {
    case "json":
      return JSON.stringify(
        flags.map((f) => ({ ...f, targetingRules: stripRuleIds(f.targetingRules) })),
        null,
        2,
      );
    case "sql_insert":
      return flags.map(flagToSqlInsert).join("\n\n");
    case "sql_update":
      return flags.map(flagToSqlUpdate).join("\n\n");
  }
}

const FORMAT_LABELS: Record<OutputFormat, string> = {
  json: "JSON",
  sql_insert: "SQL Insert",
  sql_update: "SQL Update",
};

const FORMATS: OutputFormat[] = ["json", "sql_insert", "sql_update"];

function parseCsvRow(row: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (inQuotes) {
      if (ch === '"' && row[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function parseTargetingRules(raw: string): TargetingRule[] {
  if (!raw || raw === "NULL" || raw === "null") return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r: Record<string, unknown>) => ({
      id: crypto.randomUUID(),
      description: (r.description as string) ?? null,
      conditions: Array.isArray(r.conditions) ? r.conditions : [],
      percentage: (r.percentage as number) ?? null,
      percentageSeed: (r.percentageSeed as string) ?? null,
      value: String(r.value ?? ""),
    }));
  } catch {
    return [];
  }
}

function csvToFlags(text: string): FeatureFlag[] {
  const lines = text.trim().split("\n").filter((l) => l.trim());
  return lines.map((line) => {
    const fields = parseCsvRow(line);
    // id, description, flag_type, default_value, enabled, targeting_rules, [created_at, updated_at]
    const flagType = (fields[2]?.trim() || "BOOLEAN") as FlagType;
    return {
      id: fields[0]?.trim() || "",
      description: fields[1]?.trim() || null,
      flagType: FLAG_TYPES.includes(flagType) ? flagType : "BOOLEAN",
      defaultValue: fields[3]?.trim() || "false",
      enabled: fields[4]?.trim() === "true",
      targetingRules: parseTargetingRules(fields[5]?.trim() || ""),
    };
  });
}

function parseSqlValue(val: string): string {
  val = val.trim();
  if (val.toUpperCase() === "NULL") return "";
  // Strip ::jsonb or other casts
  val = val.replace(/::[\w]+/g, "");
  // Remove surrounding quotes
  if (val.startsWith("'") && val.endsWith("'")) {
    val = val.slice(1, -1).replace(/''/g, "'");
  }
  return val;
}

function sqlInsertToFlags(text: string): FeatureFlag[] {
  const flags: FeatureFlag[] = [];
  const insertRegex = /INSERT\s+INTO\s+\S+\s*\(([^)]+)\)\s*VALUES\s*\((.+?)\)\s*;/gi;
  let match;
  while ((match = insertRegex.exec(text)) !== null) {
    const columns = match[1].split(",").map((c) => c.trim().toLowerCase());
    const valuesRaw = match[2];
    const values: string[] = [];
    let current = "";
    let inQuote = false;
    for (let i = 0; i < valuesRaw.length; i++) {
      const ch = valuesRaw[i];
      if (inQuote) {
        if (ch === "'" && valuesRaw[i + 1] === "'") {
          current += "''";
          i++;
        } else if (ch === "'") {
          current += "'";
          inQuote = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === "'") {
          current += "'";
          inQuote = true;
        } else if (ch === ",") {
          values.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
    }
    values.push(current);

    const colMap = new Map<string, string>();
    columns.forEach((col, i) => {
      colMap.set(col, parseSqlValue(values[i] ?? ""));
    });

    const flagType = (colMap.get("flag_type") || "BOOLEAN").toUpperCase() as FlagType;
    flags.push({
      id: colMap.get("id") || "",
      description: colMap.get("description") || null,
      flagType: FLAG_TYPES.includes(flagType) ? flagType : "BOOLEAN",
      defaultValue: colMap.get("default_value") || "false",
      enabled: (colMap.get("enabled") || "false").trim().toLowerCase() === "true",
      targetingRules: parseTargetingRules(colMap.get("targeting_rules") || ""),
    });
  }
  return flags;
}

function detectAndParse(text: string): FeatureFlag[] {
  const trimmed = text.trim();

  // Try JSON first
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed);
    const arr: FeatureFlag[] = Array.isArray(parsed) ? parsed : [parsed];
    return arr.map((f) => ({
      ...f,
      targetingRules: (f.targetingRules ?? []).map((r: TargetingRule) => ({
        ...r,
        id: r.id || crypto.randomUUID(),
      })),
    }));
  }

  // Try SQL INSERT
  if (/^\s*INSERT\s+INTO/i.test(trimmed)) {
    const flags = sqlInsertToFlags(trimmed);
    if (flags.length > 0) return flags;
    throw new Error("Could not parse SQL INSERT statement");
  }

  // Try CSV (contains commas, not JSON)
  if (trimmed.includes(",")) {
    const flags = csvToFlags(trimmed);
    if (flags.length > 0 && flags[0].id) return flags;
  }

  throw new Error("Unrecognized format. Supported: JSON array, SQL INSERT, or CSV");
}

interface Props {
  flags: FeatureFlag[];
  onImport: (flags: FeatureFlag[]) => void;
}

export default function JsonOutput({ flags, onImport }: Props) {
  const [importText, setImportText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<OutputFormat>("json");

  const output = generateOutput(flags, format);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleImport = () => {
    try {
      const flags = detectAndParse(importText);
      if (flags.length === 0) {
        setError("No flags found in input");
        return;
      }
      onImport(flags);
      setImportText("");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse input");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300">Output</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-700 bg-gray-800 p-0.5">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  format === f
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
          <button
            onClick={handleCopy}
            className="rounded bg-gray-700 px-3 py-1 text-sm text-gray-200 hover:bg-gray-600"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <textarea
        readOnly
        value={output}
        className="mb-4 min-h-[200px] flex-1 resize-none rounded-lg bg-gray-900 p-3 font-mono text-sm text-gray-300 focus:outline-none"
      />

      <h2 className="mb-2 text-sm font-semibold text-gray-300">Import</h2>
      <textarea
        value={importText}
        onChange={(e) => {
          setImportText(e.target.value);
          setError(null);
        }}
        placeholder="Paste JSON, SQL INSERT, or CSV here..."
        className="mb-2 min-h-[100px] resize-none rounded-lg bg-gray-900 p-3 font-mono text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      <button
        onClick={handleImport}
        disabled={!importText.trim()}
        className="self-start rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-40"
      >
        Import
      </button>
    </div>
  );
}
