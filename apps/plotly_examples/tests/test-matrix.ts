const startExampleTestIndex = 0;
export const totalChartExamplesCount = 1005;
const startExampleTestIndexLocalization = 377;
const endExampleTestIndexLocalization = 569;

export const chartsListWithErrors = [];

export const chartsListWithErrorsV9 = [];

export const themes = ["Light", "Dark"];
export const modes = ["LTR", "RTL"];

interface TestConfig {
  theme: string;
  mode: string;
  startExampleIndex: number;
  endExampleIndex: number;
  locale: string | undefined;
  highContrast: boolean;
}

export const testMatrix: TestConfig[] = [
  {
    theme: "Light",
    mode: "LTR",
    startExampleIndex: startExampleTestIndex,
    endExampleIndex: totalChartExamplesCount - 1,
    locale: undefined,
    highContrast: false,
  },
  {
    theme: "Light",
    mode: "RTL",
    startExampleIndex: startExampleTestIndex,
    endExampleIndex: totalChartExamplesCount - 1,
    locale: undefined,
    highContrast: false,
  },
  {
    theme: "Dark",
    mode: "LTR",
    startExampleIndex: startExampleTestIndex,
    endExampleIndex: totalChartExamplesCount - 1,
    locale: undefined,
    highContrast: false,
  },
  {
    theme: "Dark",
    mode: "RTL",
    startExampleIndex: startExampleTestIndex,
    endExampleIndex: totalChartExamplesCount - 1,
    locale: undefined,
    highContrast: false,
  },
  {
    theme: "Light",
    mode: "LTR",
    startExampleIndex: startExampleTestIndexLocalization,
    endExampleIndex: endExampleTestIndexLocalization,
    locale: "fr-FR",
    highContrast: false,
  },
  {
    theme: "Light",
    mode: "LTR",
    startExampleIndex: startExampleTestIndexLocalization,
    endExampleIndex: endExampleTestIndexLocalization,
    locale: "de-DE",
    highContrast: false,
  },
  {
    theme: "Light",
    mode: "LTR",
    startExampleIndex: startExampleTestIndexLocalization,
    endExampleIndex: endExampleTestIndexLocalization,
    locale: "ja-JP",
    highContrast: false,
  },
  {
    theme: "Dark",
    mode: "LTR",
    startExampleIndex: startExampleTestIndexLocalization,
    endExampleIndex: endExampleTestIndexLocalization,
    locale: "en-GB",
    highContrast: false,
  },
  {
    theme: "Light",
    mode: "RTL",
    startExampleIndex: startExampleTestIndexLocalization,
    endExampleIndex: endExampleTestIndexLocalization,
    locale: "ar-SA",
    highContrast: false,
  },
  {
    theme: "Light",
    mode: "LTR",
    startExampleIndex: startExampleTestIndexLocalization,
    endExampleIndex: endExampleTestIndexLocalization,
    locale: "hi-IN",
    highContrast: false,
  },
  {
    theme: "Light",
    mode: "LTR",
    startExampleIndex: startExampleTestIndexLocalization,
    endExampleIndex: endExampleTestIndexLocalization,
    locale: undefined,
    highContrast: true,
  },
  {
    theme: "Dark",
    mode: "LTR",
    startExampleIndex: startExampleTestIndexLocalization,
    endExampleIndex: endExampleTestIndexLocalization,
    locale: undefined,
    highContrast: true,
  },
];
