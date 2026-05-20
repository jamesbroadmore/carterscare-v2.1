import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Upload,
  FileUp,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Column definitions for each importable table ────────────────────────
type ColDef = {
  key: string;
  label: string;
  required: boolean;
  type: "text" | "date" | "number" | "boolean" | "uuid" | "timestamp" | "text[]";
  hint?: string;
};

const TABLE_SCHEMAS: Record<string, { label: string; columns: ColDef[] }> = {
  staff: {
    label: "Staff",
    columns: [
      { key: "first_name", label: "First Name", required: true, type: "text" },
      { key: "last_name", label: "Last Name", required: true, type: "text" },
      { key: "preferred_name", label: "Preferred Name", required: false, type: "text" },
      { key: "email", label: "Email", required: true, type: "text" },
      { key: "phone", label: "Phone", required: false, type: "text" },
      { key: "date_of_birth", label: "Date of Birth", required: false, type: "date", hint: "YYYY-MM-DD" },
      { key: "address", label: "Address", required: false, type: "text" },
      { key: "role", label: "Role", required: false, type: "text", hint: "admin, manager, support_worker" },
      { key: "employment_type", label: "Employment Type", required: false, type: "text", hint: "permanent, casual, contract" },
      { key: "status", label: "Status", required: false, type: "text", hint: "active, inactive, on_leave" },
      { key: "start_date", label: "Start Date", required: false, type: "date", hint: "YYYY-MM-DD" },
      { key: "emergency_contact_name", label: "Emergency Contact Name", required: false, type: "text" },
      { key: "emergency_contact_phone", label: "Emergency Contact Phone", required: false, type: "text" },
      { key: "notes", label: "Notes", required: false, type: "text" },
    ],
  },
  clients: {
    label: "Clients",
    columns: [
      { key: "first_name", label: "First Name", required: true, type: "text" },
      { key: "last_name", label: "Last Name", required: true, type: "text" },
      { key: "preferred_name", label: "Preferred Name", required: false, type: "text" },
      { key: "email", label: "Email", required: false, type: "text" },
      { key: "phone", label: "Phone", required: false, type: "text" },
      { key: "date_of_birth", label: "Date of Birth", required: false, type: "date", hint: "YYYY-MM-DD" },
      { key: "address", label: "Address", required: false, type: "text" },
      { key: "suburb", label: "Suburb", required: false, type: "text" },
      { key: "state", label: "State", required: false, type: "text" },
      { key: "postcode", label: "Postcode", required: false, type: "text" },
      { key: "funding_type", label: "Funding Type", required: false, type: "text", hint: "ndis, private, aged_care" },
      { key: "ndis_number", label: "NDIS Number", required: false, type: "text" },
      { key: "ndis_plan_start", label: "NDIS Plan Start", required: false, type: "date", hint: "YYYY-MM-DD" },
      { key: "ndis_plan_end", label: "NDIS Plan End", required: false, type: "date", hint: "YYYY-MM-DD" },
      { key: "primary_disability", label: "Primary Disability", required: false, type: "text" },
      { key: "support_needs", label: "Support Needs", required: false, type: "text" },
      { key: "plan_manager", label: "Plan Manager", required: false, type: "text" },
      { key: "support_coordinator", label: "Support Coordinator", required: false, type: "text" },
      { key: "status", label: "Status", required: false, type: "text", hint: "active, inactive, on_hold" },
      { key: "emergency_contact_name", label: "Emergency Contact", required: false, type: "text" },
      { key: "emergency_contact_phone", label: "Emergency Phone", required: false, type: "text" },
      { key: "emergency_contact_relationship", label: "Emergency Relationship", required: false, type: "text" },
      { key: "notes", label: "Notes", required: false, type: "text" },
      { key: "medical_conditions", label: "Medical Conditions", required: false, type: "text" },
      { key: "allergies", label: "Allergies", required: false, type: "text" },
      { key: "medications", label: "Medications", required: false, type: "text" },
      { key: "gp_name", label: "GP Name", required: false, type: "text" },
      { key: "gender", label: "Gender", required: false, type: "text" },
      { key: "rate_weekday", label: "Rate Weekday", required: false, type: "number" },
      { key: "rate_saturday", label: "Rate Saturday", required: false, type: "number" },
      { key: "rate_sunday", label: "Rate Sunday", required: false, type: "number" },
      { key: "rate_public_holiday", label: "Rate Public Holiday", required: false, type: "number" },
    ],
  },
  timesheets: {
    label: "Timesheets",
    columns: [
      { key: "staff_id", label: "Staff ID", required: true, type: "uuid", hint: "UUID of existing staff member" },
      { key: "client_id", label: "Client ID", required: false, type: "uuid", hint: "UUID of existing client" },
      { key: "shift_date", label: "Shift Date", required: true, type: "date", hint: "YYYY-MM-DD" },
      { key: "start_time", label: "Start Time", required: true, type: "timestamp", hint: "YYYY-MM-DD HH:MM:SS or ISO 8601" },
      { key: "end_time", label: "End Time", required: false, type: "timestamp", hint: "YYYY-MM-DD HH:MM:SS or ISO 8601" },
      { key: "break_minutes", label: "Break (mins)", required: false, type: "number" },
      { key: "total_hours", label: "Total Hours", required: false, type: "number" },
      { key: "rate_per_hour", label: "Rate/Hour", required: false, type: "number" },
      { key: "status", label: "Status", required: false, type: "text", hint: "pending, approved, rejected" },
      { key: "notes", label: "Notes", required: false, type: "text" },
    ],
  },
  case_notes: {
    label: "Case Notes",
    columns: [
      { key: "client_id", label: "Client ID", required: true, type: "uuid", hint: "UUID of existing client" },
      { key: "staff_id", label: "Staff ID", required: false, type: "uuid", hint: "UUID of existing staff member" },
      { key: "content", label: "Content", required: true, type: "text" },
      { key: "category", label: "Category", required: false, type: "text", hint: "general, medical, behavioural, progress" },
      { key: "note_date", label: "Note Date", required: false, type: "date", hint: "YYYY-MM-DD (defaults to today)" },
      { key: "is_confidential", label: "Confidential", required: false, type: "boolean", hint: "true or false" },
    ],
  },
  incidents: {
    label: "Incidents",
    columns: [
      { key: "client_id", label: "Client ID", required: false, type: "uuid", hint: "UUID of existing client" },
      { key: "incident_type", label: "Incident Type", required: true, type: "text", hint: "fall, medication_error, behavioural, injury, other" },
      { key: "incident_date", label: "Incident Date", required: true, type: "date", hint: "YYYY-MM-DD" },
      { key: "severity", label: "Severity", required: false, type: "text", hint: "low, medium, high, critical" },
      { key: "status", label: "Status", required: false, type: "text", hint: "open, investigating, resolved, closed" },
      { key: "description", label: "Description", required: true, type: "text" },
      { key: "location", label: "Location", required: false, type: "text" },
      { key: "immediate_action", label: "Immediate Action", required: false, type: "text" },
      { key: "injury_occurred", label: "Injury Occurred", required: false, type: "boolean", hint: "true or false" },
      { key: "medical_attention_required", label: "Medical Attention", required: false, type: "boolean", hint: "true or false" },
      { key: "follow_up_required", label: "Follow-up Required", required: false, type: "boolean", hint: "true or false" },
      { key: "follow_up_notes", label: "Follow-up Notes", required: false, type: "text" },
    ],
  },
  compliance_records: {
    label: "Compliance Records",
    columns: [
      { key: "staff_id", label: "Staff ID", required: true, type: "uuid", hint: "UUID of existing staff member" },
      { key: "record_type", label: "Record Type", required: true, type: "text", hint: "wwcc, police_check, first_aid, ndis_screening, qualification" },
      { key: "record_name", label: "Record Name", required: true, type: "text" },
      { key: "status", label: "Status", required: false, type: "text", hint: "pending, current, expired, not_started" },
      { key: "issue_date", label: "Issue Date", required: false, type: "date", hint: "YYYY-MM-DD" },
      { key: "expiry_date", label: "Expiry Date", required: false, type: "date", hint: "YYYY-MM-DD" },
      { key: "document_url", label: "Document URL", required: false, type: "text" },
      { key: "notes", label: "Notes", required: false, type: "text" },
    ],
  },
  shift_checkins: {
    label: "Shift Check-Ins",
    columns: [
      { key: "staff_id", label: "Staff ID", required: false, type: "uuid", hint: "UUID of existing staff member" },
      { key: "staff_name", label: "Staff Name", required: true, type: "text" },
      { key: "client_name", label: "Client Name", required: false, type: "text" },
      { key: "shift_date", label: "Shift Date", required: false, type: "date", hint: "YYYY-MM-DD (defaults to today)" },
      { key: "status", label: "Status", required: false, type: "text", hint: "checked_in, checked_out" },
      { key: "check_in_time", label: "Check-In Time", required: false, type: "timestamp", hint: "ISO 8601" },
      { key: "check_in_address", label: "Check-In Address", required: false, type: "text" },
      { key: "check_out_time", label: "Check-Out Time", required: false, type: "timestamp", hint: "ISO 8601" },
      { key: "check_out_address", label: "Check-Out Address", required: false, type: "text" },
      { key: "notes", label: "Notes", required: false, type: "text" },
    ],
  },
};

// ── CSV Parser ──────────────────────────────────────────────────────────
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      if (current.length > 0 || lines.length > 0) lines.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.length > 0) lines.push(current);

  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (quoted && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (c === "," && !quoted) {
        fields.push(field.trim());
        field = "";
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).filter((l) => l.trim()).map(parseLine);
  return { headers, rows };
}

// ── Coerce value to expected type ───────────────────────────────────────
function coerceValue(raw: string, col: ColDef): any {
  const val = raw.trim();
  if (!val) return null;

  switch (col.type) {
    case "number":
      const num = Number(val);
      if (isNaN(num)) throw new Error(`"${val}" is not a valid number`);
      return num;
    case "boolean":
      const lower = val.toLowerCase();
      if (["true", "1", "yes", "y"].includes(lower)) return true;
      if (["false", "0", "no", "n"].includes(lower)) return false;
      throw new Error(`"${val}" is not a valid boolean`);
    case "date":
      // Accept DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
      let dateStr = val;
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
        const parts = val.split("/");
        // Assume DD/MM/YYYY for Australian format
        dateStr = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error(`"${val}" is not a valid date (use YYYY-MM-DD or DD/MM/YYYY)`);
      return dateStr;
    case "timestamp":
      // Try parsing as Date
      const d = new Date(val);
      if (isNaN(d.getTime())) throw new Error(`"${val}" is not a valid timestamp`);
      return d.toISOString();
    case "uuid":
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
        throw new Error(`"${val}" is not a valid UUID`);
      }
      return val;
    case "text[]":
      // Accept comma-separated or JSON array
      if (val.startsWith("[")) return JSON.parse(val);
      return val.split(";").map((s) => s.trim()).filter(Boolean);
    default:
      return val;
  }
}

// ── Normalize header to match schema column key ────────────────────────
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// ── Types ───────────────────────────────────────────────────────────────
type ImportState = "idle" | "preview" | "importing" | "done";
type RowError = { row: number; column: string; message: string };
type ImportResult = { inserted: number; errors: RowError[] };

// ── Single Table Importer ───────────────────────────────────────────────
function TableImporter({ tableKey, schema }: { tableKey: string; schema: (typeof TABLE_SCHEMAS)[string] }) {
  const [state, setState] = useState<ImportState>("idle");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const { headers, rows } = parseCsv(text);
        if (headers.length === 0) {
          toast.error("Could not parse CSV headers");
          return;
        }

        setCsvHeaders(headers);
        setCsvRows(rows);

        // Auto-map headers to schema columns
        const autoMap: Record<number, string> = {};
        headers.forEach((h, i) => {
          const normalized = normalizeHeader(h);
          const match = schema.columns.find(
            (c) => c.key === normalized || normalizeHeader(c.label) === normalized
          );
          if (match) autoMap[i] = match.key;
        });
        setMapping(autoMap);
        setState("preview");
        setResult(null);
      };
      reader.readAsText(file);
    },
    [schema]
  );

  const handleImport = async () => {
    setState("importing");
    const errors: RowError[] = [];
    const validRows: Record<string, any>[] = [];

    for (let r = 0; r < csvRows.length; r++) {
      const row = csvRows[r];
      const obj: Record<string, any> = {};
      let rowValid = true;

      // Map CSV columns to DB columns
      Object.entries(mapping).forEach(([csvIdx, dbCol]) => {
        const colDef = schema.columns.find((c) => c.key === dbCol);
        if (!colDef) return;
        const rawVal = row[Number(csvIdx)] || "";
        try {
          const val = coerceValue(rawVal, colDef);
          if (val !== null) obj[dbCol] = val;
        } catch (err: any) {
          errors.push({ row: r + 2, column: colDef.label, message: err.message });
          rowValid = false;
        }
      });

      // Check required columns
      schema.columns.forEach((col) => {
        if (col.required && !obj[col.key] && obj[col.key] !== 0 && obj[col.key] !== false) {
          errors.push({ row: r + 2, column: col.label, message: "Required field is empty" });
          rowValid = false;
        }
      });

      if (rowValid && Object.keys(obj).length > 0) {
        validRows.push(obj);
      }
    }

    if (validRows.length === 0) {
      setResult({ inserted: 0, errors });
      setState("done");
      return;
    }

    // Insert in batches of 100
    let inserted = 0;
    const batchSize = 100;
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      const { error } = await supabase.from(tableKey as any).insert(batch as any);
      if (error) {
        // Add generic error for failed batch
        errors.push({
          row: i + 2,
          column: "-",
          message: `Batch insert failed: ${error.message}`,
        });
      } else {
        inserted += batch.length;
      }
    }

    setResult({ inserted, errors });
    setState("done");
    if (inserted > 0) {
      toast.success(`Imported ${inserted} ${schema.label.toLowerCase()} records`);
    }
  };

  const handleReset = () => {
    setState("idle");
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setResult(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadTemplate = () => {
    const headers = schema.columns.map((c) => c.key).join(",");
    const hint = schema.columns
      .map((c) => {
        if (c.hint) return c.hint;
        if (c.required) return "REQUIRED";
        return "";
      })
      .join(",");
    const csv = headers + "\n" + hint + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableKey}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mappedCount = Object.values(mapping).filter(Boolean).length;
  const requiredCols = schema.columns.filter((c) => c.required);
  const mappedRequired = requiredCols.filter((c) => Object.values(mapping).includes(c.key));
  const allRequiredMapped = mappedRequired.length === requiredCols.length;

  return (
    <div className="border border-border/50 rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-card-foreground">{schema.label}</span>
          {state === "done" && result && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              result.inserted > 0 && result.errors.length === 0
                ? "bg-green-100 text-green-700"
                : result.inserted > 0
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
            }`}>
              {result.inserted > 0 ? `${result.inserted} imported` : "Failed"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadTemplate}
            className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
            title="Download CSV template"
          >
            <Download className="h-3 w-3" />
            Template
          </button>
          {state === "idle" ? (
            <label className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity">
              <FileUp className="h-3 w-3" />
              Choose CSV
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFile}
              />
            </label>
          ) : (
            <button
              onClick={handleReset}
              className="h-7 px-2.5 rounded-lg border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Preview / Mapping */}
        {state === "preview" && (
          <motion.div
            key="preview"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 border-t border-border/30 space-y-3">
              {/* File info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{fileName} — {csvRows.length} rows, {csvHeaders.length} columns</span>
                <span className={allRequiredMapped ? "text-green-600" : "text-amber-600"}>
                  {mappedCount}/{csvHeaders.length} columns mapped
                  {!allRequiredMapped && " (missing required)"}
                </span>
              </div>

              {/* Column mapping */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {csvHeaders.map((header, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-36 truncate shrink-0" title={header}>
                      {header}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <select
                      value={mapping[idx] || ""}
                      onChange={(e) =>
                        setMapping((prev) => {
                          const next = { ...prev };
                          if (e.target.value) next[idx] = e.target.value;
                          else delete next[idx];
                          return next;
                        })
                      }
                      className="flex-1 h-7 rounded-md border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">— Skip this column —</option>
                      {schema.columns.map((col) => (
                        <option key={col.key} value={col.key}>
                          {col.label} {col.required ? "*" : ""} {col.hint ? `(${col.hint})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Missing required warning */}
              {!allRequiredMapped && (
                <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Missing required columns: </span>
                    {requiredCols
                      .filter((c) => !Object.values(mapping).includes(c.key))
                      .map((c) => c.label)
                      .join(", ")}
                  </div>
                </div>
              )}

              {/* Preview rows */}
              {csvRows.length > 0 && (
                <div className="overflow-x-auto">
                  <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wider">Preview (first 3 rows)</p>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        {Object.entries(mapping)
                          .filter(([, v]) => v)
                          .map(([csvIdx, dbCol]) => (
                            <th
                              key={csvIdx}
                              className="text-left px-2 py-1.5 border-b border-border/50 text-muted-foreground font-medium"
                            >
                              {schema.columns.find((c) => c.key === dbCol)?.label || dbCol}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 3).map((row, ri) => (
                        <tr key={ri}>
                          {Object.entries(mapping)
                            .filter(([, v]) => v)
                            .map(([csvIdx]) => (
                              <td key={csvIdx} className="px-2 py-1.5 border-b border-border/30 text-foreground truncate max-w-[160px]">
                                {row[Number(csvIdx)] || "—"}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Import button */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleImport}
                  disabled={!allRequiredMapped || csvRows.length === 0}
                  className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Import {csvRows.length} Rows
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Importing */}
        {state === "importing" && (
          <motion.div
            key="importing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-6 border-t border-border/30 flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Importing {csvRows.length} records...
          </motion.div>
        )}

        {/* Done */}
        {state === "done" && result && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-3 border-t border-border/30 space-y-2"
          >
            {result.inserted > 0 && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Successfully imported {result.inserted} records
              </div>
            )}
            {result.errors.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-red-600">
                  <XCircle className="h-3.5 w-3.5" />
                  {result.errors.length} error{result.errors.length > 1 ? "s" : ""}
                </div>
                <div className="max-h-32 overflow-y-auto bg-red-50 rounded-lg p-2 space-y-0.5">
                  {result.errors.slice(0, 20).map((err, i) => (
                    <p key={i} className="text-[11px] text-red-600">
                      Row {err.row}, {err.column}: {err.message}
                    </p>
                  ))}
                  {result.errors.length > 20 && (
                    <p className="text-[11px] text-red-500 italic">
                      ...and {result.errors.length - 20} more errors
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────────────────
export function CsvImport() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-xl bg-card p-6 shadow-card border border-border/50 space-y-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3"
      >
        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Upload className="h-5 w-5 text-blue-600" />
        </div>
        <div className="text-left flex-1">
          <h3 className="text-sm font-semibold text-card-foreground">Import Data</h3>
          <p className="text-xs text-muted-foreground">Upload CSV files to import data into the system</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "" : "-rotate-90"}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-3"
          >
            {/* Instructions */}
            <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">How to import:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Download a template CSV for the data type you want to import</li>
                <li>Fill in your data (dates in DD/MM/YYYY or YYYY-MM-DD format)</li>
                <li>Upload the CSV and map columns to the correct fields</li>
                <li>Review the preview, then click Import</li>
              </ol>
              <p className="text-amber-600 mt-1.5">
                <strong>Tip:</strong> For Timesheets, Case Notes, and Compliance Records, you'll need the Staff/Client UUID.
                Export Staff and Clients first to get their IDs.
              </p>
            </div>

            {/* Importers */}
            {Object.entries(TABLE_SCHEMAS).map(([key, schema]) => (
              <TableImporter key={key} tableKey={key} schema={schema} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
