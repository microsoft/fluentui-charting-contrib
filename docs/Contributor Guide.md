Fluent charting library is a collection of individual charts like LineChart, AreaChart, Horizontal bar chart, vertical bar chart.
Charting components are built as production-ready, generalized, documented, and reusable components to be used in Microsoft products. This enables us and our partners to easily build great applications without spending a ton of time implementing the same controls over and over.
Each component is designed to be RTL-friendly, keyboard accessible, screen reader-friendly, themable, and generalized. TypeScript definition files are also included, so if you use TypeScript (which isn't a requirement), you will get compiler validation and using an editor like VS Code, you'll get intellisense. Each component is exported as a named module that can be easily imported in your code, allowing your external bundler to create small bundles that include just what you need.

**Contribution process**
We invite members of the community to actively participate in any way - code, documentation, design, publicity, moderation, analytics, explorations, dicussions and more.

Before proceeding into details, we would like to set some contractual guidelines with our contributor community.

**Commitments from the maintaining team** [(charting-team)](https://github.com/orgs/microsoft/teams/charting-team)
- Responding to queries within a day.
- Responding to PRs within 2 business days.
- Publishing day to day design discussions, decisions taken, roadmaps, backlogs and current sprint board. 

**Expectations from contributors**
**For Issues:**
Follow the [issue template](https://github.com/microsoft/fluentui/issues/new/choose) to report bugs and feature requests.
For internal product requests that can contain confidential information, report issues to our internal ADO [here](https://uifabric.visualstudio.com/iss/_workitems/create/User%20Story?templateId=c0a6b2f0-ecaf-4f0e-83a6-a3ea43f30847&ownerId=0c0ad9a8-059c-4697-a4b6-ff1179ca8699).
Make sure to specify the current and expected behavior along with repro steps so that our team can take appropriate action to the request.

**For Pull Requests:**
_During planning of the implementation:_
- Go through the documentation and design decisions for the respective component.
- Any design and/or behavior changes should be reviewed by the charting core team to validate its consistency, generalization, and visual design alignment with the rest of the charts.
- If the change is major, the dev design should be reviewed by the charting core team to ensure the changes are aligned to the overall design of the library and does not cause any unexpected behavior.

_After implementation_
- Follow [Testing Strategy](Testing Strategy.md) to ensure all the changes are tested and relevant scenarios are automated.
- Test for relevant accessibility scenarios. Refer [Accessibility Guide](Accessibility.md) for more details.
- The contributor needs to provide a 30 day support to fix any bug arising due to their change. 

**Checklist for a partner feature contribution.**
- [ ]	Clearly mention the usecase and a video of the functionality that you have implemented.
- [ ]	Test Plan Item created and corresponding test passed.
- [ ] Add examples on our demo site for new scenarios. 
- [ ]	Test for keyboard accessibility
- [ ]	Test for screen reader accessibility
- [ ]	Works with light theme, dark theme and high contrast theme.
- [ ]	Release notes updated with appropriate details.
- [ ]	30 day support for user reported or accessibility bugs in your feature area.
- [ ] Works with RTL languages

**Measuring the impact of your contribution**
The charting team is working to define datapoints to measure the usage of different charts and their functionalities. We will soon publish metrics with quantitative impact of your contribution across the organization.

