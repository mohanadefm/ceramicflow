import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

function Main() {
  const { theme } = useTheme();
  const muiTheme = createTheme({
    palette: {
      mode: theme,
      background: {
        default: theme === 'dark' ? '#18181b' : '#fff',
        paper: theme === 'dark' ? '#23232a' : '#fff',
      },
      text: {
        primary: theme === 'dark' ? '#fff' : '#1a202c',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: theme === 'dark' ? '#23232a' : '#fff',
            color: theme === 'dark' ? '#fff' : '#1a202c',
          },
        },
      },
    },
  });
  return (
    <MuiThemeProvider theme={muiTheme}>
      <App />
    </MuiThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Main />
    </ThemeProvider>
  </StrictMode>
);
