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
  const [isDimensionSlidersEnabled, setIsDimensionSlidersEnabled] = React.useState(getSelection("DimensionSlidersEnabled", "true") === "true");
  const [isV9ChartFirst, setIsV9ChartFirst] = React.useState(getSelection("isV9ChartFirst", "false") === "true");
  const [labelRTLMode, setLabelRTLMode] = React.useState("Enable RTL");
  const [labelDimensionSwitch, setLabelDimensionSwitch] = React.useState("Disable Dimension sliders");
  const [labelChartOrderSwitch] = React.useState("Show v9 first");
  const [chartWidth, setChartWidth] = React.useState<number>(Number(getSelection("ChartWidth", window.innerWidth.toString())));
  const [chartHeight, setChartHeight] = React.useState<number>(Number(getSelection("ChartHeight", "400")));

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

   const handleDimensionSlidersChange = () => {
    const newIsEnabled = !isDimensionSlidersEnabled;
    setIsDimensionSlidersEnabled(newIsEnabled);
    setLabelDimensionSwitch(newIsEnabled ? "Disable Dimension sliders" : "Enable Dimension sliders");
    saveSelection("DimensionSlidersEnabled", newIsEnabled.toString());
  };

  const handleChartOrderSwitchChange = () => {
    const newIsV9ChartFirst = !isV9ChartFirst;
    setIsV9ChartFirst(newIsV9ChartFirst);
    saveSelection("isV9ChartFirst", newIsV9ChartFirst.toString());
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
    setChartWidth(Number(data.value));
    saveSelection("ChartWidth", data.value.toString());
  };

  const handleHeightSliderChange = (event: React.ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
    setChartHeight(Number(data.value));
    saveSelection("ChartHeight", data.value.toString());
  };

  return (
    <div>
      <FluentProvider theme={value === "Light" ? webLightTheme : webDarkTheme} targetDocument={document} dir={isRTL ? 'rtl' : 'ltr'}>
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
            checked={isDimensionSlidersEnabled}
            onChange={handleDimensionSlidersChange}
            label={labelDimensionSwitch}
          />
          <Switch
            checked={isV9ChartFirst}
            onChange={handleChartOrderSwitchChange}
            label={labelChartOrderSwitch}
          />
          &nbsp;&nbsp;<Body2>@fluentui/react-charting &nbsp;</Body2><Subtitle2>v5.25.2</Subtitle2>
          &nbsp;&nbsp;<Body2>@fluentui/react-charts &nbsp;</Body2><Subtitle2>0.0.0-nightly-20251126-0406.1</Subtitle2>
          <br />
          {isDimensionSlidersEnabled && (<>
          <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Subtitle2>Chart Width:</Subtitle2>
              <Slider
                min={300}
                max={window.innerWidth}
                value={chartWidth}
                onChange={handleSliderChange}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Subtitle2>Chart Height:</Subtitle2>
              <Slider
                min={300}
                max={800}
                value={chartHeight}
                onChange={handleHeightSliderChange}
              />
            </div>
          </div>
          </>)}
          <ChartWrapper 
            width={isDimensionSlidersEnabled ? chartWidth : undefined} 
            height={isDimensionSlidersEnabled ? chartHeight : undefined}
            isReversedOrder={isV9ChartFirst}
            isRTL={isRTL}
          />
        </PortalCompatProvider>
      </FluentProvider>
    </div>
  );
};

export default App;
