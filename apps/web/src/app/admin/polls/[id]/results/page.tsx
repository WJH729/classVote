'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { apiFetch } from '@/lib/api';
import { getAdminAccessToken } from '@/lib/admin-auth';

type Results = {
  pollId: string;
  totalVotes: number;
  options: { optionId: string; text: string; votes: number }[];
  generatedAt: string;
};

export default function AdminPollResultsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pollId = params.id;
  const accessToken = getAdminAccessToken();

  useEffect(() => {
    if (!accessToken) router.replace('/admin/login');
  }, [accessToken, router]);

  const { data, error, isLoading, mutate } = useSWR(
    accessToken ? [`/admin/polls/${pollId}/results`, accessToken] : null,
    ([path, token]) => apiFetch<Results>(path, { accessToken: token }),
  );

  const maxVotes = useMemo(
    () => Math.max(1, ...(data?.options ?? []).map((o) => o.votes)),
    [data],
  );

  const [exportError, setExportError] = useState<string | null>(null);
  async function exportCsv() {
    if (!accessToken) return;
    setExportError(null);
    try {
      const csv = await apiFetch<string>(`/admin/polls/${pollId}/export`, {
        accessToken,
        headers: { Accept: 'text/csv' },
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poll_${pollId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : '导出失败');
    }
  }

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ color: 'text.primary' }}>投票结果</Typography>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => mutate()}>刷新</Button>
            <Button variant="outlined" onClick={exportCsv}>导出 CSV</Button>
          </Stack>
        </Stack>

        {isLoading ? <Typography sx={{ color: 'text.secondary' }}>加载中…</Typography> : null}
        {error ? <Alert severity="error">{String(error)}</Alert> : null}
        {exportError ? <Alert severity="error">{exportError}</Alert> : null}

        {data ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                总票数：{data.totalVotes}（生成时间：{new Date(data.generatedAt).toLocaleString()}）
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {data.options.map((o) => (
                  <Box key={o.optionId}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography sx={{ color: 'text.primary' }}>{o.text}</Typography>
                      <Typography color="text.secondary">{o.votes}</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={(o.votes / maxVotes) * 100} sx={{ height: 10, borderRadius: 6, mt: 0.5 }} />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Box>
  );
}
