interface StaffingPayload { version: number; sourceSheet: string; staffingDate: string; capturedUtc: string; values: string[][]; }

function main(workbook: ExcelScript.Workbook, payloadJson: string): string {
  const view = workbook.getWorksheet("Staffing View");
  const dash = workbook.getWorksheet("Charge Nurse Dashboard");
  if (!view || !dash) throw new Error("Staffing View and Charge Nurse Dashboard are required.");
  try {
    const p = JSON.parse(payloadJson) as StaffingPayload;
    validatePayload(p);
    const previous = String(view.getRange("B4").getValue());
    if (previous && Number.isFinite(Date.parse(previous)) && Date.parse(p.capturedUtc) < Date.parse(previous)) throw new Error("An older snapshot cannot replace a newer staffing import.");
    const values = p.values.map(row => row.map(value => /^[=+\-@]/.test(value) ? "'" + value : value));
    // A1:L46 in the source maps exactly to A7:L52 in the viewing sheet.
    view.getRange("A7:L52").setNumberFormatLocal("@");
    ["B2", "B3", "B4"].forEach(a => view.getRange(a).setNumberFormatLocal("@"));
    ["B34", "F34", "B35"].forEach(a => dash.getRange(a).setNumberFormatLocal("@"));
    view.getRange("A7:L52").setValues(values);
    view.getRange("B2").setValue(p.staffingDate);
    view.getRange("B3").setValue(p.sourceSheet);
    view.getRange("B4").setValue(p.capturedUtc);
    view.getRange("A5").setValue("IMPORTED SNAPSHOT | Edit assignments in the staffing workbook. Refresh after edits.");
    dash.getRange("B34").setValue(p.staffingDate);
    dash.getRange("F34").setValue(p.sourceSheet);
    dash.getRange("B35").setValue(p.capturedUtc);
    dash.getRange("A36").setValue("Staffing snapshot available on Staffing View. Later shifts in K:L are included.");
    return JSON.stringify({ status: "imported", date: p.staffingDate, sourceSheet: p.sourceSheet, cells: 552 });
  } catch (error) {
    view.getRange("A5").setValue("IMPORT FAILED | Prior staffing remains displayed. " + String(error));
    dash.getRange("A36").setValue("STAFFING IMPORT FAILED | Review the flow. Prior snapshot remains displayed.");
    throw error;
  }
}
function validatePayload(p: StaffingPayload) {
  if (p.version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(p.staffingDate) || !Number.isFinite(Date.parse(p.staffingDate + "T00:00:00Z")) || new Date(p.staffingDate + "T00:00:00Z").toISOString().slice(0,10) !== p.staffingDate || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(p.capturedUtc) || !Number.isFinite(Date.parse(p.capturedUtc))) throw new Error("Invalid staffing metadata.");
  if (!Array.isArray(p.values) || p.values.length !== 46 || p.values.some(r => !Array.isArray(r) || r.length !== 12 || r.some(v => typeof v !== "string"))) throw new Error("Staffing snapshot must contain exactly 46 rows by 12 columns of text.");
  if (!p.sourceSheet || p.sourceSheet.length > 31) throw new Error("Invalid staffing sheet name.");
}
