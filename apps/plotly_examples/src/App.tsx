import React from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Dropdown,
  Option,
  SelectionEvents,
  OptionOnSelectData,
  Subtitle2,
  Body2,
  Switch,
  Slider
} from '@fluentui/react-components';
import { PortalCompatProvider } from '@fluentui/react-portal-compat';
import { ChartWrapper } from './components/ChartWrapper';
import { getSelection, saveSelection } from './components/utils';
import { setRTL } from '@fluentui/react/lib/Utilities';
import { SliderOnChangeData } from '@fluentui/react-components';

const App: React.FC = () => {
  const [value, setValue] = React.useState(getSelection("Theme", "Light"));
  const [isRTL, setisRTL] = React.useState(getSelection("RTL", "false") === "true");
  const [labelRTLMode, setLabelRTLMode] = React.useState("Enable RTL");
  const [chartWidth, setChartWidth] = React.useState<number>(Number(getSelection("ChartWidth", window.innerWidth.toString())));

  setRTL(isRTL);
  const onOptionSelect = (event: SelectionEvents, data: OptionOnSelectData): void => {
    setValue(data.optionText ?? "Light");
    saveSelection("Theme", data.optionText ?? "Light");
  };

  const handleRTLSwitchChange = () => {
    const newIsRTL = !isRTL;
    setisRTL(newIsRTL);
    setLabelRTLMode(newIsRTL ? "Disable RTL" : "Enable RTL");
    setRTL(newIsRTL);
    saveSelection("RTL", newIsRTL.toString());
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
    setChartWidth(Number(data.value));
    saveSelection("ChartWidth", data.value.toString());
  };

  return (
    <div>
      <FluentProvider theme={value === "Light" ? webLightTheme : webDarkTheme} targetDocument={document}>
        <PortalCompatProvider>
          <Subtitle2> Theme:</Subtitle2>&nbsp;&nbsp;
          <Dropdown
            value={value}
            onOptionSelect={onOptionSelect}
          >
            <Option>Light</Option>
            <Option>Dark</Option>
          </Dropdown>
          &nbsp;&nbsp;&nbsp;
          <Switch
            checked={isRTL}
            onChange={handleRTLSwitchChange}
            label={labelRTLMode}
          />
          &nbsp;&nbsp;<Body2>@fluentui/react-charting &nbsp;</Body2><Subtitle2>v5.23.60</Subtitle2>
          <br />
          <Subtitle2>Chart Width:</Subtitle2>&nbsp;&nbsp;
          <Slider
            min={300}
            max={window.innerWidth}
            value={chartWidth}
            onChange={handleSliderChange}
          />
          <ChartWrapper width={chartWidth} />
        </PortalCompatProvider>
      </FluentProvider>
    </div>
  );
};

export default App;