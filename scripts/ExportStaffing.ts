interface StaffingPayload { version: number; sourceSheet: string; staffingDate: string; capturedUtc: string; values: string[][]; }

function main(workbook: ExcelScript.Workbook, localDate: string, mode: string = "next-business-day", sheetName: string = "", explicitDate: string = ""): string {
  const date = chooseDate(localDate, mode, explicitDate);
  const tab = sheetName.trim() || formatTab(date);
  const source = workbook.getWorksheet(tab);
  if (!source) throw new Error("Staffing sheet not found: " + tab + ". Create the dated tab or supply sheetName. No other date was substituted.");
  const header = source.getRange("B1").getValue();
  const headerDate = typeof header === "number" ? new Date(Math.round((header - 25569) * 86400000)).toISOString().slice(0, 10) : String(header).trim();
  if (headerDate !== date) throw new Error("Staffing B1 must match " + date + ". Enter that ISO date or a real Excel date. This prevents importing an old weekday template.");
  workbook.getApplication().calculate(ExcelScript.CalculationType.full);
  const payload: StaffingPayload = { version: 1, sourceSheet: tab, staffingDate: date, capturedUtc: new Date().toISOString(), values: source.getRange("A1:L46").getTexts() };
  return JSON.stringify(payload);
}

function validDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Dates must use YYYY-MM-DD.");
  const d = new Date(value + "T12:00:00Z");
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== value) throw new Error("Invalid calendar date: " + value);
  return d;
}
function chooseDate(localDate: string, mode: string, explicitDate: string): string {
  if (mode === "explicit-date") { validDate(explicitDate); return explicitDate; }
  const d = validDate(localDate);
  if (mode === "next-business-day") {
    do { d.setUTCDate(d.getUTCDate() + 1); } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  } else if (mode !== "same-date") throw new Error("Use next-business-day, same-date or explicit-date.");
  return d.toISOString().slice(0, 10);
}
function formatTab(date: string): string { return date.slice(5, 7) + "-" + date.slice(8, 10) + "-" + date.slice(2, 4); }
