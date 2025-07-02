import { symbols } from './plotly-symbol-defs';

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

export function symbolWithMargin(symbolFn: (size: number) => string, size: number, margin = 1) {
    const adjustedSize = Math.max(0, size - 2 * margin);
    let path = symbolFn(adjustedSize);
    // Offset the path by +1px in both x and y directions
    path = path.replace(/([ML])\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/g, (match, cmd, x, y) => {
        return `${cmd} ${parseFloat(x) + margin},${parseFloat(y) + margin}`;
    });
    return path;
}

export function getSymbolPathByName(symbolName: keyof typeof symbols, size: number, margin = 1) {
    return symbolWithMargin((s) => symbols[symbolName].f(s, 0, 0), size, margin);
}