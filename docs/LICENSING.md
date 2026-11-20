# Licensing and restricted environments

This design does not call premium connectors, AI Builder, Copilot Studio, HTTP APIs or desktop flows. It uses cloud flows with Microsoft Forms and Excel Online (Business), which Microsoft classifies as standard connectors. [Forms connector](https://learn.microsoft.com/en-us/connectors/microsoftforms/), [Excel connector](https://learn.microsoft.com/en-us/connectors/excelonlinebusiness/)

| Situation | Route |
| --- | --- |
| Eligible Microsoft 365 business plan with Office Scripts and Power Automate enabled | Follow SETUP.md using standard connectors |
| Same plan without a Copilot add-on | Same setup; Copilot is not required by the code |
| No Power Automate Premium subscription | The documented standard-connector route is the intended option; confirm included use rights with your administrator |
| Office Scripts disabled or restricted by IT | Ask for the required capability or use the manual workflow below |
| Only personal Excel or a free Power Automate account | Do not assume business Office Scripts integration is available |
| E1 or F3 plan | Microsoft documents script use through Power Automate, but not the direct Power Automate integration within Excel |

Microsoft 365 use rights depend on the actual plan and tenant configuration. A standard connector does not mean every account is licensed for every workflow. Refer to Microsoft's [licensing FAQ](https://learn.microsoft.com/en-us/power-platform/admin/power-automate-licensing/faqs) and [Office Scripts business-license requirements](https://learn.microsoft.com/en-us/office/dev/scripts/develop/power-automate-integration).

When requesting access, describe the exact components: Microsoft Forms, an approved SharePoint or OneDrive for Business location, Excel Online (Business) Run script, and Office Scripts. An administrator may enable or restrict scripts and their Power Automate use. [Administration reference](https://learn.microsoft.com/microsoft-365/admin/manage/manage-office-scripts-settings)

If automatic flows are unavailable but scripts are allowed, a leader can run UpdateDashboard manually after responses arrive. For staffing without flows, copy source A1:L46 and **Paste Special > Values** into Staffing View A7:L52. Manually update its date, source tab and captured timestamp, and the dashboard's staffing reference. The manual copy is not automatically synchronized. If scripts are also unavailable, maintain dashboard fields manually and label the update time. These fallbacks do not promise 2:45 PM automation.

Microsoft guidance checked November 20, 2026. Product availability and licensing can change.
