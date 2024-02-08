// import {Neutral51} from '@/components/theme/colors';
import {makeStyles, shorthands, tokens} from '@fluentui/react-components';

export const useBarChartHoverCardClasses = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#202427', //'var(--colorPaletteRedBackground1)',//tokens.colorNeutralBackgroundInverted1,// '#242A2E', //tokens.colorNeutralBackgroundInverted, //, //Neutral51[16],
        width: 'auto',
        height: 'auto',
        color: '#D2D7D9', //tokens.colorNeutralBackground3Pressed,
        ...shorthands.padding('12px', '16px', '16px', '16px'), // Adding tokens makes it not respect the values provided
        ...shorthands.gap('12px'), // Adding tokens makes it not respect the values provided
    },
    datetime: {},
    usageStatus: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        ...shorthands.gap('6px'), // Adding tokens makes it not respect the values provided
    },
    usageStatusIcon: {
        height: '14px',
        width: '14px',
    },
    usageStatusText: {
        fontWeight: tokens.fontWeightSemibold, //tokens.fontWeightSemibold - 600,
    },
    usageBox: {
        display: 'flex',
        flexDirection: 'row',
    },
    usageBar: {
        height: '40px',
        width: '4px', // Adding tokens makes it not respect the values provided
        backgroundColor: tokens.colorBrandBackground2, //tokens.colorBrandBackground2 - '#58D3DB', // Not sure why tokens.colorBrandBackground2 isn't working even after using !important
    },
    usageValueBox: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.padding('0px', '0px', '0px', '8px'),
    },
    usageValue: {
        color: tokens.colorNeutralStrokeOnBrand2,
        fontWeight: tokens.fontWeightBold, //tokens.fontWeightBold, //tokens.fontWeightBold - 700, // Adding tokens makes it not respect the values provided
    },
});
