# RFC: Supporting Negative Values in fluentui-react-charting

---

[AtishayMsft](https://github.com/AtishayMsft)

[Shubhabrata08](https://github.com/Shubhabrata08)

06.01.2024

<!-- If substantial updates are made add an "Updated on: $date" below, don't replace the original date -->

## Summary

Support for negative values in fluentui-react-charting.

1. Modification of scales and ticks
2. Additional logic for drawing -ve values in certain charts
3. Addtion of optional prop to enable these changes to charting components

## Problem statement

<!--
Why are we making this change? What problem are we solving? What do we expect to gain from this?


This section is important as the motivation or problem statement is indepenent from the proposed change. Even if this RFC is not accepted this Motivation can be used for alternative solutions.

In the end, please make sure to present a neutral Problem statement, rather than one that motivates a particular solution
-->

FluentUI's charting library doesn't support use of negative y values as of yet. Everything is scaled assuming 0 to be the least value possible.
This results in undesirable behaviour on using negative data as demonstrated in the issue and the linked PR:

[[Bug]: Giving Negative values (Y-axis) in fluent-ui react charting (vertical bar chart) makes the bar disappears #28707](https://github.com/microsoft/fluentui/issues/28707)
[Support for negative values for VerticalBarChart #30164](https://github.com/microsoft/fluentui/pull/30164)

## Detailed Design or Proposal

<!-- This is the bulk of the RFC. Explain the proposal or design in enough detail for the inteded audience to understand. -->

### Proposal:

Supporting negative values first requires the acknowledgement of having negative values as a mandatory case, thus removing filters in the codebase where negative data is outrightly eliminated from the dataset and then devising a methodology to draw up scales based on presence of such values.

### Scale changes (utilities.ts):

Now we can generalise that our scale will belong to [min,max] instead of [0,max]. Considering that the charting library allows users to modify the number of ticks on the y-axis via props. Initially the difference between two consecutive ticks was calculated and the ticks were created iteratively by adding the difference to the previous tick. The starting tick is set to 0.
This logic can be referred here: [prepareDatapoints()](https://github.com/microsoft/fluentui/blob/a493617d5c710d78246d315e67fa7eb2d7b6b9f9/packages/react-charting/src/utilities/utilities.ts#L312)

Extending this logic to [min,max] intervals can cause us to skip 0 as a tick. Thus, in charts like VerticalBarChart (which visually need an anchor point) will seem to float on the cartesian space. So, we can't simply fill in using min as a starting value. Thus,

1. We start from 0
2. Append -ve of the difference upto min
3. Reverse the array to get 0 as last element
4. Append +ve of the difference upto max

This ensures presence of y=0 tick as the anchor line for our charts while maintaining user requirements.

Post this, the implementation logic diverges.

### Logic 1: Have equidistant scaling on both sides of y=0

Regardless of the fact that |yMin| and |yMax| may not be equal, we will choose the maximum absolute value among the two, and set our scales as [-maxAbsVal,+maxAbsVal]
[PR for Logic 1:](https://github.com/microsoft/fluentui/pull/30164)

#### Pros:

1. y=0 anchor line remains symmetrically centered in all cases

#### Cons:

2. There can be unnecessary wastage of graphing space in case where the absolute value of the minimum and maximum vary hugely

### Logic 2: Scale upto needed min and max

The concept of using max absolute value among min and max is simply eliminated from Logic 1:
[PR for Logic 2:](https://github.com/microsoft/fluentui/pull/30182)

#### Pros:

1. y=0 anchor line may not be symmetrically centered in all cases

#### Cons:

2. There is no unnecessary wastage of graphing space in any case.

### Prop Changes

Since this proposal brings in multiple experimental changes in multiple files, especially in CartesianChart and utilities, which are used by almost everything in the charting library , these changes can be enabled by passing true to a supportNegativeValues optional prop to the corresponding chart which has support for this.
Thus, this change comes in with minor API changes as well to charting components.

### Additional changes in certain charts

The above changes ensure that **CartesianChart** acknowledges the presence of -ve values and makes graphing space, ticks and scales according to it.
Now the charts using CartesianChart must modify their logic to acknowledge this as well.
This starts with always keeping the y=0 tick line as a reference while drawing. Thus, everything in the code must make distance calculations with respect to y=0 line for heights. Prior this change, it wasn't needed as the bottommost point denoted the y=0 line. Now an additional factor of yBarScale(0) is to be kept in mind while making changes.
Certain charts have additional code for making plots, such as VerticalBarChart where SVG rectangles are used for drawing the bars. SVG rectangles do not support negative values for height or width. Thus, for drawing -ve height rectangles the logic is set to draw from y=0 reference line using the absolute value of the height.
Refer the changes in this PR for more detailed info:
[Support for negative values for VerticalBarChart #30164](https://github.com/microsoft/fluentui/pull/30164)

In VerticalStackedBarChart, there is a provision of having rounded cornered bars which uses SVG paths. Additional code was added for the inverted counterparts to achieve the -ve valued bars as well.
Refer this commit for the changes:
[Add new path for -ve bars with rounded corners](https://github.com/microsoft/fluentui/pull/30224/commits/9fe2e1adc309adf9648f82a72c878f6f72392299)

## Discarded Solutions

As of now, the logics are being inspected and which logic is to be discarded is TBD.

## Open Issues

[[Bug]: Giving Negative values (Y-axis) in fluent-ui react charting (vertical bar chart) makes the bar disappears #28707](https://github.com/microsoft/fluentui/issues/28707)
