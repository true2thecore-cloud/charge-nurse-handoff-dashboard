# Handoff question catalog

Use a Form rather than a scored quiz. Report date, Reporter and Shift are metadata fields. The 21 operational items below adapt the original handoff questionnaire, with spelling and wording clarified. The printable Word form includes yes/no choices where appropriate and space for comments.

| Question | Form type | Excel column | Dashboard destination |
| --- | --- | --- | --- |
| Have add-on cases been picked? | Yes/No | `AddOnsPicked` | `addons` |
| For add-on cases, is the surgeon's availability confirmed? Include availability in booking. | Text | `SurgeonAvailability` | `detail` |
| Does preop know about the add-on cases? | Yes/No | `PreopAware` | `detail` |
| Were there any staff call-outs? | Yes/No | `CallOuts` | `callouts` |
| What are the names and roles of the staff who called out? | Text | `CallOutNames` | `calloutNames` |
| Have all staff been assigned to a task or room? | Yes/No | `StaffAssigned` | `detail` |
| Have hourly OR rounds been completed and all staff accounted for? | Yes/No | `HourlyRounds` | `detail` |
| Have environmental rounds been completed, including lead storage, tape, sutures, wires and equipment dust? | Yes/No | `EnvironmentalRounds` | `detail` |
| What staff or environmental concerns were found? Enter None when there are no concerns. | Text | `Concerns` | `concerns` |
| Is the hallway free of clutter? | Yes/No | `HallwayClear` | `detail` |
| Are surgical case carts in the correct locations? | Yes/No | `CaseCarts` | `detail` |
| Is equipment in the correct locations? | Yes/No | `EquipmentLocations` | `detail` |
| Are robots correctly positioned in their rooms? | Yes/No | `RobotsPositioned` | `detail` |
| Are emergency carts stocked? | Yes/No | `EmergencyCarts` | `detail` |
| Have the code cart, medication OmniCell and blood fridge been checked for expirations or errors? | Yes/No | `EquipmentChecks` | `equipmentChecks` |
| Did nurses, techs, support staff, anesthesia techs and case pickers check in before breaks or lunch? | Yes/No | `BreakCheckIn` | `detail` |
| Who did not check in, if this has not already been escalated? | Text | `MissedCheckIn` | `detail` |
| Were put-backs followed up on? | Yes/No | `PutBacks` | `putbacks` |
| What issues were identified on your shift? Enter None when there are no issues. | Text | `Issues` | `issues` |
| Were rooms prepared for an emergency or the next day's cases? | Yes/No | `RoomsReady` | `rooms` |
| What else should the next charge nurse know? Include comments, needs or shout-outs. | Text | `Comments` | `comments` |

For yes/no questions, choose a single-answer Choice question with Yes and No. For narrative questions, use Text with Long answer enabled. Make critical checks required according to your unit workflow. Use None when an open-ended concern or issue question has no findings.

To add a comment field beside a yes/no check, create an optional Text question and a matching Excel column, then map it as `detail` with rule `info`. Keep a combined equipment check only when that matches your local process. Split the code cart, OmniCell and blood fridge into separate questions when leaders need separate confirmation.

The Word document is a question reference and printable form. This repository does not claim to automatically create or import a Microsoft Form from the document. Create and verify the Form in your tenant.
