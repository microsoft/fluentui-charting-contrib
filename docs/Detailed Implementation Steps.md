If you are planning to contribute a major chart, follow the below steps to align the component with fluent charting design, principles, style and standards.

**Step 1:**
**_Background research._**
Is there any existing work that has already happened (either on the dev side or on the design side) or in the backlog. Any planned feature can be found in our roadmap [here](https://github.com/orgs/microsoft/projects/792/views/1) along with high level timelines and current status. Also look for any discussions about the feature in our discord channel.
If the ask is net new, setup sometime with the charting team. This will help determine the next steps to proceed with designing the control as per fluent charting framework. 

**Step 2:**
**_Visual design._**
The design figma should cover specification about the following aspects before the control can be implemented.
1. **Anatomy:** Describe the components of the chart and how each of them will look.
2. **Possible sizes:** The control can be supported in different sizes like S, M, L XL. 
3. **Variations:** The control can have multiple variations for different use cases.
4. **Handling large dataset or data labels.**
5. **Theming:** How will the chart look in light mode and dark mode. What about high contrast mode.
6. **Colors:** What is the supported color palette by this chart. It should either use the default color palette of react charting (<Provide reference>) or a subset of it.
7. **Interactive behavior:** Define how the user can interact with points and other visuals in the chart. For eg: hover card when a user hovers over a chart area, selecting particular legend.
8. **Accessibility:** The charting library is currently MAS C compliant. The chart should meet accessibility standards to ensure this grade. <Link to accessibility page>
9. **RTL support:** The library supports [RTL](https://en.wikipedia.org/wiki/Right-to-left_script) scripts. Do we need any special design to support them.

Refer to [this](https://www.figma.com/file/oNWKEgIOCSLElvMZPOVMCq/Fluent-Data-Viz-(WIP)?node-id=1776-205538&t=77LXR8DHndlgs3ap-0) figma to see an example.

**Step 3:**
**_Dev Design._**
Once the visual design is finalized, prepare a dev design document. You can look at design docs of other charts for reference. [[Example](https://github.com/microsoft/fluentui/blob/master/packages/react-charting/src/components/TreeChart/TreeChart.md)]
Try to include the following sections in the design document.
1. External interfaces
2. Props
3. React lifecycle state management.
4. Data structure to store and process the data.
5. Handling large data sets.
6. Rerendering and recomputations on user interactions.
7. Reusable components.
8. Unit testable and component testable pieces.
9. Mapping geometrical logic to visual graph.
10. Limitations.
11. Alternative design considerations.
12. Accessibility considerations

These design collaterals will be added to this contributor guide for future references.

**Step 4.**
**_POC._** - This step will overlap with step 2. This will help understand and align with overall design of fluent charting library.
The charting team will be more than happy to participate in design discussions to iterate over step 2 and 3.
Once done get a formal review from the charting team and address any feedbacks.

**Step 5:**
**_Implementation._**


**Step 6:**
_**Pilot with a customer as an unstable component.**_
The rollout starts by piloting with a partner assuming the component to have some bugs. 
This phase includes fixing these bugs and correcting any external interfaces.

**Step 7:**
**_Stable release._**
Once the component has been released as stable, it can no longer have any breaking changes before the next major release of the library.

If the proposed changes are bugfixes, minor enhancements or extension then steps 1-4, 5 and 6 can be brief or skipped. But make sure to capture any relevant information in PR description or supporting documents.