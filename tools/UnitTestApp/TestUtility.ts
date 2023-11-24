function testWithRewire(pathToModule, baseClass, testFunction) {
    const rewire = require('rewire');
    const module = rewire(pathToModule);
    const chartBase = module.__get__(baseClass);
    testFunction(chartBase);
}

module.exports = testWithRewire;
