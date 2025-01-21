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
  Body2
} from '@fluentui/react-components';
import { PortalCompatProvider } from '@fluentui/react-portal-compat';
import { ChartWrapper } from './components/ChartWrapper';
import { getSelection, saveSelection } from './components/utils';

const App: React.FC = () => {
  const [value, setValue] = React.useState(getSelection("Theme", "Light"));

  const onOptionSelect = (event: SelectionEvents, data: OptionOnSelectData): void => {
    setValue(data.optionText ?? "Light");
    saveSelection("Theme", data.optionText ?? "Light");
  };

  return (
    <div>
      <FluentProvider theme={ value === "Light"? webLightTheme: webDarkTheme} targetDocument={document}>
        <PortalCompatProvider>
          <Subtitle2> Theme:</Subtitle2>&nbsp;&nbsp;
          <Dropdown
              value={value}
              onOptionSelect={onOptionSelect}
            >
              <Option>Light</Option>
              <Option>Dark</Option>
            </Dropdown>
            &nbsp;&nbsp;<Body2>@fluentui/react-charting &nbsp;</Body2><Subtitle2>v5.23.43</Subtitle2>
          <ChartWrapper/>
        </PortalCompatProvider>
      </FluentProvider>
    </div>
  );
};

export default App;