/** Optional bridge when the Forms response table is in a DIFFERENT workbook. */
function main(workbook: ExcelScript.Workbook, tableName: string = "HandoffResponses"): string {
  const table = workbook.getTable(tableName);
  if (!table) throw new Error("Handoff table not found: " + tableName);
  if (table.getRowCount() > 5000) throw new Error("Archive older responses before exporting more than 5000 rows.");
  const payload = JSON.stringify({ version: 1, headers: table.getHeaderRowRange().getTexts()[0], rows: table.getRowCount() ? table.getRangeBetweenHeaderAndTotal().getValues() : [] });
  if (payload.length > 1500000) throw new Error("Response snapshot is too large. Archive older responses.");
  return payload;
}
