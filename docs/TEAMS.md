# Show the dashboard in Teams

Use a tab pointing to the same cloud workbook that Power Automate updates. Uploading a second copy to a different location creates a separate file and will not show changes to the original.

1. Store the dashboard in the team's approved SharePoint library or upload it to the intended channel. If moving an already connected workbook, reselect its location in each flow.
2. Confirm that charge nurses can view the workbook and that designated maintainers can edit it.
3. In the channel, select **Add a tab (+)**, choose the Excel/file app available in your organization, select the dashboard workbook, and save. Your organization may restrict which apps or tabs are available. [Microsoft Teams tab guide](https://support.microsoft.com/en-us/teams/teams-channels/use-a-tab-in-a-channel-or-chat-in-microsoft-teams)
4. Name the tab **Charge Nurse Dashboard**. Open the workbook and select its dashboard sheet. Use **Staffing View** for room assignments and later shifts.
5. Submit a test response and run the staffing flow. Confirm the timestamp and response ID in the Teams view match Excel for the web. Reload or reopen the tab if the view has not refreshed.

The Teams tab displays the workbook. It does not create a refresh schedule or replace Power Automate. Teams channel files are stored in SharePoint. [Teams file storage](https://support.microsoft.com/en-us/teams/files/file-storage-in-microsoft-teams)

Run or edit scripts in Excel for the web when the Teams client does not expose the Automate tools. Microsoft documents Office Scripts support in Teams on the web rather than the desktop or mobile Teams clients. [Office Scripts troubleshooting](https://learn.microsoft.com/en-us/office/dev/scripts/testing/troubleshooting)

Give the workflow a primary and backup owner, document the chosen time zone and staffing-date rule, and keep the latest response and staffing timestamps visible. Worksheet hiding is a presentation choice, not an access-control boundary. Named-sheet scripts can read hidden sheets, but viewers with workbook access may still access underlying data according to their permissions.
