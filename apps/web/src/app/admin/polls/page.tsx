'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { Box, Button, Stack, Typography } from '@mui/material';
import { apiFetch } from '@/lib/api';
import { getAdminAccessToken } from '@/lib/admin-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { glassSx, chipSx, fadeInUpMobileSx } from '@/lib/glass-style';
import { useAdminAuth } from '@/hooks/use-admin-auth';

type PollListItem = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'closed';
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
};

const PollItem = ({ p }: { p: PollListItem }) => (
  <Box key={p.id} sx={glassSx({ transition: 'all 0.3s ease', '&:hover': { background: 'rgba(255, 255, 255, 0.35)' }, p: { xs: 2, sm: 3 } })}>
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: 'center', gap: { xs: 1, sm: 0 } }}>
      <Box>
        <Typography variant="h6" sx={{ color: 'text.primary', fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>{p.title}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
          创建时间：{new Date(p.createdAt).toLocaleString()}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box component="span" sx={chipSx({ px: 1, py: 0.5, background: p.status === 'published' ? 'rgba(76,175,80,0.3)' : undefined, fontSize: '12px' })}>{p.status}</Box>
        <Link href={`/admin/polls/${p.id}`} style={{ textDecoration: 'none' }}>
          <Button size="small" sx={glassSx()}>编辑</Button>
        </Link>
        <Link href={`/admin/polls/${p.id}/results`} style={{ textDecoration: 'none' }}>
          <Button size="small" sx={glassSx()}>结果</Button>
        </Link>
      </Stack>
    </Stack>
  </Box>
);

export default function AdminPollsPage() {
  const router = useRouter();
  const { token, mounted } = useAdminAuth('/admin/login');

  const { data, error, isLoading, mutate } = useSWR(
    token ? ['/admin/polls', token] : null,
    ([path, t]) => apiFetch<PollListItem[]>(path, { accessToken: t }),
  );

  const { data: announcements, mutate: mutateAnnouncements } = useSWR(
    token ? ['/announcement', token] : null,
    ([path, t]) => apiFetch<AnnouncementItem[]>(path, { accessToken: t }),
  );

  if (!mounted) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5" sx={{ color: 'text.primary' }}>投票管理</Typography>
        <Typography sx={{ color: 'text.secondary' }}>加载中…</Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden', ...fadeInUpMobileSx }}>
      <Stack spacing={3}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Typography variant="h5" sx={{ color: 'text.primary' }}>管理后台</Typography>
            <Box component="span" sx={chipSx({ px: 1.5, py: 0.5, fontSize: '12px' })}>已登录</Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Link href="/admin/announcements" style={{ textDecoration: 'none' }}>
              <Button sx={glassSx()}>公告管理</Button>
            </Link>
            <Link href="/admin/settings" style={{ textDecoration: 'none' }}>
              <Button sx={glassSx()}>修改密钥</Button>
            </Link>
          </Stack>
        </Stack>

        {announcements && announcements.length > 0 && (
          <Box sx={glassSx({ p: 2, borderLeft: '4px solid #FF8042' })}>
            <Typography variant="subtitle1" sx={{ color: 'text.primary', mb: 1 }}>📢 活跃公告</Typography>
            {announcements.filter(a => a.isActive).slice(0, 2).map((a) => (
              <Box key={a.id} sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{a.title}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{a.content}</Typography>
              </Box>
            ))}
          </Box>
        )}

        <Typography variant="h5" sx={{ color: 'text.primary' }}>投票管理</Typography>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>共 {(data ?? []).length} 个投票</Typography>
          <Stack direction="row" spacing={1}>
            <Link href="/admin/polls/new" style={{ textDecoration: 'none' }}>
              <Button variant="contained" sx={glassSx({ borderRadius: '8px', textTransform: 'none' })}>新建投票</Button>
            </Link>
          </Stack>
        </Stack>

        {isLoading ? <Typography sx={{ color: 'text.secondary' }}>加载中…</Typography> : null}
        {error ? (<Typography color="error">{String(error)}</Typography>) : null}

        <Stack spacing={1.5}>
          {(data ?? []).map((p) => <PollItem key={p.id} p={p} />)}
        </Stack>

        <Button variant="text" onClick={() => mutate()} sx={glassSx()}>刷新</Button>
      </Stack>
    </Box>
  );
}
