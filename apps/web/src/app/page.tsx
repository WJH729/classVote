'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { AppBar, Box, Button, Container, Stack, Toolbar, Typography, CircularProgress } from '@mui/material';
import { apiFetch } from '@/lib/api';
import { glassSx, appBarSx, fadeInUpMobileSx } from '@/lib/glass-style';

type PollSummary = {
  id: string;
  title: string;
  createdAt: string;
};

const PollListItem = ({ p }: { p: PollSummary }) => (
  <Box key={p.id} sx={glassSx({ p: 2 })}>
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="h6" sx={{ color: 'text.primary' }}>{p.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date(p.createdAt).toLocaleString('zh-CN')}
        </Typography>
      </Box>
      <Link href={`/polls/${p.id}`} style={{ textDecoration: 'none' }}>
        <Button variant="contained" sx={glassSx({ borderRadius: '8px' })}>进入</Button>
      </Link>
    </Stack>
  </Box>
);

export default function HomePage() {
  const { data, error, isLoading } = useSWR<PollSummary[]>(
    '/api/polls',
    (path: string) => apiFetch<PollSummary[]>(path),
  );

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', zIndex: 1, ...fadeInUpMobileSx }}>
      <AppBar position="static" sx={appBarSx({ position: 'relative', zIndex: 10 })} elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>投票系统</Typography>
          <Link href="/admin/login" style={{ textDecoration: 'none', position: 'relative', zIndex: 10 }}>
            <Button color="inherit">管理后台</Button>
          </Link>
          <Link href="/class/login" style={{ textDecoration: 'none', position: 'relative', zIndex: 10 }}>
            <Button variant="contained" sx={{ ml: 1 }}>班级投票</Button>
          </Link>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 3, position: 'relative', zIndex: 1 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2, color: 'text.secondary' }}>加载中...</Typography>
          </Box>
        ) : (
          <>
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                错误: {String(error)}
              </Typography>
            )}

            <Typography variant="h5" sx={{ mb: 2, color: 'text.primary' }}>可参与投票</Typography>

            <Stack spacing={2}>
              {(data ?? []).map((p) => <PollListItem key={p.id} p={p} />)}
              {(data?.length === 0) && (
                <Typography sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  暂无投票数据
                </Typography>
              )}
            </Stack>
          </>
        )}
      </Container>
    </Box>
  );
}
