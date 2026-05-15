'use client';

import { useState } from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme';
import { AppLayout } from './AppLayout';

function createEmotionCache() {
  return createCache({ key: 'css', prepend: true });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [cache] = useState(createEmotionCache);

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <AppLayout>{children}</AppLayout>
      </ThemeProvider>
    </CacheProvider>
  );
}
