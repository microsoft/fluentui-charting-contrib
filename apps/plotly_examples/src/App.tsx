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
  const [isWidthSet, setisWidthSet] = React.useState(getSelection("WidthSet", "true") === "true");
  const [labelRTLMode, setLabelRTLMode] = React.useState("Enable RTL");
  const [labelWidthSwitch, setLabelWidthSwitch] = React.useState("Disable Width slider");
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

  const handleWidthSwitchChange = () => {
    const newIsWidthSet = !isWidthSet;
    setisWidthSet(newIsWidthSet);
    setLabelWidthSwitch(newIsWidthSet ? "Disable width slider" : "Enable Width slider");
    saveSelection("WidthSet", newIsWidthSet.toString());
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
            data-testid="rtl_switch"
            checked={isRTL}
            onChange={handleRTLSwitchChange}
            label={labelRTLMode}
          />
          <Switch
            checked={isWidthSet}
            onChange={handleWidthSwitchChange}
            label={labelWidthSwitch}
          />
          &nbsp;&nbsp;<Body2>@fluentui/react-charting &nbsp;</Body2><Subtitle2>v5.24.32</Subtitle2>
          &nbsp;&nbsp;<Body2>@fluentui/react-charts &nbsp;</Body2><Subtitle2>0.0.0-nightly-20250918-0406.1</Subtitle2>
          <br />
          {isWidthSet && (<>
          <Subtitle2>Chart Width:</Subtitle2>&nbsp;&nbsp;
          <Slider
            min={300}
            max={window.innerWidth}
            value={chartWidth}
            onChange={handleSliderChange}
          /></>)}
          <ChartWrapper width={isWidthSet ? chartWidth : undefined} />
        </PortalCompatProvider>
      </FluentProvider>
    </div>
  );
};

export default App;
