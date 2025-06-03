const startExampleTestIndex = 0;
export const totalChartExamplesCount = 842;
const startExampleTestIndexLocalization = 377;
const endExampleTestIndexLocalization = 569;

export const chartsListWithErrors = [];

export const themes = ["Light", "Dark"];
export const modes = ["LTR", "RTL"];

interface TestConfig {
    theme: string;
    mode: string;
    startExampleIndex: number;
    endExampleIndex: number;
    locale: string| undefined;
}

export const testMatrix: TestConfig[] = [
    {
        theme: "Light",
        mode: "LTR",
        startExampleIndex: startExampleTestIndex,
        endExampleIndex: totalChartExamplesCount - 1,
        locale: undefined
    },
    {
        theme: "Light",
        mode: "RTL",
        startExampleIndex: startExampleTestIndex,
        endExampleIndex: totalChartExamplesCount - 1,
        locale: undefined
    },
    {
        theme: "Dark",
        mode: "LTR",
        startExampleIndex: startExampleTestIndex,
        endExampleIndex: totalChartExamplesCount - 1,
        locale: undefined
    },
    {
        theme: "Dark",
        mode: "RTL",
        startExampleIndex: startExampleTestIndex,
        endExampleIndex: totalChartExamplesCount - 1,
        locale: undefined
    },
    {
        theme: "Light",
        mode: "LTR",
        startExampleIndex: startExampleTestIndexLocalization,
        endExampleIndex: endExampleTestIndexLocalization,
        locale: 'fr-FR'
    },
    {
        theme: "Light",
        mode: "LTR",
        startExampleIndex: startExampleTestIndexLocalization,
        endExampleIndex: endExampleTestIndexLocalization,
        locale: 'de-DE'
    },
    {
        theme: "Light",
        mode: "LTR",
        startExampleIndex: startExampleTestIndexLocalization,
        endExampleIndex: endExampleTestIndexLocalization,
        locale: 'ja-JP'
    },
    {
        theme: "Dark",
        mode: "LTR",
        startExampleIndex: startExampleTestIndexLocalization,
        endExampleIndex: endExampleTestIndexLocalization,
        locale: 'en-GB'
    },
    {
        theme: "Light",
        mode: "RTL",
        startExampleIndex: startExampleTestIndexLocalization,
        endExampleIndex: endExampleTestIndexLocalization,
        locale: 'ar-SA'
    },
    {
        theme: "Light",
        mode: "LTR",
        startExampleIndex: startExampleTestIndexLocalization,
        endExampleIndex: endExampleTestIndexLocalization,
        locale: 'hi-IN'
    },
];