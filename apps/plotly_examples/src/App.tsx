import React from 'react';
import { 
  FluentProvider, 
  webLightTheme,
  webDarkTheme,
  Dropdown,
  Option,
  SelectionEvents,
  OptionOnSelectData,
  Subtitle2
} from '@fluentui/react-components';
import { PortalCompatProvider } from '@fluentui/react-portal-compat';
import { ChartWrapper } from './components/ChartWrapper';

const App: React.FC = () => {
  const [value, setValue] = React.useState("Dark");

  const onOptionSelect = (event: SelectionEvents, data: OptionOnSelectData): void => {
    setValue(data.optionText ?? "");
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
          <ChartWrapper />
        </PortalCompatProvider>
      </FluentProvider>
    </div>
  );
};

export default App;