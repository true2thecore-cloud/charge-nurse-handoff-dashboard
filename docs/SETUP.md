# Set up the dashboard with standard connectors

This guide builds two cloud flows: one for each new handoff and one for staffing at 2:45 PM. It uses the supplied templates. No Python, desktop automation, Copilot prompt, premium HTTP connector or computer left running is required.

## 1. Place the files

1. Download both Excel files from `templates`.
2. Upload them to an approved SharePoint document library or OneDrive for Business. A team-owned SharePoint library is useful when several leaders maintain the workflow.
3. Open **Charge Nurse Dashboard.xlsx** in Excel for the web. Confirm the tabs: **Charge Nurse Dashboard**, **Staffing View**, **Hand Off Report**, **Setup**.
4. Open **Staffing Assignments.xlsx**. The `01-04-27` tab is an example, not a current schedule. Duplicate it, rename the copy using `MM-DD-YY`, and enter the matching date in **B1**. Clear the sample assignments in A4:J46 and K3:L46 without deleting section labels. Replace the N:P placeholder roster with your own staff.
5. Keep the cloud files in these locations after configuring the flows. Moving them may require selecting them again in Power Automate.

## 2. Install the Office Scripts

For each file in `scripts`, open it in GitHub, select **Raw**, then copy the full code. In Excel for the web, choose **Automate > New Script** (or **New Script > Create in Code Editor**), replace the starter code, and save under the exact name below.

| Script name | Workbook used when it runs | Purpose |
| --- | --- | --- |
| `UpdateDashboard` | Dashboard workbook | Reads the latest response using Setup mappings |
| `ExportStaffing` | Staffing workbook | Selects the required date and returns A1:L46 |
| `ImportStaffing` | Dashboard workbook | Places that snapshot on Staffing View |
| `ExportHandoff` | Existing separate Forms workbook, optional | Bridges an external response table to the dashboard |

Scripts are stored separately from the workbook. Select both the correct file and the correct script in every flow action. If the script is in a team SharePoint library, use **Run script from SharePoint library** and select its separate script location. [Microsoft script integration guide](https://learn.microsoft.com/en-us/office/dev/scripts/develop/power-automate-integration)

## 3. Build or map the Form

1. Create a Microsoft **Form**, not a scored quiz.
2. Add **Report date** (Date), **Reporter** (Text) and **Shift** (Choice: Day, Evening, Night or your local names).
3. Add the operational questions in [QUESTIONS.md](QUESTIONS.md), changing wording to fit your unit. Use a separate optional text question for comments on a yes/no item when needed.
4. In the dashboard's **Hand Off Report** sheet, the Excel table is named `HandoffResponses`. It has stable, descriptive column headers. The starting blank row is harmless.
5. Leave the **Setup** defaults for a new installation. For an existing table or different questions, follow [CUSTOMIZATION.md](CUSTOMIZATION.md).

## 4. Create the handoff flow

In Power Automate, select **Create > Automated cloud flow**. Name it `Charge nurse handoff update`.

1. Trigger: **Microsoft Forms > When a new response is submitted**. Select your Form.
2. Open trigger **Settings**, enable **Concurrency control** and set **Degree of parallelism = 1** so this flow processes submissions sequentially.
3. Add **Microsoft Forms > Get response details**. Select the same Form. For **Response Id**, choose the trigger's **Response Id** dynamic content.
4. Add **Excel Online (Business) > Add a row into a table**. Select the dashboard workbook with the file picker, then table `HandoffResponses`.
5. Map the fields below. Use the matching answer from **Get response details** for each operational column. Do not type the question's display label as the answer.

| Excel field | Value in the flow |
| --- | --- |
| `ResponseId` | Forms trigger's Response Id |
| `SubmittedUtc` | The expression `utcNow()` |
| `ReportDate` | Form answer to Report date |
| `Reporter` | Form answer to Reporter |
| `Shift` | Form answer to Shift |
| Remaining columns | Matching Form answers from QUESTIONS.md |

`utcNow()` records receipt time at this flow step in UTC. It is not a claim to be the original Forms completion timestamp. If your source supplies a reliable completion timestamp, normalize that to UTC instead, as explained in Customization.

6. Add **Schedule > Delay**, between Add row and Run script. Set **Count = 30**, **Unit = Second**. No dynamic content is needed. Excel writes can become visible after the action has already reported success. [Excel connector limitations](https://learn.microsoft.com/en-us/connectors/excelonlinebusiness/)
7. Add **Excel Online (Business) > Run script**. Select the same dashboard workbook and `UpdateDashboard`.
8. Set **expectedResponseId** to the trigger's Response Id. Leave **responseJson** empty. This verifies that the new response is visible before updating, instead of silently displaying an older response.
9. Save. Select **Test > Manually**, then submit one clearly labeled test response through Forms. Wait for the entire run to finish.
10. Compare Reporter, Shift, Call-out names, Comments, Issues and Put-backs against that response. Check the response ID and timestamp at the top of the dashboard. Change the call-out answer from No to Yes in a second test and confirm the alert changes.

Do not resubmit an entire successful run merely to refresh the display: that can add another row. Run `UpdateDashboard` directly to re-read existing responses. If a write was delayed beyond 30 seconds, wait and retry only the dashboard action, or use a bounded retry branch in the flow. Review duplicate ResponseIds after connector retries; the dashboard selects the latest timestamp, but does not delete duplicate history.

## 5. Create the 2:45 PM staffing flow

Select **Create > Scheduled cloud flow** and name it `Staffing snapshot 245`.

1. In **Recurrence**, choose **Frequency = Week**, **Interval = 1**, days **Monday through Friday**, hour **14**, minute **45**. Select your local time zone. For Eastern US, choose **Eastern Standard Time**. Selecting a named zone allows seasonal clock changes to be handled by the schedule. [Microsoft recurrence guidance](https://learn.microsoft.com/en-us/azure/connectors/connectors-native-recurrence)
2. Set trigger concurrency to **1**.
3. Add **Run script**, choose the **staffing workbook**, and select `ExportStaffing`. Rename this action **Export_staffing** before adding expressions.
4. Fill the script parameters:

| Parameter | Default installation value |
| --- | --- |
| `localDate` | Expression below |
| `mode` | `next-business-day` |
| `sheetName` | Leave blank to select the matching `MM-DD-YY` tab |
| `explicitDate` | Leave blank |

```text
formatDateTime(convertTimeZone(utcNow(),'UTC','Eastern Standard Time'),'yyyy-MM-dd')
```

Change the time-zone name in that expression if your unit is elsewhere. The expression converts the current UTC instant before deriving the local calendar date. [Power Automate time conversion](https://learn.microsoft.com/en-us/power-automate/convert-time-zone)

5. Add another **Run script**, now choose the **dashboard workbook** and `ImportStaffing`.
6. For **payloadJson**, choose **result** from **Export_staffing** in Dynamic content. If necessary, use this expression, with the action named exactly as above:

```text
outputs('Export_staffing')?['body/result']
```

7. Keep the default success dependency: ImportStaffing must run only after Export_staffing succeeds. Save.
8. Test using a date for which you prepared staffing. For a repeatable Friday test, temporarily set `localDate` to `2026-11-20`, create `11-23-26` with **B1 = 2026-11-23**, and run. Confirm Monday is imported. Restore the localDate expression before enabling the schedule.
9. Open **Staffing View**. Confirm the displayed date, source tab and captured UTC timestamp, and compare a cell at the bottom right: source **L46** must appear at destination **L52**. The snapshot starts at A7 to allow a clear title and refresh information above it.

No workbook needs to remain open for these cloud flows. A scheduled time is the trigger time, not a guaranteed completion deadline. If the target dated sheet is missing or B1 does not match, export fails without substituting another day. The previous snapshot and its old timestamp remain until a successful import. Check flow failures before handoff.

## 6. Avoid competing writers

The two flows both update the dashboard workbook. Trigger concurrency of 1 serializes each flow separately; it does **not** serialize two different flows or manual edits. Arrange the 2:45 staffing import away from routine handoff submissions, avoid simultaneous editing during imports, and inspect retries or lock errors. For units needing frequent simultaneous writes, have IT implement a shared queue or a different record store before scaling this Excel workflow. Microsoft documents limits on concurrent workbook modifications in the [Excel connector reference](https://learn.microsoft.com/en-us/connectors/excelonlinebusiness/).

## 7. Acceptance test before use

| Test | Expected result |
| --- | --- |
| Submit handoff with a named call-out | Name appears in purple section; call-out status requires action |
| Leave an optional response empty | Not reported, never Complete |
| Put different text in Comments and Issues | Each appears in its correct section |
| Run the same dashboard script twice | Same latest response; no additional source rows |
| Put `Name RN 03 (10)` in staffing C8 | Assigned hours increase by 10 |
| Move that entry back out of A:J | Assigned hours decrease by 10 |
| Repeat a name in K:L for later coverage | Assigned hours do not double count |
| Run Friday date selection | Monday's dated tab is chosen |
| Remove the required dated tab | Export action fails; old date remains visible |
| Change a source assignment after import | View remains a snapshot until the staffing flow runs again |
| Open the workbook through Teams | Same file, staffing date and handoff response ID appear |

Once these tests pass, remove test responses, prepare real dated staffing tabs, set the schedule's production time zone, and assign a primary and backup flow owner.

## Starting from Excel's Automate tab

Where available, **Automate > Automate a Task** can start a Power Automate template using the current workbook. Use the same actions and settings above. As of this package's November 20, 2026 review, Microsoft says built-in **Script scheduling** is temporarily disabled; use the Power Automate recurrence route instead. [Office Scripts scheduling notice](https://learn.microsoft.com/en-us/office/dev/scripts/overview/excel#schedule-scripts-to-run-automatically)
