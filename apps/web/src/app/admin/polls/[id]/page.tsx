'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiFetch } from '@/lib/api';
import { getAdminAccessToken } from '@/lib/admin-auth';
import { glassSx, chipSx } from '@/lib/glass-style';

type PollDetail = {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'published' | 'closed';
  type: 'single' | 'multiple';
  maxSelections: number;
  options: { id: string; text: string; sortOrder: number }[];
};

export default function AdminPollEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pollId = params.id;
  const accessToken = getAdminAccessToken();

  useEffect(() => {
    if (!accessToken) router.replace('/admin/login');
  }, [accessToken, router]);

  const { data, error, isLoading, mutate } = useSWR(
    accessToken ? [`/admin/polls/${pollId}`, accessToken] : null,
    ([path, token]) => apiFetch<PollDetail>(path, { accessToken: token }),
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<{ id?: string; text: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    setDescription(data.description ?? '');
    setOptions(data.options.map((o) => ({ id: o.id, text: o.text })));
  }, [data]);

  const canSave = useMemo(
    () => title.trim().length > 0 && options.filter((o) => o.text.trim()).length >= 2,
    [title, options],
  );

  async function save() {
    if (!accessToken) return router.replace('/admin/login');
    setActionError(null);
    setSaving(true);
    try {
      await apiFetch(`/admin/polls/${pollId}`, {
        method: 'PATCH',
        accessToken,
        json: {
          title,
          description: description || null,
          options: options
            .map((o, idx) => ({ ...o, sortOrder: idx }))
            .filter((o) => o.text.trim().length > 0),
        },
      });
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!accessToken) return router.replace('/admin/login');
    setActionError(null);
    try {
      await apiFetch(`/admin/polls/${pollId}/publish`, { method: 'POST', accessToken });
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '发布失败');
    }
  }

  async function close() {
    if (!accessToken) return router.replace('/admin/login');
    setActionError(null);
    try {
      await apiFetch(`/admin/polls/${pollId}/close`, { method: 'POST', accessToken });
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '关闭失败');
    }
  }

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ color: 'text.primary' }}>编辑投票</Typography>
          {data ? (
            <Box component="span" sx={chipSx({ px: 1, py: 0.5, fontSize: '12px' })}>{data.status}</Box>
          ) : null}
        </Stack>

        {isLoading ? <Typography sx={{ color: 'text.secondary' }}>加载中…</Typography> : null}
        {error ? <Alert severity="error">{String(error)}</Alert> : null}
        {actionError ? <Alert severity="error">{actionError}</Alert> : null}

        <Box sx={glassSx()}>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack spacing={2}>
              <TextField label="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
              <TextField label="描述" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} />

              <Stack spacing={1}>
                <Typography variant="subtitle1" sx={{ color: 'text.primary' }}>选项</Typography>
                {options.map((opt, idx) => (
                  <Stack key={idx} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <TextField value={opt.text} onChange={(e) => setOptions((prev) => prev.map((v, i) => (i === idx ? { ...v, text: e.target.value } : v)))} fullWidth />
                    <IconButton onClick={() => setOptions((prev) => prev.filter((_, i) => i !== idx))} disabled={options.length <= 2} aria-label="删除选项">
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))}
                <Button onClick={() => setOptions((prev) => [...prev, { text: '新选项' }])} sx={glassSx()}>
                  添加选项
                </Button>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={save} disabled={!canSave || saving} sx={glassSx({ borderRadius: '8px', textTransform: 'none' })}>
                  {saving ? '保存中…' : '保存'}
                </Button>
                <Button onClick={() => router.push(`/admin/polls/${pollId}/results`)} sx={glassSx()}>
                  查看结果
                </Button>
                <Button component="a" href={`/api/admin/polls/${pollId}/export`} disabled sx={glassSx()}>
                  导出 CSV
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button onClick={publish} disabled={data?.status !== 'draft'} sx={glassSx()}>
                  发布
                </Button>
                <Button color="warning" onClick={close} disabled={data?.status !== 'published'} sx={glassSx()}>
                  关闭
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          提示：导出 CSV 需要带管理员 Token 调用后端接口，后续会在结果页提供下载按钮。
        </Typography>
      </Stack>
    </Box>
  );
}
