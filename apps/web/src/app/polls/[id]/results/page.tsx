'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import {
  Alert,
  Box,
  Button,
  Container,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { apiFetch } from '@/lib/api';
import { glassSx, fadeInUpSx } from '@/lib/glass-style';

const Results3D = dynamic(
  () => import('@/components/Results3D').then((mod) => mod.Results3D),
  { ssr: false },
);

type Results = {
  pollId: string;
  totalVotes: number;
  options: { optionId: string; text: string; votes: number }[];
  generatedAt: string;
};

export default function PollResultsPage() {
  const params = useParams<{ id: string }>();
  const pollId = params.id;
  const [show3d, setShow3d] = useState(true);

  const { data, error, isLoading, mutate } = useSWR(
    `/polls/${pollId}/results`,
    (path) => apiFetch<Results>(path),
  );

  const maxVotes = Math.max(1, ...(data?.options ?? []).map((o) => o.votes));

  return (
    <Box sx={{ minHeight: '100vh', ...fadeInUpSx }}>
      <Container sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 }, maxWidth: 900 }}>
        <Stack spacing={2}>
          <Box sx={glassSx({ p: { xs: 2, sm: 3 } })}>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ color: 'text.primary', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>投票结果</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                <Button sx={glassSx()} onClick={() => mutate()}>刷新</Button>
                <Button variant="outlined" sx={glassSx()} onClick={() => setShow3d((v) => !v)}>
                  {show3d ? '隐藏 3D' : '显示 3D'}
                </Button>
                <Button component={Link} href={`/polls/${pollId}`} sx={glassSx()}>返回投票</Button>
              </Stack>
            </Stack>
          </Box>

          {isLoading ? <Typography sx={{ color: 'text.secondary' }}>加载中…</Typography> : null}
          {error ? <Alert severity="error">{String(error)}</Alert> : null}

          {data ? (
            <Box sx={glassSx()}>
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  总票数：{data.totalVotes}（生成时间：{new Date(data.generatedAt).toLocaleString()}）
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  {data.options.map((o) => (
                    <Box key={o.optionId}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                        <Typography sx={{ color: 'text.primary', fontSize: { xs: '0.85rem', sm: '1rem' } }}>{o.text}</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: { xs: '0.85rem', sm: '1rem' } }}>{o.votes}</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={(o.votes / maxVotes) * 100} sx={{ height: 10, borderRadius: 6, mt: 0.5 }} />
                    </Box>
                  ))}
                </Stack>

                {show3d && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.primary' }}>3D 可视化</Typography>
                    <Box sx={{ width: '100%', minHeight: 350 }}>
                      <Results3D items={data.options.map((o) => ({ label: o.text, value: o.votes }))} />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      可拖拽旋转/缩放视角；当前以 3D 柱状图展示各选项票数。
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
