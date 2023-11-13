const sparkline1Points = {
  chartTitle: '10.21',
  lineChartData: [
    {
      legend: '19.64',
      color: '#00AA00',
      data: [
        {
          x: 1,
          y: 58.13,
        },
        {
          x: 2,
          y: 140.98,
        },
        {
          x: 3,
          y: 20,
        },
        {
          x: 4,
          y: 89.7,
        },
        {
          x: 5,
          y: 99,
        },
        {
          x: 6,
          y: 13.28,
        },
        {
          x: 7,
          y: 31.32,
        },
        {
          x: 8,
          y: 10.21,
        },
      ],
    },
  ],
};

describe('Unit test _isChartEmpty function', () => {
  test('Should return false when the chart is not empty', () => {
    const rewire = require('rewire');
    const SparklineBaseModule = rewire('./SparklineBase.js');
    const SparklineBase = SparklineBaseModule.__get__('SparklineBase');
    const instance = new SparklineBase({data: sparkline1Points, width: 100, height: 100, _valueTextWidth: 100});
    const result = instance._isChartEmpty();
    expect(result).toBe(false);
  });
  test('Should return true when the chart is empty', () => {
    const rewire = require('rewire');
    const SparklineBaseModule = rewire('./SparklineBase.js');
    const SparklineBase = SparklineBaseModule.__get__('SparklineBase');
    const instance = new SparklineBase({data: [], width: 100, height: 100, _valueTextWidth: 100});
    const result = instance._isChartEmpty();
    expect(result).toBe(true);
  });
});
