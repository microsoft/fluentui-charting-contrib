# RFC: Fix 2:1 spacing

## Summary

This document suggests a way to address issues that came up after the implementation of 2:1 spacing in vertical bar charts with string x-axis. The proposed solution introduces new props that will give users more control over both bar width and spacing within the chart.

## Background

The 2:1 spacing feature was added via [Pull Request #25838](https://github.com/microsoft/fluentui/pull/25838). After its release in version 5.16.0, we received queries from partner teams asking about the possibility of disabling or overriding this feature as they found the previous uniform spacing better suited to their requirements.

## Problem

![](../assets/images/Screenshot%202024-01-09%20231955.png)

- The bars don’t occupy the entire space due to the default bar width of 16px and a fixed 2:1 spacing, often leaving considerable amount of blank space before the first bar and after the last bar. This becomes particularly noticeable when the chart width is large.
- Additionally, this setup causes unnecessary overlapping of x-axis labels.

## Proposal

1. Add optional xAxisInnerPadding, xAxisOuterPadding props to vertical bar charts
   - These props accept values between 0 and 1, following the convention in [d3 documentation](https://d3js.org/d3-scale/band#band_paddingInner). This value specifies the amount of blank space in terms of multiples of [step](https://d3js.org/d3-scale/band#band_step). Step is the distance between the starts of adjacent bands (bars). This is how padding is related to bar width:\
Padding = paddingInPixels / (paddingInPixels + barWidth)
   - The default inner padding is 2/3 so that the space between bars is twice the bar width. The default outer padding is 1/3 so that the space before the first bar and after the last bar is equal to bar width and the spacing looks more uniform. This doc [fluentui/packages/react-charting/docs/implementing-2-to-1-spacing.md at master · microsoft/fluentui (github.com)](https://github.com/microsoft/fluentui/blob/master/packages/react-charting/docs/implementing-2-to-1-spacing.md) explain how these values are derived. When these props are provided, the default inner and outer padding of string x-axis will be overridden.
   - Since there is default non-zero outer padding and users can override it with 0 value if they want no space before the first bar and after the last bar, min domain margin of 8px mentioned in design doc is ignored here.
2. Use existing barWidth prop and add optional maxBarWidth prop to vertical bar charts
   - The barWidth prop will have higher priority than the above props. If not provided, bar width will be adjusted to prevent overlapping and maintain spacing between the bars. If provided, barWidth will be respected and padding may get compromised.
   - The bar width can become too large when the chart width is large. The maxBarWidth prop can be used to restrict the bars to certain width in these cases. 

## Pros and Cons

## Discarded Solutions

## Open Issues
