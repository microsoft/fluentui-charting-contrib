# Creating Date Objects For Chart Data

> There are many ways to format a date as a string. The JavaScript specification only specifies one format to be universally supported: the [date time string format](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date-time-string-format), a simplification of the ISO 8601 calendar date extended format. The format is as follows:
> ```
> YYYY-MM-DDTHH:mm:ss.sssZ
> ```

Various components can be omitted from the above format, and other formats can also be used to create a date object, resulting in the following types of interpretations:

### UTC time

The ISO format is interpreted as UTC time in the following forms. Notice how the components in the input string match those in the output ISO string.

1. Date-only form: `YYYY`, `YYYY-MM`, `YYYY-MM-DD`

   ```js
   console.log(new Date('2010').toISOString())
   // Output: "2010-01-01T00:00:00.000Z"

   console.log(new Date('2010-10').toISOString())
   // Output: "2010-10-01T00:00:00.000Z"

   console.log(new Date('2010-10-10').toISOString())
   // Output: "2010-10-10T00:00:00.000Z"
   ```

2. Date-time form (with **Z**ero time zone offset): One of the above date-only forms, followed by `T`, followed by `HH:mm`, `HH:mm:ss`, or `HH:mm:ss.sss`. Each combination followed by the literal character `Z`.

   ```js
   console.log(new Date('2010-10-10T02:10Z').toISOString())
   // Output: "2010-10-10T02:10:00.000Z"

   console.log(new Date('2010-10-10T02:10:10Z').toISOString())
   // Output: "2010-10-10T02:10:10.000Z"

   console.log(new Date('2010-10-10T02:10:10.100Z').toISOString())
   // Output: "2010-10-10T02:10:10.100Z"
   ```

There are alternative methods to create a date object that will be interpreted as UTC time, such as using the [Date.UTC()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/UTC) static method or directly passing the time in milliseconds that has elapsed since the [epoch](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-time-values-and-time-range) as an argument to the [Date() constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date).

```js
console.log(new Date(Date.UTC(2010, 9, 10, 2, 10)).toISOString())
// Output: "2010-10-10T02:10:00.000Z"

console.log(new Date(1286676600000).toISOString())
// Output: "2010-10-10T02:10:00.000Z"
```

### Local time

All other formats (including the above date-time form of the ISO format when the time zone offset is absent) are interpreted as local time. Notice how the components in the input string don't completely match those in the output ISO string.

```js
console.log(new Date('2010-10-10T02:10').toISOString())
// Output (IST): "2010-10-09T20:40:00.000Z"
// Output (PDT): "2010-10-10T09:10:00.000Z"

console.log(new Date('2010-01-10T02:10:10').toISOString())
// Output (IST): "2010-01-09T20:40:10.000Z"
// Output (PST): "2010-01-10T10:10:10.000Z"

console.log(new Date('2010-10-10T02:10:10.100').toISOString())
// Output (IST): "2010-10-09T20:40:10.100Z"
// Output (PDT): "2010-10-10T09:10:10.100Z"

console.log(new Date('1/10/2010').toISOString())
// Output (IST): "2010-01-09T18:30:00.000Z"
// Output (PST): "2010-01-10T08:00:00.000Z"

console.log(new Date('10/10/2010 02:10').toISOString())
// Output (IST): "2010-10-09T20:40:00.000Z"
// Output (PDT): "2010-10-10T09:10:00.000Z"

console.log(new Date(2010, 0, 10, 2, 10).toISOString())
// Output (IST): "2010-01-09T20:40:00.000Z"
// Output (PST): "2010-01-10T10:10:00.000Z"
```

> When the time zone offset is absent, **date-only forms are interpreted as a UTC time and date-time forms are interpreted as local time**. This is due to a historical spec error that was not consistent with ISO 8601 but could not be changed due to web compatibility. See [Broken Parser – A Web Reality Issue](https://maggiepint.com/2017/04/11/fixing-javascript-date-web-compatibility-and-reality/).

Our charts display time in the local (host system) time zone. Therefore, it is crucial to create date objects correctly, as users from various time zones may misinterpret the information. **We recommend using UTC time consistently, especially when users are distributed across different time zones. Local time should be used only when users are in the same timezone**.

We only ensure that the data points align with the axis ticks. For example, if an event occurred on 2010-10-10 00:00 UTC and a local date object is created from that, it will be shown on the chart as 2010-10-10 00:00 IST. But the correct value should be 2010-10-10 05:30 IST.

## References

- [Date - JavaScript | MDN (mozilla.org)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)