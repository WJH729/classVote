'use client';

import { WallpaperBackground } from '../components/WallpaperBackground';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WallpaperBackground />
      <main
        style={{ 
          position: 'relative', 
          zIndex: 1, 
          minHeight: '100dvh', 
          display: 'flex', 
          flexDirection: 'column' 
        }}
      >
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <footer
          style={{
            textAlign: 'center',
            padding: '20px 0',
            color: '#666',
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '1px',
          }}
        >
          work by:HEERO
        </footer>
      </main>
    </>
  );
}
