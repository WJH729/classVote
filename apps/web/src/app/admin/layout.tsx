'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
import { appBarSx } from '@/lib/glass-style';
import { clearAdminTokens, getAdminAccessToken } from '@/lib/admin-auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = getAdminAccessToken();
    if (token && !pathname.startsWith('/admin/login')) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, [pathname]);

  function handleLogout() {
    clearAdminTokens();
    router.replace('/admin/login');
  }

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AppBar position="sticky" sx={appBarSx()} elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            <Link href="/admin" style={{ color: 'inherit', textDecoration: 'none' }}>管理后台</Link>
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Link href="/admin/polls" style={{ textDecoration: 'none' }}>
              <Button
                color="inherit"
                sx={{
                  fontWeight: pathname.startsWith('/admin/polls') ? 700 : 400,
                  borderBottom: pathname.startsWith('/admin/polls') ? '2px solid' : 'none',
                  borderRadius: 0,
                }}
              >投票管理</Button>
            </Link>
            <Link href="/admin/announcement" style={{ textDecoration: 'none' }}>
              <Button
                color="inherit"
                sx={{
                  fontWeight: pathname.startsWith('/admin/announcement') ? 700 : 400,
                  borderBottom: pathname.startsWith('/admin/announcement') ? '2px solid' : 'none',
                  borderRadius: 0,
                }}
              >公告管理</Button>
            </Link>
            <Link href="/admin/settings" style={{ textDecoration: 'none' }}>
              <Button
                color="inherit"
                sx={{
                  fontWeight: pathname.startsWith('/admin/settings') ? 700 : 400,
                  borderBottom: pathname.startsWith('/admin/settings') ? '2px solid' : 'none',
                  borderRadius: 0,
                }}
              >系统设置</Button>
            </Link>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Button color="inherit">用户端</Button>
            </Link>
            {loggedIn && (
              <Button color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>登出</Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 3 }}>{children}</Container>
    </Box>
  );
}
