export function saveSelection(key: string, value: string) {
    let appKey = `FluentChartTest_${key}`;
    localStorage.setItem(appKey, value);
}

export function getSelection(key: string, defaultValue: string): string {
    let appKey = `FluentChartTest_${key}`;
    let value = localStorage.getItem(appKey);
    return value || defaultValue; 
}

export const SCHEMA_KEY = 'Schema';
export const SCHEMA_KEY_DEFAULT = '001'