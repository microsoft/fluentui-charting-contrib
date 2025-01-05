export function saveSelection(key: string, value: string) {
    let appKey = `FluentChartTest_${key}`;
    localStorage.setItem(appKey, value);
}

export function getSelection(key: string, defaultValue: string): string {
    let appKey = `FluentChartTest_${key}`;
    let value = localStorage.getItem(appKey);
    return value || defaultValue; 
}