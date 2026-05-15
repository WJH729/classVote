'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
  CircularProgress,
} from '@mui/material';
import { apiFetch } from '@/lib/api';
import { getAdminAccessToken, clearAdminTokens } from '@/lib/admin-auth';
import { glassSx, appBarSx, chipSx, fadeInUpMobileSx } from '@/lib/glass-style';
import { useAdminAuth } from '@/hooks/use-admin-auth';

type Poll = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
};

export default function ClassVotePage() {
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { token, mounted, logout } = useAdminAuth('/class/login');
  const [classId, setClassId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setClassId(payload.email?.match(/class(\d+)/)?.[1] || null);
    } catch {
      setClassId(null);
    }

    apiFetch<Poll[]>('/class/auth/polls', { accessToken: token })
      .then(setPolls)
      .catch((err) => {
        setError(err.message);
        if (err.status === 401) logout();
      })
      .finally(() => setLoading(false));
  }, [token, logout]);

  if (!mounted) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', overflowX: 'hidden', ...fadeInUpMobileSx }}>
      <AppBar position="static" sx={appBarSx()} elevation={0}>
        <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            班级投票
          </Typography>
          {classId ? (
            <Box component="span" sx={chipSx({ px: 1.5, py: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } })}>
              班级 {classId}
            </Box>
          ) : null}
          <Link href="/class/results" style={{ textDecoration: 'none' }}>
            <Button sx={{ color: 'text.primary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              统计结果
            </Button>
          </Link>
          <Button onClick={logout} sx={{ color: 'text.primary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            退出
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h5" sx={{ color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>可参与投票</Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <Stack spacing={1.5}>
            {polls.length === 0 && !loading ? (
              <Typography sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                暂无投票
              </Typography>
            ) : null}
            {polls.map((p) => (
              <Box
                key={p.id}
                sx={glassSx({
                  transition: 'all 0.3s ease',
                  '&:hover': { background: 'rgba(255, 255, 255, 0.3)' },
                  p: { xs: 2, sm: 3 },
                })}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: 'center', gap: { xs: 2, sm: 0 } }}>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>{p.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      创建时间：{new Date(p.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                    </Typography>
                  </Box>
                  <Link href={`/polls/${p.id}`} style={{ textDecoration: 'none' }}>
                    <Button
                      variant="contained"
                      sx={glassSx({ borderRadius: '8px', textTransform: 'none', width: { xs: '100%', sm: 'auto' } })}
                    >
                      进入投票
                    </Button>
                  </Link>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
