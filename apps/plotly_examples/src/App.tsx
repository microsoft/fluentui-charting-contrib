import React from 'react';
import { 
  FluentProvider, 
  teamsDarkTheme,
  teamsLightTheme,
  webLightTheme,
  webDarkTheme 
} from '@fluentui/react-components';
import { ChartWrapper } from './components/ChartWrapper';

const App: React.FC = () => {
  return (
    <div>
      <FluentProvider theme={webDarkTheme} > 
        <ChartWrapper />
      </FluentProvider>
    </div>
  );
};

export default App;