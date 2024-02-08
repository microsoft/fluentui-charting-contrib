export function getDayName(dateTime: Date | string | number) {
    const date = new Date(dateTime);
    return date.toLocaleString('default', {weekday: 'long'});
}

export function getHourlyTimeframe(dateTime: Date | string | number): string {
    const date = new Date(dateTime);
    let hour = date.getUTCHours();
    const period = hour < 12 ? 'AM' : 'PM';

    if (hour === 0) {
        hour = 12;
    } else if (hour > 12) {
        hour -= 12;
    }

    const nextHour = (hour % 12) + 1;
    const nextPeriod = hour < 11 ? period : period === 'AM' ? 'PM' : 'AM';

    return `${hour}:00 ${period} - ${nextHour}:00 ${nextPeriod}`;
}
