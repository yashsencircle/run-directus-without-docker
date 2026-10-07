import { useApi, defineInterface } from '@directus/extensions-sdk';
import { ref, computed, defineComponent, watch, reactive, onMounted, onUnmounted, resolveComponent, openBlock, createElementBlock, createVNode, createElementVNode, createBlock, withCtx, createTextVNode, toDisplayString, createCommentVNode, Fragment, renderList, normalizeClass, TransitionGroup, normalizeStyle } from 'vue';

/**
 * @module constants
 * @summary Useful constants
 * @description
 * Collection of useful date constants.
 *
 * The constants could be imported from `date-fns/constants`:
 *
 * ```ts
 * import { maxTime, minTime } from "./constants/date-fns/constants";
 *
 * function isAllowedTime(time) {
 *   return time <= maxTime && time >= minTime;
 * }
 * ```
 */


/**
 * @constant
 * @name millisecondsInWeek
 * @summary Milliseconds in 1 week.
 */
const millisecondsInWeek = 604800000;

/**
 * @constant
 * @name millisecondsInDay
 * @summary Milliseconds in 1 day.
 */
const millisecondsInDay = 86400000;

/**
 * @constant
 * @name millisecondsInMinute
 * @summary Milliseconds in 1 minute
 */
const millisecondsInMinute = 60000;

/**
 * @constant
 * @name millisecondsInHour
 * @summary Milliseconds in 1 hour
 */
const millisecondsInHour = 3600000;

/**
 * @constant
 * @name millisecondsInSecond
 * @summary Milliseconds in 1 second
 */
const millisecondsInSecond = 1000;

/**
 * @constant
 * @name constructFromSymbol
 * @summary Symbol enabling Date extensions to inherit properties from the reference date.
 *
 * The symbol is used to enable the `constructFrom` function to construct a date
 * using a reference date and a value. It allows to transfer extra properties
 * from the reference date to the new date. It's useful for extensions like
 * [`TZDate`](https://github.com/date-fns/tz) that accept a time zone as
 * a constructor argument.
 */
const constructFromSymbol = Symbol.for("constructDateFrom");

/**
 * @name constructFrom
 * @category Generic Helpers
 * @summary Constructs a date using the reference date and the value
 *
 * @description
 * The function constructs a new date using the constructor from the reference
 * date and the given value. It helps to build generic functions that accept
 * date extensions.
 *
 * It defaults to `Date` if the passed reference date is a number or a string.
 *
 * Starting from v3.7.0, it allows to construct a date using `[Symbol.for("constructDateFrom")]`
 * enabling to transfer extra properties from the reference date to the new date.
 * It's useful for extensions like [`TZDate`](https://github.com/date-fns/tz)
 * that accept a time zone as a constructor argument.
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 *
 * @param date - The reference date to take constructor from
 * @param value - The value to create the date
 *
 * @returns Date initialized using the given date and value
 *
 * @example
 * import { constructFrom } from "./constructFrom/date-fns";
 *
 * // A function that clones a date preserving the original type
 * function cloneDate<DateType extends Date>(date: DateType): DateType {
 *   return constructFrom(
 *     date, // Use constructor from the given date
 *     date.getTime() // Use the date value to create a new date
 *   );
 * }
 */
function constructFrom(date, value) {
  if (typeof date === "function") return date(value);

  if (date && typeof date === "object" && constructFromSymbol in date)
    return date[constructFromSymbol](value);

  if (date instanceof Date) return new date.constructor(value);

  return new Date(value);
}

/**
 * @name toDate
 * @category Common Helpers
 * @summary Convert the given argument to an instance of Date.
 *
 * @description
 * Convert the given argument to an instance of Date.
 *
 * If the argument is an instance of Date, the function returns its clone.
 *
 * If the argument is a number, it is treated as a timestamp.
 *
 * If the argument is none of the above, the function returns Invalid Date.
 *
 * Starting from v3.7.0, it clones a date using `[Symbol.for("constructDateFrom")]`
 * enabling to transfer extra properties from the reference date to the new date.
 * It's useful for extensions like [`TZDate`](https://github.com/date-fns/tz)
 * that accept a time zone as a constructor argument.
 *
 * **Note**: *all* Date arguments passed to any *date-fns* function is processed by `toDate`.
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
 *
 * @param argument - The value to convert
 *
 * @returns The parsed date in the local time zone
 *
 * @example
 * // Clone the date:
 * const result = toDate(new Date(2014, 1, 11, 11, 30, 30))
 * //=> Tue Feb 11 2014 11:30:30
 *
 * @example
 * // Convert the timestamp to date:
 * const result = toDate(1392098430000)
 * //=> Tue Feb 11 2014 11:30:30
 */
function toDate(argument, context) {
  // [TODO] Get rid of `toDate` or `constructFrom`?
  return constructFrom(context || argument, argument);
}

/**
 * The {@link addDays} function options.
 */

/**
 * @name addDays
 * @category Day Helpers
 * @summary Add the specified number of days to the given date.
 *
 * @description
 * Add the specified number of days to the given date.
 *
 * **You don't need date-fns\***:
 *
 * Temporal has a built-in `add` method on all its classes:
 *
 * - [`Temporal.Instant.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Instant/add)
 * - [`Temporal.PlainDate.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDate/add)
 * - [`Temporal.PlainDateTime.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDateTime/add)
 * - [`Temporal.PlainTime.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainTime/add)
 * - [`Temporal.PlainYearMonth.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainYearMonth/add)
 * - [`Temporal.ZonedDateTime.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime/add)
 *
 * \* **Not really**, see: https://date-fns.org/you-dont-need-date-fns
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
 *
 * @param date - The date to be changed
 * @param amount - The amount of days to be added.
 * @param options - An object with options
 *
 * @returns The new date with the days added
 *
 * @example
 * // Add 10 days to 1 September 2014:
 * const result = addDays(new Date(2014, 8, 1), 10)
 * //=> Thu Sep 11 2014 00:00:00
 *
 * @example
 * // Using Temporal:
 * // Add 10 days to 1 September 2014:
 * Temporal.PlainDate.from("2014-09-01").add({ days: 10 }).toString();
 * //=> "2014-09-11"
 */
function addDays(date, amount, options) {
  const _date = toDate(date, options?.in);
  if (isNaN(amount)) return constructFrom(options?.in || date, NaN);

  // If 0 days, no-op to avoid changing times in the hour before end of DST
  if (!amount) return _date;

  _date.setDate(_date.getDate() + amount);
  return _date;
}

let defaultOptions = {};

function getDefaultOptions$1() {
  return defaultOptions;
}

/**
 * The {@link startOfWeek} function options.
 */

/**
 * @name startOfWeek
 * @category Week Helpers
 * @summary Return the start of a week for the given date.
 *
 * @description
 * Return the start of a week for the given date.
 * The result will be in the local timezone.
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
 *
 * @param date - The original date
 * @param options - An object with options
 *
 * @returns The start of a week
 *
 * @example
 * // The start of a week for 2 September 2014 11:55:00:
 * const result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Sun Aug 31 2014 00:00:00
 *
 * @example
 * // If the week starts on Monday, the start of the week for 2 September 2014 11:55:00:
 * const result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0), { weekStartsOn: 1 })
 * //=> Mon Sep 01 2014 00:00:00
 */
function startOfWeek(date, options) {
  const defaultOptions = getDefaultOptions$1();
  const weekStartsOn =
    options?.weekStartsOn ??
    options?.locale?.options?.weekStartsOn ??
    defaultOptions.weekStartsOn ??
    defaultOptions.locale?.options?.weekStartsOn ??
    0;

  const _date = toDate(date, options?.in);
  const day = _date.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;

  _date.setDate(_date.getDate() - diff);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

/**
 * The {@link startOfISOWeek} function options.
 */

/**
 * @name startOfISOWeek
 * @category ISO Week Helpers
 * @summary Return the start of an ISO week for the given date.
 *
 * @description
 * Return the start of an ISO week for the given date.
 * The result will be in the local timezone.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
 *
 * @param date - The original date
 * @param options - An object with options
 *
 * @returns The start of an ISO week
 *
 * @example
 * // The start of an ISO week for 2 September 2014 11:55:00:
 * const result = startOfISOWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Mon Sep 01 2014 00:00:00
 */
function startOfISOWeek(date, options) {
  return startOfWeek(date, { ...options, weekStartsOn: 1 });
}

/**
 * The {@link getISOWeekYear} function options.
 */

/**
 * @name getISOWeekYear
 * @category ISO Week-Numbering Year Helpers
 * @summary Get the ISO week-numbering year of the given date.
 *
 * @description
 * Get the ISO week-numbering year of the given date,
 * which always starts 3 days before the year's first Thursday.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param date - The given date
 *
 * @returns The ISO week-numbering year
 *
 * @example
 * // Which ISO-week numbering year is 2 January 2005?
 * const result = getISOWeekYear(new Date(2005, 0, 2))
 * //=> 2004
 */
function getISOWeekYear(date, options) {
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();

  const fourthOfJanuaryOfNextYear = constructFrom(_date, 0);
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);

  const fourthOfJanuaryOfThisYear = constructFrom(_date, 0);
  fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
  fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);

  if (_date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (_date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}

/**
 * Google Chrome as of 67.0.3396.87 introduced timezones with offset that includes seconds.
 * They usually appear for dates that denote time before the timezones were introduced
 * (e.g. for 'Europe/Prague' timezone the offset is GMT+00:57:44 before 1 October 1891
 * and GMT+01:00:00 after that date)
 *
 * Date#getTimezoneOffset returns the offset in minutes and would return 57 for the example above,
 * which would lead to incorrect calculations.
 *
 * This function returns the timezone offset in milliseconds that takes seconds in account.
 */
function getTimezoneOffsetInMilliseconds(date) {
  const _date = toDate(date);
  const utcDate = new Date(
    Date.UTC(
      _date.getFullYear(),
      _date.getMonth(),
      _date.getDate(),
      _date.getHours(),
      _date.getMinutes(),
      _date.getSeconds(),
      _date.getMilliseconds(),
    ),
  );
  utcDate.setUTCFullYear(_date.getFullYear());
  return +date - +utcDate;
}

function normalizeDates(context, ...dates) {
  const normalize = constructFrom.bind(
    null,
    context || dates.find((date) => typeof date === "object"),
  );
  return dates.map(normalize);
}

/**
 * The {@link startOfDay} function options.
 */

/**
 * @name startOfDay
 * @category Day Helpers
 * @summary Return the start of a day for the given date.
 *
 * @description
 * Return the start of a day for the given date.
 * The result will be in the local timezone.
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
 *
 * @param date - The original date
 * @param options - The options
 *
 * @returns The start of a day
 *
 * @example
 * // The start of a day for 2 September 2014 11:55:00:
 * const result = startOfDay(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Sep 02 2014 00:00:00
 */
function startOfDay(date, options) {
  const _date = toDate(date, options?.in);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

/**
 * The {@link differenceInCalendarDays} function options.
 */

/**
 * @name differenceInCalendarDays
 * @category Day Helpers
 * @summary Get the number of calendar days between the given dates.
 *
 * @description
 * Get the number of calendar days between the given dates. This means that the times are removed
 * from the dates and then the difference in days is calculated.
 *
 * @param laterDate - The later date
 * @param earlierDate - The earlier date
 * @param options - The options object
 *
 * @returns The number of calendar days
 *
 * @example
 * // How many calendar days are between
 * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
 * const result = differenceInCalendarDays(
 *   new Date(2012, 6, 2, 0, 0),
 *   new Date(2011, 6, 2, 23, 0)
 * )
 * //=> 366
 * // How many calendar days are between
 * // 2 July 2011 23:59:00 and 3 July 2011 00:01:00?
 * const result = differenceInCalendarDays(
 *   new Date(2011, 6, 3, 0, 1),
 *   new Date(2011, 6, 2, 23, 59)
 * )
 * //=> 1
 */
function differenceInCalendarDays(laterDate, earlierDate, options) {
  const [laterDate_, earlierDate_] = normalizeDates(
    options?.in,
    laterDate,
    earlierDate,
  );

  const laterStartOfDay = startOfDay(laterDate_);
  const earlierStartOfDay = startOfDay(earlierDate_);

  const laterTimestamp =
    +laterStartOfDay - getTimezoneOffsetInMilliseconds(laterStartOfDay);
  const earlierTimestamp =
    +earlierStartOfDay - getTimezoneOffsetInMilliseconds(earlierStartOfDay);

  // Round the number of days to the nearest integer because the number of
  // milliseconds in a day is not constant (e.g. it's different in the week of
  // the daylight saving time clock shift).
  return Math.round((laterTimestamp - earlierTimestamp) / millisecondsInDay);
}

/**
 * The {@link startOfISOWeekYear} function options.
 */

/**
 * @name startOfISOWeekYear
 * @category ISO Week-Numbering Year Helpers
 * @summary Return the start of an ISO week-numbering year for the given date.
 *
 * @description
 * Return the start of an ISO week-numbering year,
 * which always starts 3 days before the year's first Thursday.
 * The result will be in the local timezone.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
 *
 * @param date - The original date
 * @param options - An object with options
 *
 * @returns The start of an ISO week-numbering year
 *
 * @example
 * // The start of an ISO week-numbering year for 2 July 2005:
 * const result = startOfISOWeekYear(new Date(2005, 6, 2))
 * //=> Mon Jan 03 2005 00:00:00
 */
function startOfISOWeekYear(date, options) {
  const year = getISOWeekYear(date, options);
  const fourthOfJanuary = constructFrom(options?.in || date, 0);
  fourthOfJanuary.setFullYear(year, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  return startOfISOWeek(fourthOfJanuary);
}

/**
 * @name isDate
 * @category Common Helpers
 * @summary Is the given value a date?
 *
 * @description
 * Returns true if the given value is an instance of Date. The function works for dates transferred across iframes.
 *
 * @param value - The value to check
 *
 * @returns True if the given value is a date
 *
 * @example
 * // For a valid date:
 * const result = isDate(new Date())
 * //=> true
 *
 * @example
 * // For an invalid date:
 * const result = isDate(new Date(NaN))
 * //=> true
 *
 * @example
 * // For some value:
 * const result = isDate('2014-02-31')
 * //=> false
 *
 * @example
 * // For an object:
 * const result = isDate({})
 * //=> false
 */
function isDate(value) {
  return (
    value instanceof Date ||
    (typeof value === "object" &&
      Object.prototype.toString.call(value) === "[object Date]")
  );
}

/**
 * @name isValid
 * @category Common Helpers
 * @summary Is the given date valid?
 *
 * @description
 * Returns false if argument is Invalid Date and true otherwise.
 * Argument is converted to Date using `toDate`. See [toDate](https://date-fns.org/docs/toDate)
 * Invalid Date is a Date, whose time value is NaN.
 *
 * Time value of Date: http://es5.github.io/#x15.9.1.1
 *
 * @param date - The date to check
 *
 * @returns The date is valid
 *
 * @example
 * // For the valid date:
 * const result = isValid(new Date(2014, 1, 31))
 * //=> true
 *
 * @example
 * // For the value, convertible into a date:
 * const result = isValid(1393804800000)
 * //=> true
 *
 * @example
 * // For the invalid date:
 * const result = isValid(new Date(''))
 * //=> false
 */
function isValid(date) {
  return !((!isDate(date) && typeof date !== "number") || isNaN(+toDate(date)));
}

/**
 * The {@link startOfYear} function options.
 */

/**
 * @name startOfYear
 * @category Year Helpers
 * @summary Return the start of a year for the given date.
 *
 * @description
 * Return the start of a year for the given date.
 * The result will be in the local timezone.
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
 *
 * @param date - The original date
 * @param options - The options
 *
 * @returns The start of a year
 *
 * @example
 * // The start of a year for 2 September 2014 11:55:00:
 * const result = startOfYear(new Date(2014, 8, 2, 11, 55, 00))
 * //=> Wed Jan 01 2014 00:00:00
 */
function startOfYear(date, options) {
  const date_ = toDate(date, options?.in);
  date_.setFullYear(date_.getFullYear(), 0, 1);
  date_.setHours(0, 0, 0, 0);
  return date_;
}

const formatDistanceLocale = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds",
  },

  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds",
  },

  halfAMinute: "half a minute",

  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes",
  },

  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes",
  },

  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours",
  },

  xHours: {
    one: "1 hour",
    other: "{{count}} hours",
  },

  xDays: {
    one: "1 day",
    other: "{{count}} days",
  },

  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks",
  },

  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks",
  },

  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months",
  },

  xMonths: {
    one: "1 month",
    other: "{{count}} months",
  },

  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years",
  },

  xYears: {
    one: "1 year",
    other: "{{count}} years",
  },

  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years",
  },

  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years",
  },
};

const formatDistance = (token, count, options) => {
  let result;

  const tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace("{{count}}", count.toString());
  }

  if (options?.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return "in " + result;
    } else {
      return result + " ago";
    }
  }

  return result;
};

function buildFormatLongFn(args) {
  return (options = {}) => {
    // TODO: Remove String()
    const width = options.width ? String(options.width) : args.defaultWidth;
    const format = args.formats[width] || args.formats[args.defaultWidth];
    return format;
  };
}

const dateFormats = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy",
};

const timeFormats = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a",
};

const dateTimeFormats = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}",
};

const formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: "full",
  }),

  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: "full",
  }),

  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: "full",
  }),
};

const formatRelativeLocale = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P",
};

const formatRelative = (token, _date, _baseDate, _options) =>
  formatRelativeLocale[token];

/**
 * The localize function argument callback which allows to convert raw value to
 * the actual type.
 *
 * @param value - The value to convert
 *
 * @returns The converted value
 */

/**
 * The map of localized values for each width.
 */

/**
 * The index type of the locale unit value. It types conversion of units of
 * values that don't start at 0 (i.e. quarters).
 */

/**
 * Converts the unit value to the tuple of values.
 */

/**
 * The tuple of localized era values. The first element represents BC,
 * the second element represents AD.
 */

/**
 * The tuple of localized quarter values. The first element represents Q1.
 */

/**
 * The tuple of localized day values. The first element represents Sunday.
 */

/**
 * The tuple of localized month values. The first element represents January.
 */

function buildLocalizeFn(args) {
  return (value, options) => {
    const context = options?.context ? String(options.context) : "standalone";

    let valuesArray;
    if (context === "formatting" && args.formattingValues) {
      const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      const width = options?.width ? String(options.width) : defaultWidth;

      valuesArray =
        args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      const defaultWidth = args.defaultWidth;
      const width = options?.width ? String(options.width) : args.defaultWidth;

      valuesArray = args.values[width] || args.values[defaultWidth];
    }
    const index = args.argumentCallback ? args.argumentCallback(value) : value;

    // @ts-expect-error - For some reason TypeScript just don't want to match it, no matter how hard we try. I challenge you to try to remove it!
    return valuesArray[index];
  };
}

const eraValues = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"],
};

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"],
};

// Note: in English, the names of days of the week and months are capitalized.
// If you are making a new locale based on this one, check if the same is true for the language you're working on.
// Generally, formatted dates should look like they are in the middle of a sentence,
// e.g. in Spanish language the weekdays and months should be in the lowercase.
const monthValues = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],

  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};

const dayValues = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
};

const dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night",
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night",
  },
};

const formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night",
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night",
  },
};

const ordinalNumber = (dirtyNumber, _options) => {
  const number = Number(dirtyNumber);

  // If ordinal numbers depend on context, for example,
  // if they are different for different grammatical genders,
  // use `options.unit`.
  //
  // `unit` can be 'year', 'quarter', 'month', 'week', 'date', 'dayOfYear',
  // 'day', 'hour', 'minute', 'second'.

  const rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + "st";
      case 2:
        return number + "nd";
      case 3:
        return number + "rd";
    }
  }
  return number + "th";
};

const localize = {
  ordinalNumber,

  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide",
  }),

  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: (quarter) => quarter - 1,
  }),

  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide",
  }),

  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide",
  }),

  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide",
  }),
};

function buildMatchFn(args) {
  return (string, options = {}) => {
    const width = options.width;

    const matchPattern =
      (width && args.matchPatterns[width]) ||
      args.matchPatterns[args.defaultMatchWidth];
    const matchResult = string.match(matchPattern);

    if (!matchResult) {
      return null;
    }
    const matchedString = matchResult[0];

    const parsePatterns =
      (width && args.parsePatterns[width]) ||
      args.parsePatterns[args.defaultParseWidth];

    const key = Array.isArray(parsePatterns)
      ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString))
      : // [TODO] -- I challenge you to fix the type
        findKey(parsePatterns, (pattern) => pattern.test(matchedString));

    let value;

    value = args.valueCallback ? args.valueCallback(key) : key;
    value = options.valueCallback
      ? // [TODO] -- I challenge you to fix the type
        options.valueCallback(value)
      : value;

    const rest = string.slice(matchedString.length);

    return { value, rest };
  };
}

function findKey(object, predicate) {
  for (const key in object) {
    if (
      Object.prototype.hasOwnProperty.call(object, key) &&
      predicate(object[key])
    ) {
      return key;
    }
  }
  return undefined;
}

function findIndex(array, predicate) {
  for (let key = 0; key < array.length; key++) {
    if (predicate(array[key])) {
      return key;
    }
  }
  return undefined;
}

function buildMatchPatternFn(args) {
  return (string, options = {}) => {
    const matchResult = string.match(args.matchPattern);
    if (!matchResult) return null;
    const matchedString = matchResult[0];

    const parseResult = string.match(args.parsePattern);
    if (!parseResult) return null;
    let value = args.valueCallback
      ? args.valueCallback(parseResult[0])
      : parseResult[0];

    // [TODO] I challenge you to fix the type
    value = options.valueCallback ? options.valueCallback(value) : value;

    const rest = string.slice(matchedString.length);

    return { value, rest };
  };
}

const matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
const parseOrdinalNumberPattern = /\d+/i;

const matchEraPatterns = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i,
};
const parseEraPatterns = {
  any: [/^b/i, /^(a|c)/i],
};

const matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i,
};
const parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i],
};

const matchMonthPatterns = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
};
const parseMonthPatterns = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i,
  ],

  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i,
  ],
};

const matchDayPatterns = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
};
const parseDayPatterns = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
};

const matchDayPeriodPatterns = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i,
};
const parseDayPeriodPatterns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i,
  },
};

const match = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: (value) => parseInt(value, 10),
  }),

  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseEraPatterns,
    defaultParseWidth: "any",
  }),

  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: "any",
    valueCallback: (index) => index + 1,
  }),

  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: "any",
  }),

  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseDayPatterns,
    defaultParseWidth: "any",
  }),

  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: "any",
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: "any",
  }),
};

/**
 * @category Locales
 * @summary English locale (United States).
 * @language English
 * @iso-639-2 eng
 * @author Sasha Koss [@kossnocorp](https://github.com/kossnocorp)
 * @author Lesha Koss [@leshakoss](https://github.com/leshakoss)
 */
const enUS = {
  code: "en-US",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: match,
  options: {
    weekStartsOn: 0 /* Sunday */,
    firstWeekContainsDate: 1,
  },
};

/**
 * The {@link getDayOfYear} function options.
 */

/**
 * @name getDayOfYear
 * @category Day Helpers
 * @summary Get the day of the year of the given date.
 *
 * @description
 * Get the day of the year of the given date.
 *
 * @param date - The given date
 * @param options - The options
 *
 * @returns The day of year
 *
 * @example
 * // Which day of the year is 2 July 2014?
 * const result = getDayOfYear(new Date(2014, 6, 2))
 * //=> 183
 */
function getDayOfYear(date, options) {
  const _date = toDate(date, options?.in);
  const diff = differenceInCalendarDays(_date, startOfYear(_date));
  const dayOfYear = diff + 1;
  return dayOfYear;
}

/**
 * The {@link getISOWeek} function options.
 */

/**
 * @name getISOWeek
 * @category ISO Week Helpers
 * @summary Get the ISO week of the given date.
 *
 * @description
 * Get the ISO week of the given date.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param date - The given date
 * @param options - The options
 *
 * @returns The ISO week
 *
 * @example
 * // Which week of the ISO-week numbering year is 2 January 2005?
 * const result = getISOWeek(new Date(2005, 0, 2))
 * //=> 53
 */
function getISOWeek(date, options) {
  const _date = toDate(date, options?.in);
  const diff = +startOfISOWeek(_date) - +startOfISOWeekYear(_date);

  // Round the number of weeks to the nearest integer because the number of
  // milliseconds in a week is not constant (e.g. it's different in the week of
  // the daylight saving time clock shift).
  return Math.round(diff / millisecondsInWeek) + 1;
}

/**
 * The {@link getWeekYear} function options.
 */

/**
 * @name getWeekYear
 * @category Week-Numbering Year Helpers
 * @summary Get the local week-numbering year of the given date.
 *
 * @description
 * Get the local week-numbering year of the given date.
 * The exact calculation depends on the values of
 * `options.weekStartsOn` (which is the index of the first day of the week)
 * and `options.firstWeekContainsDate` (which is the day of January, which is always in
 * the first week of the week-numbering year)
 *
 * Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
 *
 * @param date - The given date
 * @param options - An object with options.
 *
 * @returns The local week-numbering year
 *
 * @example
 * // Which week numbering year is 26 December 2004 with the default settings?
 * const result = getWeekYear(new Date(2004, 11, 26))
 * //=> 2005
 *
 * @example
 * // Which week numbering year is 26 December 2004 if week starts on Saturday?
 * const result = getWeekYear(new Date(2004, 11, 26), { weekStartsOn: 6 })
 * //=> 2004
 *
 * @example
 * // Which week numbering year is 26 December 2004 if the first week contains 4 January?
 * const result = getWeekYear(new Date(2004, 11, 26), { firstWeekContainsDate: 4 })
 * //=> 2004
 */
function getWeekYear(date, options) {
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();

  const defaultOptions = getDefaultOptions$1();
  const firstWeekContainsDate =
    options?.firstWeekContainsDate ??
    options?.locale?.options?.firstWeekContainsDate ??
    defaultOptions.firstWeekContainsDate ??
    defaultOptions.locale?.options?.firstWeekContainsDate ??
    1;

  const firstWeekOfNextYear = constructFrom(options?.in || date, 0);
  firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
  firstWeekOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfWeek(firstWeekOfNextYear, options);

  const firstWeekOfThisYear = constructFrom(options?.in || date, 0);
  firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
  firstWeekOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfWeek(firstWeekOfThisYear, options);

  if (+_date >= +startOfNextYear) {
    return year + 1;
  } else if (+_date >= +startOfThisYear) {
    return year;
  } else {
    return year - 1;
  }
}

/**
 * The {@link startOfWeekYear} function options.
 */

/**
 * @name startOfWeekYear
 * @category Week-Numbering Year Helpers
 * @summary Return the start of a local week-numbering year for the given date.
 *
 * @description
 * Return the start of a local week-numbering year.
 * The exact calculation depends on the values of
 * `options.weekStartsOn` (which is the index of the first day of the week)
 * and `options.firstWeekContainsDate` (which is the day of January, which is always in
 * the first week of the week-numbering year)
 *
 * Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 * @typeParam ResultDate - The result `Date` type.
 *
 * @param date - The original date
 * @param options - An object with options
 *
 * @returns The start of a week-numbering year
 *
 * @example
 * // The start of an a week-numbering year for 2 July 2005 with default settings:
 * const result = startOfWeekYear(new Date(2005, 6, 2))
 * //=> Sun Dec 26 2004 00:00:00
 *
 * @example
 * // The start of a week-numbering year for 2 July 2005
 * // if Monday is the first day of week
 * // and 4 January is always in the first week of the year:
 * const result = startOfWeekYear(new Date(2005, 6, 2), {
 *   weekStartsOn: 1,
 *   firstWeekContainsDate: 4
 * })
 * //=> Mon Jan 03 2005 00:00:00
 */
function startOfWeekYear(date, options) {
  const defaultOptions = getDefaultOptions$1();
  const firstWeekContainsDate =
    options?.firstWeekContainsDate ??
    options?.locale?.options?.firstWeekContainsDate ??
    defaultOptions.firstWeekContainsDate ??
    defaultOptions.locale?.options?.firstWeekContainsDate ??
    1;

  const year = getWeekYear(date, options);
  const firstWeek = constructFrom(options?.in || date, 0);
  firstWeek.setFullYear(year, 0, firstWeekContainsDate);
  firstWeek.setHours(0, 0, 0, 0);
  const _date = startOfWeek(firstWeek, options);
  return _date;
}

/**
 * The {@link getWeek} function options.
 */

/**
 * @name getWeek
 * @category Week Helpers
 * @summary Get the local week index of the given date.
 *
 * @description
 * Get the local week index of the given date.
 * The exact calculation depends on the values of
 * `options.weekStartsOn` (which is the index of the first day of the week)
 * and `options.firstWeekContainsDate` (which is the day of January, which is always in
 * the first week of the week-numbering year)
 *
 * Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
 *
 * @param date - The given date
 * @param options - An object with options
 *
 * @returns The week
 *
 * @example
 * // Which week of the local week numbering year is 2 January 2005 with default options?
 * const result = getWeek(new Date(2005, 0, 2))
 * //=> 2
 *
 * @example
 * // Which week of the local week numbering year is 2 January 2005,
 * // if Monday is the first day of the week,
 * // and the first week of the year always contains 4 January?
 * const result = getWeek(new Date(2005, 0, 2), {
 *   weekStartsOn: 1,
 *   firstWeekContainsDate: 4
 * })
 * //=> 53
 */
function getWeek(date, options) {
  const _date = toDate(date, options?.in);
  const diff = +startOfWeek(_date, options) - +startOfWeekYear(_date, options);

  // Round the number of weeks to the nearest integer because the number of
  // milliseconds in a week is not constant (e.g. it's different in the week of
  // the daylight saving time clock shift).
  return Math.round(diff / millisecondsInWeek) + 1;
}

function addLeadingZeros(number, targetLength) {
  const sign = number < 0 ? "-" : "";
  const output = Math.abs(number).toString().padStart(targetLength, "0");
  return sign + output;
}

/*
 * |     | Unit                           |     | Unit                           |
 * |-----|--------------------------------|-----|--------------------------------|
 * |  a  | AM, PM                         |  A* |                                |
 * |  d  | Day of month                   |  D  |                                |
 * |  h  | Hour [1-12]                    |  H  | Hour [0-23]                    |
 * |  m  | Minute                         |  M  | Month                          |
 * |  s  | Second                         |  S  | Fraction of second             |
 * |  y  | Year (abs)                     |  Y  |                                |
 *
 * Letters marked by * are not implemented but reserved by Unicode standard.
 */

const lightFormatters = {
  // Year
  y(date, token) {
    // From http://www.unicode.org/reports/tr35/tr35-31/tr35-dates.html#Date_Format_tokens
    // | Year     |     y | yy |   yyy |  yyyy | yyyyy |
    // |----------|-------|----|-------|-------|-------|
    // | AD 1     |     1 | 01 |   001 |  0001 | 00001 |
    // | AD 12    |    12 | 12 |   012 |  0012 | 00012 |
    // | AD 123   |   123 | 23 |   123 |  0123 | 00123 |
    // | AD 1234  |  1234 | 34 |  1234 |  1234 | 01234 |
    // | AD 12345 | 12345 | 45 | 12345 | 12345 | 12345 |

    const signedYear = date.getFullYear();
    // Returns 1 for 1 BC (which is year 0 in JavaScript)
    const year = signedYear > 0 ? signedYear : 1 - signedYear;
    return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
  },

  // Month
  M(date, token) {
    const month = date.getMonth();
    return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
  },

  // Day of the month
  d(date, token) {
    return addLeadingZeros(date.getDate(), token.length);
  },

  // AM or PM
  a(date, token) {
    const dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";

    switch (token) {
      case "a":
      case "aa":
        return dayPeriodEnumValue.toUpperCase();
      case "aaa":
        return dayPeriodEnumValue;
      case "aaaaa":
        return dayPeriodEnumValue[0];
      case "aaaa":
      default:
        return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
    }
  },

  // Hour [1-12]
  h(date, token) {
    return addLeadingZeros(date.getHours() % 12 || 12, token.length);
  },

  // Hour [0-23]
  H(date, token) {
    return addLeadingZeros(date.getHours(), token.length);
  },

  // Minute
  m(date, token) {
    return addLeadingZeros(date.getMinutes(), token.length);
  },

  // Second
  s(date, token) {
    return addLeadingZeros(date.getSeconds(), token.length);
  },

  // Fraction of second
  S(date, token) {
    const numberOfDigits = token.length;
    const milliseconds = date.getMilliseconds();
    const fractionalSeconds = Math.trunc(
      milliseconds * Math.pow(10, numberOfDigits - 3),
    );
    return addLeadingZeros(fractionalSeconds, token.length);
  },
};

const dayPeriodEnum = {
  am: "am",
  pm: "pm",
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night",
};

/*
 * |     | Unit                           |     | Unit                           |
 * |-----|--------------------------------|-----|--------------------------------|
 * |  a  | AM, PM                         |  A* | Milliseconds in day            |
 * |  b  | AM, PM, noon, midnight         |  B  | Flexible day period            |
 * |  c  | Stand-alone local day of week  |  C* | Localized hour w/ day period   |
 * |  d  | Day of month                   |  D  | Day of year                    |
 * |  e  | Local day of week              |  E  | Day of week                    |
 * |  f  |                                |  F* | Day of week in month           |
 * |  g* | Modified Julian day            |  G  | Era                            |
 * |  h  | Hour [1-12]                    |  H  | Hour [0-23]                    |
 * |  i! | ISO day of week                |  I! | ISO week of year               |
 * |  j* | Localized hour w/ day period   |  J* | Localized hour w/o day period  |
 * |  k  | Hour [1-24]                    |  K  | Hour [0-11]                    |
 * |  l* | (deprecated)                   |  L  | Stand-alone month              |
 * |  m  | Minute                         |  M  | Month                          |
 * |  n  |                                |  N  |                                |
 * |  o! | Ordinal number modifier        |  O  | Timezone (GMT)                 |
 * |  p! | Long localized time            |  P! | Long localized date            |
 * |  q  | Stand-alone quarter            |  Q  | Quarter                        |
 * |  r* | Related Gregorian year         |  R! | ISO week-numbering year        |
 * |  s  | Second                         |  S  | Fraction of second             |
 * |  t! | Seconds timestamp              |  T! | Milliseconds timestamp         |
 * |  u  | Extended year                  |  U* | Cyclic year                    |
 * |  v* | Timezone (generic non-locat.)  |  V* | Timezone (location)            |
 * |  w  | Local week of year             |  W* | Week of month                  |
 * |  x  | Timezone (ISO-8601 w/o Z)      |  X  | Timezone (ISO-8601)            |
 * |  y  | Year (abs)                     |  Y  | Local week-numbering year      |
 * |  z  | Timezone (specific non-locat.) |  Z* | Timezone (aliases)             |
 *
 * Letters marked by * are not implemented but reserved by Unicode standard.
 *
 * Letters marked by ! are non-standard, but implemented by date-fns:
 * - `o` modifies the previous token to turn it into an ordinal (see `format` docs)
 * - `i` is ISO day of week. For `i` and `ii` is returns numeric ISO week days,
 *   i.e. 7 for Sunday, 1 for Monday, etc.
 * - `I` is ISO week of year, as opposed to `w` which is local week of year.
 * - `R` is ISO week-numbering year, as opposed to `Y` which is local week-numbering year.
 *   `R` is supposed to be used in conjunction with `I` and `i`
 *   for universal ISO week-numbering date, whereas
 *   `Y` is supposed to be used in conjunction with `w` and `e`
 *   for week-numbering date specific to the locale.
 * - `P` is long localized date format
 * - `p` is long localized time format
 */

const formatters = {
  // Era
  G: function (date, token, localize) {
    const era = date.getFullYear() > 0 ? 1 : 0;
    switch (token) {
      // AD, BC
      case "G":
      case "GG":
      case "GGG":
        return localize.era(era, { width: "abbreviated" });
      // A, B
      case "GGGGG":
        return localize.era(era, { width: "narrow" });
      // Anno Domini, Before Christ
      case "GGGG":
      default:
        return localize.era(era, { width: "wide" });
    }
  },

  // Year
  y: function (date, token, localize) {
    // Ordinal number
    if (token === "yo") {
      const signedYear = date.getFullYear();
      // Returns 1 for 1 BC (which is year 0 in JavaScript)
      const year = signedYear > 0 ? signedYear : 1 - signedYear;
      return localize.ordinalNumber(year, { unit: "year" });
    }

    return lightFormatters.y(date, token);
  },

  // Local week-numbering year
  Y: function (date, token, localize, options) {
    const signedWeekYear = getWeekYear(date, options);
    // Returns 1 for 1 BC (which is year 0 in JavaScript)
    const weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;

    // Two digit year
    if (token === "YY") {
      const twoDigitYear = weekYear % 100;
      return addLeadingZeros(twoDigitYear, 2);
    }

    // Ordinal number
    if (token === "Yo") {
      return localize.ordinalNumber(weekYear, { unit: "year" });
    }

    // Padding
    return addLeadingZeros(weekYear, token.length);
  },

  // ISO week-numbering year
  R: function (date, token) {
    const isoWeekYear = getISOWeekYear(date);

    // Padding
    return addLeadingZeros(isoWeekYear, token.length);
  },

  // Extended year. This is a single number designating the year of this calendar system.
  // The main difference between `y` and `u` localizers are B.C. years:
  // | Year | `y` | `u` |
  // |------|-----|-----|
  // | AC 1 |   1 |   1 |
  // | BC 1 |   1 |   0 |
  // | BC 2 |   2 |  -1 |
  // Also `yy` always returns the last two digits of a year,
  // while `uu` pads single digit years to 2 characters and returns other years unchanged.
  u: function (date, token) {
    const year = date.getFullYear();
    return addLeadingZeros(year, token.length);
  },

  // Quarter
  Q: function (date, token, localize) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      // 1, 2, 3, 4
      case "Q":
        return String(quarter);
      // 01, 02, 03, 04
      case "QQ":
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th
      case "Qo":
        return localize.ordinalNumber(quarter, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "QQQ":
        return localize.quarter(quarter, {
          width: "abbreviated",
          context: "formatting",
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "QQQQQ":
        return localize.quarter(quarter, {
          width: "narrow",
          context: "formatting",
        });
      // 1st quarter, 2nd quarter, ...
      case "QQQQ":
      default:
        return localize.quarter(quarter, {
          width: "wide",
          context: "formatting",
        });
    }
  },

  // Stand-alone quarter
  q: function (date, token, localize) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      // 1, 2, 3, 4
      case "q":
        return String(quarter);
      // 01, 02, 03, 04
      case "qq":
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th
      case "qo":
        return localize.ordinalNumber(quarter, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "qqq":
        return localize.quarter(quarter, {
          width: "abbreviated",
          context: "standalone",
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "qqqqq":
        return localize.quarter(quarter, {
          width: "narrow",
          context: "standalone",
        });
      // 1st quarter, 2nd quarter, ...
      case "qqqq":
      default:
        return localize.quarter(quarter, {
          width: "wide",
          context: "standalone",
        });
    }
  },

  // Month
  M: function (date, token, localize) {
    const month = date.getMonth();
    switch (token) {
      case "M":
      case "MM":
        return lightFormatters.M(date, token);
      // 1st, 2nd, ..., 12th
      case "Mo":
        return localize.ordinalNumber(month + 1, { unit: "month" });
      // Jan, Feb, ..., Dec
      case "MMM":
        return localize.month(month, {
          width: "abbreviated",
          context: "formatting",
        });
      // J, F, ..., D
      case "MMMMM":
        return localize.month(month, {
          width: "narrow",
          context: "formatting",
        });
      // January, February, ..., December
      case "MMMM":
      default:
        return localize.month(month, { width: "wide", context: "formatting" });
    }
  },

  // Stand-alone month
  L: function (date, token, localize) {
    const month = date.getMonth();
    switch (token) {
      // 1, 2, ..., 12
      case "L":
        return String(month + 1);
      // 01, 02, ..., 12
      case "LL":
        return addLeadingZeros(month + 1, 2);
      // 1st, 2nd, ..., 12th
      case "Lo":
        return localize.ordinalNumber(month + 1, { unit: "month" });
      // Jan, Feb, ..., Dec
      case "LLL":
        return localize.month(month, {
          width: "abbreviated",
          context: "standalone",
        });
      // J, F, ..., D
      case "LLLLL":
        return localize.month(month, {
          width: "narrow",
          context: "standalone",
        });
      // January, February, ..., December
      case "LLLL":
      default:
        return localize.month(month, { width: "wide", context: "standalone" });
    }
  },

  // Local week of year
  w: function (date, token, localize, options) {
    const week = getWeek(date, options);

    if (token === "wo") {
      return localize.ordinalNumber(week, { unit: "week" });
    }

    return addLeadingZeros(week, token.length);
  },

  // ISO week of year
  I: function (date, token, localize) {
    const isoWeek = getISOWeek(date);

    if (token === "Io") {
      return localize.ordinalNumber(isoWeek, { unit: "week" });
    }

    return addLeadingZeros(isoWeek, token.length);
  },

  // Day of the month
  d: function (date, token, localize) {
    if (token === "do") {
      return localize.ordinalNumber(date.getDate(), { unit: "date" });
    }

    return lightFormatters.d(date, token);
  },

  // Day of year
  D: function (date, token, localize) {
    const dayOfYear = getDayOfYear(date);

    if (token === "Do") {
      return localize.ordinalNumber(dayOfYear, { unit: "dayOfYear" });
    }

    return addLeadingZeros(dayOfYear, token.length);
  },

  // Day of week
  E: function (date, token, localize) {
    const dayOfWeek = date.getDay();
    switch (token) {
      // Tue
      case "E":
      case "EE":
      case "EEE":
        return localize.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting",
        });
      // T
      case "EEEEE":
        return localize.day(dayOfWeek, {
          width: "narrow",
          context: "formatting",
        });
      // Tu
      case "EEEEEE":
        return localize.day(dayOfWeek, {
          width: "short",
          context: "formatting",
        });
      // Tuesday
      case "EEEE":
      default:
        return localize.day(dayOfWeek, {
          width: "wide",
          context: "formatting",
        });
    }
  },

  // Local day of week
  e: function (date, token, localize, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      // Numerical value (Nth day of week with current locale or weekStartsOn)
      case "e":
        return String(localDayOfWeek);
      // Padded numerical value
      case "ee":
        return addLeadingZeros(localDayOfWeek, 2);
      // 1st, 2nd, ..., 7th
      case "eo":
        return localize.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "eee":
        return localize.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting",
        });
      // T
      case "eeeee":
        return localize.day(dayOfWeek, {
          width: "narrow",
          context: "formatting",
        });
      // Tu
      case "eeeeee":
        return localize.day(dayOfWeek, {
          width: "short",
          context: "formatting",
        });
      // Tuesday
      case "eeee":
      default:
        return localize.day(dayOfWeek, {
          width: "wide",
          context: "formatting",
        });
    }
  },

  // Stand-alone local day of week
  c: function (date, token, localize, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      // Numerical value (same as in `e`)
      case "c":
        return String(localDayOfWeek);
      // Padded numerical value
      case "cc":
        return addLeadingZeros(localDayOfWeek, token.length);
      // 1st, 2nd, ..., 7th
      case "co":
        return localize.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "ccc":
        return localize.day(dayOfWeek, {
          width: "abbreviated",
          context: "standalone",
        });
      // T
      case "ccccc":
        return localize.day(dayOfWeek, {
          width: "narrow",
          context: "standalone",
        });
      // Tu
      case "cccccc":
        return localize.day(dayOfWeek, {
          width: "short",
          context: "standalone",
        });
      // Tuesday
      case "cccc":
      default:
        return localize.day(dayOfWeek, {
          width: "wide",
          context: "standalone",
        });
    }
  },

  // ISO day of week
  i: function (date, token, localize) {
    const dayOfWeek = date.getDay();
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    switch (token) {
      // 2
      case "i":
        return String(isoDayOfWeek);
      // 02
      case "ii":
        return addLeadingZeros(isoDayOfWeek, token.length);
      // 2nd
      case "io":
        return localize.ordinalNumber(isoDayOfWeek, { unit: "day" });
      // Tue
      case "iii":
        return localize.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting",
        });
      // T
      case "iiiii":
        return localize.day(dayOfWeek, {
          width: "narrow",
          context: "formatting",
        });
      // Tu
      case "iiiiii":
        return localize.day(dayOfWeek, {
          width: "short",
          context: "formatting",
        });
      // Tuesday
      case "iiii":
      default:
        return localize.day(dayOfWeek, {
          width: "wide",
          context: "formatting",
        });
    }
  },

  // AM or PM
  a: function (date, token, localize) {
    const hours = date.getHours();
    const dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";

    switch (token) {
      case "a":
      case "aa":
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting",
        });
      case "aaa":
        return localize
          .dayPeriod(dayPeriodEnumValue, {
            width: "abbreviated",
            context: "formatting",
          })
          .toLowerCase();
      case "aaaaa":
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting",
        });
      case "aaaa":
      default:
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting",
        });
    }
  },

  // AM, PM, midnight, noon
  b: function (date, token, localize) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours === 12) {
      dayPeriodEnumValue = dayPeriodEnum.noon;
    } else if (hours === 0) {
      dayPeriodEnumValue = dayPeriodEnum.midnight;
    } else {
      dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    }

    switch (token) {
      case "b":
      case "bb":
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting",
        });
      case "bbb":
        return localize
          .dayPeriod(dayPeriodEnumValue, {
            width: "abbreviated",
            context: "formatting",
          })
          .toLowerCase();
      case "bbbbb":
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting",
        });
      case "bbbb":
      default:
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting",
        });
    }
  },

  // in the morning, in the afternoon, in the evening, at night
  B: function (date, token, localize) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours >= 17) {
      dayPeriodEnumValue = dayPeriodEnum.evening;
    } else if (hours >= 12) {
      dayPeriodEnumValue = dayPeriodEnum.afternoon;
    } else if (hours >= 4) {
      dayPeriodEnumValue = dayPeriodEnum.morning;
    } else {
      dayPeriodEnumValue = dayPeriodEnum.night;
    }

    switch (token) {
      case "B":
      case "BB":
      case "BBB":
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting",
        });
      case "BBBBB":
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting",
        });
      case "BBBB":
      default:
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting",
        });
    }
  },

  // Hour [1-12]
  h: function (date, token, localize) {
    if (token === "ho") {
      let hours = date.getHours() % 12;
      if (hours === 0) hours = 12;
      return localize.ordinalNumber(hours, { unit: "hour" });
    }

    return lightFormatters.h(date, token);
  },

  // Hour [0-23]
  H: function (date, token, localize) {
    if (token === "Ho") {
      return localize.ordinalNumber(date.getHours(), { unit: "hour" });
    }

    return lightFormatters.H(date, token);
  },

  // Hour [0-11]
  K: function (date, token, localize) {
    const hours = date.getHours() % 12;

    if (token === "Ko") {
      return localize.ordinalNumber(hours, { unit: "hour" });
    }

    return addLeadingZeros(hours, token.length);
  },

  // Hour [1-24]
  k: function (date, token, localize) {
    let hours = date.getHours();
    if (hours === 0) hours = 24;

    if (token === "ko") {
      return localize.ordinalNumber(hours, { unit: "hour" });
    }

    return addLeadingZeros(hours, token.length);
  },

  // Minute
  m: function (date, token, localize) {
    if (token === "mo") {
      return localize.ordinalNumber(date.getMinutes(), { unit: "minute" });
    }

    return lightFormatters.m(date, token);
  },

  // Second
  s: function (date, token, localize) {
    if (token === "so") {
      return localize.ordinalNumber(date.getSeconds(), { unit: "second" });
    }

    return lightFormatters.s(date, token);
  },

  // Fraction of second
  S: function (date, token) {
    return lightFormatters.S(date, token);
  },

  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function (date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();

    if (timezoneOffset === 0) {
      return "Z";
    }

    switch (token) {
      // Hours and optional minutes
      case "X":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);

      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XX`
      case "XXXX":
      case "XX": // Hours and minutes without `:` delimiter
        return formatTimezone(timezoneOffset);

      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XXX`
      case "XXXXX":
      case "XXX": // Hours and minutes with `:` delimiter
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },

  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function (date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();

    switch (token) {
      // Hours and optional minutes
      case "x":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);

      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xx`
      case "xxxx":
      case "xx": // Hours and minutes without `:` delimiter
        return formatTimezone(timezoneOffset);

      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xxx`
      case "xxxxx":
      case "xxx": // Hours and minutes with `:` delimiter
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },

  // Timezone (GMT)
  O: function (date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();

    switch (token) {
      // Short
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      // Long
      case "OOOO":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },

  // Timezone (specific non-location)
  z: function (date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();

    switch (token) {
      // Short
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      // Long
      case "zzzz":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },

  // Seconds timestamp
  t: function (date, token, _localize) {
    const timestamp = Math.trunc(+date / 1000);
    return addLeadingZeros(timestamp, token.length);
  },

  // Milliseconds timestamp
  T: function (date, token, _localize) {
    return addLeadingZeros(+date, token.length);
  },
};

function formatTimezoneShort(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = Math.trunc(absOffset / 60);
  const minutes = absOffset % 60;
  if (minutes === 0) {
    return sign + String(hours);
  }
  return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
}

function formatTimezoneWithOptionalMinutes(offset, delimiter) {
  if (offset % 60 === 0) {
    const sign = offset > 0 ? "-" : "+";
    return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
  }
  return formatTimezone(offset, delimiter);
}

function formatTimezone(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
  const minutes = addLeadingZeros(absOffset % 60, 2);
  return sign + hours + delimiter + minutes;
}

const dateLongFormatter = (pattern, formatLong) => {
  switch (pattern) {
    case "P":
      return formatLong.date({ width: "short" });
    case "PP":
      return formatLong.date({ width: "medium" });
    case "PPP":
      return formatLong.date({ width: "long" });
    case "PPPP":
    default:
      return formatLong.date({ width: "full" });
  }
};

const timeLongFormatter = (pattern, formatLong) => {
  switch (pattern) {
    case "p":
      return formatLong.time({ width: "short" });
    case "pp":
      return formatLong.time({ width: "medium" });
    case "ppp":
      return formatLong.time({ width: "long" });
    case "pppp":
    default:
      return formatLong.time({ width: "full" });
  }
};

const dateTimeLongFormatter = (pattern, formatLong) => {
  const matchResult = pattern.match(/(P+)(p+)?/) || [];
  const datePattern = matchResult[1];
  const timePattern = matchResult[2];

  if (!timePattern) {
    return dateLongFormatter(pattern, formatLong);
  }

  let dateTimeFormat;

  switch (datePattern) {
    case "P":
      dateTimeFormat = formatLong.dateTime({ width: "short" });
      break;
    case "PP":
      dateTimeFormat = formatLong.dateTime({ width: "medium" });
      break;
    case "PPP":
      dateTimeFormat = formatLong.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      dateTimeFormat = formatLong.dateTime({ width: "full" });
      break;
  }

  return dateTimeFormat
    .replace("{{date}}", dateLongFormatter(datePattern, formatLong))
    .replace("{{time}}", timeLongFormatter(timePattern, formatLong));
};

const longFormatters = {
  p: timeLongFormatter,
  P: dateTimeLongFormatter,
};

const dayOfYearTokenRE = /^D+$/;
const weekYearTokenRE = /^Y+$/;

const throwTokens = ["D", "DD", "YY", "YYYY"];

function isProtectedDayOfYearToken(token) {
  return dayOfYearTokenRE.test(token);
}

function isProtectedWeekYearToken(token) {
  return weekYearTokenRE.test(token);
}

function warnOrThrowProtectedError(token, format, input) {
  const _message = message(token, format, input);
  console.warn(_message);
  if (throwTokens.includes(token)) throw new RangeError(_message);
}

function message(token, format, input) {
  const subject = token[0] === "Y" ? "years" : "days of the month";
  return `Use \`${token.toLowerCase()}\` instead of \`${token}\` (in \`${format}\`) for formatting ${subject} to the input \`${input}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}

// This RegExp consists of three parts separated by `|`:
// - [yYQqMLwIdDecihHKkms]o matches any available ordinal number token
//   (one of the certain letters followed by `o`)
// - (\w)\1* matches any sequences of the same letter
// - '' matches two quote characters in a row
// - '(''|[^'])+('|$) matches anything surrounded by two quote characters ('),
//   except a single quote symbol, which ends the sequence.
//   Two quote characters do not end the sequence.
//   If there is no matching single quote
//   then the sequence will continue until the end of the string.
// - . matches any single character unmatched by previous parts of the RegExps
const formattingTokensRegExp$1 =
  /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;

// This RegExp catches symbols escaped by quotes, and also
// sequences of symbols P, p, and the combinations like `PPPPPPPppppp`
const longFormattingTokensRegExp$1 = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;

const escapedStringRegExp$1 = /^'([^]*?)'?$/;
const doubleQuoteRegExp$1 = /''/g;
const unescapedLatinCharacterRegExp$1 = /[a-zA-Z]/;

/**
 * The {@link format} function options.
 */

/**
 * @name format
 * @alias formatDate
 * @category Common Helpers
 * @summary Format the date.
 *
 * @description
 * Return the formatted date string in the given format. The result may vary by locale.
 *
 * > ⚠️ Please note that the `format` tokens differ from Moment.js and other libraries.
 * > See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 *
 * The characters wrapped between two single quotes characters (') are escaped.
 * Two single quotes in a row, whether inside or outside a quoted sequence, represent a 'real' single quote.
 * (see the last example)
 *
 * Format of the string is based on Unicode Technical Standard #35:
 * https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
 * with a few additions (see note 7 below the table).
 *
 * Accepted patterns:
 * | Unit                            | Pattern | Result examples                   | Notes |
 * |---------------------------------|---------|-----------------------------------|-------|
 * | Era                             | G..GGG  | AD, BC                            |       |
 * |                                 | GGGG    | Anno Domini, Before Christ        | 2     |
 * |                                 | GGGGG   | A, B                              |       |
 * | Calendar year                   | y       | 44, 1, 1900, 2017                 | 5     |
 * |                                 | yo      | 44th, 1st, 0th, 17th              | 5,7   |
 * |                                 | yy      | 44, 01, 00, 17                    | 5     |
 * |                                 | yyy     | 044, 001, 1900, 2017              | 5     |
 * |                                 | yyyy    | 0044, 0001, 1900, 2017            | 5     |
 * |                                 | yyyyy   | ...                               | 3,5   |
 * | Local week-numbering year       | Y       | 44, 1, 1900, 2017                 | 5     |
 * |                                 | Yo      | 44th, 1st, 1900th, 2017th         | 5,7   |
 * |                                 | YY      | 44, 01, 00, 17                    | 5,8   |
 * |                                 | YYY     | 044, 001, 1900, 2017              | 5     |
 * |                                 | YYYY    | 0044, 0001, 1900, 2017            | 5,8   |
 * |                                 | YYYYY   | ...                               | 3,5   |
 * | ISO week-numbering year         | R       | -43, 0, 1, 1900, 2017             | 5,7   |
 * |                                 | RR      | -43, 00, 01, 1900, 2017           | 5,7   |
 * |                                 | RRR     | -043, 000, 001, 1900, 2017        | 5,7   |
 * |                                 | RRRR    | -0043, 0000, 0001, 1900, 2017     | 5,7   |
 * |                                 | RRRRR   | ...                               | 3,5,7 |
 * | Extended year                   | u       | -43, 0, 1, 1900, 2017             | 5     |
 * |                                 | uu      | -43, 01, 1900, 2017               | 5     |
 * |                                 | uuu     | -043, 001, 1900, 2017             | 5     |
 * |                                 | uuuu    | -0043, 0001, 1900, 2017           | 5     |
 * |                                 | uuuuu   | ...                               | 3,5   |
 * | Quarter (formatting)            | Q       | 1, 2, 3, 4                        |       |
 * |                                 | Qo      | 1st, 2nd, 3rd, 4th                | 7     |
 * |                                 | QQ      | 01, 02, 03, 04                    |       |
 * |                                 | QQQ     | Q1, Q2, Q3, Q4                    |       |
 * |                                 | QQQQ    | 1st quarter, 2nd quarter, ...     | 2     |
 * |                                 | QQQQQ   | 1, 2, 3, 4                        | 4     |
 * | Quarter (stand-alone)           | q       | 1, 2, 3, 4                        |       |
 * |                                 | qo      | 1st, 2nd, 3rd, 4th                | 7     |
 * |                                 | qq      | 01, 02, 03, 04                    |       |
 * |                                 | qqq     | Q1, Q2, Q3, Q4                    |       |
 * |                                 | qqqq    | 1st quarter, 2nd quarter, ...     | 2     |
 * |                                 | qqqqq   | 1, 2, 3, 4                        | 4     |
 * | Month (formatting)              | M       | 1, 2, ..., 12                     |       |
 * |                                 | Mo      | 1st, 2nd, ..., 12th               | 7     |
 * |                                 | MM      | 01, 02, ..., 12                   |       |
 * |                                 | MMM     | Jan, Feb, ..., Dec                |       |
 * |                                 | MMMM    | January, February, ..., December  | 2     |
 * |                                 | MMMMM   | J, F, ..., D                      |       |
 * | Month (stand-alone)             | L       | 1, 2, ..., 12                     |       |
 * |                                 | Lo      | 1st, 2nd, ..., 12th               | 7     |
 * |                                 | LL      | 01, 02, ..., 12                   |       |
 * |                                 | LLL     | Jan, Feb, ..., Dec                |       |
 * |                                 | LLLL    | January, February, ..., December  | 2     |
 * |                                 | LLLLL   | J, F, ..., D                      |       |
 * | Local week of year              | w       | 1, 2, ..., 53                     |       |
 * |                                 | wo      | 1st, 2nd, ..., 53th               | 7     |
 * |                                 | ww      | 01, 02, ..., 53                   |       |
 * | ISO week of year                | I       | 1, 2, ..., 53                     | 7     |
 * |                                 | Io      | 1st, 2nd, ..., 53th               | 7     |
 * |                                 | II      | 01, 02, ..., 53                   | 7     |
 * | Day of month                    | d       | 1, 2, ..., 31                     |       |
 * |                                 | do      | 1st, 2nd, ..., 31st               | 7     |
 * |                                 | dd      | 01, 02, ..., 31                   |       |
 * | Day of year                     | D       | 1, 2, ..., 365, 366               | 9     |
 * |                                 | Do      | 1st, 2nd, ..., 365th, 366th       | 7     |
 * |                                 | DD      | 01, 02, ..., 365, 366             | 9     |
 * |                                 | DDD     | 001, 002, ..., 365, 366           |       |
 * |                                 | DDDD    | ...                               | 3     |
 * | Day of week (formatting)        | E..EEE  | Mon, Tue, Wed, ..., Sun           |       |
 * |                                 | EEEE    | Monday, Tuesday, ..., Sunday      | 2     |
 * |                                 | EEEEE   | M, T, W, T, F, S, S               |       |
 * |                                 | EEEEEE  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
 * | ISO day of week (formatting)    | i       | 1, 2, 3, ..., 7                   | 7     |
 * |                                 | io      | 1st, 2nd, ..., 7th                | 7     |
 * |                                 | ii      | 01, 02, ..., 07                   | 7     |
 * |                                 | iii     | Mon, Tue, Wed, ..., Sun           | 7     |
 * |                                 | iiii    | Monday, Tuesday, ..., Sunday      | 2,7   |
 * |                                 | iiiii   | M, T, W, T, F, S, S               | 7     |
 * |                                 | iiiiii  | Mo, Tu, We, Th, Fr, Sa, Su        | 7     |
 * | Local day of week (formatting)  | e       | 2, 3, 4, ..., 1                   |       |
 * |                                 | eo      | 2nd, 3rd, ..., 1st                | 7     |
 * |                                 | ee      | 02, 03, ..., 01                   |       |
 * |                                 | eee     | Mon, Tue, Wed, ..., Sun           |       |
 * |                                 | eeee    | Monday, Tuesday, ..., Sunday      | 2     |
 * |                                 | eeeee   | M, T, W, T, F, S, S               |       |
 * |                                 | eeeeee  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
 * | Local day of week (stand-alone) | c       | 2, 3, 4, ..., 1                   |       |
 * |                                 | co      | 2nd, 3rd, ..., 1st                | 7     |
 * |                                 | cc      | 02, 03, ..., 01                   |       |
 * |                                 | ccc     | Mon, Tue, Wed, ..., Sun           |       |
 * |                                 | cccc    | Monday, Tuesday, ..., Sunday      | 2     |
 * |                                 | ccccc   | M, T, W, T, F, S, S               |       |
 * |                                 | cccccc  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
 * | AM, PM                          | a..aa   | AM, PM                            |       |
 * |                                 | aaa     | am, pm                            |       |
 * |                                 | aaaa    | a.m., p.m.                        | 2     |
 * |                                 | aaaaa   | a, p                              |       |
 * | AM, PM, noon, midnight          | b..bb   | AM, PM, noon, midnight            |       |
 * |                                 | bbb     | am, pm, noon, midnight            |       |
 * |                                 | bbbb    | a.m., p.m., noon, midnight        | 2     |
 * |                                 | bbbbb   | a, p, n, mi                       |       |
 * | Flexible day period             | B..BBB  | at night, in the morning, ...     |       |
 * |                                 | BBBB    | at night, in the morning, ...     | 2     |
 * |                                 | BBBBB   | at night, in the morning, ...     |       |
 * | Hour [1-12]                     | h       | 1, 2, ..., 11, 12                 |       |
 * |                                 | ho      | 1st, 2nd, ..., 11th, 12th         | 7     |
 * |                                 | hh      | 01, 02, ..., 11, 12               |       |
 * | Hour [0-23]                     | H       | 0, 1, 2, ..., 23                  |       |
 * |                                 | Ho      | 0th, 1st, 2nd, ..., 23rd          | 7     |
 * |                                 | HH      | 00, 01, 02, ..., 23               |       |
 * | Hour [0-11]                     | K       | 1, 2, ..., 11, 0                  |       |
 * |                                 | Ko      | 1st, 2nd, ..., 11th, 0th          | 7     |
 * |                                 | KK      | 01, 02, ..., 11, 00               |       |
 * | Hour [1-24]                     | k       | 24, 1, 2, ..., 23                 |       |
 * |                                 | ko      | 24th, 1st, 2nd, ..., 23rd         | 7     |
 * |                                 | kk      | 24, 01, 02, ..., 23               |       |
 * | Minute                          | m       | 0, 1, ..., 59                     |       |
 * |                                 | mo      | 0th, 1st, ..., 59th               | 7     |
 * |                                 | mm      | 00, 01, ..., 59                   |       |
 * | Second                          | s       | 0, 1, ..., 59                     |       |
 * |                                 | so      | 0th, 1st, ..., 59th               | 7     |
 * |                                 | ss      | 00, 01, ..., 59                   |       |
 * | Fraction of second              | S       | 0, 1, ..., 9                      |       |
 * |                                 | SS      | 00, 01, ..., 99                   |       |
 * |                                 | SSS     | 000, 001, ..., 999                |       |
 * |                                 | SSSS    | ...                               | 3     |
 * | Timezone (ISO-8601 w/ Z)        | X       | -08, +0530, Z                     |       |
 * |                                 | XX      | -0800, +0530, Z                   |       |
 * |                                 | XXX     | -08:00, +05:30, Z                 |       |
 * |                                 | XXXX    | -0800, +0530, Z, +123456          | 2     |
 * |                                 | XXXXX   | -08:00, +05:30, Z, +12:34:56      |       |
 * | Timezone (ISO-8601 w/o Z)       | x       | -08, +0530, +00                   |       |
 * |                                 | xx      | -0800, +0530, +0000               |       |
 * |                                 | xxx     | -08:00, +05:30, +00:00            | 2     |
 * |                                 | xxxx    | -0800, +0530, +0000, +123456      |       |
 * |                                 | xxxxx   | -08:00, +05:30, +00:00, +12:34:56 |       |
 * | Timezone (GMT)                  | O...OOO | GMT-8, GMT+5:30, GMT+0            |       |
 * |                                 | OOOO    | GMT-08:00, GMT+05:30, GMT+00:00   | 2     |
 * | Timezone (specific non-locat.)  | z...zzz | GMT-8, GMT+5:30, GMT+0            | 6     |
 * |                                 | zzzz    | GMT-08:00, GMT+05:30, GMT+00:00   | 2,6   |
 * | Seconds timestamp               | t       | 512969520                         | 7     |
 * |                                 | tt      | ...                               | 3,7   |
 * | Milliseconds timestamp          | T       | 512969520900                      | 7     |
 * |                                 | TT      | ...                               | 3,7   |
 * | Long localized date             | P       | 04/29/1453                        | 7     |
 * |                                 | PP      | Apr 29, 1453                      | 7     |
 * |                                 | PPP     | April 29th, 1453                  | 7     |
 * |                                 | PPPP    | Friday, April 29th, 1453          | 2,7   |
 * | Long localized time             | p       | 12:00 AM                          | 7     |
 * |                                 | pp      | 12:00:00 AM                       | 7     |
 * |                                 | ppp     | 12:00:00 AM GMT+2                 | 7     |
 * |                                 | pppp    | 12:00:00 AM GMT+02:00             | 2,7   |
 * | Combination of date and time    | Pp      | 04/29/1453, 12:00 AM              | 7     |
 * |                                 | PPpp    | Apr 29, 1453, 12:00:00 AM         | 7     |
 * |                                 | PPPppp  | April 29th, 1453 at ...           | 7     |
 * |                                 | PPPPpppp| Friday, April 29th, 1453 at ...   | 2,7   |
 * Notes:
 * 1. "Formatting" units (e.g. formatting quarter) in the default en-US locale
 *    are the same as "stand-alone" units, but are different in some languages.
 *    "Formatting" units are declined according to the rules of the language
 *    in the context of a date. "Stand-alone" units are always nominative singular:
 *
 *    `format(new Date(2017, 10, 6), 'do LLLL', {locale: cs}) //=> '6. listopad'`
 *
 *    `format(new Date(2017, 10, 6), 'do MMMM', {locale: cs}) //=> '6. listopadu'`
 *
 * 2. Any sequence of the identical letters is a pattern, unless it is escaped by
 *    the single quote characters (see below).
 *    If the sequence is longer than listed in table (e.g. `EEEEEEEEEEE`)
 *    the output will be the same as default pattern for this unit, usually
 *    the longest one (in case of ISO weekdays, `EEEE`). Default patterns for units
 *    are marked with "2" in the last column of the table.
 *
 *    `format(new Date(2017, 10, 6), 'MMM') //=> 'Nov'`
 *
 *    `format(new Date(2017, 10, 6), 'MMMM') //=> 'November'`
 *
 *    `format(new Date(2017, 10, 6), 'MMMMM') //=> 'N'`
 *
 *    `format(new Date(2017, 10, 6), 'MMMMMM') //=> 'November'`
 *
 *    `format(new Date(2017, 10, 6), 'MMMMMMM') //=> 'November'`
 *
 * 3. Some patterns could be unlimited length (such as `yyyyyyyy`).
 *    The output will be padded with zeros to match the length of the pattern.
 *
 *    `format(new Date(2017, 10, 6), 'yyyyyyyy') //=> '00002017'`
 *
 * 4. `QQQQQ` and `qqqqq` could be not strictly numerical in some locales.
 *    These tokens represent the shortest form of the quarter.
 *
 * 5. The main difference between `y` and `u` patterns are B.C. years:
 *
 *    | Year | `y` | `u` |
 *    |------|-----|-----|
 *    | AC 1 |   1 |   1 |
 *    | BC 1 |   1 |   0 |
 *    | BC 2 |   2 |  -1 |
 *
 *    Also `yy` always returns the last two digits of a year,
 *    while `uu` pads single digit years to 2 characters and returns other years unchanged:
 *
 *    | Year | `yy` | `uu` |
 *    |------|------|------|
 *    | 1    |   01 |   01 |
 *    | 14   |   14 |   14 |
 *    | 376  |   76 |  376 |
 *    | 1453 |   53 | 1453 |
 *
 *    The same difference is true for local and ISO week-numbering years (`Y` and `R`),
 *    except local week-numbering years are dependent on `options.weekStartsOn`
 *    and `options.firstWeekContainsDate` (compare [getISOWeekYear](https://date-fns.org/docs/getISOWeekYear)
 *    and [getWeekYear](https://date-fns.org/docs/getWeekYear)).
 *
 * 6. Specific non-location timezones are currently unavailable in `date-fns`,
 *    so right now these tokens fall back to GMT timezones.
 *
 * 7. These patterns are not in the Unicode Technical Standard #35:
 *    - `i`: ISO day of week
 *    - `I`: ISO week of year
 *    - `R`: ISO week-numbering year
 *    - `t`: seconds timestamp
 *    - `T`: milliseconds timestamp
 *    - `o`: ordinal number modifier
 *    - `P`: long localized date
 *    - `p`: long localized time
 *
 * 8. `YY` and `YYYY` tokens represent week-numbering years but they are often confused with years.
 *    You should enable `options.useAdditionalWeekYearTokens` to use them. See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 *
 * 9. `D` and `DD` tokens represent days of the year but they are often confused with days of the month.
 *    You should enable `options.useAdditionalDayOfYearTokens` to use them. See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 *
 * @param date - The original date
 * @param format - The string of tokens
 * @param options - An object with options
 *
 * @returns The formatted date string
 *
 * @throws `date` must not be Invalid Date
 * @throws `options.locale` must contain `localize` property
 * @throws `options.locale` must contain `formatLong` property
 * @throws use `yyyy` instead of `YYYY` for formatting years using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 * @throws use `yy` instead of `YY` for formatting years using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 * @throws use `d` instead of `D` for formatting days of the month using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 * @throws use `dd` instead of `DD` for formatting days of the month using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 * @throws format string contains an unescaped latin alphabet character
 *
 * @example
 * // Represent 11 February 2014 in middle-endian format:
 * const result = format(new Date(2014, 1, 11), 'MM/dd/yyyy')
 * //=> '02/11/2014'
 *
 * @example
 * // Represent 2 July 2014 in Esperanto:
 * import { eoLocale } from 'date-fns/locale/eo'
 * const result = format(new Date(2014, 6, 2), "do 'de' MMMM yyyy", {
 *   locale: eoLocale
 * })
 * //=> '2-a de julio 2014'
 *
 * @example
 * // Escape string by single quote characters:
 * const result = format(new Date(2014, 6, 2, 15), "h 'o''clock'")
 * //=> "3 o'clock"
 */
function format(date, formatStr, options) {
  const defaultOptions = getDefaultOptions$1();
  const locale = options?.locale ?? defaultOptions.locale ?? enUS;

  const firstWeekContainsDate =
    options?.firstWeekContainsDate ??
    options?.locale?.options?.firstWeekContainsDate ??
    defaultOptions.firstWeekContainsDate ??
    defaultOptions.locale?.options?.firstWeekContainsDate ??
    1;

  const weekStartsOn =
    options?.weekStartsOn ??
    options?.locale?.options?.weekStartsOn ??
    defaultOptions.weekStartsOn ??
    defaultOptions.locale?.options?.weekStartsOn ??
    0;

  const originalDate = toDate(date, options?.in);

  if (!isValid(originalDate)) {
    throw new RangeError("Invalid time value");
  }

  let parts = formatStr
    .match(longFormattingTokensRegExp$1)
    .map((substring) => {
      const firstCharacter = substring[0];
      if (firstCharacter === "p" || firstCharacter === "P") {
        const longFormatter = longFormatters[firstCharacter];
        return longFormatter(substring, locale.formatLong);
      }
      return substring;
    })
    .join("")
    .match(formattingTokensRegExp$1)
    .map((substring) => {
      // Replace two single quote characters with one single quote character
      if (substring === "''") {
        return { isToken: false, value: "'" };
      }

      const firstCharacter = substring[0];
      if (firstCharacter === "'") {
        return { isToken: false, value: cleanEscapedString$1(substring) };
      }

      if (formatters[firstCharacter]) {
        return { isToken: true, value: substring };
      }

      if (firstCharacter.match(unescapedLatinCharacterRegExp$1)) {
        throw new RangeError(
          "Format string contains an unescaped latin alphabet character `" +
            firstCharacter +
            "`",
        );
      }

      return { isToken: false, value: substring };
    });

  // invoke localize preprocessor (only for french locales at the moment)
  if (locale.localize.preprocessor) {
    parts = locale.localize.preprocessor(originalDate, parts);
  }

  const formatterOptions = {
    firstWeekContainsDate,
    weekStartsOn,
    locale,
  };

  return parts
    .map((part) => {
      if (!part.isToken) return part.value;

      const token = part.value;

      if (
        (!options?.useAdditionalWeekYearTokens &&
          isProtectedWeekYearToken(token)) ||
        (!options?.useAdditionalDayOfYearTokens &&
          isProtectedDayOfYearToken(token))
      ) {
        warnOrThrowProtectedError(token, formatStr, String(date));
      }

      const formatter = formatters[token[0]];
      return formatter(originalDate, token, locale.localize, formatterOptions);
    })
    .join("");
}

function cleanEscapedString$1(input) {
  const matched = input.match(escapedStringRegExp$1);

  if (!matched) {
    return input;
  }

  return matched[1].replace(doubleQuoteRegExp$1, "'");
}

/**
 * @name getDefaultOptions
 * @category Common Helpers
 * @summary Get default options.
 * @pure false
 *
 * @description
 * Returns an object that contains defaults for
 * `options.locale`, `options.weekStartsOn` and `options.firstWeekContainsDate`
 * arguments for all functions.
 *
 * You can change these with [setDefaultOptions](https://date-fns.org/docs/setDefaultOptions).
 *
 * @returns The default options
 *
 * @example
 * const result = getDefaultOptions()
 * //=> {}
 *
 * @example
 * setDefaultOptions({ weekStarsOn: 1, firstWeekContainsDate: 4 })
 * const result = getDefaultOptions()
 * //=> { weekStarsOn: 1, firstWeekContainsDate: 4 }
 */
function getDefaultOptions() {
  return Object.assign({}, getDefaultOptions$1());
}

/**
 * The {@link getISODay} function options.
 */

/**
 * @name getISODay
 * @category Weekday Helpers
 * @summary Get the day of the ISO week of the given date.
 *
 * @description
 * Get the day of the ISO week of the given date,
 * which is 7 for Sunday, 1 for Monday etc.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param date - The given date
 * @param options - An object with options
 *
 * @returns The day of ISO week
 *
 * @example
 * // Which day of the ISO week is 26 February 2012?
 * const result = getISODay(new Date(2012, 1, 26))
 * //=> 7
 */
function getISODay(date, options) {
  const day = toDate(date, options?.in).getDay();
  return day === 0 ? 7 : day;
}

/**
 * @name transpose
 * @category Generic Helpers
 * @summary Transpose the date to the given constructor.
 *
 * @description
 * The function transposes the date to the given constructor. It helps you
 * to transpose the date in the system time zone to say `UTCDate` or any other
 * date extension.
 *
 * @typeParam InputDate - The input `Date` type derived from the passed argument.
 * @typeParam ResultDate - The result `Date` type derived from the passed constructor.
 *
 * @param date - The date to use values from
 * @param constructor - The date constructor to use
 *
 * @returns Date transposed to the given constructor
 *
 * @example
 * // Create July 10, 2022 00:00 in locale time zone
 * const date = new Date(2022, 6, 10)
 * //=> 'Sun Jul 10 2022 00:00:00 GMT+0800 (Singapore Standard Time)'
 *
 * @example
 * // Transpose the date to July 10, 2022 00:00 in UTC
 * transpose(date, UTCDate)
 * //=> 'Sun Jul 10 2022 00:00:00 GMT+0000 (Coordinated Universal Time)'
 */
function transpose(date, constructor) {
  const date_ = isConstructor(constructor)
    ? new constructor(0)
    : constructFrom(constructor, 0);
  date_.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  date_.setHours(
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
  return date_;
}

function isConstructor(constructor) {
  return (
    typeof constructor === "function" &&
    constructor.prototype?.constructor === constructor
  );
}

const TIMEZONE_UNIT_PRIORITY = 10;

class Setter {
  subPriority = 0;

  validate(_utcDate, _options) {
    return true;
  }
}

class ValueSetter extends Setter {
  constructor(
    value,

    validateValue,

    setValue,

    priority,
    subPriority,
  ) {
    super();
    this.value = value;
    this.validateValue = validateValue;
    this.setValue = setValue;
    this.priority = priority;
    if (subPriority) {
      this.subPriority = subPriority;
    }
  }

  validate(date, options) {
    return this.validateValue(date, this.value, options);
  }

  set(date, flags, options) {
    return this.setValue(date, flags, this.value, options);
  }
}

class DateTimezoneSetter extends Setter {
  priority = TIMEZONE_UNIT_PRIORITY;
  subPriority = -1;

  constructor(context, reference) {
    super();
    this.context = context || ((date) => constructFrom(reference, date));
  }

  set(date, flags) {
    if (flags.timestampIsSet) return date;
    return constructFrom(date, transpose(date, this.context));
  }
}

class Parser {
  run(dateString, token, match, options) {
    const result = this.parse(dateString, token, match, options);
    if (!result) {
      return null;
    }

    return {
      setter: new ValueSetter(
        result.value,
        this.validate,
        this.set,
        this.priority,
        this.subPriority,
      ),
      rest: result.rest,
    };
  }

  validate(_utcDate, _value, _options) {
    return true;
  }
}

class EraParser extends Parser {
  priority = 140;

  parse(dateString, token, match) {
    switch (token) {
      // AD, BC
      case "G":
      case "GG":
      case "GGG":
        return (
          match.era(dateString, { width: "abbreviated" }) ||
          match.era(dateString, { width: "narrow" })
        );

      // A, B
      case "GGGGG":
        return match.era(dateString, { width: "narrow" });
      // Anno Domini, Before Christ
      case "GGGG":
      default:
        return (
          match.era(dateString, { width: "wide" }) ||
          match.era(dateString, { width: "abbreviated" }) ||
          match.era(dateString, { width: "narrow" })
        );
    }
  }

  set(date, flags, value) {
    flags.era = value;
    date.setFullYear(value, 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  incompatibleTokens = ["R", "u", "t", "T"];
}

const numericPatterns = {
  month: /^(1[0-2]|0?\d)/, // 0 to 12
  date: /^(3[0-1]|[0-2]?\d)/, // 0 to 31
  dayOfYear: /^(36[0-6]|3[0-5]\d|[0-2]?\d?\d)/, // 0 to 366
  week: /^(5[0-3]|[0-4]?\d)/, // 0 to 53
  hour23h: /^(2[0-3]|[0-1]?\d)/, // 0 to 23
  hour24h: /^(2[0-4]|[0-1]?\d)/, // 0 to 24
  hour11h: /^(1[0-1]|0?\d)/, // 0 to 11
  hour12h: /^(1[0-2]|0?\d)/, // 0 to 12
  minute: /^[0-5]?\d/, // 0 to 59
  second: /^[0-5]?\d/, // 0 to 59

  singleDigit: /^\d/, // 0 to 9
  twoDigits: /^\d{1,2}/, // 0 to 99
  threeDigits: /^\d{1,3}/, // 0 to 999
  fourDigits: /^\d{1,4}/, // 0 to 9999

  anyDigitsSigned: /^-?\d+/,
  singleDigitSigned: /^-?\d/, // 0 to 9, -0 to -9
  twoDigitsSigned: /^-?\d{1,2}/, // 0 to 99, -0 to -99
  threeDigitsSigned: /^-?\d{1,3}/, // 0 to 999, -0 to -999
  fourDigitsSigned: /^-?\d{1,4}/, // 0 to 9999, -0 to -9999
};

const timezonePatterns = {
  basicOptionalMinutes: /^([+-])(\d{2})(\d{2})?|Z/,
  basic: /^([+-])(\d{2})(\d{2})|Z/,
  basicOptionalSeconds: /^([+-])(\d{2})(\d{2})((\d{2}))?|Z/,
  extended: /^([+-])(\d{2}):(\d{2})|Z/,
  extendedOptionalSeconds: /^([+-])(\d{2}):(\d{2})(:(\d{2}))?|Z/,
};

function mapValue(parseFnResult, mapFn) {
  if (!parseFnResult) {
    return parseFnResult;
  }

  return {
    value: mapFn(parseFnResult.value),
    rest: parseFnResult.rest,
  };
}

function parseNumericPattern(pattern, dateString) {
  const matchResult = dateString.match(pattern);

  if (!matchResult) {
    return null;
  }

  return {
    value: parseInt(matchResult[0], 10),
    rest: dateString.slice(matchResult[0].length),
  };
}

function parseTimezonePattern(pattern, dateString) {
  const matchResult = dateString.match(pattern);

  if (!matchResult) {
    return null;
  }

  // Input is 'Z'
  if (matchResult[0] === "Z") {
    return {
      value: 0,
      rest: dateString.slice(1),
    };
  }

  const sign = matchResult[1] === "+" ? 1 : -1;
  const hours = matchResult[2] ? parseInt(matchResult[2], 10) : 0;
  const minutes = matchResult[3] ? parseInt(matchResult[3], 10) : 0;
  const seconds = matchResult[5] ? parseInt(matchResult[5], 10) : 0;

  return {
    value:
      sign *
      (hours * millisecondsInHour +
        minutes * millisecondsInMinute +
        seconds * millisecondsInSecond),
    rest: dateString.slice(matchResult[0].length),
  };
}

function parseAnyDigitsSigned(dateString) {
  return parseNumericPattern(numericPatterns.anyDigitsSigned, dateString);
}

function parseNDigits(n, dateString) {
  switch (n) {
    case 1:
      return parseNumericPattern(numericPatterns.singleDigit, dateString);
    case 2:
      return parseNumericPattern(numericPatterns.twoDigits, dateString);
    case 3:
      return parseNumericPattern(numericPatterns.threeDigits, dateString);
    case 4:
      return parseNumericPattern(numericPatterns.fourDigits, dateString);
    default:
      return parseNumericPattern(new RegExp("^\\d{1," + n + "}"), dateString);
  }
}

function parseNDigitsSigned(n, dateString) {
  switch (n) {
    case 1:
      return parseNumericPattern(numericPatterns.singleDigitSigned, dateString);
    case 2:
      return parseNumericPattern(numericPatterns.twoDigitsSigned, dateString);
    case 3:
      return parseNumericPattern(numericPatterns.threeDigitsSigned, dateString);
    case 4:
      return parseNumericPattern(numericPatterns.fourDigitsSigned, dateString);
    default:
      return parseNumericPattern(new RegExp("^-?\\d{1," + n + "}"), dateString);
  }
}

function dayPeriodEnumToHours(dayPeriod) {
  switch (dayPeriod) {
    case "morning":
      return 4;
    case "evening":
      return 17;
    case "pm":
    case "noon":
    case "afternoon":
      return 12;
    case "am":
    case "midnight":
    case "night":
    default:
      return 0;
  }
}

function normalizeTwoDigitYear(twoDigitYear, currentYear) {
  const isCommonEra = currentYear > 0;
  // Absolute number of the current year:
  // 1 -> 1 AC
  // 0 -> 1 BC
  // -1 -> 2 BC
  const absCurrentYear = isCommonEra ? currentYear : 1 - currentYear;

  let result;
  if (absCurrentYear <= 50) {
    result = twoDigitYear || 100;
  } else {
    const rangeEnd = absCurrentYear + 50;
    const rangeEndCentury = Math.trunc(rangeEnd / 100) * 100;
    const isPreviousCentury = twoDigitYear >= rangeEnd % 100;
    result = twoDigitYear + rangeEndCentury - (isPreviousCentury ? 100 : 0);
  }

  return isCommonEra ? result : 1 - result;
}

function isLeapYearIndex(year) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

// From http://www.unicode.org/reports/tr35/tr35-31/tr35-dates.html#Date_Format_Patterns
// | Year     |     y | yy |   yyy |  yyyy | yyyyy |
// |----------|-------|----|-------|-------|-------|
// | AD 1     |     1 | 01 |   001 |  0001 | 00001 |
// | AD 12    |    12 | 12 |   012 |  0012 | 00012 |
// | AD 123   |   123 | 23 |   123 |  0123 | 00123 |
// | AD 1234  |  1234 | 34 |  1234 |  1234 | 01234 |
// | AD 12345 | 12345 | 45 | 12345 | 12345 | 12345 |
class YearParser extends Parser {
  priority = 130;
  incompatibleTokens = ["Y", "R", "u", "w", "I", "i", "e", "c", "t", "T"];

  parse(dateString, token, match) {
    const valueCallback = (year) => ({
      year,
      isTwoDigitYear: token === "yy",
    });

    switch (token) {
      case "y":
        return mapValue(parseNDigits(4, dateString), valueCallback);
      case "yo":
        return mapValue(
          match.ordinalNumber(dateString, {
            unit: "year",
          }),
          valueCallback,
        );
      default:
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
    }
  }

  validate(_date, value) {
    return value.isTwoDigitYear || value.year > 0;
  }

  set(date, flags, value) {
    const currentYear = date.getFullYear();

    if (value.isTwoDigitYear) {
      const normalizedTwoDigitYear = normalizeTwoDigitYear(
        value.year,
        currentYear,
      );
      date.setFullYear(normalizedTwoDigitYear, 0, 1);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    const year =
      !("era" in flags) || flags.era === 1 ? value.year : 1 - value.year;
    date.setFullYear(year, 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}

// Local week-numbering year
class LocalWeekYearParser extends Parser {
  priority = 130;

  parse(dateString, token, match) {
    const valueCallback = (year) => ({
      year,
      isTwoDigitYear: token === "YY",
    });

    switch (token) {
      case "Y":
        return mapValue(parseNDigits(4, dateString), valueCallback);
      case "Yo":
        return mapValue(
          match.ordinalNumber(dateString, {
            unit: "year",
          }),
          valueCallback,
        );
      default:
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
    }
  }

  validate(_date, value) {
    return value.isTwoDigitYear || value.year > 0;
  }

  set(date, flags, value, options) {
    const currentYear = getWeekYear(date, options);

    if (value.isTwoDigitYear) {
      const normalizedTwoDigitYear = normalizeTwoDigitYear(
        value.year,
        currentYear,
      );
      date.setFullYear(
        normalizedTwoDigitYear,
        0,
        options.firstWeekContainsDate,
      );
      date.setHours(0, 0, 0, 0);
      return startOfWeek(date, options);
    }

    const year =
      !("era" in flags) || flags.era === 1 ? value.year : 1 - value.year;
    date.setFullYear(year, 0, options.firstWeekContainsDate);
    date.setHours(0, 0, 0, 0);
    return startOfWeek(date, options);
  }

  incompatibleTokens = [
    "y",
    "R",
    "u",
    "Q",
    "q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "i",
    "t",
    "T",
  ];
}

// ISO week-numbering year
class ISOWeekYearParser extends Parser {
  priority = 130;

  parse(dateString, token) {
    if (token === "R") {
      return parseNDigitsSigned(4, dateString);
    }

    return parseNDigitsSigned(token.length, dateString);
  }

  set(date, _flags, value) {
    const firstWeekOfYear = constructFrom(date, 0);
    firstWeekOfYear.setFullYear(value, 0, 4);
    firstWeekOfYear.setHours(0, 0, 0, 0);
    return startOfISOWeek(firstWeekOfYear);
  }

  incompatibleTokens = [
    "G",
    "y",
    "Y",
    "u",
    "Q",
    "q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "e",
    "c",
    "t",
    "T",
  ];
}

class ExtendedYearParser extends Parser {
  priority = 130;

  parse(dateString, token) {
    if (token === "u") {
      return parseNDigitsSigned(4, dateString);
    }

    return parseNDigitsSigned(token.length, dateString);
  }

  set(date, _flags, value) {
    date.setFullYear(value, 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  incompatibleTokens = ["G", "y", "Y", "R", "w", "I", "i", "e", "c", "t", "T"];
}

class QuarterParser extends Parser {
  priority = 120;

  parse(dateString, token, match) {
    switch (token) {
      // 1, 2, 3, 4
      case "Q":
      case "QQ": // 01, 02, 03, 04
        return parseNDigits(token.length, dateString);
      // 1st, 2nd, 3rd, 4th
      case "Qo":
        return match.ordinalNumber(dateString, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "QQQ":
        return (
          match.quarter(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
          match.quarter(dateString, {
            width: "narrow",
            context: "formatting",
          })
        );

      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "QQQQQ":
        return match.quarter(dateString, {
          width: "narrow",
          context: "formatting",
        });
      // 1st quarter, 2nd quarter, ...
      case "QQQQ":
      default:
        return (
          match.quarter(dateString, {
            width: "wide",
            context: "formatting",
          }) ||
          match.quarter(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
          match.quarter(dateString, {
            width: "narrow",
            context: "formatting",
          })
        );
    }
  }

  validate(_date, value) {
    return value >= 1 && value <= 4;
  }

  set(date, _flags, value) {
    date.setMonth((value - 1) * 3, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T",
  ];
}

class StandAloneQuarterParser extends Parser {
  priority = 120;

  parse(dateString, token, match) {
    switch (token) {
      // 1, 2, 3, 4
      case "q":
      case "qq": // 01, 02, 03, 04
        return parseNDigits(token.length, dateString);
      // 1st, 2nd, 3rd, 4th
      case "qo":
        return match.ordinalNumber(dateString, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "qqq":
        return (
          match.quarter(dateString, {
            width: "abbreviated",
            context: "standalone",
          }) ||
          match.quarter(dateString, {
            width: "narrow",
            context: "standalone",
          })
        );

      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "qqqqq":
        return match.quarter(dateString, {
          width: "narrow",
          context: "standalone",
        });
      // 1st quarter, 2nd quarter, ...
      case "qqqq":
      default:
        return (
          match.quarter(dateString, {
            width: "wide",
            context: "standalone",
          }) ||
          match.quarter(dateString, {
            width: "abbreviated",
            context: "standalone",
          }) ||
          match.quarter(dateString, {
            width: "narrow",
            context: "standalone",
          })
        );
    }
  }

  validate(_date, value) {
    return value >= 1 && value <= 4;
  }

  set(date, _flags, value) {
    date.setMonth((value - 1) * 3, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  incompatibleTokens = [
    "Y",
    "R",
    "Q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T",
  ];
}

class MonthParser extends Parser {
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "L",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T",
  ];

  priority = 110;

  parse(dateString, token, match) {
    const valueCallback = (value) => value - 1;

    switch (token) {
      // 1, 2, ..., 12
      case "M":
        return mapValue(
          parseNumericPattern(numericPatterns.month, dateString),
          valueCallback,
        );
      // 01, 02, ..., 12
      case "MM":
        return mapValue(parseNDigits(2, dateString), valueCallback);
      // 1st, 2nd, ..., 12th
      case "Mo":
        return mapValue(
          match.ordinalNumber(dateString, {
            unit: "month",
          }),
          valueCallback,
        );
      // Jan, Feb, ..., Dec
      case "MMM":
        return (
          match.month(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
          match.month(dateString, { width: "narrow", context: "formatting" })
        );

      // J, F, ..., D
      case "MMMMM":
        return match.month(dateString, {
          width: "narrow",
          context: "formatting",
        });
      // January, February, ..., December
      case "MMMM":
      default:
        return (
          match.month(dateString, { width: "wide", context: "formatting" }) ||
          match.month(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
          match.month(dateString, { width: "narrow", context: "formatting" })
        );
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 11;
  }

  set(date, _flags, value) {
    date.setMonth(value, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}

class StandAloneMonthParser extends Parser {
  priority = 110;

  parse(dateString, token, match) {
    const valueCallback = (value) => value - 1;

    switch (token) {
      // 1, 2, ..., 12
      case "L":
        return mapValue(
          parseNumericPattern(numericPatterns.month, dateString),
          valueCallback,
        );
      // 01, 02, ..., 12
      case "LL":
        return mapValue(parseNDigits(2, dateString), valueCallback);
      // 1st, 2nd, ..., 12th
      case "Lo":
        return mapValue(
          match.ordinalNumber(dateString, {
            unit: "month",
          }),
          valueCallback,
        );
      // Jan, Feb, ..., Dec
      case "LLL":
        return (
          match.month(dateString, {
            width: "abbreviated",
            context: "standalone",
          }) ||
          match.month(dateString, { width: "narrow", context: "standalone" })
        );

      // J, F, ..., D
      case "LLLLL":
        return match.month(dateString, {
          width: "narrow",
          context: "standalone",
        });
      // January, February, ..., December
      case "LLLL":
      default:
        return (
          match.month(dateString, { width: "wide", context: "standalone" }) ||
          match.month(dateString, {
            width: "abbreviated",
            context: "standalone",
          }) ||
          match.month(dateString, { width: "narrow", context: "standalone" })
        );
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 11;
  }

  set(date, _flags, value) {
    date.setMonth(value, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "M",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T",
  ];
}

/**
 * The {@link setWeek} function options.
 */

/**
 * @name setWeek
 * @category Week Helpers
 * @summary Set the local week to the given date.
 *
 * @description
 * Set the local week to the given date, saving the weekday number.
 * The exact calculation depends on the values of
 * `options.weekStartsOn` (which is the index of the first day of the week)
 * and `options.firstWeekContainsDate` (which is the day of January, which is always in
 * the first week of the week-numbering year)
 *
 * Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
 *
 * @param date - The date to be changed
 * @param week - The week of the new date
 * @param options - An object with options
 *
 * @returns The new date with the local week set
 *
 * @example
 * // Set the 1st week to 2 January 2005 with default options:
 * const result = setWeek(new Date(2005, 0, 2), 1)
 * //=> Sun Dec 26 2004 00:00:00
 *
 * @example
 * // Set the 1st week to 2 January 2005,
 * // if Monday is the first day of the week,
 * // and the first week of the year always contains 4 January:
 * const result = setWeek(new Date(2005, 0, 2), 1, {
 *   weekStartsOn: 1,
 *   firstWeekContainsDate: 4
 * })
 * //=> Sun Jan 4 2004 00:00:00
 */
function setWeek(date, week, options) {
  const date_ = toDate(date, options?.in);
  const diff = getWeek(date_, options) - week;
  date_.setDate(date_.getDate() - diff * 7);
  return toDate(date_, options?.in);
}

// Local week of year
class LocalWeekParser extends Parser {
  priority = 100;

  parse(dateString, token, match) {
    switch (token) {
      case "w":
        return parseNumericPattern(numericPatterns.week, dateString);
      case "wo":
        return match.ordinalNumber(dateString, { unit: "week" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }

  validate(_date, value) {
    return value >= 1 && value <= 53;
  }

  set(date, _flags, value, options) {
    return startOfWeek(setWeek(date, value, options), options);
  }

  incompatibleTokens = [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "i",
    "t",
    "T",
  ];
}

/**
 * The {@link setISOWeek} function options.
 */

/**
 * @name setISOWeek
 * @category ISO Week Helpers
 * @summary Set the ISO week to the given date.
 *
 * @description
 * Set the ISO week to the given date, saving the weekday number.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 * @typeParam ResultDate - The `Date` type of the context function.
 *
 * @param date - The date to be changed
 * @param week - The ISO week of the new date
 * @param options - An object with options
 *
 * @returns The new date with the ISO week set
 *
 * @example
 * // Set the 53rd ISO week to 7 August 2004:
 * const result = setISOWeek(new Date(2004, 7, 7), 53)
 * //=> Sat Jan 01 2005 00:00:00
 */
function setISOWeek(date, week, options) {
  const _date = toDate(date, options?.in);
  const diff = getISOWeek(_date, options) - week;
  _date.setDate(_date.getDate() - diff * 7);
  return _date;
}

// ISO week of year
class ISOWeekParser extends Parser {
  priority = 100;

  parse(dateString, token, match) {
    switch (token) {
      case "I":
        return parseNumericPattern(numericPatterns.week, dateString);
      case "Io":
        return match.ordinalNumber(dateString, { unit: "week" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }

  validate(_date, value) {
    return value >= 1 && value <= 53;
  }

  set(date, _flags, value) {
    return startOfISOWeek(setISOWeek(date, value));
  }

  incompatibleTokens = [
    "y",
    "Y",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "e",
    "c",
    "t",
    "T",
  ];
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DAYS_IN_MONTH_LEAP_YEAR = [
  31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
];

// Day of the month
class DateParser extends Parser {
  priority = 90;
  subPriority = 1;

  parse(dateString, token, match) {
    switch (token) {
      case "d":
        return parseNumericPattern(numericPatterns.date, dateString);
      case "do":
        return match.ordinalNumber(dateString, { unit: "date" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }

  validate(date, value) {
    const year = date.getFullYear();
    const isLeapYear = isLeapYearIndex(year);
    const month = date.getMonth();
    if (isLeapYear) {
      return value >= 1 && value <= DAYS_IN_MONTH_LEAP_YEAR[month];
    } else {
      return value >= 1 && value <= DAYS_IN_MONTH[month];
    }
  }

  set(date, _flags, value) {
    date.setDate(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T",
  ];
}

class DayOfYearParser extends Parser {
  priority = 90;

  subpriority = 1;

  parse(dateString, token, match) {
    switch (token) {
      case "D":
      case "DD":
        return parseNumericPattern(numericPatterns.dayOfYear, dateString);
      case "Do":
        return match.ordinalNumber(dateString, { unit: "date" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }

  validate(date, value) {
    const year = date.getFullYear();
    const isLeapYear = isLeapYearIndex(year);
    if (isLeapYear) {
      return value >= 1 && value <= 366;
    } else {
      return value >= 1 && value <= 365;
    }
  }

  set(date, _flags, value) {
    date.setMonth(0, value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "E",
    "i",
    "e",
    "c",
    "t",
    "T",
  ];
}

/**
 * The {@link setDay} function options.
 */

/**
 * @name setDay
 * @category Weekday Helpers
 * @summary Set the day of the week to the given date.
 *
 * @description
 * Set the day of the week to the given date.
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
 *
 * @param date - The date to be changed
 * @param day - The day of the week of the new date
 * @param options - An object with options.
 *
 * @returns The new date with the day of the week set
 *
 * @example
 * // Set week day to Sunday, with the default weekStartsOn of Sunday:
 * const result = setDay(new Date(2014, 8, 1), 0)
 * //=> Sun Aug 31 2014 00:00:00
 *
 * @example
 * // Set week day to Sunday, with a weekStartsOn of Monday:
 * const result = setDay(new Date(2014, 8, 1), 0, { weekStartsOn: 1 })
 * //=> Sun Sep 07 2014 00:00:00
 */
function setDay(date, day, options) {
  const defaultOptions = getDefaultOptions$1();
  const weekStartsOn =
    options?.weekStartsOn ??
    options?.locale?.options?.weekStartsOn ??
    defaultOptions.weekStartsOn ??
    defaultOptions.locale?.options?.weekStartsOn ??
    0;

  const date_ = toDate(date, options?.in);
  const currentDay = date_.getDay();

  const remainder = day % 7;
  const dayIndex = (remainder + 7) % 7;

  const delta = 7 - weekStartsOn;
  const diff =
    day < 0 || day > 6
      ? day - ((currentDay + delta) % 7)
      : ((dayIndex + delta) % 7) - ((currentDay + delta) % 7);
  return addDays(date_, diff, options);
}

// Day of week
class DayParser extends Parser {
  priority = 90;

  parse(dateString, token, match) {
    switch (token) {
      // Tue
      case "E":
      case "EE":
      case "EEE":
        return (
          match.day(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
          match.day(dateString, { width: "short", context: "formatting" }) ||
          match.day(dateString, { width: "narrow", context: "formatting" })
        );

      // T
      case "EEEEE":
        return match.day(dateString, {
          width: "narrow",
          context: "formatting",
        });
      // Tu
      case "EEEEEE":
        return (
          match.day(dateString, { width: "short", context: "formatting" }) ||
          match.day(dateString, { width: "narrow", context: "formatting" })
        );

      // Tuesday
      case "EEEE":
      default:
        return (
          match.day(dateString, { width: "wide", context: "formatting" }) ||
          match.day(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
          match.day(dateString, { width: "short", context: "formatting" }) ||
          match.day(dateString, { width: "narrow", context: "formatting" })
        );
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 6;
  }

  set(date, _flags, value, options) {
    date = setDay(date, value, options);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  incompatibleTokens = ["D", "i", "e", "c", "t", "T"];
}

// Local day of week
class LocalDayParser extends Parser {
  priority = 90;
  parse(dateString, token, match, options) {
    const valueCallback = (value) => {
      // We want here floor instead of trunc, so we get -7 for value 0 instead of 0
      const wholeWeekDays = Math.floor((value - 1) / 7) * 7;
      return ((value + options.weekStartsOn + 6) % 7) + wholeWeekDays;
    };

    switch (token) {
      // 3
      case "e":
      case "ee": // 03
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
      // 3rd
      case "eo":
        return mapValue(
          match.ordinalNumber(dateString, {
            unit: "day",
          }),
          valueCallback,
        );
      // Tue
      case "eee":
        return (
          match.day(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
          match.day(dateString, { width: "short", context: "formatting" }) ||
          match.day(dateString, { width: "narrow", context: "formatting" })
        );

      // T
      case "eeeee":
        return match.day(dateString, {
          width: "narrow",
          context: "formatting",
        });
      // Tu
      case "eeeeee":
        return (
          match.day(dateString, { width: "short", context: "formatting" }) ||
          match.day(dateString, { width: "narrow", context: "formatting" })
        );

      // Tuesday
      case "eeee":
      default:
        return (
          match.day(dateString, { width: "wide", context: "formatting" }) ||
          match.day(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
          match.day(dateString, { width: "short", context: "formatting" }) ||
          match.day(dateString, { width: "narrow", context: "formatting" })
        );
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 6;
  }

  set(date, _flags, value, options) {
    date = setDay(date, value, options);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  incompatibleTokens = [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "E",
    "i",
    "c",
    "t",
    "T",
  ];
}

// Stand-alone local day of week
class StandAloneLocalDayParser extends Parser {
  priority = 90;

  parse(dateString, token, match, options) {
    const valueCallback = (value) => {
      // We want here floor instead of trunc, so we get -7 for value 0 instead of 0
      const wholeWeekDays = Math.floor((value - 1) / 7) * 7;
      return ((value + options.weekStartsOn + 6) % 7) + wholeWeekDays;
    };

    switch (token) {
      // 3
      case "c":
      case "cc": // 03
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
      // 3rd
      case "co":
        return mapValue(
          match.ordinalNumber(dateString, {
            unit: "day",
          }),
          valueCallback,
        );
      // Tue
      case "ccc":
        return (
          match.day(dateString, {
            width: "abbreviated",
            context: "standalone",
          }) ||
          match.day(dateString, { width: "short", context: "standalone" }) ||
          match.day(dateString, { width: "narrow", context: "standalone" })
        );

      // T
      case "ccccc":
        return match.day(dateString, {
          width: "narrow",
          context: "standalone",
        });
      // Tu
      case "cccccc":
        return (
          match.day(dateString, { width: "short", context: "standalone" }) ||
          match.day(dateString, { width: "narrow", context: "standalone" })
        );

      // Tuesday
      case "cccc":
      default:
        return (
          match.day(dateString, { width: "wide", context: "standalone" }) ||
          match.day(dateString, {
            width: "abbreviated",
            context: "standalone",
          }) ||
          match.day(dateString, { width: "short", context: "standalone" }) ||
          match.day(dateString, { width: "narrow", context: "standalone" })
        );
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 6;
  }

  set(date, _flags, value, options) {
    date = setDay(date, value, options);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  incompatibleTokens = [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "E",
    "i",
    "e",
    "t",
    "T",
  ];
}

/**
 * The {@link setISODay} function options.
 */

/**
 * @name setISODay
 * @category Weekday Helpers
 * @summary Set the day of the ISO week to the given date.
 *
 * @description
 * Set the day of the ISO week to the given date.
 * ISO week starts with Monday.
 * 7 is the index of Sunday, 1 is the index of Monday, etc.
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
 *
 * @param date - The date to be changed
 * @param day - The day of the ISO week of the new date
 * @param options - An object with options
 *
 * @returns The new date with the day of the ISO week set
 *
 * @example
 * // Set Sunday to 1 September 2014:
 * const result = setISODay(new Date(2014, 8, 1), 7)
 * //=> Sun Sep 07 2014 00:00:00
 */
function setISODay(date, day, options) {
  const date_ = toDate(date, options?.in);
  const currentDay = getISODay(date_, options);
  const diff = day - currentDay;
  return addDays(date_, diff, options);
}

// ISO day of week
class ISODayParser extends Parser {
  priority = 90;

  parse(dateString, token, match) {
    const valueCallback = (value) => {
      if (value === 0) {
        return 7;
      }
      return value;
    };

    switch (token) {
      // 2
      case "i":
      case "ii": // 02
        return parseNDigits(token.length, dateString);
      // 2nd
      case "io":
        return match.ordinalNumber(dateString, { unit: "day" });
      // Tue
      case "iii":
        return mapValue(
          match.day(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
            match.day(dateString, {
              width: "short",
              context: "formatting",
            }) ||
            match.day(dateString, {
              width: "narrow",
              context: "formatting",
            }),
          valueCallback,
        );
      // T
      case "iiiii":
        return mapValue(
          match.day(dateString, {
            width: "narrow",
            context: "formatting",
          }),
          valueCallback,
        );
      // Tu
      case "iiiiii":
        return mapValue(
          match.day(dateString, {
            width: "short",
            context: "formatting",
          }) ||
            match.day(dateString, {
              width: "narrow",
              context: "formatting",
            }),
          valueCallback,
        );
      // Tuesday
      case "iiii":
      default:
        return mapValue(
          match.day(dateString, {
            width: "wide",
            context: "formatting",
          }) ||
            match.day(dateString, {
              width: "abbreviated",
              context: "formatting",
            }) ||
            match.day(dateString, {
              width: "short",
              context: "formatting",
            }) ||
            match.day(dateString, {
              width: "narrow",
              context: "formatting",
            }),
          valueCallback,
        );
    }
  }

  validate(_date, value) {
    return value >= 1 && value <= 7;
  }

  set(date, _flags, value) {
    date = setISODay(date, value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  incompatibleTokens = [
    "y",
    "Y",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "E",
    "e",
    "c",
    "t",
    "T",
  ];
}

class AMPMParser extends Parser {
  priority = 80;

  parse(dateString, token, match) {
    switch (token) {
      case "a":
      case "aa":
      case "aaa":
        return (
          match.dayPeriod(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
          match.dayPeriod(dateString, {
            width: "narrow",
            context: "formatting",
          })
        );

      case "aaaaa":
        return match.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting",
        });
      case "aaaa":
      default:
        return (
          match.dayPeriod(dateString, {
            width: "wide",
            context: "formatting",
          }) ||
          match.dayPeriod(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
          match.dayPeriod(dateString, {
            width: "narrow",
            context: "formatting",
          })
        );
    }
  }

  set(date, _flags, value) {
    date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);
    return date;
  }

  incompatibleTokens = ["b", "B", "H", "k", "t", "T"];
}

class AMPMMidnightParser extends Parser {
  priority = 80;

  parse(dateString, token, match) {
    switch (token) {
      case "b":
      case "bb":
      case "bbb":
        return (
          match.dayPeriod(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
          match.dayPeriod(dateString, {
            width: "narrow",
            context: "formatting",
          })
        );

      case "bbbbb":
        return match.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting",
        });
      case "bbbb":
      default:
        return (
          match.dayPeriod(dateString, {
            width: "wide",
            context: "formatting",
          }) ||
          match.dayPeriod(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
          match.dayPeriod(dateString, {
            width: "narrow",
            context: "formatting",
          })
        );
    }
  }

  set(date, _flags, value) {
    date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);
    return date;
  }

  incompatibleTokens = ["a", "B", "H", "k", "t", "T"];
}

// in the morning, in the afternoon, in the evening, at night
class DayPeriodParser extends Parser {
  priority = 80;

  parse(dateString, token, match) {
    switch (token) {
      case "B":
      case "BB":
      case "BBB":
        return (
          match.dayPeriod(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
          match.dayPeriod(dateString, {
            width: "narrow",
            context: "formatting",
          })
        );

      case "BBBBB":
        return match.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting",
        });
      case "BBBB":
      default:
        return (
          match.dayPeriod(dateString, {
            width: "wide",
            context: "formatting",
          }) ||
          match.dayPeriod(dateString, {
            width: "abbreviated",
            context: "formatting",
          }) ||
          match.dayPeriod(dateString, {
            width: "narrow",
            context: "formatting",
          })
        );
    }
  }

  set(date, _flags, value) {
    date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);
    return date;
  }

  incompatibleTokens = ["a", "b", "t", "T"];
}

class Hour1to12Parser extends Parser {
  priority = 70;

  parse(dateString, token, match) {
    switch (token) {
      case "h":
        return parseNumericPattern(numericPatterns.hour12h, dateString);
      case "ho":
        return match.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }

  validate(_date, value) {
    return value >= 1 && value <= 12;
  }

  set(date, _flags, value) {
    const isPM = date.getHours() >= 12;
    if (isPM && value < 12) {
      date.setHours(value + 12, 0, 0, 0);
    } else if (!isPM && value === 12) {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(value, 0, 0, 0);
    }
    return date;
  }

  incompatibleTokens = ["H", "K", "k", "t", "T"];
}

class Hour0to23Parser extends Parser {
  priority = 70;

  parse(dateString, token, match) {
    switch (token) {
      case "H":
        return parseNumericPattern(numericPatterns.hour23h, dateString);
      case "Ho":
        return match.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 23;
  }

  set(date, _flags, value) {
    date.setHours(value, 0, 0, 0);
    return date;
  }

  incompatibleTokens = ["a", "b", "h", "K", "k", "t", "T"];
}

class Hour0To11Parser extends Parser {
  priority = 70;

  parse(dateString, token, match) {
    switch (token) {
      case "K":
        return parseNumericPattern(numericPatterns.hour11h, dateString);
      case "Ko":
        return match.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 11;
  }

  set(date, _flags, value) {
    const isPM = date.getHours() >= 12;
    if (isPM && value < 12) {
      date.setHours(value + 12, 0, 0, 0);
    } else {
      date.setHours(value, 0, 0, 0);
    }
    return date;
  }

  incompatibleTokens = ["h", "H", "k", "t", "T"];
}

class Hour1To24Parser extends Parser {
  priority = 70;

  parse(dateString, token, match) {
    switch (token) {
      case "k":
        return parseNumericPattern(numericPatterns.hour24h, dateString);
      case "ko":
        return match.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }

  validate(_date, value) {
    return value >= 1 && value <= 24;
  }

  set(date, _flags, value) {
    const hours = value <= 24 ? value % 24 : value;
    date.setHours(hours, 0, 0, 0);
    return date;
  }

  incompatibleTokens = ["a", "b", "h", "H", "K", "t", "T"];
}

class MinuteParser extends Parser {
  priority = 60;

  parse(dateString, token, match) {
    switch (token) {
      case "m":
        return parseNumericPattern(numericPatterns.minute, dateString);
      case "mo":
        return match.ordinalNumber(dateString, { unit: "minute" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 59;
  }

  set(date, _flags, value) {
    date.setMinutes(value, 0, 0);
    return date;
  }

  incompatibleTokens = ["t", "T"];
}

class SecondParser extends Parser {
  priority = 50;

  parse(dateString, token, match) {
    switch (token) {
      case "s":
        return parseNumericPattern(numericPatterns.second, dateString);
      case "so":
        return match.ordinalNumber(dateString, { unit: "second" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 59;
  }

  set(date, _flags, value) {
    date.setSeconds(value, 0);
    return date;
  }

  incompatibleTokens = ["t", "T"];
}

class FractionOfSecondParser extends Parser {
  priority = 30;

  parse(dateString, token) {
    const valueCallback = (value) =>
      Math.trunc(value * Math.pow(10, -token.length + 3));
    return mapValue(parseNDigits(token.length, dateString), valueCallback);
  }

  set(date, _flags, value) {
    date.setMilliseconds(value);
    return date;
  }

  incompatibleTokens = ["t", "T"];
}

// Timezone (ISO-8601. +00:00 is `'Z'`)
class ISOTimezoneWithZParser extends Parser {
  priority = 10;

  parse(dateString, token) {
    switch (token) {
      case "X":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalMinutes,
          dateString,
        );
      case "XX":
        return parseTimezonePattern(timezonePatterns.basic, dateString);
      case "XXXX":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalSeconds,
          dateString,
        );
      case "XXXXX":
        return parseTimezonePattern(
          timezonePatterns.extendedOptionalSeconds,
          dateString,
        );
      case "XXX":
      default:
        return parseTimezonePattern(timezonePatterns.extended, dateString);
    }
  }

  set(date, flags, value) {
    if (flags.timestampIsSet) return date;
    return constructFrom(
      date,
      date.getTime() - getTimezoneOffsetInMilliseconds(date) - value,
    );
  }

  incompatibleTokens = ["t", "T", "x"];
}

// Timezone (ISO-8601)
class ISOTimezoneParser extends Parser {
  priority = 10;

  parse(dateString, token) {
    switch (token) {
      case "x":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalMinutes,
          dateString,
        );
      case "xx":
        return parseTimezonePattern(timezonePatterns.basic, dateString);
      case "xxxx":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalSeconds,
          dateString,
        );
      case "xxxxx":
        return parseTimezonePattern(
          timezonePatterns.extendedOptionalSeconds,
          dateString,
        );
      case "xxx":
      default:
        return parseTimezonePattern(timezonePatterns.extended, dateString);
    }
  }

  set(date, flags, value) {
    if (flags.timestampIsSet) return date;
    return constructFrom(
      date,
      date.getTime() - getTimezoneOffsetInMilliseconds(date) - value,
    );
  }

  incompatibleTokens = ["t", "T", "X"];
}

class TimestampSecondsParser extends Parser {
  priority = 40;

  parse(dateString) {
    return parseAnyDigitsSigned(dateString);
  }

  set(date, _flags, value) {
    return [constructFrom(date, value * 1000), { timestampIsSet: true }];
  }

  incompatibleTokens = "*";
}

class TimestampMillisecondsParser extends Parser {
  priority = 20;

  parse(dateString) {
    return parseAnyDigitsSigned(dateString);
  }

  set(date, _flags, value) {
    return [constructFrom(date, value), { timestampIsSet: true }];
  }

  incompatibleTokens = "*";
}

/*
 * |     | Unit                           |     | Unit                           |
 * |-----|--------------------------------|-----|--------------------------------|
 * |  a  | AM, PM                         |  A* | Milliseconds in day            |
 * |  b  | AM, PM, noon, midnight         |  B  | Flexible day period            |
 * |  c  | Stand-alone local day of week  |  C* | Localized hour w/ day period   |
 * |  d  | Day of month                   |  D  | Day of year                    |
 * |  e  | Local day of week              |  E  | Day of week                    |
 * |  f  |                                |  F* | Day of week in month           |
 * |  g* | Modified Julian day            |  G  | Era                            |
 * |  h  | Hour [1-12]                    |  H  | Hour [0-23]                    |
 * |  i! | ISO day of week                |  I! | ISO week of year               |
 * |  j* | Localized hour w/ day period   |  J* | Localized hour w/o day period  |
 * |  k  | Hour [1-24]                    |  K  | Hour [0-11]                    |
 * |  l* | (deprecated)                   |  L  | Stand-alone month              |
 * |  m  | Minute                         |  M  | Month                          |
 * |  n  |                                |  N  |                                |
 * |  o! | Ordinal number modifier        |  O* | Timezone (GMT)                 |
 * |  p  |                                |  P  |                                |
 * |  q  | Stand-alone quarter            |  Q  | Quarter                        |
 * |  r* | Related Gregorian year         |  R! | ISO week-numbering year        |
 * |  s  | Second                         |  S  | Fraction of second             |
 * |  t! | Seconds timestamp              |  T! | Milliseconds timestamp         |
 * |  u  | Extended year                  |  U* | Cyclic year                    |
 * |  v* | Timezone (generic non-locat.)  |  V* | Timezone (location)            |
 * |  w  | Local week of year             |  W* | Week of month                  |
 * |  x  | Timezone (ISO-8601 w/o Z)      |  X  | Timezone (ISO-8601)            |
 * |  y  | Year (abs)                     |  Y  | Local week-numbering year      |
 * |  z* | Timezone (specific non-locat.) |  Z* | Timezone (aliases)             |
 *
 * Letters marked by * are not implemented but reserved by Unicode standard.
 *
 * Letters marked by ! are non-standard, but implemented by date-fns:
 * - `o` modifies the previous token to turn it into an ordinal (see `parse` docs)
 * - `i` is ISO day of week. For `i` and `ii` is returns numeric ISO week days,
 *   i.e. 7 for Sunday, 1 for Monday, etc.
 * - `I` is ISO week of year, as opposed to `w` which is local week of year.
 * - `R` is ISO week-numbering year, as opposed to `Y` which is local week-numbering year.
 *   `R` is supposed to be used in conjunction with `I` and `i`
 *   for universal ISO week-numbering date, whereas
 *   `Y` is supposed to be used in conjunction with `w` and `e`
 *   for week-numbering date specific to the locale.
 */
const parsers = {
  G: new EraParser(),
  y: new YearParser(),
  Y: new LocalWeekYearParser(),
  R: new ISOWeekYearParser(),
  u: new ExtendedYearParser(),
  Q: new QuarterParser(),
  q: new StandAloneQuarterParser(),
  M: new MonthParser(),
  L: new StandAloneMonthParser(),
  w: new LocalWeekParser(),
  I: new ISOWeekParser(),
  d: new DateParser(),
  D: new DayOfYearParser(),
  E: new DayParser(),
  e: new LocalDayParser(),
  c: new StandAloneLocalDayParser(),
  i: new ISODayParser(),
  a: new AMPMParser(),
  b: new AMPMMidnightParser(),
  B: new DayPeriodParser(),
  h: new Hour1to12Parser(),
  H: new Hour0to23Parser(),
  K: new Hour0To11Parser(),
  k: new Hour1To24Parser(),
  m: new MinuteParser(),
  s: new SecondParser(),
  S: new FractionOfSecondParser(),
  X: new ISOTimezoneWithZParser(),
  x: new ISOTimezoneParser(),
  t: new TimestampSecondsParser(),
  T: new TimestampMillisecondsParser(),
};

/**
 * The {@link parse} function options.
 */

// This RegExp consists of three parts separated by `|`:
// - [yYQqMLwIdDecihHKkms]o matches any available ordinal number token
//   (one of the certain letters followed by `o`)
// - (\w)\1* matches any sequences of the same letter
// - '' matches two quote characters in a row
// - '(''|[^'])+('|$) matches anything surrounded by two quote characters ('),
//   except a single quote symbol, which ends the sequence.
//   Two quote characters do not end the sequence.
//   If there is no matching single quote
//   then the sequence will continue until the end of the string.
// - . matches any single character unmatched by previous parts of the RegExps
const formattingTokensRegExp =
  /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;

// This RegExp catches symbols escaped by quotes, and also
// sequences of symbols P, p, and the combinations like `PPPPPPPppppp`
const longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;

const escapedStringRegExp = /^'([^]*?)'?$/;
const doubleQuoteRegExp = /''/g;

const notWhitespaceRegExp = /\S/;
const unescapedLatinCharacterRegExp = /[a-zA-Z]/;

/**
 * @name parse
 * @category Common Helpers
 * @summary Parse the date.
 *
 * @description
 * Return the date parsed from string using the given format string.
 *
 * > ⚠️ Please note that the `format` tokens differ from Moment.js and other libraries.
 * > See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 *
 * The characters in the format string wrapped between two single quotes characters (') are escaped.
 * Two single quotes in a row, whether inside or outside a quoted sequence, represent a 'real' single quote.
 *
 * Format of the format string is based on Unicode Technical Standard #35:
 * https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
 * with a few additions (see note 5 below the table).
 *
 * Not all tokens are compatible. Combinations that don't make sense or could lead to bugs are prohibited
 * and will throw `RangeError`. For example usage of 24-hour format token with AM/PM token will throw an exception:
 *
 * ```javascript
 * parse('23 AM', 'HH a', new Date())
 * //=> RangeError: The format string mustn't contain `HH` and `a` at the same time
 * ```
 *
 * See the compatibility table: https://docs.google.com/spreadsheets/d/e/2PACX-1vQOPU3xUhplll6dyoMmVUXHKl_8CRDs6_ueLmex3SoqwhuolkuN3O05l4rqx5h1dKX8eb46Ul-CCSrq/pubhtml?gid=0&single=true
 *
 * Accepted format string patterns:
 * | Unit                            |Prior| Pattern | Result examples                   | Notes |
 * |---------------------------------|-----|---------|-----------------------------------|-------|
 * | Era                             | 140 | G..GGG  | AD, BC                            |       |
 * |                                 |     | GGGG    | Anno Domini, Before Christ        | 2     |
 * |                                 |     | GGGGG   | A, B                              |       |
 * | Calendar year                   | 130 | y       | 44, 1, 1900, 2017, 9999           | 4     |
 * |                                 |     | yo      | 44th, 1st, 1900th, 9999999th      | 4,5   |
 * |                                 |     | yy      | 44, 01, 00, 17                    | 4     |
 * |                                 |     | yyy     | 044, 001, 123, 999                | 4     |
 * |                                 |     | yyyy    | 0044, 0001, 1900, 2017            | 4     |
 * |                                 |     | yyyyy   | ...                               | 2,4   |
 * | Local week-numbering year       | 130 | Y       | 44, 1, 1900, 2017, 9000           | 4     |
 * |                                 |     | Yo      | 44th, 1st, 1900th, 9999999th      | 4,5   |
 * |                                 |     | YY      | 44, 01, 00, 17                    | 4,6   |
 * |                                 |     | YYY     | 044, 001, 123, 999                | 4     |
 * |                                 |     | YYYY    | 0044, 0001, 1900, 2017            | 4,6   |
 * |                                 |     | YYYYY   | ...                               | 2,4   |
 * | ISO week-numbering year         | 130 | R       | -43, 1, 1900, 2017, 9999, -9999   | 4,5   |
 * |                                 |     | RR      | -43, 01, 00, 17                   | 4,5   |
 * |                                 |     | RRR     | -043, 001, 123, 999, -999         | 4,5   |
 * |                                 |     | RRRR    | -0043, 0001, 2017, 9999, -9999    | 4,5   |
 * |                                 |     | RRRRR   | ...                               | 2,4,5 |
 * | Extended year                   | 130 | u       | -43, 1, 1900, 2017, 9999, -999    | 4     |
 * |                                 |     | uu      | -43, 01, 99, -99                  | 4     |
 * |                                 |     | uuu     | -043, 001, 123, 999, -999         | 4     |
 * |                                 |     | uuuu    | -0043, 0001, 2017, 9999, -9999    | 4     |
 * |                                 |     | uuuuu   | ...                               | 2,4   |
 * | Quarter (formatting)            | 120 | Q       | 1, 2, 3, 4                        |       |
 * |                                 |     | Qo      | 1st, 2nd, 3rd, 4th                | 5     |
 * |                                 |     | QQ      | 01, 02, 03, 04                    |       |
 * |                                 |     | QQQ     | Q1, Q2, Q3, Q4                    |       |
 * |                                 |     | QQQQ    | 1st quarter, 2nd quarter, ...     | 2     |
 * |                                 |     | QQQQQ   | 1, 2, 3, 4                        | 4     |
 * | Quarter (stand-alone)           | 120 | q       | 1, 2, 3, 4                        |       |
 * |                                 |     | qo      | 1st, 2nd, 3rd, 4th                | 5     |
 * |                                 |     | qq      | 01, 02, 03, 04                    |       |
 * |                                 |     | qqq     | Q1, Q2, Q3, Q4                    |       |
 * |                                 |     | qqqq    | 1st quarter, 2nd quarter, ...     | 2     |
 * |                                 |     | qqqqq   | 1, 2, 3, 4                        | 3     |
 * | Month (formatting)              | 110 | M       | 1, 2, ..., 12                     |       |
 * |                                 |     | Mo      | 1st, 2nd, ..., 12th               | 5     |
 * |                                 |     | MM      | 01, 02, ..., 12                   |       |
 * |                                 |     | MMM     | Jan, Feb, ..., Dec                |       |
 * |                                 |     | MMMM    | January, February, ..., December  | 2     |
 * |                                 |     | MMMMM   | J, F, ..., D                      |       |
 * | Month (stand-alone)             | 110 | L       | 1, 2, ..., 12                     |       |
 * |                                 |     | Lo      | 1st, 2nd, ..., 12th               | 5     |
 * |                                 |     | LL      | 01, 02, ..., 12                   |       |
 * |                                 |     | LLL     | Jan, Feb, ..., Dec                |       |
 * |                                 |     | LLLL    | January, February, ..., December  | 2     |
 * |                                 |     | LLLLL   | J, F, ..., D                      |       |
 * | Local week of year              | 100 | w       | 1, 2, ..., 53                     |       |
 * |                                 |     | wo      | 1st, 2nd, ..., 53th               | 5     |
 * |                                 |     | ww      | 01, 02, ..., 53                   |       |
 * | ISO week of year                | 100 | I       | 1, 2, ..., 53                     | 5     |
 * |                                 |     | Io      | 1st, 2nd, ..., 53th               | 5     |
 * |                                 |     | II      | 01, 02, ..., 53                   | 5     |
 * | Day of month                    |  90 | d       | 1, 2, ..., 31                     |       |
 * |                                 |     | do      | 1st, 2nd, ..., 31st               | 5     |
 * |                                 |     | dd      | 01, 02, ..., 31                   |       |
 * | Day of year                     |  90 | D       | 1, 2, ..., 365, 366               | 7     |
 * |                                 |     | Do      | 1st, 2nd, ..., 365th, 366th       | 5     |
 * |                                 |     | DD      | 01, 02, ..., 365, 366             | 7     |
 * |                                 |     | DDD     | 001, 002, ..., 365, 366           |       |
 * |                                 |     | DDDD    | ...                               | 2     |
 * | Day of week (formatting)        |  90 | E..EEE  | Mon, Tue, Wed, ..., Sun           |       |
 * |                                 |     | EEEE    | Monday, Tuesday, ..., Sunday      | 2     |
 * |                                 |     | EEEEE   | M, T, W, T, F, S, S               |       |
 * |                                 |     | EEEEEE  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
 * | ISO day of week (formatting)    |  90 | i       | 1, 2, 3, ..., 7                   | 5     |
 * |                                 |     | io      | 1st, 2nd, ..., 7th                | 5     |
 * |                                 |     | ii      | 01, 02, ..., 07                   | 5     |
 * |                                 |     | iii     | Mon, Tue, Wed, ..., Sun           | 5     |
 * |                                 |     | iiii    | Monday, Tuesday, ..., Sunday      | 2,5   |
 * |                                 |     | iiiii   | M, T, W, T, F, S, S               | 5     |
 * |                                 |     | iiiiii  | Mo, Tu, We, Th, Fr, Sa, Su        | 5     |
 * | Local day of week (formatting)  |  90 | e       | 2, 3, 4, ..., 1                   |       |
 * |                                 |     | eo      | 2nd, 3rd, ..., 1st                | 5     |
 * |                                 |     | ee      | 02, 03, ..., 01                   |       |
 * |                                 |     | eee     | Mon, Tue, Wed, ..., Sun           |       |
 * |                                 |     | eeee    | Monday, Tuesday, ..., Sunday      | 2     |
 * |                                 |     | eeeee   | M, T, W, T, F, S, S               |       |
 * |                                 |     | eeeeee  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
 * | Local day of week (stand-alone) |  90 | c       | 2, 3, 4, ..., 1                   |       |
 * |                                 |     | co      | 2nd, 3rd, ..., 1st                | 5     |
 * |                                 |     | cc      | 02, 03, ..., 01                   |       |
 * |                                 |     | ccc     | Mon, Tue, Wed, ..., Sun           |       |
 * |                                 |     | cccc    | Monday, Tuesday, ..., Sunday      | 2     |
 * |                                 |     | ccccc   | M, T, W, T, F, S, S               |       |
 * |                                 |     | cccccc  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
 * | AM, PM                          |  80 | a..aaa  | AM, PM                            |       |
 * |                                 |     | aaaa    | a.m., p.m.                        | 2     |
 * |                                 |     | aaaaa   | a, p                              |       |
 * | AM, PM, noon, midnight          |  80 | b..bbb  | AM, PM, noon, midnight            |       |
 * |                                 |     | bbbb    | a.m., p.m., noon, midnight        | 2     |
 * |                                 |     | bbbbb   | a, p, n, mi                       |       |
 * | Flexible day period             |  80 | B..BBB  | at night, in the morning, ...     |       |
 * |                                 |     | BBBB    | at night, in the morning, ...     | 2     |
 * |                                 |     | BBBBB   | at night, in the morning, ...     |       |
 * | Hour [1-12]                     |  70 | h       | 1, 2, ..., 11, 12                 |       |
 * |                                 |     | ho      | 1st, 2nd, ..., 11th, 12th         | 5     |
 * |                                 |     | hh      | 01, 02, ..., 11, 12               |       |
 * | Hour [0-23]                     |  70 | H       | 0, 1, 2, ..., 23                  |       |
 * |                                 |     | Ho      | 0th, 1st, 2nd, ..., 23rd          | 5     |
 * |                                 |     | HH      | 00, 01, 02, ..., 23               |       |
 * | Hour [0-11]                     |  70 | K       | 1, 2, ..., 11, 0                  |       |
 * |                                 |     | Ko      | 1st, 2nd, ..., 11th, 0th          | 5     |
 * |                                 |     | KK      | 01, 02, ..., 11, 00               |       |
 * | Hour [1-24]                     |  70 | k       | 24, 1, 2, ..., 23                 |       |
 * |                                 |     | ko      | 24th, 1st, 2nd, ..., 23rd         | 5     |
 * |                                 |     | kk      | 24, 01, 02, ..., 23               |       |
 * | Minute                          |  60 | m       | 0, 1, ..., 59                     |       |
 * |                                 |     | mo      | 0th, 1st, ..., 59th               | 5     |
 * |                                 |     | mm      | 00, 01, ..., 59                   |       |
 * | Second                          |  50 | s       | 0, 1, ..., 59                     |       |
 * |                                 |     | so      | 0th, 1st, ..., 59th               | 5     |
 * |                                 |     | ss      | 00, 01, ..., 59                   |       |
 * | Seconds timestamp               |  40 | t       | 512969520                         |       |
 * |                                 |     | tt      | ...                               | 2     |
 * | Fraction of second              |  30 | S       | 0, 1, ..., 9                      |       |
 * |                                 |     | SS      | 00, 01, ..., 99                   |       |
 * |                                 |     | SSS     | 000, 001, ..., 999                |       |
 * |                                 |     | SSSS    | ...                               | 2     |
 * | Milliseconds timestamp          |  20 | T       | 512969520900                      |       |
 * |                                 |     | TT      | ...                               | 2     |
 * | Timezone (ISO-8601 w/ Z)        |  10 | X       | -08, +0530, Z                     |       |
 * |                                 |     | XX      | -0800, +0530, Z                   |       |
 * |                                 |     | XXX     | -08:00, +05:30, Z                 |       |
 * |                                 |     | XXXX    | -0800, +0530, Z, +123456          | 2     |
 * |                                 |     | XXXXX   | -08:00, +05:30, Z, +12:34:56      |       |
 * | Timezone (ISO-8601 w/o Z)       |  10 | x       | -08, +0530, +00                   |       |
 * |                                 |     | xx      | -0800, +0530, +0000               |       |
 * |                                 |     | xxx     | -08:00, +05:30, +00:00            | 2     |
 * |                                 |     | xxxx    | -0800, +0530, +0000, +123456      |       |
 * |                                 |     | xxxxx   | -08:00, +05:30, +00:00, +12:34:56 |       |
 * | Long localized date             |  NA | P       | 05/29/1453                        | 5,8   |
 * |                                 |     | PP      | May 29, 1453                      |       |
 * |                                 |     | PPP     | May 29th, 1453                    |       |
 * |                                 |     | PPPP    | Sunday, May 29th, 1453            | 2,5,8 |
 * | Long localized time             |  NA | p       | 12:00 AM                          | 5,8   |
 * |                                 |     | pp      | 12:00:00 AM                       |       |
 * | Combination of date and time    |  NA | Pp      | 05/29/1453, 12:00 AM              |       |
 * |                                 |     | PPpp    | May 29, 1453, 12:00:00 AM         |       |
 * |                                 |     | PPPpp   | May 29th, 1453 at ...             |       |
 * |                                 |     | PPPPpp  | Sunday, May 29th, 1453 at ...     | 2,5,8 |
 * Notes:
 * 1. "Formatting" units (e.g. formatting quarter) in the default en-US locale
 *    are the same as "stand-alone" units, but are different in some languages.
 *    "Formatting" units are declined according to the rules of the language
 *    in the context of a date. "Stand-alone" units are always nominative singular.
 *    In `format` function, they will produce different result:
 *
 *    `format(new Date(2017, 10, 6), 'do LLLL', {locale: cs}) //=> '6. listopad'`
 *
 *    `format(new Date(2017, 10, 6), 'do MMMM', {locale: cs}) //=> '6. listopadu'`
 *
 *    `parse` will try to match both formatting and stand-alone units interchangeably.
 *
 * 2. Any sequence of the identical letters is a pattern, unless it is escaped by
 *    the single quote characters (see below).
 *    If the sequence is longer than listed in table:
 *    - for numerical units (`yyyyyyyy`) `parse` will try to match a number
 *      as wide as the sequence
 *    - for text units (`MMMMMMMM`) `parse` will try to match the widest variation of the unit.
 *      These variations are marked with "2" in the last column of the table.
 *
 * 3. `QQQQQ` and `qqqqq` could be not strictly numerical in some locales.
 *    These tokens represent the shortest form of the quarter.
 *
 * 4. The main difference between `y` and `u` patterns are B.C. years:
 *
 *    | Year | `y` | `u` |
 *    |------|-----|-----|
 *    | AC 1 |   1 |   1 |
 *    | BC 1 |   1 |   0 |
 *    | BC 2 |   2 |  -1 |
 *
 *    Also `yy` will try to guess the century of two digit year by proximity with `referenceDate`:
 *
 *    `parse('50', 'yy', new Date(2018, 0, 1)) //=> Sat Jan 01 2050 00:00:00`
 *
 *    `parse('75', 'yy', new Date(2018, 0, 1)) //=> Wed Jan 01 1975 00:00:00`
 *
 *    while `uu` will just assign the year as is:
 *
 *    `parse('50', 'uu', new Date(2018, 0, 1)) //=> Sat Jan 01 0050 00:00:00`
 *
 *    `parse('75', 'uu', new Date(2018, 0, 1)) //=> Tue Jan 01 0075 00:00:00`
 *
 *    The same difference is true for local and ISO week-numbering years (`Y` and `R`),
 *    except local week-numbering years are dependent on `options.weekStartsOn`
 *    and `options.firstWeekContainsDate` (compare [setISOWeekYear](https://date-fns.org/docs/setISOWeekYear)
 *    and [setWeekYear](https://date-fns.org/docs/setWeekYear)).
 *
 * 5. These patterns are not in the Unicode Technical Standard #35:
 *    - `i`: ISO day of week
 *    - `I`: ISO week of year
 *    - `R`: ISO week-numbering year
 *    - `o`: ordinal number modifier
 *    - `P`: long localized date
 *    - `p`: long localized time
 *
 * 6. `YY` and `YYYY` tokens represent week-numbering years but they are often confused with years.
 *    You should enable `options.useAdditionalWeekYearTokens` to use them. See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 *
 * 7. `D` and `DD` tokens represent days of the year but they are often confused with days of the month.
 *    You should enable `options.useAdditionalDayOfYearTokens` to use them. See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 *
 * 8. `P+` tokens do not have a defined priority since they are merely aliases to other tokens based
 *    on the given locale.
 *
 *    using `en-US` locale: `P` => `MM/dd/yyyy`
 *    using `en-US` locale: `p` => `hh:mm a`
 *    using `pt-BR` locale: `P` => `dd/MM/yyyy`
 *    using `pt-BR` locale: `p` => `HH:mm`
 *
 * Values will be assigned to the date in the descending order of its unit's priority.
 * Units of an equal priority overwrite each other in the order of appearance.
 *
 * If no values of higher priority are parsed (e.g. when parsing string 'January 1st' without a year),
 * the values will be taken from 3rd argument `referenceDate` which works as a context of parsing.
 *
 * `referenceDate` must be passed for correct work of the function.
 * If you're not sure which `referenceDate` to supply, create a new instance of Date:
 * `parse('02/11/2014', 'MM/dd/yyyy', new Date())`
 * In this case parsing will be done in the context of the current date.
 * If `referenceDate` is `Invalid Date` or a value not convertible to valid `Date`,
 * then `Invalid Date` will be returned.
 *
 * The result may vary by locale.
 *
 * If `formatString` matches with `dateString` but does not provides tokens, `referenceDate` will be returned.
 *
 * If parsing failed, `Invalid Date` will be returned.
 * Invalid Date is a Date, whose time value is NaN.
 * Time value of Date: http://es5.github.io/#x15.9.1.1
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
 *
 * @param dateStr - The string to parse
 * @param formatStr - The string of tokens
 * @param referenceDate - defines values missing from the parsed dateString
 * @param options - An object with options.
 *   see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 *   see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 *
 * @returns The parsed date
 *
 * @throws `options.locale` must contain `match` property
 * @throws use `yyyy` instead of `YYYY` for formatting years using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 * @throws use `yy` instead of `YY` for formatting years using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 * @throws use `d` instead of `D` for formatting days of the month using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 * @throws use `dd` instead of `DD` for formatting days of the month using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
 * @throws format string contains an unescaped latin alphabet character
 *
 * @example
 * // Parse 11 February 2014 from middle-endian format:
 * var result = parse('02/11/2014', 'MM/dd/yyyy', new Date())
 * //=> Tue Feb 11 2014 00:00:00
 *
 * @example
 * // Parse 28th of February in Esperanto locale in the context of 2010 year:
 * import eo from 'date-fns/locale/eo'
 * var result = parse('28-a de februaro', "do 'de' MMMM", new Date(2010, 0, 1), {
 *   locale: eo
 * })
 * //=> Sun Feb 28 2010 00:00:00
 */
function parse(dateStr, formatStr, referenceDate, options) {
  const invalidDate = () => constructFrom(options?.in || referenceDate, NaN);
  const defaultOptions = getDefaultOptions();
  const locale = options?.locale ?? defaultOptions.locale ?? enUS;

  const firstWeekContainsDate =
    options?.firstWeekContainsDate ??
    options?.locale?.options?.firstWeekContainsDate ??
    defaultOptions.firstWeekContainsDate ??
    defaultOptions.locale?.options?.firstWeekContainsDate ??
    1;

  const weekStartsOn =
    options?.weekStartsOn ??
    options?.locale?.options?.weekStartsOn ??
    defaultOptions.weekStartsOn ??
    defaultOptions.locale?.options?.weekStartsOn ??
    0;

  if (!formatStr)
    return dateStr ? invalidDate() : toDate(referenceDate, options?.in);

  const subFnOptions = {
    firstWeekContainsDate,
    weekStartsOn,
    locale,
  };

  // If timezone isn't specified, it will try to use the context or
  // the reference date and fallback to the system time zone.
  const setters = [new DateTimezoneSetter(options?.in, referenceDate)];

  const tokens = formatStr
    .match(longFormattingTokensRegExp)
    .map((substring) => {
      const firstCharacter = substring[0];
      if (firstCharacter in longFormatters) {
        const longFormatter = longFormatters[firstCharacter];
        return longFormatter(substring, locale.formatLong);
      }
      return substring;
    })
    .join("")
    .match(formattingTokensRegExp);

  const usedTokens = [];

  for (let token of tokens) {
    if (
      !options?.useAdditionalWeekYearTokens &&
      isProtectedWeekYearToken(token)
    ) {
      warnOrThrowProtectedError(token, formatStr, dateStr);
    }
    if (
      !options?.useAdditionalDayOfYearTokens &&
      isProtectedDayOfYearToken(token)
    ) {
      warnOrThrowProtectedError(token, formatStr, dateStr);
    }

    const firstCharacter = token[0];
    const parser = parsers[firstCharacter];
    if (parser) {
      const { incompatibleTokens } = parser;
      if (Array.isArray(incompatibleTokens)) {
        const incompatibleToken = usedTokens.find(
          (usedToken) =>
            incompatibleTokens.includes(usedToken.token) ||
            usedToken.token === firstCharacter,
        );
        if (incompatibleToken) {
          throw new RangeError(
            `The format string mustn't contain \`${incompatibleToken.fullToken}\` and \`${token}\` at the same time`,
          );
        }
      } else if (parser.incompatibleTokens === "*" && usedTokens.length > 0) {
        throw new RangeError(
          `The format string mustn't contain \`${token}\` and any other token at the same time`,
        );
      }

      usedTokens.push({ token: firstCharacter, fullToken: token });

      const parseResult = parser.run(
        dateStr,
        token,
        locale.match,
        subFnOptions,
      );

      if (!parseResult) {
        return invalidDate();
      }

      setters.push(parseResult.setter);

      dateStr = parseResult.rest;
    } else {
      if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
        throw new RangeError(
          "Format string contains an unescaped latin alphabet character `" +
            firstCharacter +
            "`",
        );
      }

      // Replace two single quote characters with one single quote character
      if (token === "''") {
        token = "'";
      } else if (firstCharacter === "'") {
        token = cleanEscapedString(token);
      }

      // Cut token from string, or, if string doesn't match the token, return Invalid Date
      if (dateStr.indexOf(token) === 0) {
        dateStr = dateStr.slice(token.length);
      } else {
        return invalidDate();
      }
    }
  }

  // Check if the remaining input contains something other than whitespace
  if (dateStr.length > 0 && notWhitespaceRegExp.test(dateStr)) {
    return invalidDate();
  }

  const uniquePrioritySetters = setters
    .map((setter) => setter.priority)
    .sort((a, b) => b - a)
    .filter((priority, index, array) => array.indexOf(priority) === index)
    .map((priority) =>
      setters
        .filter((setter) => setter.priority === priority)
        .sort((a, b) => b.subPriority - a.subPriority),
    )
    .map((setterArray) => setterArray[0]);

  let date = toDate(referenceDate, options?.in);

  if (isNaN(+date)) return invalidDate();

  const flags = {};
  for (const setter of uniquePrioritySetters) {
    if (!setter.validate(date, subFnOptions)) {
      return invalidDate();
    }

    const result = setter.set(date, flags, subFnOptions);
    // Result is tuple (date, flags)
    if (Array.isArray(result)) {
      date = result[0];
      Object.assign(flags, result[1]);
      // Result is date
    } else {
      date = result;
    }
  }

  return date;
}

function cleanEscapedString(input) {
  return input.match(escapedStringRegExp)[1].replace(doubleQuoteRegExp, "'");
}

const SCHEMA_CACHE_TTL_MS = 5 * 60 * 1e3;
const valueFieldChecks = /* @__PURE__ */ new Map();
function hasValueField(api, collection, fieldName = "value") {
  if (!collection)
    return Promise.resolve(false);
  const cacheKey = `${collection}::${fieldName}`;
  const cached = valueFieldChecks.get(cacheKey);
  if (cached && Date.now() - cached.at < SCHEMA_CACHE_TTL_MS)
    return cached.promise;
  const promise = api.get(`/fields/${collection}`).then((res) => {
    const fields = res.data?.data || [];
    return fields.some((f) => f.field === fieldName);
  }).catch(() => false);
  valueFieldChecks.set(cacheKey, { promise, at: Date.now() });
  return promise;
}
function resolveValueField(cfg) {
  return cfg.occupancyValueField || "value";
}
const relatedCollectionChecks = /* @__PURE__ */ new Map();
function resolveRelatedCollection(api, collection, field) {
  if (!collection || !field)
    return Promise.resolve(null);
  const key = `${collection}.${field}`;
  const cached = relatedCollectionChecks.get(key);
  if (cached && Date.now() - cached.at < SCHEMA_CACHE_TTL_MS)
    return cached.promise;
  const promise = api.get(`/fields/${collection}/${field}`).then((res) => res.data?.data?.schema?.foreign_key_table ?? null).catch(() => null);
  relatedCollectionChecks.set(key, { promise, at: Date.now() });
  return promise;
}
function getNestedValue(obj, path) {
  if (!obj || !path)
    return void 0;
  return path.split(".").reduce((acc, key) => acc == null ? acc : acc[key], obj);
}
function lookupKey(value) {
  return value === null || value === void 0 ? "" : String(value);
}
function pickBestPriceRow(candidates, buyPriceField, sellPriceField, onConflict) {
  if (candidates.length <= 1)
    return candidates[0];
  const sorted = [...candidates].sort((a, b) => {
    const hasBuyA = a[buyPriceField] != null && Number(a[buyPriceField]) !== 0;
    const hasBuyB = b[buyPriceField] != null && Number(b[buyPriceField]) !== 0;
    if (hasBuyA !== hasBuyB)
      return hasBuyA ? -1 : 1;
    const hasSellA = a[sellPriceField] != null;
    const hasSellB = b[sellPriceField] != null;
    if (hasSellA !== hasSellB)
      return hasSellA ? -1 : 1;
    const updatedA = a.date_updated ?? "";
    const updatedB = b.date_updated ?? "";
    if (updatedA !== updatedB)
      return updatedA < updatedB ? 1 : -1;
    return String(a.id).localeCompare(String(b.id));
  });
  const ignoredIds = sorted.slice(1).map((c) => c.id);
  console.warn(
    `[PriceTable] multiple price rows for the same category/date/occupancy \u2014 picked ${sorted[0].id}, ignored [${ignoredIds.join(", ")}]. This is a data conflict, not a resolved one \u2014 needs manual review.`
  );
  onConflict?.(sorted[0].id, ignoredIds);
  return sorted[0];
}
function isAbortError(err) {
  const e = err;
  return e?.name === "AbortError" || e?.name === "CanceledError" || e?.code === "ERR_CANCELED";
}
function isBuyPriceEmpty(value) {
  return value === null || value === void 0 || value === "" || Number(value) === 0;
}
const PRICE_PRECISION = 2;
function roundToPricePrecision(value) {
  if (value === null || value === void 0 || value === "")
    return value;
  const num = Number(value);
  if (!Number.isFinite(num))
    return value;
  const factor = 10 ** PRICE_PRECISION;
  return Math.round(num * factor) / factor;
}
function describeMissingConfig(fields) {
  return fields.filter((f) => f.value === null || f.value === void 0 || f.value === "").map((f) => f.label);
}
function missingConfigMessage(missing) {
  return `This price table isn't fully configured yet \u2014 missing: ${missing.join(", ")}. Set these in this field's interface options.`;
}
function buildFallbackRangeLabel(junctionRow, relatedRecord, cfg) {
  const minField = cfg.occupancyLabelFallbackMinField;
  if (!minField)
    return null;
  const min = getNestedValue(relatedRecord, minField) ?? getNestedValue(junctionRow, minField);
  if (min === null || min === void 0 || min === "")
    return null;
  const maxField = cfg.occupancyLabelFallbackMaxField;
  const max = maxField ? getNestedValue(relatedRecord, maxField) ?? getNestedValue(junctionRow, maxField) : null;
  let range;
  if (max === null || max === void 0 || max === "" || String(max) === String(min)) {
    range = String(min);
  } else if (Number(max) >= 999) {
    range = `${min}+`;
  } else {
    range = `${min}-${max}`;
  }
  const categoryField = cfg.occupancyLabelFallbackCategoryField;
  const category = categoryField ? getNestedValue(relatedRecord, categoryField) ?? getNestedValue(junctionRow, categoryField) : null;
  return category ? `${range} ${category}` : range;
}
function normalizeOccupancyFromJunction(junctionRow, cfg) {
  const relatedField = cfg.occupancyJunctionRelatedField;
  const related = junctionRow?.[relatedField];
  const relatedRecord = related && typeof related === "object" ? related : {};
  const resolvedId = getNestedValue(junctionRow, cfg.occupancyIdField);
  const primaryLabel = getNestedValue(relatedRecord, cfg.occupancyLabelField) ?? getNestedValue(junctionRow, cfg.occupancyLabelField);
  const hasPrimaryLabel = typeof primaryLabel === "string" ? primaryLabel.trim().length > 0 : primaryLabel != null;
  const resolvedLabel = hasPrimaryLabel ? primaryLabel : buildFallbackRangeLabel(junctionRow, relatedRecord, cfg) ?? String(resolvedId ?? "");
  const valueField = resolveValueField(cfg);
  const sortField = cfg.occupancySortField;
  return {
    ...relatedRecord,
    id: resolvedId,
    [cfg.occupancyLabelField]: resolvedLabel,
    value: getNestedValue(relatedRecord, valueField) ?? getNestedValue(junctionRow, valueField) ?? null,
    from_price: cfg.occupancyFromPriceField ? relatedRecord[cfg.occupancyFromPriceField] ?? junctionRow?.[cfg.occupancyFromPriceField] ?? false : false,
    /*
     * Manual sort order (e.g. "sort") is typically a per-parent value that
     * lives on the junction row itself — Directus writes an M2M's
     * drag-reorder position there (see `directus_relations.sort_field`),
     * scoped to this one parent/occupancy pairing. An inherent property of
     * the occupancy type (e.g. "value", guest count) instead lives on the
     * related master record and is shared across every parent. Junction row
     * wins when both are present so a real per-parent manual order is never
     * shadowed by the `...relatedRecord` spread above silently overwriting
     * it with the (usually empty) same-named field from the master record.
     */
    ...sortField ? {
      [sortField]: getNestedValue(junctionRow, sortField) ?? getNestedValue(relatedRecord, sortField) ?? null
    } : {}
  };
}
function buildGroupFields(cfg, extra = []) {
  const groupLabelField = cfg.groupLabelField;
  const groupLabelRoot = groupLabelField.split(".")[0];
  const groupTranslationField = cfg.groupLabelTranslationField;
  const fields = [
    "id",
    groupLabelField,
    "translations.translations_id",
    ...groupTranslationField ? [`translations.${groupTranslationField}`] : [],
    ...cfg.groupSharedIdField ? [cfg.groupSharedIdField] : [],
    ...extra
  ];
  const known = /* @__PURE__ */ new Set([...fields, groupLabelRoot]);
  if (cfg.groupFromPriceField && !known.has(cfg.groupFromPriceField)) {
    fields.push(cfg.groupFromPriceField);
    known.add(cfg.groupFromPriceField);
  }
  if (cfg.groupSortField && !known.has(cfg.groupSortField)) {
    fields.push(cfg.groupSortField);
  }
  return fields;
}
function getGroupLabel(key, categories, cfg, currentLangId) {
  if (key === "ungrouped")
    return "Ungrouped";
  const cat = categories.get(key);
  const resolvedLabel = getNestedValue(cat, cfg.groupLabelField);
  const translationsArr = cat?.translations || [];
  const matchedTranslation = currentLangId !== void 0 ? translationsArr.find((t) => t.translations_id === currentLangId) : translationsArr[0];
  let name = typeof resolvedLabel === "string" && resolvedLabel || matchedTranslation?.[cfg.groupLabelTranslationField] || key;
  const sharedId = cfg.groupSharedIdField ? cat?.[cfg.groupSharedIdField] : null;
  if (sharedId && sharedId !== key) {
    const parent = categories.get(sharedId);
    const repeaterEntry = (cfg.groupChildWeekdaysField && parent?.[cfg.groupChildWeekdaysField] || []).find((entry) => entry.child_id === key);
    if (repeaterEntry?.days_label)
      name = `${name} (${repeaterEntry.days_label})`;
  }
  return name;
}
function getGroupFromPrice(key, categories, groupFromPriceField) {
  if (!groupFromPriceField)
    return false;
  return !!categories.get(key)?.[groupFromPriceField];
}
function captureKnownLegIds(lookupData) {
  return {
    categories: new Set(lookupData.categories.keys()),
    dates: new Set(lookupData.dates.keys()),
    occupancies: new Set(lookupData.occupancies.keys())
  };
}
function setDifference(before, after) {
  return Array.from(before).filter((id) => !after.has(id));
}
async function reconcileRemovedLegs(before, lookupData, items, unpersistedCells, cfg, api, logPrefix, errorMessage) {
  const after = captureKnownLegIds(lookupData);
  const removedCategoryIds = setDifference(before.categories, after.categories);
  const removedDateIds = setDifference(before.dates, after.dates);
  const removedOccupancyIds = setDifference(before.occupancies, after.occupancies);
  if (!removedCategoryIds.length && !removedDateIds.length && !removedOccupancyIds.length) {
    return;
  }
  const isOrphaned = (item) => removedCategoryIds.includes(String(item[cfg.groupByField])) || removedDateIds.includes(String(item[cfg.rowField])) || removedOccupancyIds.includes(String(item[cfg.columnField]));
  Array.from(unpersistedCells.value.entries()).forEach(([key, cell]) => {
    if (isOrphaned(cell))
      unpersistedCells.value.delete(key);
  });
  const orphanedRows = items.value.filter(isOrphaned);
  if (!orphanedRows.length)
    return;
  const priceIds = orphanedRows.map((row) => row.id).filter(Boolean);
  if (!priceIds.length)
    return;
  try {
    if (cfg.translationsCollection && cfg.translationsFKField) {
      const { data } = await api.get(`/items/${cfg.translationsCollection}`, {
        params: {
          filter: { [cfg.translationsFKField]: { _in: priceIds } },
          fields: ["id"],
          limit: -1
        }
      });
      const translationIds = (data?.data || []).map((t) => t.id);
      if (translationIds.length) {
        await api.delete(`/items/${cfg.translationsCollection}`, { data: translationIds });
      }
    }
    await api.delete(`/items/${cfg.relatedCollection}`, { data: priceIds });
  } catch (err) {
    console.error(`${logPrefix} Error cascading deletion to price rows:`, err);
    if (errorMessage) {
      errorMessage.value = "Failed to clean up price rows for a removed category, price date, or occupancy \u2014 some orphaned rows may remain.";
    }
  }
}
function createLookupData() {
  return ref({
    categories: /* @__PURE__ */ new Map(),
    dates: /* @__PURE__ */ new Map(),
    occupancies: /* @__PURE__ */ new Map()
  });
}
function addOccupancyLookup(map, key, occupancy) {
  const normalizedKey = lookupKey(key);
  if (!normalizedKey)
    return;
  map.set(normalizedKey, occupancy);
}
function useColumns(props, lookupData) {
  return computed(() => {
    const sf = props.occupancySortField;
    return Array.from(lookupData.value.occupancies.entries()).map(([id, occ]) => occ ? { ...occ, id } : null).filter(Boolean).sort((a, b) => {
      const aVal = a[sf] ?? 0;
      const bVal = b[sf] ?? 0;
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum) && aNum !== bNum)
        return aNum - bNum;
      const cmp = String(aVal).localeCompare(String(bVal));
      if (cmp !== 0)
        return cmp;
      return a.from_price ? -1 : 1;
    });
  });
}
function useHasMinimumConfig(lookupData, columns) {
  return computed(
    () => lookupData.value.categories.size > 0 && lookupData.value.dates.size > 0 && columns.value.length > 0
  );
}
function useRows(props, lookupData) {
  return computed(() => {
    const sf = props.rowSortField;
    return Array.from(lookupData.value.dates.values()).filter(Boolean).sort((a, b) => {
      const aVal = a[sf];
      const bVal = b[sf];
      if (aVal == null && bVal == null)
        return 0;
      if (aVal == null)
        return 1;
      if (bVal == null)
        return -1;
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum))
        return aNum - bNum;
      const aDate = new Date(aVal).getTime();
      const bDate = new Date(bVal).getTime();
      if (!isNaN(aDate) && !isNaN(bDate))
        return aDate - bDate;
      return String(aVal).localeCompare(String(bVal));
    });
  });
}
function useGroupedData(props, lookupData, items, rows) {
  return computed(() => {
    if (!props.groupByField) {
      return { all: { items: items.value, rows: rows.value } };
    }
    const groups = {};
    lookupData.value.categories.forEach((_cat, key) => {
      groups[key] = { items: [], rows: rows.value };
    });
    items.value.forEach((item) => {
      const key = item[props.groupByField];
      if (!key)
        return;
      if (!groups[key])
        groups[key] = { items: [], rows: rows.value };
      groups[key].items.push(item);
    });
    return groups;
  });
}
function seedUnpersistedCells(orderedGroups, columns, items, unpersistedCells, cfg) {
  const itemKeys = new Set(
    items.value.map(
      (it) => `${it[cfg.groupByField]}|${it[cfg.rowField]}|${it[cfg.columnField]}`
    )
  );
  Object.entries(orderedGroups).forEach(([groupKey, group]) => {
    (group.rows || []).forEach((row) => {
      columns.forEach((col) => {
        const key = `${groupKey}|${row.id}|${col.id}`;
        if (itemKeys.has(key))
          return;
        if (unpersistedCells.value.has(key))
          return;
        unpersistedCells.value.set(key, {
          [cfg.groupByField]: groupKey,
          [cfg.rowField]: row.id,
          [cfg.columnField]: col.id,
          [cfg.buyPriceField]: null,
          [cfg.sellPriceField]: null,
          _translation_id: null
        });
      });
    });
  });
}
function useOrderedGroupedData(props, lookupData, groupedData, roomCategoryOrder) {
  return computed(() => {
    const groups = groupedData.value;
    if (props.groupSortField) {
      const sf = props.groupSortField;
      const ordered2 = {};
      Object.keys(groups).sort((a, b) => {
        const aVal = lookupData.value.categories.get(a)?.[sf] ?? 0;
        const bVal = lookupData.value.categories.get(b)?.[sf] ?? 0;
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum))
          return aNum - bNum;
        return String(aVal).localeCompare(String(bVal));
      }).forEach((key) => {
        ordered2[key] = groups[key];
      });
      return ordered2;
    }
    if (!props.groupByField || roomCategoryOrder.value.length === 0) {
      return groups;
    }
    const ordered = {};
    roomCategoryOrder.value.forEach((id) => {
      if (groups[id])
        ordered[id] = groups[id];
    });
    Object.keys(groups).forEach((key) => {
      if (!ordered[key])
        ordered[key] = groups[key];
    });
    return ordered;
  });
}

function usePriceTableData(options) {
  const { props, api, logPrefix, isJunction } = options;
  const {
    parent_id,
    translations_id,
    items,
    originalItems,
    hasChanges,
    unpersistedCells,
    lookupData,
    parentRecord,
    buyCurrencySymbol,
    sellCurrencySymbol,
    roomCategoryOrder,
    sellPricesStatus,
    sellPricesUpdatedAt,
    availableTranslations,
    selectedTranslationId,
    errorMessage,
    loading,
    saving,
    calculatingSellPrices
  } = options;
  const compileCalculator = (roundHalfCode, calcCode) => {
    try {
      const factory = new Function(
        `${roundHalfCode}
${calcCode}
return { roundHalf, calculateSellPrice };`
      );
      const { roundHalf, calculateSellPrice } = factory();
      if (typeof roundHalf !== "function" || typeof calculateSellPrice !== "function") {
        return {
          error: "Formula must define exactly named functions roundHalf(val) and calculateSellPrice(buyPrice, settingsRow, priceRow, rateValue, occupancyValue)."
        };
      }
      return { calculateSellPrice };
    } catch (err) {
      return { error: `Failed to compile formula: ${err.message}` };
    }
  };
  const saveRequiredFields = () => describeMissingConfig([
    { value: props.relatedCollection, label: "Related Collection" },
    { value: props.foreignKeyField, label: "Foreign Key Field" },
    { value: props.buyPriceField, label: "Buy Price Field" },
    { value: props.sellPriceField, label: "Sell Price Field" },
    { value: props.groupByField, label: "Group By Field" },
    { value: props.rowField, label: "Row Field" },
    { value: props.columnField, label: "Column Field" },
    ...isJunction() ? [
      { value: props.translationsCollection, label: "Translations Collection" },
      { value: props.translationsFKField, label: "Translations \u2192 Price FK Field" },
      { value: props.translationsLanguageField, label: "Translations \u2192 Language Field" }
    ] : []
  ]);
  const calculateRequiredFields = () => describeMissingConfig([
    { value: props.junctionCollection, label: "Junction Collection" },
    {
      value: props.parentKeyField || props.junctionParentKeyField,
      label: "Parent Key Field / Junction \u2192 Parent Key Field"
    },
    { value: props.junctionLanguageField, label: "Junction \u2192 Language Field" },
    { value: props.buyPriceTypeField, label: "Buy Price Type Field" },
    { value: props.sellPriceTypeField, label: "Sell Price Type Field" },
    { value: props.percentageTypeField, label: "Percentage Type Field" },
    { value: props.marginField, label: "Margin Percentage Field" },
    { value: props.provisionField, label: "Provision Percentage Field" },
    { value: props.junctionExchangeRateField, label: "Junction \u2192 Exchange Rate Field" },
    { value: props.ratesCollection, label: "Rates Collection" },
    { value: props.occupancyJunctionCollection, label: "Occupancy Junction Collection" },
    { value: props.occupancyJunctionParentField, label: "Occupancy Junction Parent Field" },
    // `occupancyJunctionRelatedField` is deliberately NOT required here —
    // it's optional (see `nestedOrOwn` in `fetchOccupanciesFromJunction`)
    // for junction rows that carry their own label/value directly with no
    // separate related master item to hop through (e.g.
    // `vehicles_rental_periods`), unlike hotels/tours/cruises/excursions.
    { value: props.occupancyValueField, label: "Occupancy Value Field" },
    { value: props.parentCollection, label: "Parent Collection" },
    { value: props.sellStatusField, label: "Sell Price Status Field" },
    { value: props.sellUpdatedAtField, label: "Sell Price Updated At Field" },
    { value: props.roundHalfLogic, label: "Round Half Logic" },
    { value: props.calculateSellPriceLogic, label: "Calculate Sell Price Logic" }
  ]);
  const normalizeOccupancyFromJunctionBound = (junctionRow) => normalizeOccupancyFromJunction(junctionRow, props);
  const fetchCurrencySymbols = async (rateKey) => {
    try {
      const fc = props.fromCurrencyField;
      const tc = props.toCurrencyField;
      const sf = props.currencySymbolField;
      const { data } = await api.get(
        `/items/${props.ratesCollection}/${rateKey}`,
        { params: { fields: [`${fc}.${sf}`, `${tc}.${sf}`] } }
      );
      buyCurrencySymbol.value = data.data[fc]?.[sf] || props.defaultBuyCurrencySymbol;
      sellCurrencySymbol.value = data.data[tc]?.[sf] || props.defaultSellCurrencySymbol;
    } catch (err) {
      console.error(`${logPrefix} Error fetching currency symbols:`, err);
      errorMessage.value = "Failed to load currency symbols for the price table header.";
    }
  };
  const resolveParentId = () => {
    if (props.primaryKey && props.primaryKey !== "+") {
      parent_id.value = props.primaryKey;
      return;
    }
    const pathParts = window.location.pathname.split("/");
    const idx = pathParts.indexOf(props.parentCollection);
    if (idx !== -1 && pathParts[idx + 1] && pathParts[idx + 1] !== "+") {
      parent_id.value = pathParts[idx + 1];
    }
  };
  const fetchTranslationInfo = async () => {
    buyCurrencySymbol.value = props.defaultBuyCurrencySymbol;
    sellCurrencySymbol.value = props.defaultSellCurrencySymbol;
    if (props.collection === props.parentCollection) {
      if (!props.primaryKey || props.primaryKey === "+") {
        const pathParts = window.location.pathname.split("/");
        const parentIdx = pathParts.indexOf(props.parentCollection);
        if (parentIdx !== -1 && pathParts[parentIdx + 1] && pathParts[parentIdx + 1] !== "+") {
          parent_id.value = pathParts[parentIdx + 1];
        } else {
          return;
        }
      } else {
        parent_id.value = props.primaryKey;
      }
      try {
        const { data } = await api.get(`/items/${props.junctionCollection}`, {
          params: {
            filter: {
              [props.junctionParentKeyField]: { _eq: parent_id.value }
            },
            fields: [
              "id",
              `${props.junctionLanguageField}.id`,
              `${props.junctionLanguageField}.${props.languageNameField}`,
              props.junctionExchangeRateField
            ]
          }
        });
        availableTranslations.value = data.data.map((t) => ({
          text: getNestedValue(
            t[props.junctionLanguageField],
            props.languageNameField
          ) || t[props.junctionLanguageField]?.id || "Unknown",
          value: t.id,
          exchange_rate: t[props.junctionExchangeRateField],
          lang_id: t[props.junctionLanguageField]?.id
        }));
        if (availableTranslations.value.length > 0) {
          if (!selectedTranslationId.value) {
            selectedTranslationId.value = availableTranslations.value[0].value;
          }
          const current = availableTranslations.value.find(
            (t) => t.value === selectedTranslationId.value
          );
          if (current) {
            translations_id.value = current.lang_id != null ? String(current.lang_id) : null;
            if (current.exchange_rate?.key) {
              fetchCurrencySymbols(current.exchange_rate.key);
            }
          }
        }
      } catch (err) {
        console.error(`${logPrefix} Error fetching junction records:`, err);
        errorMessage.value = "Failed to load available languages for this price table.";
      }
      return;
    }
    if (props.collection === props.junctionCollection) {
      if (props.values?.[props.junctionParentKeyField]) {
        const hId = typeof props.values[props.junctionParentKeyField] === "object" ? props.values[props.junctionParentKeyField].id : props.values[props.junctionParentKeyField];
        const tId = typeof props.values[props.junctionLanguageField] === "object" ? props.values[props.junctionLanguageField].id : props.values[props.junctionLanguageField];
        if (hId) {
          parent_id.value = hId;
          translations_id.value = tId || null;
          if (props.values[props.junctionExchangeRateField]) {
            const rateKey = typeof props.values[props.junctionExchangeRateField] === "object" ? props.values[props.junctionExchangeRateField].key : props.values[props.junctionExchangeRateField];
            if (rateKey)
              fetchCurrencySymbols(rateKey);
          }
          if (!translations_id.value && props.primaryKey && props.primaryKey !== "+") ; else {
            return;
          }
        }
      }
      if (!parent_id.value) {
        const pathParts = window.location.pathname.split("/");
        const parentIdx = pathParts.indexOf(props.parentCollection);
        if (parentIdx !== -1 && pathParts[parentIdx + 1] && pathParts[parentIdx + 1] !== "+") {
          parent_id.value = pathParts[parentIdx + 1];
        }
      }
      if (!props.primaryKey || props.primaryKey === "+") {
        return;
      }
      const parentField = props.parentKeyField || props.junctionParentKeyField;
      if (!parentField) {
        const msg = "Neither Parent Key Field nor Junction \u2192 Parent Key Field is configured \u2014 cannot resolve the parent record.";
        console.error(`${logPrefix} ${msg}`);
        errorMessage.value = msg;
        return;
      }
      try {
        const { data } = await api.get(
          `/items/${props.junctionCollection}/${props.primaryKey}`,
          {
            params: {
              fields: [
                parentField,
                props.junctionLanguageField,
                props.junctionExchangeRateField
              ]
            }
          }
        );
        parent_id.value = typeof data.data[parentField] === "object" ? data.data[parentField].id : data.data[parentField];
        translations_id.value = typeof data.data[props.junctionLanguageField] === "object" ? data.data[props.junctionLanguageField].id : data.data[props.junctionLanguageField];
        if (data.data[props.junctionExchangeRateField]) {
          const rateKey = typeof data.data[props.junctionExchangeRateField] === "object" ? data.data[props.junctionExchangeRateField].key : data.data[props.junctionExchangeRateField];
          if (rateKey)
            fetchCurrencySymbols(rateKey);
        }
      } catch (err) {
        console.error(`${logPrefix} Error fetching junction record:`, err);
        errorMessage.value = "Failed to load the settings record for this price table.";
      }
    }
  };
  const initParentContext = async () => {
    if (isJunction()) {
      await fetchTranslationInfo();
    } else {
      resolveParentId();
      buyCurrencySymbol.value = props.defaultBuyCurrencySymbol;
      sellCurrencySymbol.value = props.defaultSellCurrencySymbol;
    }
  };
  const fetchOccupanciesFromJunction = async (map) => {
    if (!parent_id.value || !props.occupancyJunctionCollection)
      return false;
    const primaryKeyField = props.occupancyJunctionPrimaryKeyField;
    const parentField = props.occupancyJunctionParentField || props.foreignKeyField;
    const relatedField = props.occupancyJunctionRelatedField;
    const valueField = resolveValueField(props);
    const sortField = props.occupancySortField;
    const nestedOrOwn = (field) => relatedField ? `${relatedField}.${field}` : field;
    const collection = props.occupancyJunctionCollection;
    const relatedCollection = relatedField ? await resolveRelatedCollection(api, collection, relatedField) : null;
    const [includeOwnValue, includeRelatedValue, includeOwnSort] = await Promise.all([
      hasValueField(api, collection, valueField),
      relatedCollection ? hasValueField(api, relatedCollection, valueField) : Promise.resolve(false),
      // A manual sort field (e.g. "sort") is typically per-parent and lives
      // on the junction row itself — see `normalizeOccupancyFromJunction`,
      // which prefers this over the nested related-record copy requested
      // below. Only requested when `relatedField` is set and the junction
      // collection actually has this field, since `nestedOrOwn` already
      // covers the no-relatedField case (the bare field IS the request).
      relatedField && sortField && sortField !== valueField ? hasValueField(api, collection, sortField) : Promise.resolve(false)
    ]);
    const fields = [
      primaryKeyField,
      ...includeOwnValue ? [valueField] : [],
      ...includeOwnSort ? [sortField] : [],
      parentField,
      ...relatedField ? [relatedField, `${relatedField}.id`] : [],
      nestedOrOwn(props.occupancyLabelField),
      ...includeRelatedValue ? [`${relatedField}.${valueField}`] : [],
      ...props.occupancyFromPriceField ? [nestedOrOwn(props.occupancyFromPriceField)] : [],
      ...sortField && sortField !== valueField ? [nestedOrOwn(sortField)] : [],
      ...props.occupancyLabelFallbackMinField ? [nestedOrOwn(props.occupancyLabelFallbackMinField)] : [],
      ...props.occupancyLabelFallbackMaxField ? [nestedOrOwn(props.occupancyLabelFallbackMaxField)] : [],
      ...props.occupancyLabelFallbackCategoryField ? [nestedOrOwn(props.occupancyLabelFallbackCategoryField)] : []
    ];
    const { data } = await api.get(`/items/${collection}`, {
      params: {
        fields,
        filter: { [parentField]: { _eq: parent_id.value } },
        limit: -1
      }
    });
    const rows = data?.data || [];
    const originalIds = rows.map((row) => row?.[relatedField]).filter((value) => value && typeof value !== "object");
    const originalLookup = /* @__PURE__ */ new Map();
    if (originalIds.length > 0 && props.occupancyCollection) {
      const originalRes = await api.get(
        `/items/${props.occupancyCollection}`,
        {
          params: {
            fields: [
              "id",
              props.occupancyLabelField,
              valueField,
              ...props.occupancyFromPriceField ? [props.occupancyFromPriceField] : [],
              ...props.occupancySortField && props.occupancySortField !== valueField ? [props.occupancySortField] : [],
              ...props.occupancyLabelFallbackMinField ? [props.occupancyLabelFallbackMinField] : [],
              ...props.occupancyLabelFallbackMaxField ? [props.occupancyLabelFallbackMaxField] : [],
              ...props.occupancyLabelFallbackCategoryField ? [props.occupancyLabelFallbackCategoryField] : []
            ],
            filter: { id: { _in: [...new Set(originalIds)] } },
            limit: -1
          }
        }
      );
      (originalRes.data?.data || []).forEach((occupancy) => {
        originalLookup.set(lookupKey(occupancy.id), occupancy);
      });
    }
    rows.forEach((row) => {
      const related = row?.[relatedField];
      const hydratedRow = related && typeof related !== "object" && originalLookup.has(lookupKey(related)) ? { ...row, [relatedField]: originalLookup.get(lookupKey(related)) } : row;
      const occupancy = normalizeOccupancyFromJunctionBound(hydratedRow);
      addOccupancyLookup(map, occupancy.id, occupancy);
    });
    return rows.length > 0;
  };
  const fetchParentRecord = async () => {
    if (!parent_id.value || parent_id.value === "+")
      return;
    try {
      const useParentOccupancies = props.occupancySourceMode !== "junction";
      const occupancyRelatedPrefix = props.occupancyJunctionRelatedField ? `${props.occupanciesField}.${props.occupancyJunctionRelatedField}` : props.occupanciesField;
      const occupancyValueField = resolveValueField(props);
      const occupancySortFieldName = props.occupancySortField;
      const occupancyFields = [
        `${props.occupanciesField}.${props.occupancyJunctionPrimaryKeyField}`,
        `${occupancyRelatedPrefix}.id`,
        `${occupancyRelatedPrefix}.${props.occupancyLabelField}`,
        `${occupancyRelatedPrefix}.${occupancyValueField}`,
        ...props.occupancyFromPriceField ? [`${occupancyRelatedPrefix}.${props.occupancyFromPriceField}`] : [],
        // A manual sort field (e.g. "sort") is typically per-parent and
        // lives on the junction row itself (`room_occupancies.sort`, not
        // `room_occupancies.occupancies_id.sort`) — see
        // `normalizeOccupancyFromJunction`, which prefers this bare copy
        // over the nested related-record one requested right after it.
        ...occupancySortFieldName && occupancySortFieldName !== occupancyValueField && props.occupancyJunctionRelatedField ? [`${props.occupanciesField}.${occupancySortFieldName}`] : [],
        ...occupancySortFieldName && occupancySortFieldName !== occupancyValueField ? [`${occupancyRelatedPrefix}.${occupancySortFieldName}`] : [],
        ...props.occupancyLabelFallbackMinField ? [`${occupancyRelatedPrefix}.${props.occupancyLabelFallbackMinField}`] : [],
        ...props.occupancyLabelFallbackMaxField ? [`${occupancyRelatedPrefix}.${props.occupancyLabelFallbackMaxField}`] : [],
        ...props.occupancyLabelFallbackCategoryField ? [`${occupancyRelatedPrefix}.${props.occupancyLabelFallbackCategoryField}`] : []
      ];
      const parentFields = [
        "*",
        ...props.categoryOrderField ? [props.categoryOrderField] : [],
        ...isJunction() ? [props.sellStatusField, props.sellUpdatedAtField] : [],
        ...useParentOccupancies ? occupancyFields : []
      ];
      const newOccupancies = /* @__PURE__ */ new Map();
      if (props.occupancySourceMode === "junction") {
        const [parentRes] = await Promise.all([
          api.get(`/items/${props.parentCollection}/${parent_id.value}`, {
            params: { fields: parentFields }
          }),
          fetchOccupanciesFromJunction(newOccupancies).catch((junctionErr) => {
            console.error(
              `${logPrefix} Error fetching occupancy junction collection:`,
              junctionErr
            );
            errorMessage.value = "Failed to load occupancies \u2014 the table may be missing some columns.";
            return false;
          })
        ]);
        parentRecord.value = parentRes.data.data;
      } else {
        const parentRes = await api.get(
          `/items/${props.parentCollection}/${parent_id.value}`,
          { params: { fields: parentFields } }
        );
        parentRecord.value = parentRes.data.data;
        if (useParentOccupancies && Array.isArray(parentRecord.value[props.occupanciesField])) {
          parentRecord.value[props.occupanciesField].forEach((row) => {
            const occupancy = normalizeOccupancyFromJunctionBound(row);
            if (occupancy.id)
              addOccupancyLookup(newOccupancies, occupancy.id, occupancy);
          });
        }
        if (props.occupancySourceMode === "auto" && newOccupancies.size === 0) {
          try {
            await fetchOccupanciesFromJunction(newOccupancies);
          } catch (junctionErr) {
            console.error(
              `${logPrefix} Error fetching occupancy junction collection:`,
              junctionErr
            );
            errorMessage.value = "Failed to load occupancies \u2014 the table may be missing some columns.";
          }
        }
      }
      if (isJunction()) {
        sellPricesStatus.value = parentRecord.value[props.sellStatusField] ?? null;
        sellPricesUpdatedAt.value = parentRecord.value[props.sellUpdatedAtField] ?? null;
      }
      if (Array.isArray(parentRecord.value[props.categoryOrderField])) {
        roomCategoryOrder.value = parentRecord.value[props.categoryOrderField].map((cat) => typeof cat === "string" ? cat : cat.id || cat);
      }
      lookupData.value.occupancies = newOccupancies;
    } catch (err) {
      console.error(`${logPrefix} Error fetching parent record:`, err);
      errorMessage.value = "Failed to load the parent record for this price table.";
    }
  };
  const fetchLookupData = async () => {
    if (!parent_id.value || parent_id.value === "+")
      return;
    try {
      const [baseCatRes, dateRes] = await Promise.all([
        api.get(`/items/${props.groupByCollection}`, {
          params: {
            filter: { [props.foreignKeyField]: { _eq: parent_id.value } },
            fields: buildGroupFields(
              props,
              props.groupChildWeekdaysField ? [props.groupChildWeekdaysField] : []
            ),
            limit: -1
          }
        }),
        api.get(`/items/${props.rowCollection}`, {
          params: {
            filter: { [props.foreignKeyField]: { _eq: parent_id.value } },
            limit: -1
          }
        })
      ]);
      const parentCats = baseCatRes.data.data || [];
      const parentCategoryIds = parentCats.map((cat) => cat.id).filter(Boolean);
      let childCats = [];
      if (parentCategoryIds.length && props.groupSharedIdField) {
        const childRes = await api.get(`/items/${props.groupByCollection}`, {
          params: {
            filter: {
              [props.groupSharedIdField]: { _in: parentCategoryIds },
              id: { _nin: parentCategoryIds }
            },
            fields: buildGroupFields(props),
            limit: -1
          }
        });
        childCats = childRes.data.data || [];
      }
      const newCategories = /* @__PURE__ */ new Map();
      [...parentCats, ...childCats].forEach(
        (cat) => newCategories.set(lookupKey(cat.id), cat)
      );
      const newDates = /* @__PURE__ */ new Map();
      (dateRes.data.data || []).forEach(
        (date) => newDates.set(lookupKey(date.id), date)
      );
      lookupData.value.categories = newCategories;
      lookupData.value.dates = newDates;
    } catch (err) {
      console.error(`${logPrefix} Error fetching lookup data:`, err);
      errorMessage.value = "Failed to load categories and price dates for this price table.";
    }
  };
  const fetchTranslationMap = async (signal) => {
    const translationMap = /* @__PURE__ */ new Map();
    if (!translations_id.value || !parent_id.value)
      return translationMap;
    try {
      const filterValue = props.parentKeyField ? props.values?.[props.parentKeyField] ?? parent_id.value : parent_id.value;
      const { data } = await api.get(
        `/items/${props.translationsCollection}`,
        {
          params: {
            filter: {
              _and: [
                {
                  [props.translationsFKField]: {
                    [props.foreignKeyField]: { _eq: filterValue }
                  }
                },
                {
                  [props.translationsLanguageField]: {
                    _eq: translations_id.value
                  }
                }
              ]
            },
            fields: [
              "id",
              props.translationsFKField,
              props.translationsLanguageField,
              props.sellPriceField
            ],
            limit: -1
          },
          signal
        }
      );
      data.data.forEach((t) => {
        const rpId = typeof t[props.translationsFKField] === "object" ? t[props.translationsFKField].id : t[props.translationsFKField];
        if (rpId)
          translationMap.set(rpId, t);
      });
    } catch (err) {
      if (isAbortError(err))
        return translationMap;
      console.error(`${logPrefix} Error fetching price translations:`, err);
      errorMessage.value = "Failed to load sell prices for the current language.";
    }
    return translationMap;
  };
  let fetchItemsRequestId = 0;
  let fetchItemsAbortController = null;
  const fetchItems = async (silent = false) => {
    if (!parent_id.value || parent_id.value === "+")
      return;
    fetchItemsAbortController?.abort();
    const controller = new AbortController();
    fetchItemsAbortController = controller;
    const requestId = ++fetchItemsRequestId;
    const isStale = () => requestId !== fetchItemsRequestId;
    if (!silent)
      loading.value = true;
    try {
      const filterValue = props.parentKeyField ? props.values?.[props.parentKeyField] ?? parent_id.value : parent_id.value;
      const [{ data }, translationMap] = await Promise.all([
        api.get(`/items/${props.relatedCollection}`, {
          params: {
            filter: { [props.foreignKeyField]: { _eq: filterValue } },
            limit: -1
          },
          signal: controller.signal
        }),
        isJunction() ? fetchTranslationMap(controller.signal) : Promise.resolve(/* @__PURE__ */ new Map())
      ]);
      if (isStale())
        return;
      items.value = (data.data || []).map((item) => {
        if (!isJunction()) {
          return {
            ...item,
            [props.buyPriceField]: roundToPricePrecision(item[props.buyPriceField]),
            [props.sellPriceField]: roundToPricePrecision(item[props.sellPriceField])
          };
        }
        const translation = translationMap.get(item.id);
        const translationLangId = typeof translation?.[props.translationsLanguageField] === "object" ? translation[props.translationsLanguageField]?.id : translation?.[props.translationsLanguageField];
        return {
          ...item,
          [props.buyPriceField]: roundToPricePrecision(item[props.buyPriceField]),
          [props.sellPriceField]: roundToPricePrecision(
            translation?.[props.sellPriceField] ?? item[props.sellPriceField]
          ),
          _translation_id: translation?.id ?? null,
          _translation_lang_id: translationLangId ?? translations_id.value
        };
      });
      originalItems.value = JSON.parse(JSON.stringify(items.value));
      hasChanges.value = false;
    } catch (err) {
      if (isAbortError(err))
        return;
      console.error(`${logPrefix} Error fetching items:`, err);
      errorMessage.value = "Failed to load prices for this table.";
      items.value = [];
    } finally {
      if (!silent && !isStale())
        loading.value = false;
    }
  };
  const refreshLookupsAndReconcile = async () => {
    const before = captureKnownLegIds(lookupData.value);
    await Promise.all([fetchLookupData(), fetchParentRecord()]);
    await reconcileRemovedLegs(
      before,
      lookupData.value,
      items,
      unpersistedCells,
      props,
      api,
      logPrefix,
      errorMessage
    );
  };
  const loadAll = async (silent = false) => {
    await Promise.all([fetchLookupData(), fetchParentRecord(), fetchItems(silent)]);
  };
  const persistChanges = async (refetch = true) => {
    if (!hasChanges.value)
      return [];
    const missing = saveRequiredFields();
    if (missing.length) {
      errorMessage.value = missingConfigMessage(missing);
      return [];
    }
    errorMessage.value = "";
    const freshRows = [];
    try {
      const changedItems = items.value.filter((item) => {
        const orig = originalItems.value.find((o) => o.id === item.id);
        return orig && (orig[props.sellPriceField] !== item[props.sellPriceField] || orig[props.buyPriceField] !== item[props.buyPriceField]);
      });
      changedItems.forEach((item) => {
        freshRows.push({
          id: item.id,
          [props.buyPriceField]: roundToPricePrecision(
            item[props.buyPriceField]
          )
        });
      });
      const priceRowUpdates = [];
      const translationUpdates = [];
      const translationCreates = [];
      changedItems.forEach((item) => {
        const orig = originalItems.value.find((o) => o.id === item.id);
        const priceRowPatch = {};
        if (orig && orig[props.buyPriceField] !== item[props.buyPriceField]) {
          priceRowPatch[props.buyPriceField] = roundToPricePrecision(
            item[props.buyPriceField]
          );
        }
        if (!isJunction()) {
          if (orig && orig[props.sellPriceField] !== item[props.sellPriceField]) {
            priceRowPatch[props.sellPriceField] = roundToPricePrecision(
              item[props.sellPriceField]
            );
          }
          if (Object.keys(priceRowPatch).length) {
            priceRowUpdates.push({ id: item.id, ...priceRowPatch });
          }
          return;
        }
        if (Object.keys(priceRowPatch).length) {
          priceRowUpdates.push({ id: item.id, ...priceRowPatch });
        }
        if (orig && orig[props.sellPriceField] !== item[props.sellPriceField]) {
          const roundedSellPrice = roundToPricePrecision(
            item[props.sellPriceField]
          );
          if (item._translation_id) {
            translationUpdates.push({
              id: item._translation_id,
              [props.sellPriceField]: roundedSellPrice
            });
          } else {
            translationCreates.push({
              [props.translationsFKField]: item.id,
              [props.translationsLanguageField]: translations_id.value,
              [props.sellPriceField]: roundedSellPrice
            });
          }
        }
      });
      const updates = [];
      if (priceRowUpdates.length) {
        updates.push(
          api.patch(`/items/${props.relatedCollection}`, priceRowUpdates, {
            params: { fields: ["id"] }
          })
        );
      }
      if (translationUpdates.length) {
        updates.push(
          api.patch(`/items/${props.translationsCollection}`, translationUpdates, {
            params: { fields: ["id"] }
          })
        );
      }
      if (translationCreates.length) {
        updates.push(
          api.post(`/items/${props.translationsCollection}`, translationCreates, {
            params: { fields: ["id"] }
          })
        );
      }
      const pendingCells = Array.from(unpersistedCells.value.entries());
      const hasAnyBuyPrice = pendingCells.some(
        ([, cell]) => !isBuyPriceEmpty(cell[props.buyPriceField])
      );
      const cellsToCreate = hasAnyBuyPrice ? pendingCells : [];
      const createdRows = [];
      const filterValue = props.parentKeyField ? props.values?.[props.parentKeyField] ?? parent_id.value : parent_id.value;
      const createdRes = await Promise.all([
        Promise.all(updates),
        cellsToCreate.length ? api.post(
          `/items/${props.relatedCollection}`,
          cellsToCreate.map(([, cell]) => ({
            [props.foreignKeyField]: filterValue,
            [props.groupByField]: cell[props.groupByField],
            [props.rowField]: cell[props.rowField],
            [props.columnField]: cell[props.columnField],
            [props.buyPriceField]: isBuyPriceEmpty(
              cell[props.buyPriceField]
            ) ? 0 : roundToPricePrecision(cell[props.buyPriceField])
          })),
          { params: { fields: ["id"] } }
        ) : Promise.resolve(null)
      ]).then((results) => results[1]);
      if (createdRes) {
        const createdData = createdRes.data?.data ?? createdRes.data;
        createdRows.push(...Array.isArray(createdData) ? createdData : [createdData]);
        createdRows.forEach((row, i) => {
          const cell = cellsToCreate[i]?.[1];
          freshRows.push({
            id: row.id,
            [props.buyPriceField]: isBuyPriceEmpty(
              cell?.[props.buyPriceField]
            ) ? 0 : roundToPricePrecision(cell?.[props.buyPriceField])
          });
        });
        if (isJunction() && translations_id.value) {
          const newTranslations = cellsToCreate.map(([, cell], i) => ({ cell, newId: createdRows[i]?.id })).filter(
            ({ cell, newId }) => newId && cell[props.sellPriceField] != null
          ).map(({ cell, newId }) => ({
            [props.translationsFKField]: newId,
            [props.translationsLanguageField]: translations_id.value,
            [props.sellPriceField]: roundToPricePrecision(
              cell[props.sellPriceField]
            )
          }));
          if (newTranslations.length) {
            await api.post(
              `/items/${props.translationsCollection}`,
              newTranslations,
              { params: { fields: ["id"] } }
            );
          }
        }
        cellsToCreate.forEach(([key]) => unpersistedCells.value.delete(key));
      }
      if (refetch) {
        await fetchItems(true);
      } else if (createdRows.length) {
        const tmap = isJunction() ? await fetchTranslationMap() : /* @__PURE__ */ new Map();
        items.value.push(
          ...createdRows.map((row, i) => {
            const cell = cellsToCreate[i]?.[1] ?? {};
            const translation = tmap.get(row.id);
            const translationLangId = typeof translation?.[props.translationsLanguageField] === "object" ? translation[props.translationsLanguageField]?.id : translation?.[props.translationsLanguageField];
            const buyPrice = isBuyPriceEmpty(cell[props.buyPriceField]) ? 0 : roundToPricePrecision(cell[props.buyPriceField]);
            if (!isJunction()) {
              return {
                ...cell,
                id: row.id,
                [props.buyPriceField]: buyPrice,
                [props.sellPriceField]: roundToPricePrecision(row[props.sellPriceField])
              };
            }
            return {
              ...cell,
              id: row.id,
              [props.buyPriceField]: buyPrice,
              [props.sellPriceField]: roundToPricePrecision(
                translation?.[props.sellPriceField] ?? row[props.sellPriceField]
              ),
              _translation_id: translation?.id ?? null,
              _translation_lang_id: translationLangId ?? translations_id.value
            };
          })
        );
        originalItems.value = JSON.parse(JSON.stringify(items.value));
        hasChanges.value = false;
      }
      return freshRows;
    } catch (err) {
      console.error(`${logPrefix} Save error:`, err);
      errorMessage.value = err?.response?.data?.error || err?.response?.data?.errors?.[0]?.message || err?.message || "Failed to save changes.";
      return [];
    }
  };
  const calculateSellPrices = async () => {
    if (!parent_id.value || parent_id.value === "+") {
      errorMessage.value = isJunction() ? "Save the record first before calculating sell prices." : "Save the record first before saving prices.";
      return;
    }
    if (!isJunction()) {
      calculatingSellPrices.value = true;
      errorMessage.value = "";
      try {
        if (hasChanges.value) {
          saving.value = true;
          try {
            await persistChanges(false);
          } finally {
            saving.value = false;
          }
          if (errorMessage.value)
            return;
        }
        const directMissing = describeMissingConfig([
          { value: props.buyPriceTypeField, label: "Buy Price Type Field" },
          { value: props.sellPriceTypeField, label: "Sell Price Type Field" },
          { value: props.percentageTypeField, label: "Percentage Type Field" },
          { value: props.marginField, label: "Margin Percentage Field" },
          { value: props.provisionField, label: "Provision Percentage Field" },
          { value: props.roundHalfLogic, label: "Round Half Logic" },
          { value: props.calculateSellPriceLogic, label: "Calculate Sell Price Logic" }
        ]);
        if (directMissing.length)
          return;
        const compiled = compileCalculator(
          props.roundHalfLogic,
          props.calculateSellPriceLogic
        );
        if (compiled.error)
          throw new Error(compiled.error);
        const { calculateSellPrice } = compiled;
        const { data: parentRes } = await api.get(
          `/items/${props.parentCollection}/${parent_id.value}`
        );
        const settingsRow = parentRes.data;
        let rateValue = 1;
        if (props.junctionExchangeRateField && props.ratesCollection) {
          const rateKey = settingsRow[props.junctionExchangeRateField]?.key;
          if (rateKey) {
            const { data: rateRes } = await api.get(
              `/items/${props.ratesCollection}/${rateKey}`,
              { params: { fields: ["rate"] } }
            );
            rateValue = parseFloat(rateRes.data?.rate) || 1;
          }
        }
        const occupancyValueMap = /* @__PURE__ */ new Map();
        if (props.occupancyJunctionCollection && props.occupancyJunctionParentField) {
          const occupancyJunctionRows = await api.get(`/items/${props.occupancyJunctionCollection}`, {
            params: {
              filter: {
                [props.occupancyJunctionParentField]: {
                  _eq: parent_id.value
                }
              },
              fields: [
                "id",
                props.occupancyJunctionRelatedField ? `${props.occupancyJunctionRelatedField}.${props.occupancyValueField}` : props.occupancyValueField
              ],
              limit: -1
            }
          }).then((r) => r.data.data || []);
          occupancyJunctionRows.forEach((occ) => {
            const related = props.occupancyJunctionRelatedField ? occ[props.occupancyJunctionRelatedField] : occ;
            const value = related && typeof related === "object" ? related[props.occupancyValueField] : void 0;
            const occId = normalizeOccupancyFromJunctionBound(occ).id;
            if (occId !== void 0 && occId !== null) {
              occupancyValueMap.set(lookupKey(occId), value ?? 1);
            }
          });
        }
        const priceUpdates = [];
        let formulaErrorCount = 0;
        items.value.forEach((priceRow) => {
          const occupancyValue = occupancyValueMap.get(lookupKey(priceRow[props.columnField])) ?? 1;
          const buyRaw = priceRow[props.buyPriceField];
          const buyIsZero = buyRaw === null || buyRaw === void 0 || buyRaw === "" || Number(buyRaw) === 0;
          let sellPrice = null;
          if (buyIsZero) {
            sellPrice = 0;
          } else {
            try {
              const result = calculateSellPrice(
                buyRaw,
                settingsRow,
                priceRow,
                rateValue,
                occupancyValue
              );
              if (result === null || Number.isFinite(result))
                sellPrice = result;
            } catch (calcErr) {
              console.error(
                `${logPrefix} Formula threw for price row`,
                priceRow.id,
                calcErr
              );
              formulaErrorCount += 1;
            }
          }
          sellPrice = roundToPricePrecision(sellPrice);
          const current = priceRow[props.sellPriceField];
          const currentNum = current === null || current === void 0 || current === "" ? null : Number(current);
          const unchanged = sellPrice === null || sellPrice === void 0 ? currentNum === null : currentNum !== null && currentNum === sellPrice;
          if (!unchanged) {
            priceUpdates.push({ id: priceRow.id, [props.sellPriceField]: sellPrice });
          }
        });
        if (priceUpdates.length) {
          await api.patch(`/items/${props.relatedCollection}`, priceUpdates, {
            params: { fields: ["id"] }
          });
        }
        await fetchItems(true);
        hasChanges.value = false;
        if (formulaErrorCount > 0) {
          errorMessage.value = `Calculate Sell Price Logic threw an error for ${formulaErrorCount} row(s) \u2014 see the browser console for details.`;
        }
      } catch (err) {
        console.error(`${logPrefix} calculateSellPrices (direct) error:`, err);
        errorMessage.value = err?.response?.data?.error || err?.response?.data?.errors?.[0]?.message || err?.message || "Failed to calculate sell prices.";
      } finally {
        calculatingSellPrices.value = false;
      }
      return;
    }
    const missing = [...saveRequiredFields(), ...calculateRequiredFields()];
    if (missing.length) {
      errorMessage.value = missingConfigMessage(missing);
      return;
    }
    calculatingSellPrices.value = true;
    errorMessage.value = "";
    try {
      if (hasChanges.value) {
        saving.value = true;
        try {
          await persistChanges(false);
        } finally {
          saving.value = false;
        }
        if (errorMessage.value) {
          calculatingSellPrices.value = false;
          return;
        }
      }
      const settingsParentField = props.parentKeyField || props.junctionParentKeyField;
      const compiled = compileCalculator(
        props.roundHalfLogic,
        props.calculateSellPriceLogic
      );
      if (compiled.error)
        throw new Error(compiled.error);
      const { calculateSellPrice } = compiled;
      const settingsRows = await api.get(`/items/${props.junctionCollection}`, {
        params: {
          filter: { [settingsParentField]: { _eq: parent_id.value } },
          fields: ["*"],
          limit: -1
        }
      }).then((r) => r.data.data || []);
      const usedRateKeys = Array.from(
        new Set(
          settingsRows.map((s) => s[props.junctionExchangeRateField]?.key).filter((k) => !!k)
        )
      );
      const [rates, priceRows, occupancyJunctionRows, existingTranslations] = await Promise.all([
        usedRateKeys.length ? api.get(`/items/${props.ratesCollection}`, {
          params: {
            filter: { id: { _in: usedRateKeys } },
            fields: ["id", "rate"],
            limit: -1
          }
        }).then((r) => r.data.data || []) : Promise.resolve([]),
        /*
         * `persistChanges(false)` already merged any just-created rows
         * into `items.value` above, so reuse it directly rather than
         * re-fetching the row collection it just came from.
         */
        Promise.resolve(items.value),
        api.get(`/items/${props.occupancyJunctionCollection}`, {
          params: {
            filter: {
              [props.occupancyJunctionParentField]: {
                _eq: parent_id.value
              }
            },
            fields: [
              "id",
              props.occupancyJunctionRelatedField ? `${props.occupancyJunctionRelatedField}.${props.occupancyValueField}` : props.occupancyValueField
            ],
            limit: -1
          }
        }).then((r) => r.data.data || []),
        api.get(`/items/${props.translationsCollection}`, {
          params: {
            filter: {
              [props.translationsFKField]: {
                [props.foreignKeyField]: { _eq: parent_id.value }
              }
            },
            fields: [
              "id",
              props.translationsFKField,
              props.translationsLanguageField,
              props.sellPriceField
            ],
            limit: -1
          }
        }).then((r) => r.data.data || [])
      ]);
      const occupancyValueMap = /* @__PURE__ */ new Map();
      occupancyJunctionRows.forEach((occ) => {
        const related = props.occupancyJunctionRelatedField ? occ[props.occupancyJunctionRelatedField] : occ;
        const value = related && typeof related === "object" ? related[props.occupancyValueField] : void 0;
        const occId = normalizeOccupancyFromJunctionBound(occ).id;
        if (occId !== void 0 && occId !== null) {
          occupancyValueMap.set(lookupKey(occId), value ?? 1);
        }
      });
      const rateById = new Map(
        rates.map((r) => [r.id, r])
      );
      const translationByKey = new Map(
        existingTranslations.map((t) => [
          `${t[props.translationsFKField]}|${t[props.translationsLanguageField]}`,
          t
        ])
      );
      const translationUpdates = [];
      const translationCreates = [];
      let formulaErrorCount = 0;
      settingsRows.forEach((settingsRow) => {
        const langId = settingsRow[props.junctionLanguageField];
        if (!langId)
          return;
        if (settingsRow[props.buyPriceTypeField] == null || settingsRow[props.sellPriceTypeField] == null || settingsRow[props.percentageTypeField] == null || settingsRow[props.marginField] == null || settingsRow[props.junctionExchangeRateField] == null) {
          return;
        }
        const exchangeRateInfo = settingsRow[props.junctionExchangeRateField];
        const rateRecord = exchangeRateInfo && exchangeRateInfo.key ? rateById.get(exchangeRateInfo.key) : void 0;
        if (!rateRecord)
          return;
        const rateValue = parseFloat(rateRecord.rate);
        priceRows.forEach((priceRow) => {
          const occupancyValue = occupancyValueMap.get(
            lookupKey(priceRow[props.columnField])
          ) ?? 1;
          let sellPrice = null;
          const buyRaw = priceRow[props.buyPriceField];
          const buyIsZero = buyRaw === null || buyRaw === void 0 || buyRaw === "" || Number(buyRaw) === 0;
          if (buyIsZero) {
            sellPrice = 0;
          } else {
            try {
              const result = calculateSellPrice(
                buyRaw,
                settingsRow,
                priceRow,
                rateValue,
                occupancyValue
              );
              if (result === null || Number.isFinite(result)) {
                sellPrice = result;
              }
            } catch (calcErr) {
              console.error(
                `${logPrefix} Formula threw for price row`,
                priceRow.id,
                calcErr
              );
              formulaErrorCount += 1;
            }
          }
          sellPrice = roundToPricePrecision(sellPrice);
          const key = `${priceRow.id}|${langId}`;
          const existing = translationByKey.get(key);
          if (existing) {
            const current = existing[props.sellPriceField];
            const currentNum = current === null || current === void 0 || current === "" ? null : Number(current);
            const unchanged = sellPrice === null || sellPrice === void 0 ? currentNum === null : currentNum !== null && currentNum === sellPrice;
            if (!unchanged) {
              translationUpdates.push({
                id: existing.id,
                [props.sellPriceField]: sellPrice
              });
            }
          } else {
            translationCreates.push({
              [props.translationsFKField]: priceRow.id,
              [props.translationsLanguageField]: langId,
              [props.sellPriceField]: sellPrice
            });
          }
        });
      });
      await Promise.all([
        translationUpdates.length ? api.patch(
          `/items/${props.translationsCollection}`,
          translationUpdates,
          { params: { fields: ["id"] } }
        ) : Promise.resolve(),
        translationCreates.length ? api.post(
          `/items/${props.translationsCollection}`,
          translationCreates,
          { params: { fields: ["id"] } }
        ) : Promise.resolve(),
        api.patch(
          `/items/${props.parentCollection}/${parent_id.value}`,
          {
            [props.sellStatusField]: "done",
            [props.sellUpdatedAtField]: (/* @__PURE__ */ new Date()).toISOString()
          },
          { params: { fields: ["id"] } }
        )
      ]);
      const translationMap = await fetchTranslationMap();
      items.value.forEach((item) => {
        const translation = translationMap.get(item.id);
        if (!translation)
          return;
        const langId = typeof translation[props.translationsLanguageField] === "object" ? translation[props.translationsLanguageField]?.id : translation[props.translationsLanguageField];
        item[props.sellPriceField] = roundToPricePrecision(
          translation[props.sellPriceField]
        );
        item._translation_id = translation.id;
        item._translation_lang_id = langId ?? translations_id.value;
      });
      originalItems.value = JSON.parse(JSON.stringify(items.value));
      hasChanges.value = false;
      if (formulaErrorCount > 0) {
        errorMessage.value = `Calculate Sell Price Logic threw an error for ${formulaErrorCount} row(s) \u2014 see the browser console for details.`;
      }
    } catch (err) {
      console.error(`${logPrefix} calculateSellPrices error:`, err);
      errorMessage.value = err?.response?.data?.error || err?.response?.data?.errors?.[0]?.message || err?.message || "Failed to calculate sell prices.";
      try {
        await api.patch(
          `/items/${props.parentCollection}/${parent_id.value}`,
          { [props.sellStatusField]: "failed" }
        );
      } catch (statusErr) {
      }
    } finally {
      calculatingSellPrices.value = false;
    }
  };
  return {
    initParentContext,
    fetchCurrencySymbols,
    fetchItems,
    loadAll,
    refreshLookupsAndReconcile,
    persistChanges,
    calculateSellPrices
  };
}

var _sfc_main = defineComponent({
  /*
   * No field-name, collection-name, or cosmetic prop below carries a
   * default value. An unconfigured prop is simply absent/empty, so a
   * misconfiguration surfaces as a visibly missing value instead of a
   * silent, wrong guess (e.g. assuming a "name" field or a "€" symbol).
   */
  props: {
    mode: { type: String },
    value: { type: Array, default: () => [] },
    label: { type: String },
    buttonPosition: { type: String },
    primaryKey: { type: [String, Number], default: null },
    collection: { type: String, required: true },
    field: { type: String, required: true },
    groupByField: { type: String },
    rowField: { type: String },
    columnField: { type: String },
    disabled: { type: Boolean },
    values: { type: Object, default: () => ({}) },
    buyPriceTypeField: { type: String },
    sellPriceTypeField: { type: String },
    percentageTypeField: { type: String },
    marginField: { type: String },
    provisionField: { type: String },
    occupancyValueField: { type: String },
    roundHalfLogic: { type: String },
    calculateSellPriceLogic: { type: String },
    // Related collection (prices)
    relatedCollection: { type: String },
    foreignKeyField: { type: String },
    buyPriceField: { type: String },
    // Parent record
    parentCollection: { type: String },
    parentKeyField: { type: String },
    occupanciesField: { type: String },
    occupancySourceMode: { type: String },
    occupancyJunctionCollection: { type: String },
    occupancyJunctionPrimaryKeyField: { type: String },
    occupancyJunctionParentField: { type: String },
    occupancyJunctionRelatedField: { type: String },
    /*
     * Dot-path into the occupancy junction row for the value the price
     * record's occupancy foreign key actually stores — e.g. "id" when the
     * FK points at the junction row itself (hotels: room_prices.room_occupancy_id
     * → hotels_occupancies.id), or "tours_occupancies_id.id" when it points
     * at the original occupancy record instead (tours). Resolved via
     * `getNestedValue`.
     */
    occupancyIdField: { type: String },
    occupancyCollection: { type: String },
    categoryOrderField: { type: String },
    groupByCollection: { type: String },
    /*
     * Field on `groupByCollection` that links a per-weekday child category
     * back to its parent (the hotel `room_categories.sharedId` feature).
     * Presence of this config — not a separate boolean — is what enables
     * the whole child-category fetch/merge: leave it unset for a
     * collection with no such concept (e.g. `tours_categories`).
     */
    groupSharedIdField: { type: String },
    // Field on the parent category holding its per-weekday repeater
    // entries (hotel: `days_repeater`) — read only when the category
    // resolved via `groupSharedIdField` turns out to be a child.
    groupChildWeekdaysField: { type: String },
    rowCollection: { type: String },
    sellStatusField: { type: String },
    sellUpdatedAtField: { type: String },
    // Junction collection
    junctionCollection: { type: String },
    junctionParentKeyField: { type: String },
    junctionLanguageField: { type: String },
    junctionExchangeRateField: { type: String },
    // Translations collection (sell prices)
    translationsCollection: { type: String },
    translationsFKField: { type: String },
    translationsLanguageField: { type: String },
    sellPriceField: { type: String },
    // Currency
    ratesCollection: { type: String },
    fromCurrencyField: { type: String },
    toCurrencyField: { type: String },
    currencySymbolField: { type: String },
    defaultBuyCurrencySymbol: { type: String },
    defaultSellCurrencySymbol: { type: String },
    fromPriceSymbol: { type: String },
    groupFromPriceField: { type: String },
    occupancyFromPriceField: { type: String },
    rowFromPriceField: { type: String },
    occupancySortField: { type: String },
    rowSortField: { type: String },
    groupSortField: { type: String },
    groupLabelField: { type: String },
    groupLabelTranslationField: { type: String },
    occupancyLabelField: { type: String },
    occupancyLabelFallbackMinField: { type: String },
    occupancyLabelFallbackMaxField: { type: String },
    occupancyLabelFallbackCategoryField: { type: String },
    rowLabelField: { type: String },
    rowStartDateField: { type: String },
    rowEndDateField: { type: String },
    languageNameField: { type: String },
    emptyStateTitle: { type: String },
    emptyStateHint: { type: String },
    buyLabel: { type: String },
    sellLabel: { type: String }
  },
  emits: ["input"],
  setup(props) {
    const api = useApi();
    const isJunction = () => props.mode === "junction";
    const logPrefix = isJunction() ? "[RoomPricesTable]" : "[RoomPricesTable/Direct]";
    const loading = ref(false);
    const saving = ref(false);
    const calculatingSellPrices = ref(false);
    const errorMessage = ref("");
    const items = ref([]);
    const originalItems = ref([]);
    const hasChanges = ref(false);
    const unpersistedCells = ref(/* @__PURE__ */ new Map());
    const parent_id = ref(null);
    const translations_id = ref(null);
    const lookupData = createLookupData();
    const parentRecord = ref(null);
    const buyCurrencySymbol = ref("");
    const sellCurrencySymbol = ref("");
    const roomCategoryOrder = ref([]);
    const sellPricesStatus = ref(null);
    const sellPricesUpdatedAt = ref(null);
    const availableTranslations = ref([]);
    const selectedTranslationId = ref(null);
    const expandedGroups = ref({});
    const {
      initParentContext,
      fetchCurrencySymbols,
      fetchItems,
      loadAll,
      refreshLookupsAndReconcile,
      persistChanges,
      calculateSellPrices: calculateSellPricesInternal
    } = usePriceTableData({
      props,
      api,
      logPrefix,
      isJunction,
      parent_id,
      translations_id,
      items,
      originalItems,
      hasChanges,
      unpersistedCells,
      lookupData,
      parentRecord,
      buyCurrencySymbol,
      sellCurrencySymbol,
      roomCategoryOrder,
      sellPricesStatus,
      sellPricesUpdatedAt,
      availableTranslations,
      selectedTranslationId,
      errorMessage,
      loading,
      saving,
      calculatingSellPrices
    });
    const handleExternalCalculation = async (event) => {
      const detail = event.detail;
      if (detail?.parentId && String(detail.parentId) === String(parent_id.value)) {
        await refreshLookupsAndReconcile();
        await fetchItems(true);
      }
    };
    watch(hasChanges, (dirty) => {
      window.dispatchEvent(
        new CustomEvent("price-table:dirty-changed", { detail: { dirty } })
      );
    });
    const handleFlushRequest = async () => {
      let freshRows = [];
      try {
        if (hasChanges.value)
          freshRows = await persistChanges();
      } finally {
        window.dispatchEvent(
          new CustomEvent("save-and-stay:flush-complete", {
            detail: { source: "price-table", freshRows }
          })
        );
      }
    };
    const cellMap = computed(() => {
      const map = /* @__PURE__ */ new Map();
      const candidatesByKey = /* @__PURE__ */ new Map();
      items.value.forEach((item) => {
        const key = `${item[props.groupByField]}|${item[props.rowField]}|${item[props.columnField]}`;
        const bucket = candidatesByKey.get(key);
        if (bucket)
          bucket.push(item);
        else
          candidatesByKey.set(key, [item]);
      });
      candidatesByKey.forEach((candidates, key) => {
        map.set(
          key,
          pickBestPriceRow(
            candidates,
            props.buyPriceField,
            props.sellPriceField
          )
        );
      });
      unpersistedCells.value.forEach((cell, key) => {
        if (!map.has(key))
          map.set(key, cell);
      });
      return map;
    });
    const getCell = (groupKey, rowId, colId) => {
      const key = `${groupKey}|${rowId}|${colId}`;
      return cellMap.value.get(key) || {};
    };
    const isCellModified = (groupKey, rowId, colId) => {
      const current = getCell(groupKey, rowId, colId);
      if (current.id === void 0) {
        return current[props.buyPriceField] != null || current[props.sellPriceField] != null;
      }
      const original = originalItems.value.find((o) => o.id === current.id);
      return original && (original[props.sellPriceField] !== current[props.sellPriceField] || original[props.buyPriceField] !== current[props.buyPriceField]);
    };
    const getOrCreateEditableCell = (groupKey, rowId, colId) => {
      const key = `${groupKey}|${rowId}|${colId}`;
      const existing = cellMap.value.get(key);
      if (existing)
        return existing;
      const draft = {
        [props.groupByField]: groupKey,
        [props.rowField]: rowId,
        [props.columnField]: colId,
        [props.buyPriceField]: null,
        [props.sellPriceField]: null,
        _translation_id: null
      };
      unpersistedCells.value.set(key, draft);
      return draft;
    };
    const handleBuyPriceInput = (groupKey, rowId, colId, event) => {
      const input = event.target;
      const value = input.value === "" ? null : Number(input.value);
      const cell = getOrCreateEditableCell(groupKey, rowId, colId);
      cell[props.buyPriceField] = value;
      hasChanges.value = true;
    };
    const columns = useColumns(props, lookupData);
    const hasMinimumConfig = useHasMinimumConfig(lookupData, columns);
    const rows = useRows(props, lookupData);
    const groupedData = useGroupedData(props, lookupData, items, rows);
    const orderedGroupedData = useOrderedGroupedData(
      props,
      lookupData,
      groupedData,
      roomCategoryOrder
    );
    if (props.groupByField) {
      watch(
        [orderedGroupedData, columns, items],
        () => {
          seedUnpersistedCells(
            orderedGroupedData.value,
            columns.value,
            items,
            unpersistedCells,
            props
          );
        },
        { immediate: true }
      );
    }
    const getGroupLabel$1 = (key) => getGroupLabel(
      key,
      lookupData.value.categories,
      props,
      isJunction() ? translations_id.value : void 0
    );
    const getGroupFromPrice$1 = (key) => getGroupFromPrice(
      key,
      lookupData.value.categories,
      props.groupFromPriceField
    );
    const isZero = (value) => value != null && value !== "" && Number(value) === 0;
    const getBuyValue = (groupKey, rowId, colId) => getCell(groupKey, rowId, colId)[props.buyPriceField || ""];
    const editedBuyCellKeys = reactive(/* @__PURE__ */ new Set());
    const buyCellKey = (groupKey, rowId, colId) => `${groupKey}|${rowId}|${colId}`;
    const markBuyCellTyped = (groupKey, rowId, colId) => {
      editedBuyCellKeys.add(buyCellKey(groupKey, rowId, colId));
    };
    const getBuyDisplay = (groupKey, rowId, colId) => {
      const buy = getBuyValue(groupKey, rowId, colId);
      if (!isZero(buy))
        return buy;
      return editedBuyCellKeys.has(buyCellKey(groupKey, rowId, colId)) ? buy : "";
    };
    const calculateSellPrices = async () => {
      await calculateSellPricesInternal();
      editedBuyCellKeys.clear();
    };
    const formatPrice = (value) => {
      if (isZero(value))
        return "";
      if (value == null || isNaN(Number(value)))
        return "";
      return Number(value).toFixed(PRICE_PRECISION);
    };
    const rowStartDateFormat = ref("dd.MM.yyyy");
    const rowEndDateFormat = ref("dd.MM.yyyy");
    const loadFieldFormat = async (fieldName, target) => {
      if (!props.rowCollection || !fieldName)
        return;
      try {
        const { data } = await api.get(
          `/fields/${props.rowCollection}/${fieldName}`
        );
        const configuredFormat = data?.data?.meta?.options?.format;
        if (configuredFormat)
          target.value = configuredFormat;
      } catch {
      }
    };
    const loadRowDateFormat = async () => Promise.all([
      loadFieldFormat(props.rowStartDateField, rowStartDateFormat),
      loadFieldFormat(props.rowEndDateField, rowEndDateFormat)
    ]);
    const INTL_DATE_STYLE_PRESETS = /* @__PURE__ */ new Set(["full", "long", "medium", "short"]);
    const formatWithPattern = (d, value) => {
      if (INTL_DATE_STYLE_PRESETS.has(value)) {
        return new Intl.DateTimeFormat(void 0, {
          dateStyle: value
        }).format(new Date(d));
      }
      return format(new Date(d), value);
    };
    const formatDateRange = (start, end) => {
      if (!start)
        return "";
      const formattedStart = formatWithPattern(start, rowStartDateFormat.value);
      return end ? `${formattedStart} - ${formatWithPattern(end, rowEndDateFormat.value)}` : formattedStart;
    };
    const isDateRangeName = (name) => {
      const parts = name.split(/\s*[-–]\s*/);
      if (parts.length !== 2)
        return false;
      const ref2 = new Date(2e3, 0, 1);
      return parts.every((p) => isValid(parse(p.trim(), "dd.MM.yyyy", ref2)));
    };
    const toggleGroup = (groupKey) => {
      expandedGroups.value[groupKey] = !expandedGroups.value[groupKey];
    };
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && parent_id.value) {
        await refreshLookupsAndReconcile();
        await fetchItems(true);
      }
    };
    onMounted(async () => {
      await initParentContext();
      await Promise.all([loadAll(), loadRowDateFormat()]);
      if (isJunction()) {
        window.addEventListener(
          "price-calculator:calculated",
          handleExternalCalculation
        );
      }
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("save-and-stay:flush-request", handleFlushRequest);
    });
    onUnmounted(() => {
      if (isJunction()) {
        window.removeEventListener(
          "price-calculator:calculated",
          handleExternalCalculation
        );
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("save-and-stay:flush-request", handleFlushRequest);
      window.dispatchEvent(
        new CustomEvent("price-table:dirty-changed", { detail: { dirty: false } })
      );
    });
    watch(
      orderedGroupedData,
      (newVal) => {
        Object.keys(newVal).forEach((key) => {
          if (expandedGroups.value[key] === void 0) {
            expandedGroups.value[key] = true;
          }
        });
      },
      { immediate: true }
    );
    watch(selectedTranslationId, async (newVal) => {
      if (newVal === null || newVal === void 0)
        return;
      const current = availableTranslations.value.find(
        (t) => t.value === newVal
      );
      if (current) {
        translations_id.value = current.lang_id ? String(current.lang_id) : null;
        if (current.exchange_rate?.key) {
          fetchCurrencySymbols(current.exchange_rate.key);
        }
        await fetchItems();
      }
    });
    watch(
      () => props.primaryKey,
      async () => {
        parent_id.value = null;
        translations_id.value = null;
        await initParentContext();
        await loadAll();
      }
    );
    watch(
      [items, unpersistedCells],
      () => {
        const hasUnpersistedEdits = Array.from(
          unpersistedCells.value.values()
        ).some(
          (cell) => cell[props.buyPriceField] != null || cell[props.sellPriceField] != null
        );
        hasChanges.value = hasUnpersistedEdits || JSON.stringify(items.value) !== JSON.stringify(originalItems.value);
      },
      { deep: true }
    );
    watch(
      () => props.values,
      async (newVal) => {
        if (!isJunction())
          return;
        if (props.primaryKey === "+") {
          const parentField = props.parentKeyField || props.junctionParentKeyField;
          const langField = props.junctionLanguageField;
          if (!parentField)
            return;
          const hId = newVal?.[parentField];
          const tId = newVal?.[langField];
          if (hId && hId !== parent_id.value) {
            parent_id.value = typeof hId === "object" ? hId.id : hId;
          }
          if (tId && tId !== translations_id.value) {
            translations_id.value = typeof tId === "object" ? tId.id : tId;
            await fetchItems();
          }
        }
      },
      { deep: true }
    );
    return {
      loading,
      saving,
      calculatingSellPrices,
      errorMessage,
      hasChanges,
      items,
      availableTranslations,
      selectedTranslationId,
      buyCurrencySymbol,
      sellCurrencySymbol,
      orderedGroupedData,
      hasMinimumConfig,
      columns,
      expandedGroups,
      getGroupLabel: getGroupLabel$1,
      getGroupFromPrice: getGroupFromPrice$1,
      formatPrice,
      getBuyDisplay,
      markBuyCellTyped,
      formatDateRange,
      getCell,
      isCellModified,
      handleBuyPriceInput,
      calculateSellPrices,
      toggleGroup,
      isDateRangeName,
      parent_id,
      translations_id,
      buyPriceField: props.buyPriceField,
      sellPriceField: props.sellPriceField
    };
  }
});

var e=[],t=[];function n(n,r){if(n&&"undefined"!=typeof document){var a,s=!0===r.prepend?"prepend":"append",d=!0===r.singleTag,i="string"==typeof r.container?document.querySelector(r.container):document.getElementsByTagName("head")[0];if(d){var u=e.indexOf(i);-1===u&&(u=e.push(i)-1,t[u]={}),a=t[u]&&t[u][s]?t[u][s]:t[u][s]=c();}else a=c();65279===n.charCodeAt(0)&&(n=n.substring(1)),a.styleSheet?a.styleSheet.cssText+=n:a.appendChild(document.createTextNode(n));}function c(){var e=document.createElement("style");if(e.setAttribute("type","text/css"),r.attributes)for(var t=Object.keys(r.attributes),n=0;n<t.length;n++)e.setAttribute(t[n],r.attributes[t[n]]);var a="prepend"===s?"afterbegin":"beforeend";return i.insertAdjacentElement(a,e),e}}

var css = "\n.room-prices-table[data-v-2b04b4bf] {\n  width: 100%;\n  color: var(--theme--foreground);\n  font-size: 0.8125rem;\n}\n.loading[data-v-2b04b4bf] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  padding: 4rem 2rem;\n  color: var(--theme--foreground-subdued);\n  gap: 1rem;\n}\n.error-notice[data-v-2b04b4bf] {\n  margin-bottom: 1rem;\n}\n.context-header[data-v-2b04b4bf] {\n  margin-bottom: 0.75rem;\n}\n.selector-field[data-v-2b04b4bf] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  font-size: 0.8125rem;\n}\n.selector-label[data-v-2b04b4bf] {\n  font-weight: 600;\n  color: var(--theme--foreground-subdued);\n  white-space: nowrap;\n}\n.save-bar[data-v-2b04b4bf] {\n  display: flex;\n  align-items: center;\n  justify-content: flex-start;\n  padding: 0.5rem 0;\n  margin-bottom: 1rem;\n}\n.price-group[data-v-2b04b4bf] {\n  margin-bottom: 1rem;\n  border-radius: var(--theme--border-radius);\n  overflow: hidden;\n  border: var(--theme--border-width) solid var(--theme--border-color);\n}\n.table-wrapper[data-v-2b04b4bf] {\n  overflow-x: auto;\n}\n.prices-table[data-v-2b04b4bf] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.8125rem;\n  table-layout: fixed;\n}\ncol.col-label[data-v-2b04b4bf] {\n  width: 220px;\n}\ncol.col-price-type[data-v-2b04b4bf] {\n  width: 110px;\n}\ncol.col-price[data-v-2b04b4bf] {\n  width: 120px;\n}\n.prices-table th[data-v-2b04b4bf],\n.prices-table td[data-v-2b04b4bf] {\n  border: var(--theme--border-width) solid var(--theme--border-color);\n  padding: 0.5rem 0.75rem;\n  vertical-align: middle;\n}\n.group-header-cell[data-v-2b04b4bf] {\n  background: var(--theme--background-subdued);\n  cursor: pointer;\n  user-select: none;\n  width: 320px;\n  min-width: 200px;\n  text-align: left;\n  transition: background var(--fast) var(--transition);\n}\n.group-header-cell[data-v-2b04b4bf]:hover {\n  background: color-mix(\n    in srgb,\n    var(--theme--background-subdued),\n    var(--theme--foreground-subdued) 15%\n  );\n}\n.group-header-inner[data-v-2b04b4bf] {\n  display: flex;\n  align-items: center;\n  gap: 0.375rem;\n}\n.accordion-icon[data-v-2b04b4bf] {\n  color: var(--theme--primary);\n  flex-shrink: 0;\n  transition: transform 0.2s ease;\n}\n.accordion-icon.is-expanded[data-v-2b04b4bf] {\n  transform: rotate(180deg);\n}\n.group-title[data-v-2b04b4bf] {\n  font-size: 0.875rem;\n  font-weight: 600;\n  color: var(--theme--primary);\n  white-space: nowrap;\n}\n.column-header[data-v-2b04b4bf] {\n  background: var(--theme--background-subdued);\n  color: var(--theme--primary);\n  font-weight: 600;\n  font-size: 14px;\n  text-align: center;\n  min-width: 100px;\n  white-space: nowrap;\n}\n.sticky-col[data-v-2b04b4bf] {\n  position: sticky;\n  left: 0;\n}\n.row-label[data-v-2b04b4bf] {\n  background: var(--theme--background-normal);\n  text-align: left;\n  font-weight: 500;\n  width: 220px;\n  min-width: 160px;\n}\n.row-label-content[data-v-2b04b4bf] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.2rem;\n}\n.date-range[data-v-2b04b4bf] {\n  color: var(--theme--foreground-accent);\n  font-weight: 400;\n  font-size: 0.75rem;\n}\n.date-name[data-v-2b04b4bf] {\n  color: var(--theme--foreground-accent);\n  font-weight: 600;\n  font-size: 0.75rem;\n}\n.label-col[data-v-2b04b4bf] {\n  background: var(--theme--banner--title--foreground);\n  text-align: left;\n  width: 110px;\n  min-width: 100px;\n}\n.price-labels[data-v-2b04b4bf] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.375rem;\n}\n.input-label[data-v-2b04b4bf] {\n  font-size: 0.75rem;\n  font-weight: 600;\n  display: flex;\n  align-items: center;\n  gap: 0.25rem;\n  white-space: nowrap;\n}\n.buy-label[data-v-2b04b4bf] {\n  color: var(--theme--foreground);\n}\n.sell-label[data-v-2b04b4bf] {\n  color: var(--theme--foreground-subdued);\n}\n.price-cell[data-v-2b04b4bf] {\n  background: var(--theme--background-normal);\n  padding: 0.5rem !important;\n  min-width: 100px;\n}\n.price-cell.has-changes[data-v-2b04b4bf] {\n  background: var(--theme--warning-background);\n  border-color: var(--theme--warning);\n}\n.price-inputs[data-v-2b04b4bf] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.3rem;\n}\n.cell-input[data-v-2b04b4bf] {\n  width: 100%;\n  padding: 0.3rem 0.5rem;\n  border: var(--theme--border-width) solid var(--theme--border-color);\n  border-radius: var(--theme--border-radius);\n  background: var(--theme--banner--title--foreground);\n  color: var(--theme--foreground);\n  font-size: 0.8125rem;\n  text-align: center;\n  transition: border-color var(--fast) var(--transition);\n}\n.cell-input[data-v-2b04b4bf]:hover:not(:disabled) {\n  border-color: var(--theme--primary);\n}\n.cell-input[data-v-2b04b4bf]:focus {\n  outline: none;\n  border-color: var(--theme--primary);\n  box-shadow: 0 0 0 2px var(--theme--primary-background);\n}\n.cell-input[data-v-2b04b4bf]:disabled {\n  background: var(--theme--background-subdued);\n  color: var(--theme--foreground-subdued);\n  opacity: 0.7;\n}\n.price-display[data-v-2b04b4bf] {\n  display: block;\n  min-height: 1.125rem;\n  text-align: center;\n  font-size: 0.75rem;\n  font-weight: 500;\n  color: var(--theme--foreground-subdued);\n}\n.empty-state-card[data-v-2b04b4bf] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  padding: 3rem 2rem;\n  text-align: center;\n  color: var(--theme--foreground-subdued);\n  border: var(--theme--border-width) solid var(--theme--border-color);\n  border-radius: var(--theme--border-radius);\n  background: var(--theme--background-subdued);\n}\n.empty-icon[data-v-2b04b4bf] {\n  color: var(--theme--foreground-subdued);\n  opacity: 0.5;\n}\n.empty-title[data-v-2b04b4bf] {\n  margin: 0.75rem 0 0.375rem;\n  font-size: 1rem;\n  font-weight: 600;\n  color: var(--theme--foreground);\n}\n.empty-hint[data-v-2b04b4bf] {\n  margin: 0;\n  font-size: 0.875rem;\n}\n.button-bottom[data-v-2b04b4bf] {\n  margin-top: 1rem;\n  margin-bottom: 0;\n}\n.button-top[data-v-2b04b4bf] {\n  margin-top: 0;\n  margin-bottom: 1rem;\n}\n.row-cascade-enter-active[data-v-2b04b4bf] {\n  transition:\n    opacity 0.35s ease,\n    transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);\n  transition-delay: calc(var(--row-index) * 30ms);\n}\n.row-cascade-leave-active[data-v-2b04b4bf] {\n  transition:\n    opacity 0.2s ease,\n    transform 0.2s ease;\n}\n.row-cascade-enter-from[data-v-2b04b4bf] {\n  opacity: 0;\n  transform: translateY(-10px);\n}\n.row-cascade-leave-to[data-v-2b04b4bf] {\n  opacity: 0;\n  transform: translateY(-5px);\n}\n.from-price-wrapper[data-v-2b04b4bf] {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.1em;\n  white-space: nowrap;\n}\n.from-price-icon[data-v-2b04b4bf] {\n  color: var(--theme--primary);\n  vertical-align: middle;\n  flex-shrink: 0;\n}\n";
n(css,{});

var _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};

const _hoisted_1 = { class: "room-prices-table" };
const _hoisted_2 = {
  key: 0,
  class: "loading"
};
const _hoisted_3 = { key: 1 };
const _hoisted_4 = {
  key: 1,
  class: "context-header"
};
const _hoisted_5 = { class: "selector-field" };
const _hoisted_6 = {
  key: 2,
  class: "save-bar button-top"
};
const _hoisted_7 = { class: "table-wrapper" };
const _hoisted_8 = { class: "prices-table" };
const _hoisted_9 = ["onClick"];
const _hoisted_10 = { class: "group-header-inner" };
const _hoisted_11 = { class: "group-title" };
const _hoisted_12 = {
  key: 0,
  class: "from-price-wrapper"
};
const _hoisted_13 = {
  key: 0,
  class: "from-price-wrapper"
};
const _hoisted_14 = { class: "row-label sticky-col" };
const _hoisted_15 = { class: "row-label-content" };
const _hoisted_16 = {
  key: 0,
  class: "date-name"
};
const _hoisted_17 = { class: "date-range" };
const _hoisted_18 = {
  key: 0,
  class: "from-price-wrapper"
};
const _hoisted_19 = { class: "label-col" };
const _hoisted_20 = { class: "price-labels" };
const _hoisted_21 = { class: "input-label buy-label" };
const _hoisted_22 = { class: "input-label sell-label" };
const _hoisted_23 = { class: "price-inputs" };
const _hoisted_24 = ["value", "disabled", "onInput"];
const _hoisted_25 = { class: "price-display" };
const _hoisted_26 = {
  key: 4,
  class: "empty-state-card"
};
const _hoisted_27 = { class: "empty-title" };
const _hoisted_28 = { class: "empty-hint" };
const _hoisted_29 = {
  key: 5,
  class: "save-bar button-bottom"
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_v_progress_circular = resolveComponent("v-progress-circular");
  const _component_v_notice = resolveComponent("v-notice");
  const _component_v_select = resolveComponent("v-select");
  const _component_v_button = resolveComponent("v-button");
  const _component_v_icon = resolveComponent("v-icon");
  return openBlock(), createElementBlock("div", _hoisted_1, [
    _ctx.loading ? (openBlock(), createElementBlock("div", _hoisted_2, [
      createVNode(_component_v_progress_circular, { indeterminate: "" }),
      _cache[2] || (_cache[2] = createElementVNode(
        "p",
        { class: "loading-text" },
        "Loading prices...",
        -1
        /* CACHED */
      ))
    ])) : (openBlock(), createElementBlock("div", _hoisted_3, [
      _ctx.errorMessage ? (openBlock(), createBlock(_component_v_notice, {
        key: 0,
        type: "danger",
        class: "error-notice"
      }, {
        default: withCtx(() => [
          createTextVNode(
            toDisplayString(_ctx.errorMessage),
            1
            /* TEXT */
          )
        ]),
        _: 1
        /* STABLE */
      })) : createCommentVNode("v-if", true),
      createCommentVNode(" Context Selector for Hotel view (junction mode only \u2014 stays empty in direct mode) "),
      _ctx.collection === _ctx.parentCollection && _ctx.availableTranslations.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_4, [
        createElementVNode("div", _hoisted_5, [
          _cache[3] || (_cache[3] = createElementVNode(
            "span",
            { class: "selector-label" },
            "Language:",
            -1
            /* CACHED */
          )),
          createVNode(_component_v_select, {
            modelValue: _ctx.selectedTranslationId,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => _ctx.selectedTranslationId = $event),
            items: _ctx.availableTranslations,
            placeholder: "Select language...",
            inline: ""
          }, null, 8, ["modelValue", "items"])
        ])
      ])) : createCommentVNode("v-if", true),
      createCommentVNode(" Save Bar "),
      _ctx.buttonPosition === "top" ? (openBlock(), createElementBlock("div", _hoisted_6, [
        createVNode(_component_v_button, {
          onClick: _ctx.calculateSellPrices,
          loading: _ctx.calculatingSellPrices,
          disabled: _ctx.disabled || _ctx.saving || _ctx.loading || !_ctx.parent_id || !_ctx.hasChanges
        }, {
          default: withCtx(() => [
            createTextVNode(
              toDisplayString(_ctx.label),
              1
              /* TEXT */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["onClick", "loading", "disabled"])
      ])) : createCommentVNode("v-if", true),
      createCommentVNode(" Groups (Accordion style) "),
      _ctx.hasMinimumConfig ? (openBlock(true), createElementBlock(
        Fragment,
        { key: 3 },
        renderList(_ctx.orderedGroupedData, (group, groupKey) => {
          return openBlock(), createElementBlock("div", {
            key: groupKey,
            class: "price-group"
          }, [
            createElementVNode("div", _hoisted_7, [
              createElementVNode("table", _hoisted_8, [
                createElementVNode("colgroup", null, [
                  _cache[4] || (_cache[4] = createElementVNode(
                    "col",
                    { class: "col-label" },
                    null,
                    -1
                    /* CACHED */
                  )),
                  _cache[5] || (_cache[5] = createElementVNode(
                    "col",
                    { class: "col-price-type" },
                    null,
                    -1
                    /* CACHED */
                  )),
                  (openBlock(true), createElementBlock(
                    Fragment,
                    null,
                    renderList(_ctx.columns, (col) => {
                      return openBlock(), createElementBlock("col", {
                        key: "cg-" + col.id,
                        class: "col-price"
                      });
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ]),
                createElementVNode("thead", null, [
                  createElementVNode("tr", null, [
                    createElementVNode("th", {
                      class: "group-header-cell sticky-col",
                      colspan: "2",
                      onClick: ($event) => _ctx.toggleGroup(groupKey)
                    }, [
                      createElementVNode("div", _hoisted_10, [
                        createVNode(_component_v_icon, {
                          name: "expand_more",
                          class: normalizeClass(["accordion-icon", { "is-expanded": _ctx.expandedGroups[groupKey] }])
                        }, null, 8, ["class"]),
                        createElementVNode("span", _hoisted_11, [
                          createTextVNode(
                            toDisplayString(_ctx.getGroupLabel(groupKey)) + " ",
                            1
                            /* TEXT */
                          ),
                          _ctx.fromPriceSymbol && _ctx.getGroupFromPrice(groupKey) ? (openBlock(), createElementBlock("span", _hoisted_12, [
                            _cache[6] || (_cache[6] = createTextVNode(
                              "(",
                              -1
                              /* CACHED */
                            )),
                            createVNode(_component_v_icon, {
                              name: _ctx.fromPriceSymbol,
                              small: "",
                              class: "from-price-icon"
                            }, null, 8, ["name"]),
                            _cache[7] || (_cache[7] = createTextVNode(
                              ")",
                              -1
                              /* CACHED */
                            ))
                          ])) : createCommentVNode("v-if", true)
                        ])
                      ])
                    ], 8, _hoisted_9),
                    (openBlock(true), createElementBlock(
                      Fragment,
                      null,
                      renderList(_ctx.columns, (col) => {
                        return openBlock(), createElementBlock("th", {
                          key: col.id,
                          class: "column-header"
                        }, [
                          createTextVNode(
                            toDisplayString(col[_ctx.occupancyLabelField || ""]) + " [" + toDisplayString(col.value) + "] ",
                            1
                            /* TEXT */
                          ),
                          _ctx.fromPriceSymbol && col.from_price ? (openBlock(), createElementBlock("span", _hoisted_13, [
                            _cache[8] || (_cache[8] = createTextVNode(
                              "(",
                              -1
                              /* CACHED */
                            )),
                            createVNode(_component_v_icon, {
                              name: _ctx.fromPriceSymbol,
                              small: "",
                              class: "from-price-icon"
                            }, null, 8, ["name"]),
                            _cache[9] || (_cache[9] = createTextVNode(
                              ")",
                              -1
                              /* CACHED */
                            ))
                          ])) : createCommentVNode("v-if", true)
                        ]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ])
                ]),
                createVNode(
                  TransitionGroup,
                  {
                    tag: "tbody",
                    name: "row-cascade"
                  },
                  {
                    default: withCtx(() => [
                      (openBlock(true), createElementBlock(
                        Fragment,
                        null,
                        renderList(_ctx.expandedGroups[groupKey] ? group.rows : [], (row, rowIndex) => {
                          return openBlock(), createElementBlock(
                            "tr",
                            {
                              key: `${groupKey}|${row.id}`,
                              class: "data-row",
                              style: normalizeStyle({ "--row-index": Math.min(Number(rowIndex), 8) })
                            },
                            [
                              createElementVNode("td", _hoisted_14, [
                                createElementVNode("div", _hoisted_15, [
                                  row?.[_ctx.rowLabelField || ""] && !_ctx.isDateRangeName(row[_ctx.rowLabelField || ""]) ? (openBlock(), createElementBlock(
                                    "strong",
                                    _hoisted_16,
                                    toDisplayString(row[_ctx.rowLabelField || ""]),
                                    1
                                    /* TEXT */
                                  )) : createCommentVNode("v-if", true),
                                  createElementVNode("small", _hoisted_17, [
                                    createTextVNode(
                                      toDisplayString(_ctx.formatDateRange(row[_ctx.rowStartDateField || "start_date"], row[_ctx.rowEndDateField || "end_date"])) + " ",
                                      1
                                      /* TEXT */
                                    ),
                                    _ctx.fromPriceSymbol && _ctx.rowFromPriceField && row[_ctx.rowFromPriceField || ""] ? (openBlock(), createElementBlock("span", _hoisted_18, [
                                      _cache[10] || (_cache[10] = createTextVNode(
                                        "(",
                                        -1
                                        /* CACHED */
                                      )),
                                      createVNode(_component_v_icon, {
                                        name: _ctx.fromPriceSymbol,
                                        small: "",
                                        class: "from-price-icon"
                                      }, null, 8, ["name"]),
                                      _cache[11] || (_cache[11] = createTextVNode(
                                        ")",
                                        -1
                                        /* CACHED */
                                      ))
                                    ])) : createCommentVNode("v-if", true)
                                  ])
                                ])
                              ]),
                              createElementVNode("td", _hoisted_19, [
                                createElementVNode("div", _hoisted_20, [
                                  createElementVNode("label", _hoisted_21, [
                                    createVNode(_component_v_icon, {
                                      name: "shopping_cart",
                                      "x-small": ""
                                    }),
                                    createTextVNode(
                                      " " + toDisplayString(_ctx.buyLabel) + " (" + toDisplayString(_ctx.buyCurrencySymbol) + ") ",
                                      1
                                      /* TEXT */
                                    )
                                  ]),
                                  createElementVNode("label", _hoisted_22, [
                                    createVNode(_component_v_icon, {
                                      name: "sell",
                                      "x-small": ""
                                    }),
                                    createTextVNode(
                                      " " + toDisplayString(_ctx.sellLabel) + " (" + toDisplayString(_ctx.sellCurrencySymbol) + ") ",
                                      1
                                      /* TEXT */
                                    )
                                  ])
                                ])
                              ]),
                              (openBlock(true), createElementBlock(
                                Fragment,
                                null,
                                renderList(_ctx.columns, (col) => {
                                  return openBlock(), createElementBlock(
                                    "td",
                                    {
                                      key: `${groupKey}|${row.id}|${col.id}`,
                                      class: normalizeClass(["price-cell", {
                                        "has-changes": _ctx.isCellModified(groupKey, row.id, col.id)
                                      }])
                                    },
                                    [
                                      createElementVNode("div", _hoisted_23, [
                                        createElementVNode("input", {
                                          value: _ctx.getBuyDisplay(groupKey, row.id, col.id),
                                          type: "number",
                                          step: "0.01",
                                          class: "cell-input",
                                          disabled: _ctx.disabled,
                                          onInput: ($event) => (_ctx.markBuyCellTyped(groupKey, row.id, col.id), _ctx.handleBuyPriceInput(groupKey, row.id, col.id, $event)),
                                          onFocus: _cache[1] || (_cache[1] = ($event) => $event.target.select())
                                        }, null, 40, _hoisted_24),
                                        createElementVNode(
                                          "span",
                                          _hoisted_25,
                                          toDisplayString(_ctx.formatPrice(
                                            _ctx.getCell(groupKey, row.id, col.id)[_ctx.sellPriceField || ""]
                                          )),
                                          1
                                          /* TEXT */
                                        )
                                      ])
                                    ],
                                    2
                                    /* CLASS */
                                  );
                                }),
                                128
                                /* KEYED_FRAGMENT */
                              ))
                            ],
                            4
                            /* STYLE */
                          );
                        }),
                        128
                        /* KEYED_FRAGMENT */
                      ))
                    ]),
                    _: 2
                    /* DYNAMIC */
                  },
                  1024
                  /* DYNAMIC_SLOTS */
                )
              ])
            ])
          ]);
        }),
        128
        /* KEYED_FRAGMENT */
      )) : createCommentVNode("v-if", true),
      createCommentVNode(" Empty State "),
      !_ctx.hasMinimumConfig ? (openBlock(), createElementBlock("div", _hoisted_26, [
        createVNode(_component_v_icon, {
          name: "inbox",
          large: "",
          class: "empty-icon"
        }),
        createElementVNode(
          "p",
          _hoisted_27,
          toDisplayString(_ctx.emptyStateTitle),
          1
          /* TEXT */
        ),
        createElementVNode(
          "p",
          _hoisted_28,
          toDisplayString(_ctx.emptyStateHint),
          1
          /* TEXT */
        )
      ])) : createCommentVNode("v-if", true),
      _ctx.buttonPosition === "bottom" ? (openBlock(), createElementBlock("div", _hoisted_29, [
        createVNode(_component_v_button, {
          onClick: _ctx.calculateSellPrices,
          loading: _ctx.calculatingSellPrices,
          disabled: _ctx.disabled || _ctx.saving || _ctx.loading || !_ctx.parent_id || !_ctx.hasChanges
        }, {
          default: withCtx(() => [
            createTextVNode(
              toDisplayString(_ctx.label),
              1
              /* TEXT */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["onClick", "loading", "disabled"])
      ])) : createCommentVNode("v-if", true)
    ]))
  ]);
}
var InterfaceComponent = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-2b04b4bf"], ["__file", "interface.vue"]]);

var index = defineInterface({
  id: "price-table",
  name: "Price Table",
  icon: "table_chart",
  description: "Display and edit prices in a grouped table format. Fully configurable for hotels, cruises, yachts, or any similar product.",
  component: InterfaceComponent,
  options: () => {
    const hideWhenDirect = [
      { name: "Direct mode", rule: { mode: { _eq: "direct" } }, hidden: true }
    ];
    const divider = (field, title, conditions) => ({
      field,
      name: title,
      type: "alias",
      meta: {
        width: "full",
        interface: "presentation-divider",
        options: { title, color: "var(--theme--primary)" },
        ...conditions ? { conditions } : {}
      }
    });
    return [
      // ─── General ─────────────────────────────────────────────────────────────
      divider("divider_general", "General"),
      {
        field: "label",
        type: "string",
        name: "$t:label",
        meta: {
          width: "full",
          interface: "system-input-translated-string",
          options: { placeholder: "$t:label" }
        }
      },
      {
        field: "buttonPosition",
        name: "Button Position",
        type: "string",
        meta: {
          width: "half",
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Top", value: "top" },
              { text: "Bottom", value: "bottom" }
            ]
          }
        }
      },
      // ─── Mode ────────────────────────────────────────────────────────────────
      {
        field: "mode",
        name: "Mode",
        type: "string",
        meta: {
          width: "half",
          interface: "select-dropdown",
          note: "Junction: prices are per language/market (hotels, cruises) \u2014 uses a junction collection and translations table. Direct: prices live on one flat collection with no language concept (e.g. cars).",
          options: {
            choices: [
              {
                text: "Junction Table (With Translations) (hotels, cruises etc)",
                value: "junction"
              },
              { text: "Direct Table (Without Translations)", value: "direct" }
            ]
          }
        }
      },
      // ─── Table Layout ────────────────────────────────────────────────────────
      divider("divider_layout", "Table Layout"),
      {
        field: "fromPriceSymbol",
        name: "From Price Icon",
        type: "string",
        meta: {
          width: "half",
          interface: "select-icon",
          note: "Icon shown next to any item (occupancy, room category, price date) marked as a 'from price'. Pick any Material icon."
        }
      },
      {
        field: "groupFromPriceField",
        name: "Category From-Price Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the group-by collection that marks a room category as a 'from price' (e.g. price_start). Leave empty to disable the from-price indicator on category headers.",
          options: { placeholder: "e.g. price_start" }
        }
      },
      {
        field: "occupancyFromPriceField",
        name: "Occupancy From-Price Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the occupancy record that marks it as a 'from price' column (e.g. from_price). Leave empty to disable the from-price indicator on column headers.",
          options: { placeholder: "e.g. from_price" }
        }
      },
      {
        field: "rowFromPriceField",
        name: "Date (Row) From-Price Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the row collection that marks a price date as a 'from price' row (e.g. from_price). Leave empty to disable the from-price indicator on row labels.",
          options: { placeholder: "e.g. from_price" }
        }
      },
      {
        field: "groupSharedIdField",
        name: "Category Shared Id Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Group By Collection linking a per-weekday child category back to its parent (hotels: 'sharedId'). Leave empty for a collection with no such concept \u2014 e.g. tours_categories \u2014 this field's presence is what enables weekday-splitting support at all; leaving it unset skips that fetch entirely instead of requesting a field that doesn't exist.",
          options: { placeholder: "e.g. sharedId" }
        }
      },
      {
        field: "groupChildWeekdaysField",
        name: "Category Child Weekdays Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the parent category holding its per-weekday repeater entries (hotels: 'days_repeater'). Only read when Category Shared Id Field is also set.",
          options: { placeholder: "e.g. days_repeater" }
        }
      },
      {
        field: "groupSortField",
        name: "Category (Group) Sort Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the group-by collection used to sort room categories in the table. e.g. 'sort' for a manual sort integer. Leave empty to use the parent record's category order array.",
          options: { placeholder: "e.g. sort" }
        }
      },
      {
        field: "groupLabelField",
        name: "Category Label Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field (dot-path into a relation allowed) on the Group By Collection used as the category display name, e.g. room_category.name or just name. Update this here if the underlying name field ever changes \u2014 no extension release needed.",
          options: { placeholder: "e.g. room_category.name" }
        }
      },
      {
        field: "groupLabelTranslationField",
        name: "Category Label Translation Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Group By Collection's translations used as a language-specific label addition (optional fallback, used when the main label is empty).",
          options: { placeholder: "e.g. room_category_additions" }
        }
      },
      {
        field: "occupancySortField",
        name: "Occupancy (Column) Sort Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field used to sort columns left-to-right. Checked on the occupancy junction row first (e.g. a manual 'sort' integer \u2014 this is what a drag-reorder in the M2M/occupancy selector writes, per-parent), falling back to the original occupancy record (e.g. 'value', a number of guests shared across every parent). Use 'sort' for manual per-record ordering \u2014 but that only works once each record's occupancies have actually been drag-reordered at least once; until then the field is empty for every row and the sort has no effect.",
          options: { placeholder: "e.g. value" }
        }
      },
      {
        field: "occupancyLabelField",
        name: "Occupancy Label Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the occupancy record used as the column display label. Update this here if the underlying name field ever changes \u2014 no extension release needed.",
          options: { placeholder: "e.g. name" }
        }
      },
      {
        field: "occupancyLabelFallbackMinField",
        name: "Occupancy Label Fallback: Min Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Optional. When the Occupancy Label Field is empty on a given row, compose a 'min-max' (or 'min+' when max is 999 or more) label from these fields instead of falling back to the raw row id. Leave empty to keep the old raw-id fallback (e.g. hotels, tours, cruises).",
          options: { placeholder: "e.g. rental_period_min" }
        }
      },
      {
        field: "occupancyLabelFallbackMaxField",
        name: "Occupancy Label Fallback: Max Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Optional, only used when Occupancy Label Fallback: Min Field is also set.",
          options: { placeholder: "e.g. rental_period_max" }
        }
      },
      {
        field: "occupancyLabelFallbackCategoryField",
        name: "Occupancy Label Fallback: Category Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Optional (dot-path into a relation allowed). Appended after the min-max range in the fallback label, e.g. 'rental_period_depot_category.name' \u2192 '7-13 Airport'. Only used when the Min Field above is also set.",
          options: { placeholder: "e.g. rental_period_depot_category.name" }
        }
      },
      {
        field: "rowSortField",
        name: "Date (Row) Sort Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the row collection used to sort rows top-to-bottom. e.g. 'start_date' for chronological order or 'sort' for a manual sort integer.",
          options: { placeholder: "e.g. start_date" }
        }
      },
      {
        field: "rowLabelField",
        name: "Row Label Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Row Collection used as the row display label (e.g. a custom date-range name). Update this here if the underlying name field ever changes \u2014 no extension release needed.",
          options: { placeholder: "e.g. name" }
        }
      },
      {
        field: "rowStartDateField",
        name: "Row Start Date Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Row Collection holding the range start date, used for the date-range fallback label shown under the row name. e.g. 'start_date' for hotels, 'price_period_start' for tours.",
          options: { placeholder: "e.g. start_date" }
        }
      },
      {
        field: "rowEndDateField",
        name: "Row End Date Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Row Collection holding the range end date. e.g. 'end_date' for hotels, 'price_period_end' for tours.",
          options: { placeholder: "e.g. end_date" }
        }
      },
      {
        field: "groupByField",
        name: "Group By Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field name on the price record used to group rows into sections. e.g. room_category_id for hotels, cruise_room_category_id for cruises.",
          options: { placeholder: "e.g. room_category_id" }
        }
      },
      {
        field: "rowField",
        name: "Row Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field name on the price record used for each row inside a group. e.g. price_date_id for hotels, cruise_price_date_id for cruises.",
          options: { placeholder: "e.g. price_date_id" }
        }
      },
      {
        field: "columnField",
        name: "Column Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field name on the price record used for each column. Typically room_occupancy_id for both hotels and cruises.",
          options: { placeholder: "e.g. room_occupancy_id" }
        }
      },
      // ─── Labels ──────────────────────────────────────────────────────────────
      divider("divider_labels", "Labels"),
      {
        field: "buyLabel",
        name: "Buy Price Label",
        type: "string",
        meta: {
          width: "half",
          interface: "system-input-translated-string",
          options: { placeholder: "e.g. Buy" }
        }
      },
      {
        field: "sellLabel",
        name: "Sell Price Label",
        type: "string",
        meta: {
          width: "half",
          interface: "system-input-translated-string",
          options: { placeholder: "e.g. Sell" }
        }
      },
      {
        field: "emptyStateTitle",
        name: "Empty State Title",
        type: "string",
        meta: {
          width: "half",
          interface: "system-input-translated-string",
          note: "Heading shown when there are no prices to display. Supports $t: translation keys.",
          options: { placeholder: "e.g. No prices configured yet" }
        }
      },
      {
        field: "emptyStateHint",
        name: "Empty State Hint",
        type: "string",
        meta: {
          width: "half",
          interface: "system-input-translated-string",
          note: "Subtext shown below the empty state heading. Supports $t: translation keys.",
          options: { placeholder: "e.g. Add price dates, categories, and occupancies to see them here." }
        }
      },
      // ─── Sell Price Calculation ──────────────────────────────────────────────
      // Junction mode: the sell price is computed in the browser by the
      // interface's own `calculateSellPrices` (see `usePriceTableData`),
      // driven entirely by the two formula fields below.
      divider("divider_formula", "Calculation Formula (Junction Mode)", [
        { name: "Direct mode", rule: { mode: { _eq: "direct" } }, hidden: true }
      ]),
      {
        field: "buyPriceTypeField",
        name: "Buy Price Type Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Junction Collection (settings row) storing whether the buy price is 'net' or 'gross'.",
          options: { placeholder: "e.g. buy_price_type" }
        }
      },
      {
        field: "sellPriceTypeField",
        name: "Sell Price Type Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Junction Collection (settings row) storing whether the sell price is 'net' or 'gross'.",
          options: { placeholder: "e.g. sell_price_type" }
        }
      },
      {
        field: "percentageTypeField",
        name: "Percentage Type Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Junction Collection (settings row) storing 'net'/'gross' for how margin/provision are applied.",
          options: { placeholder: "e.g. percentage_type" }
        }
      },
      {
        field: "marginField",
        name: "Margin Percentage Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Junction Collection (settings row) storing the margin percentage.",
          options: { placeholder: "e.g. margin_percentage" }
        }
      },
      {
        field: "provisionField",
        name: "Provision Percentage Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Junction Collection (settings row) storing the provision percentage.",
          options: { placeholder: "e.g. provision_percentage" }
        }
      },
      {
        field: "occupancyValueField",
        name: "Occupancy Value Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the occupancy record storing its numeric value (e.g. guest count) \u2014 drives BOTH the '[value]' shown next to each column header AND the formula's occupancy value when buy/sell price types differ. Defaults to 'value' if left empty. Use a different field for a collection with no bare 'value' column (e.g. vehicles: 'rental_period_min').",
          options: { placeholder: "e.g. value" }
        }
      },
      {
        field: "roundHalfLogic",
        name: "Round Half Logic",
        type: "text",
        meta: {
          width: "full",
          interface: "input-code",
          options: { language: "javascript", lineNumber: true },
          note: "Required to enable sell-price calculation (junction or direct mode). Define a function named exactly roundHalf(val). Applies to every hotel/record using this field configuration. There is no built-in fallback \u2014 this must be provided."
        }
      },
      {
        field: "calculateSellPriceLogic",
        name: "Calculate Sell Price Logic",
        type: "text",
        meta: {
          width: "full",
          interface: "input-code",
          options: { language: "javascript", lineNumber: true },
          note: "Required to enable sell-price calculation (junction or direct mode). Define a function named exactly calculateSellPrice(buyPrice, settingsRow, priceRow, rateValue, occupancyValue). In direct mode settingsRow is the parent record itself. Applies to every hotel/record using this field configuration. There is no built-in fallback \u2014 this must be provided."
        }
      },
      // ─── Related Collection (Prices) ─────────────────────────────────────────
      divider("divider_related", "Related Collection (Prices)"),
      {
        field: "relatedCollection",
        name: "Related Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The collection that holds the price records to display in the table. For hotels this is 'room_prices'. For cruises or yachts, create a similar collection and enter its name here.",
          options: { placeholder: "e.g. room_prices" }
        }
      },
      {
        field: "foreignKeyField",
        name: "Foreign Key Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field inside the Related Collection that stores the ID linking each price back to its parent record. For hotels it is 'hotel_id'. For cruises it would be 'cruise_id'. For yachts 'yacht_id'.",
          options: { placeholder: "e.g. hotel_id" }
        }
      },
      {
        field: "buyPriceField",
        name: "Buy Price Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field name in the Related Collection that stores the buy/purchase price. This is the raw cost price before any margin or exchange rate is applied.",
          options: { placeholder: "e.g. buy_price" }
        }
      },
      {
        field: "sellPriceField",
        name: "Sell Price Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field that holds the sell price value. In junction mode: field on the Translations Collection. In direct mode: field directly on the price record.",
          options: { placeholder: "e.g. sell_price" }
        }
      },
      // ─── Parent Record ───────────────────────────────────────────────────────
      divider("divider_parent", "Parent Record"),
      {
        field: "parentCollection",
        name: "Parent Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The main product collection this interface belongs to. For hotels enter 'hotels', for cruises 'cruises', for yachts 'yachts'. Used to fetch occupancies, category order, and sell price status.",
          options: { placeholder: "e.g. hotels" }
        }
      },
      {
        field: "parentKeyField",
        name: "Parent Key Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Only needed when this interface is placed on a junction/translation collection instead of the parent directly. Enter the field name on the junction that holds the parent record ID. Example: placed on 'hotels_translations_1' \u2192 enter 'hotels_id'. Placed on 'cruises_translations_1' \u2192 enter 'cruises_id'. Leave empty if placed directly on the parent collection.",
          options: {
            placeholder: "e.g. hotels_id \u2014 leave empty if on parent collection directly"
          }
        }
      },
      {
        field: "groupByCollection",
        name: "Group By Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The collection used to fetch group labels for the table. Matches the Group By Field \u2014 if grouping by room_category_id, this should be 'room_categories'. For cruises grouping by cabin_category_id, enter 'cabin_categories'.",
          options: { placeholder: "e.g. room_categories" }
        }
      },
      {
        field: "rowCollection",
        name: "Row Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The collection used to fetch row labels for the table. Matches the Row Field \u2014 if rows are price_date_id, this should be 'price_dates'. For cruises with departure_date_id rows, enter 'departure_dates'.",
          options: { placeholder: "e.g. price_dates" }
        }
      },
      {
        field: "occupanciesField",
        name: "Occupancies Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field on the Parent Collection that holds the list of occupancy options (e.g. single, double, triple). These become the columns in the price table. For hotels this is 'room_occupancies'.",
          options: { placeholder: "e.g. room_occupancies" }
        }
      },
      {
        field: "occupancySourceMode",
        name: "Occupancy Source Mode",
        type: "string",
        meta: {
          width: "half",
          interface: "select-dropdown",
          note: "Where column occupancies are loaded from. Use Junction Collection when the price record stores the M2M junction row ID, e.g. room_prices.room_occupancy_id = hotels_occupancies.id.",
          options: {
            choices: [
              {
                text: "Auto (Junction first, parent field fallback)",
                value: "auto"
              },
              { text: "Parent Field Array", value: "parent_field" },
              { text: "Junction Collection", value: "junction" }
            ]
          }
        }
      },
      {
        field: "occupancyJunctionCollection",
        name: "Occupancy Junction Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "M2M junction collection that stores the selected occupancies for the parent. For hotels this is 'hotels_occupancies'.",
          options: { placeholder: "e.g. hotels_occupancies" }
        }
      },
      {
        field: "occupancyJunctionPrimaryKeyField",
        name: "Occupancy Junction Primary Key Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Primary key field on the occupancy junction collection. This is the value stored in the price table column field. For hotels_occupancies this is 'id'.",
          options: { placeholder: "e.g. id" }
        }
      },
      {
        field: "occupancyJunctionParentField",
        name: "Occupancy Junction Parent Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the occupancy junction collection that points back to the parent record. For hotels_occupancies this is 'hotels_id'.",
          options: { placeholder: "e.g. hotels_id" }
        }
      },
      {
        field: "occupancyJunctionRelatedField",
        name: "Occupancy Junction Related Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the occupancy junction collection that points to the original occupancy collection. For hotels_occupancies this is 'occupancies_id'.",
          options: { placeholder: "e.g. occupancies_id" }
        }
      },
      {
        field: "occupancyIdField",
        name: "Occupancy Id Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Dot-path into the occupancy junction row for the value the price record's occupancy foreign key actually stores. Use 'id' if the FK references the junction row itself (hotels: room_prices.room_occupancy_id \u2192 hotels_occupancies.id). Use a dot-path through the Occupancy Junction Related Field if it references the original occupancy record instead (tours: tours_prices.occupancy_id \u2192 tours_occupancies.id \u2192 enter 'tours_occupancies_id.id').",
          options: { placeholder: "e.g. id or tours_occupancies_id.id" }
        }
      },
      {
        field: "occupancyCollection",
        name: "Original Occupancy Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Original collection that stores occupancy labels and values. Used as a fallback if the junction relation is returned as an ID instead of an object. For hotels this is 'occupancies'.",
          options: { placeholder: "e.g. occupancies" }
        }
      },
      {
        field: "categoryOrderField",
        name: "Category Order Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field on the Parent Collection that defines the display order of categories (groups) in the table. For hotels this is 'room_categories'. Leave empty to use default ordering.",
          options: { placeholder: "e.g. room_categories" }
        }
      },
      {
        field: "sellStatusField",
        name: "Sell Price Status Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field on the Parent Collection that tracks the status of the sell price calculation job (e.g. idle, processing, done, failed). Used to poll and refresh the table after the flow completes.",
          options: { placeholder: "e.g. sell_prices_status" }
        }
      },
      {
        field: "sellUpdatedAtField",
        name: "Sell Price Updated At Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field on the Parent Collection that stores the timestamp of the last successful sell price calculation. Used to detect when a new calculation has completed.",
          options: { placeholder: "e.g. sell_prices_updated_at" }
        }
      },
      // ─── Junction / Translation Collection ───────────────────────────────────
      divider(
        "divider_junction",
        "Junction / Translation Collection",
        hideWhenDirect
      ),
      {
        field: "junctionCollection",
        name: "Junction Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The junction/translation collection that links the parent to a language or market. For hotels this is 'hotels_translations_1'. For cruises it would be 'cruises_translations_1'. Used to fetch available languages for the selector when placed on the parent collection.",
          options: { placeholder: "e.g. hotels_translations_1" },
          conditions: hideWhenDirect
        }
      },
      {
        field: "junctionParentKeyField",
        name: "Junction \u2192 Parent Key Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field inside the Junction Collection that links back to the parent record. For 'hotels_translations_1' this is 'hotels_id'. For 'cruises_translations_1' it would be 'cruises_id'.",
          options: { placeholder: "e.g. hotels_id" },
          conditions: hideWhenDirect
        }
      },
      {
        field: "junctionLanguageField",
        name: "Junction \u2192 Language Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field inside the Junction Collection that stores the language or market ID. Typically 'translations_id'. Used to filter sell prices per language.",
          options: { placeholder: "e.g. translations_id" },
          conditions: hideWhenDirect
        }
      },
      {
        field: "junctionExchangeRateField",
        name: "Junction \u2192 Exchange Rate Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field inside the Junction Collection that stores the exchange rate reference for this market. Used to determine the buy and sell currency symbols displayed in the table header.",
          options: { placeholder: "e.g. exchange_rate" }
        }
      },
      {
        field: "languageNameField",
        name: "Language Name Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the language/market record (Junction \u2192 Language Field relation) used as its display name in the language selector dropdown.",
          options: { placeholder: "e.g. name" },
          conditions: hideWhenDirect
        }
      },
      // ─── Translations Collection (Sell Prices) ───────────────────────────────
      divider(
        "divider_translations",
        "Translations Collection (Sell Prices)",
        hideWhenDirect
      ),
      {
        field: "translationsCollection",
        name: "Translations Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The collection that stores per-language sell prices for each price record. For hotels this is 'room_prices_translations'. For cruises it would be 'cruise_prices_translations'.",
          options: { placeholder: "e.g. room_prices_translations" },
          conditions: hideWhenDirect
        }
      },
      {
        field: "translationsFKField",
        name: "Translations \u2192 Price FK Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field inside the Translations Collection that links each sell price record back to its parent price record in the Related Collection. For 'room_prices_translations' this is 'room_prices_id'.",
          options: { placeholder: "e.g. room_prices_id" },
          conditions: hideWhenDirect
        }
      },
      {
        field: "translationsLanguageField",
        name: "Translations \u2192 Language Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field inside the Translations Collection that stores the language or market ID. Used to filter sell prices for the currently selected language. Typically 'translations_id'.",
          options: { placeholder: "e.g. translations_id" },
          conditions: hideWhenDirect
        }
      },
      // ─── Currency ─────────────────────────────────────────────────────────────
      // Buy & sell prices are always displayed and saved to 2 decimal
      // places (see `PRICE_PRECISION` in `priceTableCore`) — not
      // configurable, so there's no field for it here.
      divider("divider_currency", "Currency"),
      {
        field: "defaultBuyCurrencySymbol",
        name: "Buy Currency Symbol",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Symbol shown in the buy price column header. In junction mode this is a fallback; in direct mode it is always used.",
          options: { placeholder: "e.g. \u20AC" }
        }
      },
      {
        field: "defaultSellCurrencySymbol",
        name: "Sell Currency Symbol",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Symbol shown in the sell price column header. In junction mode this is a fallback; in direct mode it is always used.",
          options: { placeholder: "e.g. $" }
        }
      },
      {
        field: "ratesCollection",
        name: "Rates Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The collection that stores exchange rate records. Used to resolve and display currency symbols in the table header.",
          options: { placeholder: "e.g. rates" },
          conditions: hideWhenDirect
        }
      },
      {
        field: "fromCurrencyField",
        name: "Rate \u2192 From Currency Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field on the rate record that references the source (buy) currency.",
          options: { placeholder: "e.g. from_currency" },
          conditions: hideWhenDirect
        }
      },
      {
        field: "toCurrencyField",
        name: "Rate \u2192 To Currency Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field on the rate record that references the target (sell) currency.",
          options: { placeholder: "e.g. to_currency" },
          conditions: hideWhenDirect
        }
      },
      {
        field: "currencySymbolField",
        name: "Currency \u2192 Symbol Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field on each currency record that holds the display symbol (e.g. \u20AC, $, \xA3).",
          options: { placeholder: "e.g. symbol" },
          conditions: hideWhenDirect
        }
      }
    ];
  },
  types: ["alias"],
  localTypes: ["presentation"],
  group: "other",
  relational: false
});

export { index as default };
