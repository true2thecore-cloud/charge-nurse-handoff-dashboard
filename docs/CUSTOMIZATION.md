# Connect your own questions and response table

The dashboard uses named column headers rather than numeric column positions. Moving a source column will not change its mapping, provided its header stays the same.

## Use the Setup sheet

| Setting | Meaning |
| --- | --- |
| ResponseTable | Excel table to read when responseJson is empty |
| TimestampHeader | Header of the sortable submission timestamp |
| ResponseIdHeader | Unique response identifier, preferably Forms Response Id |
| TimestampMode | `iso` for ISO text with Z or an offset; `excel-utc` only for numeric Excel serials already representing UTC |
| DisplayTimeZone | IANA time-zone name used to show the timestamp, such as `America/New_York` |
| TemplateVersion | Package version; keep for support |

The DashboardMap table has five editable columns:

| Column | What to enter |
| --- | --- |
| SourceHeader | Exact column name in your response table |
| DashboardLabel | Wording leaders will see |
| Slot | A fixed dashboard destination, or `detail` |
| Rule | `yes-good`, `no-good`, or `info` |
| Enabled | `Yes` or `No` |

The fixed slots are `reporter`, `shift`, `reportDate`, `callouts`, `addons`, `equipmentChecks`, `rooms`, `concerns`, `calloutNames`, `comments`, `issues`, and `putbacks`. Each fixed slot may be used once. Up to 40 `detail` rows are supported. Disabled mappings are not required in the source table. Blank answers are shown as missing; an unusual yes/no answer is flagged for review.

To add a question, add a column to the response table, add the question to Forms, map the answer in the flow, and add one enabled DashboardMap row. A new source column alone does not automatically become a dashboard question. Resize the Excel table if typing directly below its last row did not extend it.

Example: to separate the three equipment checks, rename the existing equipment column to `CodeCartChecked`, map it to slot `equipmentChecks`, and label it `Code cart checked`. Add `OmniCellChecked` and `BloodFridgeChecked` columns and two `detail` mappings with rule `yes-good`. Then map all three Form answers in the flow. No clinical criteria are inferred by the script; each unit defines what a Yes confirms.

## Existing Forms table in the dashboard workbook

Keep the source data on its own worksheet. Select the table, find its table name in **Table Design**, and enter that name in Setup. Replace DashboardMap SourceHeader entries with your actual headers. Update TimestampHeader and ResponseIdHeader too. Do not move the dashboard's output blocks or its Setup table to accommodate different source columns.

For an export with generic headers such as `Column15`, use [legacy-column-map.csv](../config/legacy-column-map.csv) as a starting reference for the supplied example's layout only. Verify each actual question before using it. Quiz exports often have points and feedback columns between answers; those are not operational answers.

## Existing Forms table in a separate workbook

Use the optional ExportHandoff bridge so your original response workbook remains the source of record:

1. Keep the existing mechanism that writes the Form response into that workbook. Do not add a second writer to the same response table.
2. After that write and a 30-second Delay, run `ExportHandoff` against the source workbook. Set `tableName` to its exact table name. Rename the action `Export_handoff`.
3. Run `UpdateDashboard` against the dashboard workbook.
4. Set `responseJson` to the **result** of Export_handoff, using Dynamic content or `outputs('Export_handoff')?['body/result']`.
5. Set `expectedResponseId` to the new Forms Response Id. The ID must match the value stored in the source table's configured ID column.
6. Configure Setup and DashboardMap using the **external table's headers**. ResponseTable is ignored when a responseJson snapshot is supplied.

This path displays the external responses; it does not copy their history into the dashboard's local Hand Off Report table. Keep that table empty or label it unused. ExportHandoff allows up to 5,000 rows and rejects an oversized payload. Archive older responses in the source as needed. If the source uses Forms' own workbook synchronization, test its write timing; the Forms event alone does not prove that its Excel row is ready.

## Timestamps

The new package leaves original timestamps unchanged. The default is an ISO value such as `2026-11-20T19:45:00Z`; the display converts it to the selected local zone. A plain value such as `11/20/2026 2:45 PM` has no time-zone information and is intentionally rejected.

For an existing local timestamp, add a new UTC column through your flow and use **Convert time zone** with the actual source zone and UTC destination. Keep the original column. Do not append Z to local time or subtract a fixed number of hours, because daylight saving changes can alter the offset. This package does not change an already working local timestamp workaround in your production file. [Microsoft conversion guide](https://learn.microsoft.com/power-automate/convert-time-zone)

`excel-utc` is only for an Excel numeric date already known to be UTC. It does not make a locally recorded Excel timestamp UTC. Mixed formats should be normalized before connecting the table.

## Keep the output structure stable

The scripts replace values in designated cells. They do not insert dashboard rows, overwrite source timestamps or import the roster. Long text remains stored in the output cell; if it exceeds the visible panel, select the cell to read the complete response in the formula bar, or enlarge that panel's row height. Apply layout changes to a copy and test all mapped fields again.
