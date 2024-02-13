import {makeStyles, shorthands, tokens} from '@fluentui/react-components';

export const useBarChartHoverCardClasses = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: tokens.colorNeutralBackgroundInverted,
        width: 'auto',
        height: 'auto',
        color: tokens.colorNeutralBackground3Pressed,
        ...shorthands.padding('12px', '16px', '16px', '16px'), 
        ...shorthands.gap('12px'),
    },
    datetime: {},
    usageStatus: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        ...shorthands.gap('6px'),
    },
    usageStatusIcon: {
        height: '14px',
        width: '14px',
    },
    usageStatusText: {
        fontWeight: tokens.fontWeightSemibold,
    },
    usageBox: {
        display: 'flex',
        flexDirection: 'row',
    },
    usageBar: {
        height: '40px',
        width: '4px', 
        backgroundColor: tokens.colorBrandBackground2,
    },
    usageValueBox: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.padding('0px', '0px', '0px', '8px'),
    },
    usageValue: {
        color: tokens.colorNeutralStrokeOnBrand2,
        fontWeight: tokens.fontWeightBold,
    },
});
