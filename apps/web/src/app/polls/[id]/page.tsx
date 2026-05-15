'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Radio,
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { apiFetch } from '@/lib/api';
import { getOrCreateVoterKey } from '@/lib/voter';
import { getAdminAccessToken } from '@/lib/admin-auth';
import { glassSx, fadeInUpSx } from '@/lib/glass-style';

type PollDetail = {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'published' | 'closed';
  type: 'single' | 'multiple';
  maxSelections: number;
  options: { id: string; text: string }[];
};

export default function PollDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pollId = params.id;
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    const token = getAdminAccessToken();
    if (!token) setShowLoginDialog(true);
    setCheckedAuth(true);
  }, []);

  const { data, error, isLoading, mutate } = useSWR(`/polls/${pollId}`, (path) =>
    apiFetch<PollDetail>(path),
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = useMemo(() => selected.length > 0, [selected]);

  function toggle(id: string) {
    if (!data) return;
    if (data.type === 'single') {
      setSelected([id]);
      return;
    }
    setSelected((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      const arr = Array.from(set);
      return arr.slice(0, Math.max(1, data.maxSelections));
    });
  }

  async function submit() {
    if (!data) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const voterKey = getOrCreateVoterKey();
      await apiFetch(`/polls/${pollId}/votes`, {
        method: 'POST',
        json: { optionIds: selected },
        headers: voterKey ? { 'x-voter-key': voterKey } : undefined,
      });
      router.push(`/polls/${pollId}/results`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '投票失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (!checkedAuth) return null;

  return (
    <Box sx={{ minHeight: '100vh', ...fadeInUpSx }}>
      <Container sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 }, maxWidth: 900 }}>
        <Stack spacing={2}>
          <Box sx={glassSx({ p: { xs: 2, sm: 3 } })}>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ color: 'text.primary', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>投票</Typography>
              <Button component={Link} href="/" sx={{ color: 'text.primary' }}>返回列表</Button>
            </Stack>
          </Box>

          {isLoading ? <Typography sx={{ color: 'text.secondary' }}>加载中…</Typography> : null}
          {error ? <Alert severity="error">{String(error)}</Alert> : null}
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}

          {data ? (
            <Box sx={glassSx()}>
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>{data.title}</Typography>
                    {data.description ? (<Typography sx={{ color: 'text.secondary', mt: 0.5 }}>{data.description}</Typography>) : null}
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                      {data.type === 'single' ? '单选' : `多选（最多 ${data.maxSelections} 项）`}
                    </Typography>
                  </Box>

                  <Stack spacing={0.5}>
                    {data.options.map((o) => (
                      <FormControlLabel
                        key={o.id}
                        control={
                          data.type === 'single'
                            ? (<Radio checked={selected[0] === o.id} onChange={() => toggle(o.id)} />)
                            : (<Checkbox checked={selected.includes(o.id)} onChange={() => toggle(o.id)} />)
                        }
                        label={<Typography sx={{ color: 'text.primary' }}>{o.text}</Typography>}
                      />
                    ))}
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button variant="contained" sx={glassSx({ borderRadius: '8px', textTransform: 'none', width: { xs: '100%', sm: 'auto' }, minHeight: { xs: 48, sm: 36 }, fontSize: { xs: '1rem', sm: '0.875rem' } })} disabled={!canSubmit || submitting} onClick={submit}>
                      {submitting ? '提交中…' : '提交投票'}
                    </Button>
                    <Button sx={glassSx({ width: { xs: '100%', sm: 'auto' }, minHeight: { xs: 48, sm: 36 }, fontSize: { xs: '1rem', sm: '0.875rem' } })} onClick={() => mutate()}>刷新</Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button component={Link} href={`/polls/${pollId}/results`} sx={glassSx({ width: { xs: '100%', sm: 'auto' }, minHeight: { xs: 48, sm: 36 }, fontSize: { xs: '1rem', sm: '0.875rem' } })}>
                      查看结果
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Box>
          ) : null}
        </Stack>
      </Container>

      <Dialog open={showLoginDialog} onClose={() => {}} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'text.primary' }}>需要登录</DialogTitle>
        <DialogContent><Typography sx={{ color: 'text.secondary' }}>请先登录班级账号才能参与投票。</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => router.replace('/class/login')} variant="contained" sx={glassSx()}>去登录</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
