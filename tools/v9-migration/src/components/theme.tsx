import { createDarkTheme, BrandVariants, createLightTheme} from '@fluentui/react-components';


export const myVariant: BrandVariants = { 
    10: "#000000",
    20: "#220E03",
    30: "#3A1407",
    40: "#551809",
    50: "#701A0B",
    60: "#8D1B0A",
    70: "#AB1A09",
    80: "#CA1506",
    90: "#EA0A02",
    100: "#FF2D13",
    110: "#FF603E",
    120: "#FF8261",
    130: "#FF9F83",
    140: "#FFB8A4",
    150: "#FFD1C3",
    160: "#FFE8E2"
    };
        
export const myCustomTheme=createDarkTheme(myVariant)
