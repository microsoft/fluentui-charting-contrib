The chart components can be debugged using few techniques.

1. Using browser developer tools.
    1. Open developer tools (Pressing `F12`).
    2. Go to sources tab and open search bar (Pressing `Ctrl + Shift + F`).
    3. Search for the component name and open the sources file from the search results.
    4. Apply breakpoints and run the scenario to see the breakpoints getting hit.

2. Add console logs with the variables that you want to test. (Make sure to remove these logs while commiting your changes.)
3. Add a `debugger` statement wherever you want to debug. Open dev tools and run the scenario. The execution will pause once the debugger statement is hit. (Make sure to remove these logs while commiting your changes.)
4. Debugging using test cases
    1. Open visual studio code from fluent ui root folder. (Not from `packages\react-charting`)
    2. Check whether the `Debug current open test` debug option is visible under the run and debug tab.
    3. Add breakpoints to the relevant test case and start debugging using `Debug current open test` option.
    Note that this option renders the components under a headless browser. So some actual rendering dependent functions like `getBoundingClientRect` will not work and will need to be mocked.