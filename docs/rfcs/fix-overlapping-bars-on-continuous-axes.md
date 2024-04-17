# RFC: Fix overlapping bars on continuous axes

## How x-axis ticks are rendered?

Let TR be the total width available to render the bars. The first bar should start from the beginning of TR and the last bar should end at the end of TR. The corresponding x-axis ticks should be rendered at the center of the bars. The first tick should align with the center of first and the last tick should align with the center of the last bar. So the x-axis scale range becomes [BW/2, TR-BW/2] where BW is the bar width. d3 linear scale dont account for the bar width. So if we know the bar width we can just shift the x-axis scale range by BW/2 [0, TR-BW] so that the scale return start point of each bar. So we first need to know the bar width in order to render the bars and the x-axis ticks correctly. 

we dont need to create 2 sepearate scales for x-axis and bars. we can just use the same scale and shift it to get the desired result.

## How to calculate bar width?

Now if we want to prevent overlap of bars, the bar width won't be a fixed number and will depend on various factors. Now let's think about it this way: If we are able to guess the bar width such that the closest pair of bars don't overlap, then if we render the bars with that width, there will be overlapping at all. To calculate the bar width, we will need pixel distance between the closest pair of bars. Let's assume the padding between bars to be atleast equal to bar width. So, BW = (PX2-PX1)/2 where PX1 and PX2 are the positions of the closest pair of bars in pixels on the x-axis. Linear scales work like this: y=mx+c. We have determined the x-axis scale range above in pixels but we need to know the scale domain to get the position of each bar in pixels. The scale domain will be the range of the data [minX, maxX]. To calculate PX1 and PX2, we will have to find closest pair of x values (X1, X2) from the data. Here, m=(TR-BW)/(maxX-minX) and c=BW/2. So, PX1 = m*X1 + c and PX2 = m*X2 + c. So, BW = (TR-BW)*(X2-X1)/((maxX-minX)*2). On solving this, we get BW = (TR*(X2-X1))/(2*(maxX-minX)+X2-X1).

The following calculation may not give accurate results for numeric scale because of the nice() function used with it. nice() extends the domain so that it starts and ends on nice round values. This result may prevent overlapping but the closest bars may not exactly have 1:1 spacing.

We can ignore (x2-x1) in the denominator if it is very small compared to (maxX-minX). 

## Implementation

### Attempt
we need to calculate the bar width before rendering the x-axis and bars. Since logic for rendering bars is written in VerticalBarChart, I have added the above bar width calculation there only. But for total width TR we need containerWidth which is a state in CartesianChart. states from child component (CartesianChart) can only be passed to parent component (VerticalBarChart) through a function prop passed from the parent component. I found the following functions that are already passing containerWidth to VerticalBarChart:
1.	getDomainMargins
2.	getGraphData
getDomainMargins is the only function that is called before rendering the x-axis and bars. So i added the barWidth calculation inside this function. The bar width in VerticalBarChart is a class variable and not a state but passed as a prop to CartesianChart where it is used for rendering x-axis.

### Issues

•	Bars are rendered with the updated barWidth
•	Axis ticks don’t align with the bars.

### Solution

•	Update barWidth after containerWidth state updates and before CartesianChart renders. Will have to use a react lifecycle method that is called before render with the updated state.
•	Create a state for barWidth so that CartesianChart updates when its value changes.
•	Remove CartesianChart’s dependency on the barWidth prop.
•	Store and update barWidth in CartesianChart and pass it to VerticalBarChart through the getGraphData function.

3rd one is the most straightforward solution so went with that.