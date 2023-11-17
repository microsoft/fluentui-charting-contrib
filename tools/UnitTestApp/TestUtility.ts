function testWithRewire(pathToModule, baseClass, testFunction) {
    const rewire = require('rewire');
    const module = rewire(pathToModule);
    const AreaChartBase = module.__get__(baseClass);
    testFunction(AreaChartBase);
}

module.exports = testWithRewire;