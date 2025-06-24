const startExampleTestIndex = 0;
export const totalChartExamplesCount = 847;
const startExampleTestIndexLocalization = 377;
const endExampleTestIndexLocalization = 569;

export const chartsListWithErrors = [];

export const chartsListWithErrorsV9 = [103, 117, 163, 169, 216, 250, 28, 319, 343, 356, 360, 371, 385, 423, 430, 433, 436, 437, 439, 444, 448, 450, 452, 457, 460, 462, 467, 470, 475, 478,
    480, 483, 485, 493, 498, 503, 504, 514, 517, 518, 519, 529, 532, 536, 541, 553, 555, 559, 563, 565, 566, 617, 618, 636, 641, 660, 737, 738, 739, 740, 741, 742,
    743, 744, 745, 746, 747, 748, 749, 752, 753, 754, 755, 756, 760, 761, 762, 763, 764, 765, 766, 767, 788, 794, 800, 801, 803, 805, 810, 815, 819, 823, 828, 830, 833, 837, 
    838, 839, 87, 847
 ];

export const themes = ["Light", "Dark"];
export const modes = ["LTR", "RTL"];

interface TestConfig {
    theme: string;
    mode: string;
    startExampleIndex: number;
    endExampleIndex: number;
    locale: string| undefined;
    highContrast: boolean;
}

export const testMatrix: TestConfig[] = [
    {
        theme: "Light",
        mode: "LTR",
        startExampleIndex: startExampleTestIndex,
        endExampleIndex: totalChartExamplesCount - 1,
        locale: undefined,
        highContrast: false
    },
    {
        theme: "Light",
        mode: "RTL",
        startExampleIndex: startExampleTestIndex,
        endExampleIndex: totalChartExamplesCount - 1,
        locale: undefined,
        highContrast: false
    },
    {
        theme: "Dark",
        mode: "LTR",
        startExampleIndex: startExampleTestIndex,
        endExampleIndex: totalChartExamplesCount - 1,
        locale: undefined,
        highContrast: false
    },
    {
        theme: "Dark",
        mode: "RTL",
        startExampleIndex: startExampleTestIndex,
        endExampleIndex: totalChartExamplesCount - 1,
        locale: undefined,
        highContrast: false
    },
    {
        theme: "Light",
        mode: "LTR",
        startExampleIndex: startExampleTestIndexLocalization,
        endExampleIndex: endExampleTestIndexLocalization,
        locale: 'fr-FR',
        highContrast: false
    },
    {
        theme: "Light",
        mode: "LTR",
        startExampleIndex: startExampleTestIndexLocalization,
        endExampleIndex: endExampleTestIndexLocalization,
        locale: 'de-DE',
        highContrast: false
    },
    {
        theme: "Light",
        mode: "LTR",
        startExampleIndex: startExampleTestIndexLocalization,
        endExampleIndex: endExampleTestIndexLocalization,
        locale: 'ja-JP',
        highContrast: false
    },
    {
        theme: "Dark",
        mode: "LTR",
        startExampleIndex: startExampleTestIndexLocalization,
        endExampleIndex: endExampleTestIndexLocalization,
        locale: 'en-GB',
        highContrast: false
    },
    {
        theme: "Light",
        mode: "RTL",
        startExampleIndex: startExampleTestIndexLocalization,
        endExampleIndex: endExampleTestIndexLocalization,
        locale: 'ar-SA',
        highContrast: false
    },
    {
        theme: "Light",
        mode: "LTR",
        startExampleIndex: startExampleTestIndexLocalization,
        endExampleIndex: endExampleTestIndexLocalization,
        locale: 'hi-IN',
        highContrast: false
    },
    {
        theme: "Light",
        mode: "LTR",
        startExampleIndex: startExampleTestIndexLocalization,
        endExampleIndex: endExampleTestIndexLocalization,
        locale: undefined,
        highContrast: true
    },
    {
        theme: "Dark",
        mode: "LTR",
        startExampleIndex: startExampleTestIndexLocalization,
        endExampleIndex: endExampleTestIndexLocalization,
        locale: undefined,
        highContrast: true
    },
];