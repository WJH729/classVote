import type { SxProps, Theme } from '@mui/material/styles';

export function glassSx(overrides?: SxProps<Theme>): SxProps<Theme> {
  return {
    background: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '16px',
    boxShadow: (theme) => theme.shadows[1],
    border: '1px solid rgba(255, 255, 255, 0.3)',
    ...overrides,
  };
}

export function appBarSx(overrides?: SxProps<Theme>): SxProps<Theme> {
  return {
    background: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 1000,
    ...overrides,
  };
}

export function chipSx(overrides?: SxProps<Theme>): SxProps<Theme> {
  return {
    background: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: '8px',
    ...overrides,
  };
}

export const fadeInUpSx: SxProps<Theme> = {
  animation: 'fadeInUp 0.5s ease-out',
};

export const fadeInUpMobileSx: SxProps<Theme> = {
  animation: { xs: 'none', sm: 'fadeInUp 0.5s ease-out' },
};
