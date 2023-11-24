const DarkTheme = require('@fluentui/theme-samples').DarkTheme;
const fs = require('fs');
const testWithRewireWrapper = require('../TestUtility');
const chart1Points = [
  {
    x: 20,
    y: 9,
  },
  {
    x: 25,
    y: 14,
  },
  {
    x: 30,
    y: 14,
  },
  {
    x: 35,
    y: 23,
  },
  {
    x: 40,
    y: 20,
  },
  {
    x: 45,
    y: 31,
  },
  {
    x: 50,
    y: 29,
  },
  {
    x: 55,
    y: 27,
  },
  {
    x: 60,
    y: 37,
  },
  {
    x: 65,
    y: 51,
  },
];

const chart2Points = [
  {
    x: 20,
    y: 21,
  },
  {
    x: 25,
    y: 25,
  },
  {
    x: 30,
    y: 10,
  },
  {
    x: 35,
    y: 10,
  },
  {
    x: 40,
    y: 14,
  },
  {
    x: 45,
    y: 18,
  },
  {
    x: 50,
    y: 9,
  },
  {
    x: 55,
    y: 23,
  },
  {
    x: 60,
    y: 7,
  },
  {
    x: 65,
    y: 55,
  },
];

const chart3Points = [
  {
    x: 20,
    y: 30,
  },
  {
    x: 25,
    y: 35,
  },
  {
    x: 30,
    y: 33,
  },
  {
    x: 35,
    y: 40,
  },
  {
    x: 40,
    y: 10,
  },
  {
    x: 45,
    y: 40,
  },
  {
    x: 50,
    y: 34,
  },
  {
    x: 55,
    y: 40,
  },
  {
    x: 60,
    y: 60,
  },
  {
    x: 65,
    y: 40,
  },
];

const chartPointsMultiStacked = [
  {
    legend: 'legend1',
    data: chart1Points,
    color: 'green',
  },
  {
    legend: 'legend2',
    data: chart2Points,
    color: 'yellow',
  },
  {
    legend: 'legend3',
    data: chart3Points,
    color: 'blue',
  },
];

const chartPoints = [
  {
    legend: 'legend1',
    data: chart1Points,
    color: 'green',
  },
];

const chartPointsDarkTheme = [
  {
    legend: 'legend1',
    data: chart1Points,
    color: DarkTheme.palette.themePrimary,
  },
];

const chartPointsWithoutDefaultColor = [
  {
    legend: 'legend1',
    data: chart1Points,
  },
];

const chartDataMultiStacked = {
  chartTitle: 'Area chart multiple example',
  lineChartData: chartPointsMultiStacked,
};

const chartData = {
  chartTitle: 'Area chart example',
  lineChartData: chartPoints,
};

const chartDataWithoutDefaultColor = {
  chartTitle: 'Area chart without default color example',
  lineChartData: chartPointsWithoutDefaultColor,
};

const chartDataDarkTheme = {
  chartTitle: 'Area chart dark theme example',
  lineChartData: chartPointsDarkTheme,
};

const pathToBaseModule = './node_modules/@fluentui/react-charting/lib-commonjs/components/AreaChart/AreaChart.base.js';

testWithRewireWrapper(pathToBaseModule, 'AreaChartBase', (AreaChartBase) => {
  describe('Unit test Area Chart _getOpacity function', () => {
    test('Should return fill-opacity of 0.7 if chart is not multi-stacked', () => {        
      const instance = new AreaChartBase({data: chartData});
      const legends = instance._getLegendData(chartData.lineChartData);
      const result = instance._getOpacity(legends[0]);
      expect(result).toBe(0.7);
    });
    test('Should return fill-opacity of 0.7 if chart is not multi-stacked', () => {        
        const instance = new AreaChartBase({data: chartData});
        const legends = instance._getLegendData(chartData.lineChartData);
        instance._isMultiStackChart = false;
        const result = instance._getOpacity(legends[0]);
        expect(result).toBe(0.7);
    });
    test('Should return fill-opacity of 0.7 if legend is highlighted and data is multi-stacked', () => {
        const instance = new AreaChartBase({data: chartDataMultiStacked});
        const legends = instance._getLegendData(chartDataMultiStacked.lineChartData);
        instance._isMultiStackChart = true;
        instance._legendHighlighted = () => true;
        const result = instance._getOpacity(legends[0]);
        expect(result).toBe(0.7);
    });
    test('Should return fill-opacity of 0.7 if any one of the legend other than legend 1 is highlighted and data is multi-stacked', () => {
        const instance = new AreaChartBase({data: chartDataMultiStacked});
        const legends = instance._getLegendData(chartDataMultiStacked.lineChartData);
        instance._isMultiStackChart = true;
        instance._legendHighlighted = () => false;
        instance._noLegendHighlighted = () => true;
        const result = instance._getOpacity(legends[0]);
        expect(result).toBe(0.7);
    });
    test('Should return fill-opacity of 0.1 if any one of the legend other than legend 1 is highlighted and data is multi-stacked', () => {
        const instance = new AreaChartBase({data: chartDataMultiStacked});
        const legends = instance._getLegendData(chartDataMultiStacked.lineChartData);
        instance._isMultiStackChart = true;
        instance._noLegendHighlighted = () => false;
        instance._legendHighlighted = () => false;
        const result = instance._getOpacity(legends[0]);
        expect(result).toBe(0.1);
    });
  });

  describe('_getLineOpacity', () => {
    test('Should return 1 if chart is not multi-stacked', () => {
        const instance = new AreaChartBase({data: chartData});
        const legends = instance._getLegendData(chartData.lineChartData);
        instance._isMultiStackChart = false;
        const result = instance._getLineOpacity(legends[0]);
        expect(result).toBe(1);
    });
    test('Should return 0.3 if chart is multi-stacked and no legend is highlighted', () => {
        const instance = new AreaChartBase({data: chartDataMultiStacked});
        const legends = instance._getLegendData(chartDataMultiStacked.lineChartData);
        instance._isMultiStackChart = true;
        instance._noLegendHighlighted = () => true;
        const result = instance._getLineOpacity(legends[0]);
        expect(result).toBe(0.3);
    });
    test('Should return 1 if callout is visible and data is not multi-stacked', () => {
        const instance = new AreaChartBase({data: chartData});
        const legends = instance._getLegendData(chartData.lineChartData);
        instance._isMultiStackChart = false;
        instance.state.isCalloutVisible = () => true;
        const result = instance._getLineOpacity(legends[0]);
        expect(result).toBe(1);
    });
    test('Should return opacity of 0.1 if any legend other than legend 1 is highlighted and data is multi-stacked', () => {
        const instance = new AreaChartBase({data: chartDataMultiStacked});
        const legends = instance._getLegendData(chartDataMultiStacked.lineChartData);
        instance._isMultiStackChart = true;
        instance._legendHighlighted = (legends[0]) = () => false;
        instance._noLegendHighlighted = () => false;
        const result = instance._getLineOpacity(legends[0]);
        expect(result).toBe(0.1);
    });
    test('Should return opacity of 0 if legend 1 is highlighted and data is multi-stacked', () => {
        const instance = new AreaChartBase({data: chartDataMultiStacked});
        const legends = instance._getLegendData(chartDataMultiStacked.lineChartData);
        instance._isMultiStackChart = true;
        instance._legendHighlighted = (legends[0]) = () => true;
        instance._noLegendHighlighted = () => false;
        const result = instance._getLineOpacity(legends[0]);
        expect(result).toBe(0);
    });
  });

  describe('_updateCircleFillColor', () => {
    test('Should return the line color if neither the nearest circle nor the active point is highlighted', () => {
        const instance = new AreaChartBase({data: chartData});
        instance.state = {
            nearestCircleToHighlight: null,
            activePoint: null,
            isCircleClicked: false,
        }        
        const result = instance._updateCircleFillColor(chartData.lineChartData[0].data[0].x, chartData.lineChartData[0].color, 0);
        expect(result).toBe('green');
    });
    test('Should return white if the nearest circle is highlighted and the circle is not clicked', () => {
        const instance = new AreaChartBase({data: chartData, theme: DarkTheme});
        instance.state = {
            nearestCircleToHighlight: chartData.lineChartData[0].data[0].x,
            activePoint: null,
            isCircleClicked: false,
        }        
        const result = instance._updateCircleFillColor(chartData.lineChartData[0].data[0].x, chartData.lineChartData[0].color, 0);
        expect(result).toBe('#1b1a19');
    });
    test('Should return the line color if the nearest circle is highlighted and the circle is clicked', () => {
        const instance = new AreaChartBase({data: chartData});
        instance.state = {
            nearestCircleToHighlight: chartData.lineChartData[0].data[0].x,
            activePoint: null,
            isCircleClicked: true,
        }        
        const result = instance._updateCircleFillColor(chartData.lineChartData[0].data[0].x, chartData.lineChartData[0].color, 0);
        expect(result).toBe('green');
    });
    test('Should return white if the active point is highlighted and the circle is not clicked', () => {
        const instance = new AreaChartBase({data: chartData, theme: DarkTheme});
        instance.state = {
            nearestCircleToHighlight: null,
            activePoint: chartData.lineChartData[0].data[0],
            isCircleClicked: false,
        }        
        const result = instance._updateCircleFillColor(chartData.lineChartData[0].data[0].x, chartData.lineChartData[0].color, chartData.lineChartData[0].data[0]);
        expect(result).toBe('#1b1a19');
    });
    test('Should return the line color if the active point is highlighted but the circle is clicked', () => {
        const instance = new AreaChartBase({data: chartData});
        instance.state = {
            nearestCircleToHighlight: null,
            activePoint: chartData.lineChartData[0].data[0],
            isCircleClicked: true,
        }        
        const result = instance._updateCircleFillColor(chartData.lineChartData[0].data[0].x, chartData.lineChartData[0].color, 0);
        expect(result).toBe('green');
    });
  });

  describe('_getCircleRadius', () => {
    test('Should return 1 if isCircleClicked is true and nearestCircleToHighlight matches xDataPoint', () => {
        const instance = new AreaChartBase({data: chartData});
        instance.state = {
            isCircleClicked: true,
            nearestCircleToHighlight: chartData.lineChartData[0].data[0].x,
            activePoint: null,
        }        
        const result = instance._getCircleRadius(chartData.lineChartData[0].data[0].x, 10, 0);
        expect(result).toBe(1);
    });
    test('Should return circleRadius if activePoint matches the circle', () => {
        const instance = new AreaChartBase({data: chartData});
        instance.state = {
            isCircleClicked: false,
            nearestCircleToHighlight: null,
            activePoint: chartData.lineChartData[0].data[0],
        }        
        const result = instance._getCircleRadius(chartData.lineChartData[0].data[0].x, 10, chartData.lineChartData[0].data[0]);
        expect(result).toBe(10);
    });
    test('Should return 0 if circle is not clicked', () => {
        const instance = new AreaChartBase({data: chartData});
        instance.state = {
            isCircleClicked: false,
            nearestCircleToHighlight: null,
            activePoint: null,
        }        
        const result = instance._getCircleRadius(chartData.lineChartData[0].data[0].x, 10, 0);
        expect(result).toBe(0);
    });
    test('Should return 0 if isCircleClicked is true but nearestCircleToHighlight does not match xDataPoint', () => {
        const instance = new AreaChartBase({data: chartData});
        instance.state = {
            isCircleClicked: true,
            nearestCircleToHighlight: chartData.lineChartData[0].data[1].x,
            activePoint: null,
        }        
        const result = instance._getCircleRadius(chartData.lineChartData[0].data[0].x, 10, 0);
        expect(result).toBe(0);
    });
    test('Should return 0 if nearestCircleToHighlight does not match xDataPoint and activePoint is not set', () => {
        const instance = new AreaChartBase({data: chartData});
        instance.state = {
            isCircleClicked: true,
            nearestCircleToHighlight: chartData.lineChartData[0].data[1].x,
            activePoint: null,
        }        
        const result = instance._getCircleRadius(chartData.lineChartData[0].data[0].x, 10, 0);
        expect(result).toBe(0);
    });
    test('Should return circleRadius if nearestCircleToHighlight matches xDataPoint and activePoint is not set', () => {
        const instance = new AreaChartBase({data: chartData});
        instance.state = {
            isCircleClicked: false,
            nearestCircleToHighlight: chartData.lineChartData[0].data[0].x,
            activePoint: null,
        }        
        const result = instance._getCircleRadius(chartData.lineChartData[0].data[0].x, 10, 0);
        expect(result).toBe(10);
    });
  });

  describe('_addDefaultColors', () => {
    test('Should return an array with the same length as the input array', () => {
        const instance = new AreaChartBase({data: chartData, theme: DarkTheme});
        const result = instance._addDefaultColors(chartData.lineChartData);
        expect(result.length).toBe(chartData.lineChartData.length);
    });
    test('Should add default colors to each item in the input array', () => {
        const instance = new AreaChartBase({data: chartDataWithoutDefaultColor, theme: DarkTheme});
        const result = instance._addDefaultColors(chartDataWithoutDefaultColor.lineChartData);
        expect(result[0].color).toBe('#637cef');
    });
    test('Should use the provided color if it exists', () => {
        const instance = new AreaChartBase({data: chartData, theme: DarkTheme});
        const result = instance._addDefaultColors(chartData.lineChartData);
        expect(result[0].color).toBe('green');   
    });
    test('Should use the inverted theme if the isInverted property is true and colors are not provided', () => {
        const instance = new AreaChartBase({data: chartDataWithoutDefaultColor, theme: {...DarkTheme, isInverted: true}});
        const result = instance._addDefaultColors(chartDataWithoutDefaultColor.lineChartData);
        expect(result[0].color).toBe('#637cef');   
    });
    test('Should use the inverted theme if the isInverted property is true and colors are provided', () => {
        const instance = new AreaChartBase({data: chartDataDarkTheme, theme: {...DarkTheme, isInverted: true}});
        const result = instance._addDefaultColors(chartDataDarkTheme.lineChartData);
        expect(result[0].color).toBe('#2899f5');   
    });
  });

  describe('_getAriaLabel', () => {
    test('Should return the correct aria label for a point with xAxisCalloutData and yAxisCalloutData', () => {
        const instance = new AreaChartBase({data: {
            chartTitle: 'Area chart arial label example',
            lineChartData: [
            {
                legend: 'Legend 1',
                data: [
                {
                    x: new Date(2022, 0, 1),
                    y: 10,
                    xAxisCalloutData: 'Jan 1, 2022',
                    yAxisCalloutData: '10 units',
                    callOutAccessibilityData: {
                    ariaLabel: 'Custom aria label',
                    },
                },
                ],
            },
            ],
        }, theme: DarkTheme});
        const result = instance._getAriaLabel(0, 0);
        expect(result).toBe('Custom aria label');
    });
    test('Should return the correct aria label for a point with xAxisCalloutData and yAxisCalloutData', () => {
        const instance = new AreaChartBase({data: {
            chartTitle: 'Area chart arial label example',
            lineChartData: [
              {
                legend: 'Legend 1',
                data: [
                  {
                    x: new Date(2022, 0, 1),
                    y: 10,
                  },
                ],
              },
            ],
          }, theme: DarkTheme});
        const result = instance._getAriaLabel(0, 0);
        expect(result).toBe('Sat Jan 01 2022 00:00:00 GMT+0530 (India Standard Time). Legend 1, 10.');
    });
    test('Should return the correct aria label for a point with formatted x value and yAxisCalloutData', () => {
        const instance = new AreaChartBase({data: {
            chartTitle: 'Area chart arial label example',
            lineChartData: [
              {
                legend: 'Legend 1',
                data: [
                  {
                    x: new Date(2022, 0, 1),
                    y: 10,
                    yAxisCalloutData: '10 units',
                  },
                ],
              },
            ],
          }, theme: DarkTheme});
        const result = instance._getAriaLabel(0, 0);
        expect(result).toBe('Sat Jan 01 2022 00:00:00 GMT+0530 (India Standard Time). Legend 1, 10 units.');
    });
    test('Should return the correct aria label for a point with formatted x value and xAxisCalloutData', () => {
        const instance = new AreaChartBase({data: {
            chartTitle: 'Area chart arial label example',
            lineChartData: [
              {
                legend: 'Legend 1',
                data: [
                  {
                    x: new Date(2022, 0, 1),
                    y: 10,
                    xAxisCalloutData: 'Jan 1, 2022',
                  },
                ],
              },
            ],
          },theme: DarkTheme});
        const result = instance._getAriaLabel(0, 0);
        expect(result).toBe('Jan 1, 2022. Legend 1, 10.');
    });
    test('Should return the correct aria label for a point with callOutAccessibilityData but no xAxis or yAxis CalloutData', () => {
        const instance = new AreaChartBase({data: {
            chartTitle: 'Area chart arial label example',
            lineChartData: [
              {
                legend: 'Legend 1',
                data: [
                  {
                    x: 1,
                    y: 10,
                    callOutAccessibilityData: {
                      ariaLabel: 'Custom aria label',
                    },
                  },
                ],
              },
            ],
          },theme: DarkTheme});
        const result = instance._getAriaLabel(0, 0);
        expect(result).toBe('Custom aria label');
    });
  });
});