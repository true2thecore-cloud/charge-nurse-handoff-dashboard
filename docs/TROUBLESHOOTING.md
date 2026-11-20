# Troubleshooting

| Symptom | Check | Corrective action |
| --- | --- | --- |
| Manual script works, automatic flow does not | Last run, action inputs, workbook and script selection | Select the same workbook and saved script version in the flow |
| Green run but old dashboard | New response visibility and script result | Use Delay 30 seconds and expectedResponseId; confirm the returned responseId |
| Delay says invalid parameters | Count and Unit | Enter numeric 30 and select Second |
| Script parameters are missing | Script signature changed since action was added | Remove and recreate only the Run script action, then remap parameters |
| Answers land under the wrong labels | DashboardMap SourceHeader and Slot | Match exact headers and use each main slot only once |
| Reporter says anonymous or an email | Reporter mapping and Forms identity settings | Map the explicit Reporter answer if automatic identity is unavailable |
| Submission time is wrong | Stored timestamp and actual source time zone | Normalize once to UTC; do not repeatedly convert or write back |
| Staffing export fails Friday | Monday tab and B1 date | Create the Monday dated tab with the matching date |
| Staffing looks stale | Captured UTC timestamp and flow history | Run the staffing flow again; source edits do not change a snapshot |
| Names entered but hours stay zero | Assignment area and first parenthesis | Use A:J through row 46 and a value such as Name RN 01 (10) |
| Hours counted twice | Repeated entries in A:J | Keep one primary assignment per person; use K:L for later coverage |
| Script runs against hidden data | Actual named sheet/table | Hidden is supported; avoid relying on the active worksheet |
| Excel lock, 429 or timeout | Overlapping flows, manual edits, request limits | Stop competing writes, allow recovery, and inspect before retrying |
| Teams view differs from Excel | File location and browser refresh | Confirm the same cloud file and reload the tab |
| Formatting differs after staffing import | Source layout versus template | Match the destination layout; import transfers values only |

Missing sheets, invalid mappings, unavailable expected responses and invalid dates raise errors instead of silently returning success. UpdateDashboard writes an error message while retaining the prior handoff values. ImportStaffing does the same when it runs and rejects a payload. If ExportStaffing fails first, ImportStaffing does not run, so the old snapshot timestamp is the visible evidence of its age; inspect the failed flow for the cause.

The scripts do not call Refresh All or rely on an active Excel window. Microsoft notes that Power Automate runs in an independent session and that some refresh methods do not perform the same work there as in Excel. [Power Automate script troubleshooting](https://learn.microsoft.com/en-us/office/dev/scripts/testing/power-automate-troubleshooting)

When reporting a problem in GitHub, use placeholder data and include the script name, failed action, error text, expected date and actual sheet name. Do not attach live response exports, staff details, connection tokens or patient information.
