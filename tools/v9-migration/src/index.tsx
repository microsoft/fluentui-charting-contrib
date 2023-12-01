import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { 
  FluentProvider, 
  teamsDarkTheme,
  teamsLightTheme,
  webLightTheme,
  webDarkTheme 
} from '@fluentui/react-components';
import {  myCustomTheme } from './components/theme';
import { ChartWrapper } from './components/ChartWrapper';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // Set theme here - teamsDarkTheme/teamsLightTheme/webLightTheme/webDarkTheme/myCustomTheme
  <FluentProvider theme={webLightTheme} > 
    <App />
    <ChartWrapper />
  </FluentProvider>
);
