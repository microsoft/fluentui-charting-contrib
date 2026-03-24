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
  Slider,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData
} from '@fluentui/react-components';
import { PortalCompatProvider } from '@fluentui/react-portal-compat';
import { ChartWrapper } from './components/ChartWrapper';
import { VegaChartWrapper } from './components/VegaChartWrapper';
import { getSelection, saveSelection } from './components/utils';
import { setRTL } from '@fluentui/react/lib/Utilities';
import { SliderOnChangeData } from '@fluentui/react-components';

type AppView = 'plotly' | 'vega';

function getInitialView(): AppView {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'vega') return 'vega';
  return 'plotly';
}

const App: React.FC = () => {
  const [activeView, setActiveView] = React.useState<AppView>(getInitialView);
  const [value, setValue] = React.useState(getSelection("Theme", "Light"));
  const [isRTL, setisRTL] = React.useState(getSelection("RTL", "false") === "true");
  const [isDimensionSlidersEnabled, setIsDimensionSlidersEnabled] = React.useState(getSelection("DimensionSlidersEnabled", "true") === "true");
  const [labelRTLMode, setLabelRTLMode] = React.useState("Enable RTL");
  const [labelDimensionSwitch, setLabelDimensionSwitch] = React.useState("Disable Dimension sliders");
  const [chartWidth, setChartWidth] = React.useState<number>(Number(getSelection("ChartWidth", window.innerWidth.toString())));
  const [chartHeight, setChartHeight] = React.useState<number>(Number(getSelection("ChartHeight", "400")));

  React.useEffect(() => {
    const onHashChange = () => setActiveView(getInitialView());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  setRTL(isRTL);

  const onOptionSelect = (event: SelectionEvents, data: OptionOnSelectData): void => {
    setValue(data.optionText ?? "Light");
    saveSelection("Theme", data.optionText ?? "Light");
  };

  const handleTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    const view = data.value as AppView;
    setActiveView(view);
    window.location.hash = view;
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

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
    setChartWidth(Number(data.value));
    saveSelection("ChartWidth", data.value.toString());
  };

  const handleHeightSliderChange = (event: React.ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
    setChartHeight(Number(data.value));
    saveSelection("ChartHeight", data.value.toString());
  };

  const chartWidthProp = isDimensionSlidersEnabled ? chartWidth : undefined;
  const chartHeightProp = isDimensionSlidersEnabled ? chartHeight : undefined;

  return (
    <div>
      <FluentProvider theme={value === "Light" ? webLightTheme : webDarkTheme} targetDocument={document}>
        <PortalCompatProvider>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '4px 8px' }}>
            <TabList selectedValue={activeView} onTabSelect={handleTabSelect}>
              <Tab value="plotly">Plotly Schemas</Tab>
              <Tab value="vega">Vega-Lite Schemas</Tab>
            </TabList>
            <Subtitle2> Theme:</Subtitle2>&nbsp;
            <Dropdown
              value={value}
              onOptionSelect={onOptionSelect}
            >
              <Option>Light</Option>
              <Option>Dark</Option>
            </Dropdown>
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
          </div>
          <div style={{ padding: '0 8px' }}>
            <Body2>@fluentui/react-charting &nbsp;</Body2><Subtitle2>v5.25.6</Subtitle2>
            &nbsp;&nbsp;<Body2>@fluentui/react-charts &nbsp;</Body2><Subtitle2>0.0.0-nightly-20260324-0406.1</Subtitle2>
          </div>
          {isDimensionSlidersEnabled && (
          <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: '20px', padding: '4px 8px' }}>
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
          )}
          {activeView === 'plotly' ? (
            <ChartWrapper
              width={chartWidthProp}
              height={chartHeightProp}
              isReversedOrder={true}
              isRTL={isRTL}
            />
          ) : (
            <VegaChartWrapper
              width={chartWidthProp}
              height={chartHeightProp}
              isReversedOrder={true}
            />
          )}
        </PortalCompatProvider>
      </FluentProvider>
    </div>
  );
};

export default App;
