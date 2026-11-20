# Staffing dates and assignment hours

## Select the correct date

| Mode | Meaning | Example |
| --- | --- | --- |
| `next-business-day` | Advance at least one day, skipping Saturday and Sunday | Friday 11/20/2026 selects Monday 11/23/2026 |
| `same-date` | Use the localDate parameter exactly | Saturday 11/21/2026 selects Saturday |
| `explicit-date` | Use explicitDate exactly | Import a selected future staffing date |

Only weekends are skipped. Holidays are not automatically excluded. Use explicit-date for a holiday adjustment. Dates passed to scripts use `YYYY-MM-DD`. Automatically selected tabs use `MM-DD-YY`.

**B1 is the staffing date check.** It must contain the requested date as a real Excel date or ISO date text. The script fails when the tab is absent or B1 differs. It never falls back silently to a different date. To use tabs named Monday, Tuesday or another convention, pass the exact `sheetName` and still update B1. Name matching alone cannot prove that a weekday sheet is current.

## What is imported

Source **A1:L46** becomes **Staffing View A7:L52**. The import preserves displayed values, including K:L later-shift entries. It does not import formulas, drawings, cell comments, or the N:P roster. Destination formatting comes from the supplied template. If your source layout differs, make a matching destination layout in a copy before testing; values alone do not copy custom merges, colors or row heights.

The dashboard shows the snapshot date, source tab and captured UTC time. A source edit does not update an already imported snapshot. Re-run the staffing flow when an assignment changes after the daily import.

## Optional updates during the day

For a simple ongoing view, create a scheduled flow every 15 minutes using the same ExportStaffing and ImportStaffing actions. Choose one rule deliberately:

- Use `same-date` to track today's assignments all day.
- Use `next-business-day` to track tomorrow's preparation all day.
- To show today before 2:45 PM and the next weekday afterward, set `mode` with the expression below.

```text
if(
  greaterOrEquals(
    int(formatDateTime(convertTimeZone(utcNow(),'UTC','Eastern Standard Time'),'HHmm')),
    1445
  ),
  'next-business-day',
  'same-date'
)
```

Use the same localDate expression as SETUP.md. This optional rule returns same-date on weekend mornings; if the unit has no weekend sheets, restrict the recurrence to weekdays. Do not enable overlapping staffing flows for the same workbook. A periodic flow provides periodic snapshots, not instant updates, and must be planned around the handoff flow's writes.

Avoid a broad "file modified" trigger on the destination workbook: the import itself changes that file and can start a loop. The basic package uses schedules and explicit reruns to keep behavior predictable.

## Assigned hours

The formula total at P46 counts the first numeric parentheses in each occupied cell in **A1:J46**. Roster N:P and later-shift lists K:L do not count. A name without a valid numeric parenthesis contributes zero. The examples start at **42 hours: 22 RN and 20 tech / First Assist**.

| Entry | Counted hours | Category |
| --- | --- | --- |
| `Name RN 01 (12)` | 12 | RN |
| `Name CST 01 (10)` | 10 | Tech / First Assist |
| `Name Tech 01 (8)` | 8 | Tech / First Assist |
| `Name First Assist 1 (10)` | 10 | Tech / First Assist |
| `Name ANM 01` in the roster | 0 | Outside counting area |
| `Name RN 02` | 0 | No hours provided |

Use role tags as shown, including spaces around RN, CST and Tech. Unrecognized roles with valid hours are included in **Other assigned hours**. Do not put a role in parentheses before its hours. Use nonnegative scheduled hours; these are assigned hours, not actual worked hours or payroll calculations.

Each person should appear once in A:J for a given staffing day. Copying a person into two assignment cells counts both entries. Later coverage repeats belong in K:L. The formula does not identify duplicate people or determine whether double assignment is appropriate.

The readable calculation grids begin at row 54. They use fixed INDIRECT cell addresses so Excel cut-and-paste does not move the counting boundaries. Do not insert assignment rows or columns without updating the import range, layout and calculations. Duplicate the whole worksheet when creating a new day so its formulas travel with it.

Leadership entries stay in the leadership area. First Assists are shown in gold at the bottom of the tech roster and in their assignment column. The basic staffing template supplies nurses, techs and First Assists; no real names, addresses or production IDs are included.
