import {useBarChartHoverCardClasses} from './BarChartHoverCard.styles';
import {BarChartHoverCardProps} from './BarChartHoverCard.types';
import {getDayName, getHourlyTimeframe} from './BarChartHoverCard.utils';

export default function BarChartHoverCard(props: BarChartHoverCardProps) {
    const classes = useBarChartHoverCardClasses();
    const {calloutData} = props;
    const usageValue = calloutData.chartData.reduce((sum, item) => sum + item.data, 0);
    const usageStatus =
        calloutData.xAxisCalloutData;

    return (
        <div className={classes.root}>
            <div className={classes.datetime}>
                <div>{getDayName(calloutData.xAxisPoint)}</div>
                <div>{getHourlyTimeframe(calloutData.xAxisPoint)}</div>
            </div>
            {usageStatus && (
                <div className={classes.usageStatus}>
                    <div className={classes.usageStatusIcon}>Icon</div>
                    <div className={classes.usageStatusText}>Status</div>
                </div>
            )}
            <div className={classes.usageBox}>
                <div className={classes.usageBar} />
                <div className={classes.usageValueBox}>
                    <div>Usage</div>
                    <div className={classes.usageValue}>{usageValue.toFixed(1)}</div>
                </div>
            </div>
        </div>
    );
}
