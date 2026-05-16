import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6750A4',
      light: '#EADDFF',
      dark: '#4F378B',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#625B71',
      light: '#E8DEF8',
      dark: '#49454F',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#B3261E',
      light: '#F9DEDC',
    },
    warning: {
      main: '#F59E0B',
    },
    success: {
      main: '#059669',
    },
    info: {
      main: '#1976D2',
    },
    background: {
      default: '#FEF7FF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1D1B20',
      secondary: '#49454F',
    },
  },
  typography: {
    fontFamily: 'var(--font-roboto), "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 400,
      fontSize: '3.5625rem',
      lineHeight: 1.12,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 400,
      fontSize: '2.8125rem',
      lineHeight: 1.16,
    },
    h3: {
      fontWeight: 500,
      fontSize: '2.25rem',
      lineHeight: 1.22,
    },
    h4: {
      fontWeight: 500,
      fontSize: '2rem',
      lineHeight: 1.25,
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.5rem',
      lineHeight: 1.33,
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.43,
      letterSpacing: '0.01em',
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.03em',
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.43,
      letterSpacing: '0.02em',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
      fontSize: '0.875rem',
      letterSpacing: '0.03em',
    },
    caption: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.66,
      letterSpacing: '0.04em',
    },
    overline: {
      fontWeight: 500,
      fontSize: '0.6875rem',
      lineHeight: 1.64,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none',
          padding: '10px 24px',
          fontFamily: 'var(--font-roboto), Roboto, sans-serif',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 3px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.2)',
          },
          '&:active': {
            boxShadow: 'none',
          },
        },
        outlined: {
          borderWidth: 1,
          '&:hover': {
            borderWidth: 1,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'medium',
      },
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-roboto), Roboto, sans-serif',
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6750A4',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.12)',
          fontFamily: 'var(--font-roboto), Roboto, sans-serif',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontFamily: 'var(--font-roboto), Roboto, sans-serif',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          fontFamily: 'var(--font-roboto), Roboto, sans-serif',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontFamily: 'var(--font-roboto), Roboto, sans-serif',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          color: '#1D1B20',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#1D1B20',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#6750A4',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
  },
});
