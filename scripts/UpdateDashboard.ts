/** Paste this entire file into Excel > Automate > New Script. */
type Cell = string | number | boolean;
interface Snapshot { version: number; headers: string[]; rows: Cell[][]; }
interface Mapping { header: string; label: string; slot: string; rule: string; }

function main(workbook: ExcelScript.Workbook, expectedResponseId: string = "", responseJson: string = ""): string {
  const dash = workbook.getWorksheet("Charge Nurse Dashboard");
  const setup = workbook.getWorksheet("Setup");
  if (!dash || !setup) throw new Error("Use the dashboard template: Charge Nurse Dashboard and Setup are required.");
  try {
    const settings = readSettings(setup.getRange("A4:B9").getValues());
    const mapTable = workbook.getTable("DashboardMap");
    if (!mapTable || mapTable.getRowCount() === 0) throw new Error("DashboardMap is missing or empty.");
    const maps = mapTable.getRangeBetweenHeaderAndTotal().getValues()
      .filter(r => String(r[4]).trim().toLowerCase() === "yes")
      .map(r => ({ header: String(r[0]).trim(), label: String(r[1]), slot: String(r[2]).trim(), rule: String(r[3]).trim() }));
    let snapshot: Snapshot;
    if (responseJson.trim()) {
      snapshot = JSON.parse(responseJson) as Snapshot;
      if (snapshot.version !== 1 || !Array.isArray(snapshot.headers) || !Array.isArray(snapshot.rows)) throw new Error("Invalid response snapshot.");
    } else {
      const source = workbook.getTable(settings["ResponseTable"]);
      if (!source) throw new Error("Response table not found: " + settings["ResponseTable"]);
      snapshot = { version: 1, headers: source.getHeaderRowRange().getTexts()[0], rows: source.getRowCount() ? source.getRangeBetweenHeaderAndTotal().getValues() : [] };
    }
    validateMappings(maps, snapshot.headers);
    const row = selectLatest(snapshot, settings, expectedResponseId);
    const value = (slot: string): Cell => {
      const m = maps.find(x => x.slot === slot);
      return m ? row[snapshot.headers.indexOf(m.header)] ?? "" : "";
    };
    const label = (slot: string, fallback: string): string => maps.find(x => x.slot === slot)?.label || fallback;
    const stamp = parseTimestamp(row[snapshot.headers.indexOf(settings["TimestampHeader"])], settings["TimestampMode"]);
    const display = new Date(stamp).toLocaleString("en-US", { timeZone: settings["DisplayTimeZone"] || "America/New_York", dateStyle: "short", timeStyle: "short" });
    // Only designated output cells are changed. Source responses and timestamps stay intact.
    put(dash, "B5", value("reporter")); put(dash, "F5", value("shift"));
    put(dash, "B6", value("reportDate"));
    dash.getRange("B6").setNumberFormatLocal(typeof value("reportDate") === "number" ? "m/d/yyyy" : "@");
    put(dash, "F6", display);
    const slots = ["callouts", "addons", "equipmentChecks", "rooms", "concerns"];
    slots.forEach((slot, i) => {
      const n = 10 + i;
      const m = maps.find(x => x.slot === slot);
      put(dash, "A" + n, m?.label || slot);
      put(dash, "D" + n, m ? value(slot) : "Not configured");
      put(dash, "G" + n, m ? status(value(slot), m.rule) : "NOT CONFIGURED");
    });
    const panels = [{slot:"calloutNames", label:"Staff called out", heading:"A17", cell:"A18"},
      {slot:"comments", label:"Additional handoff notes", heading:"A21", cell:"A22"},
      {slot:"issues", label:"Issues and follow-up", heading:"A25", cell:"A26"},
      {slot:"putbacks", label:"Put-backs followed up", heading:"A29", cell:"A30"}];
    panels.forEach(p => {
      put(dash, p.heading, label(p.slot, p.label));
      const m = maps.find(x => x.slot === p.slot);
      const v = value(p.slot);
      put(dash, p.cell, m ? (String(v).trim() ? v : "Not reported") : "Not configured");
    });
    dash.getRange("A40:H79").clear(ExcelScript.ClearApplyTo.contents);
    maps.filter(m => m.slot === "detail").forEach((m, i) => {
      const n = 40 + i;
      put(dash, "A" + n, m.label);
      const v = row[snapshot.headers.indexOf(m.header)] ?? "";
      put(dash, "D" + n, String(v).trim() ? v : "Not reported");
      put(dash, "G" + n, status(v, m.rule));
    });
    const responseId = String(row[snapshot.headers.indexOf(settings["ResponseIdHeader"])]);
    put(dash, "A2", "Updated " + new Date().toLocaleString("en-US", { timeZone: settings["DisplayTimeZone"] || "America/New_York" }) + " | Response " + responseId);
    put(dash, "A3", "READY | Latest submitted handoff. Staffing refresh is shown separately below.");
    return JSON.stringify({ status: "updated", responseId, submittedUtc: new Date(stamp).toISOString() });
  } catch (error) {
    put(dash, "A3", "UPDATE FAILED | Prior handoff remains displayed. " + String(error));
    throw error;
  }
}

function readSettings(rows: Cell[][]): { [key: string]: string } {
  const result: { [key: string]: string } = {};
  rows.forEach(r => { result[String(r[0])] = String(r[1]); });
  return result;
}
function safeText(value: Cell): Cell {
  return typeof value === "string" && /^[=+\-@]/.test(value) ? "'" + value : value;
}
function put(sheet: ExcelScript.Worksheet, address: string, value: Cell) {
  const range = sheet.getRange(address);
  range.setNumberFormatLocal(typeof value === "string" ? "@" : "General");
  range.setValue(safeText(value));
}
function status(value: Cell, rule: string): string {
  const text = String(value).trim().toLowerCase();
  if (!text) return "NOT REPORTED";
  if (rule === "info") return ["none", "no concerns", "no issues", "n/a", "not applicable"].includes(text) ? "REPORTED" : "REVIEW NOTES";
  if (text === "n/a" || text === "not applicable") return "NOT APPLICABLE";
  if (text !== "yes" && text !== "no") return "REVIEW RESPONSE";
  return (rule === "yes-good" ? text === "yes" : text === "no") ? "COMPLETE" : "ACTION NEEDED";
}
function validateMappings(maps: Mapping[], headers: string[]) {
  const allowed = ["reporter", "shift", "reportDate", "callouts", "addons", "equipmentChecks", "rooms", "concerns", "calloutNames", "comments", "issues", "putbacks", "detail"];
  const used: string[] = [];
  if (new Set(headers).size !== headers.length) throw new Error("Source table contains duplicate column headers.");
  maps.forEach(m => {
    if (!headers.includes(m.header)) throw new Error("Mapped source header is missing: " + m.header);
    if (!allowed.includes(m.slot)) throw new Error("Unknown dashboard slot: " + m.slot);
    if (!["yes-good", "no-good", "info"].includes(m.rule)) throw new Error("Unknown alert rule: " + m.rule);
    if (m.slot !== "detail" && used.includes(m.slot)) throw new Error("Duplicate dashboard slot: " + m.slot);
    used.push(m.slot);
  });
  if (maps.filter(m => m.slot === "detail").length > 40) throw new Error("Maximum 40 additional questions.");
}
function parseTimestamp(value: Cell, mode: string): number {
  let ms: number;
  if (mode === "excel-utc") {
    if (typeof value !== "number") throw new Error("TimestampMode excel-utc requires numeric UTC Excel serials.");
    ms = Math.round((value - 25569) * 86400000);
  } else if (mode === "iso") {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) throw new Error("Use an ISO timestamp with Z or an explicit time-zone offset. Normalize local timestamps in the flow first.");
    ms = Date.parse(value);
  } else throw new Error("TimestampMode must be iso or excel-utc.");
  if (!Number.isFinite(ms)) throw new Error("Invalid submission timestamp.");
  return ms;
}
function selectLatest(snapshot: Snapshot, settings: { [key: string]: string }, expected: string): Cell[] {
  const timeCol = snapshot.headers.indexOf(settings["TimestampHeader"]);
  const idCol = snapshot.headers.indexOf(settings["ResponseIdHeader"]);
  if (timeCol < 0 || idCol < 0) throw new Error("Response ID or timestamp header is missing. Check Setup.");
  const rows = snapshot.rows.filter(r => String(r[idCol] ?? "").trim() !== "");
  if (!rows.length) throw new Error("No submitted responses are available.");
  if (expected && !rows.some(r => String(r[idCol]) === expected)) throw new Error("Expected response is not visible yet: " + expected + ". Retry after the Excel write completes.");
  let latest = rows[0]; let latestMs = -Infinity;
  rows.forEach(r => {
    if (r.length !== snapshot.headers.length) throw new Error("Response row does not match the source headers.");
    const ms = parseTimestamp(r[timeCol], settings["TimestampMode"]);
    if (ms >= latestMs) { latest = r; latestMs = ms; }
  });
  return latest;
}
