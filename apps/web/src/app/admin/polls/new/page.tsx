'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiFetch } from '@/lib/api';
import { getAdminAccessToken } from '@/lib/admin-auth';
import { glassSx, fadeInUpSx } from '@/lib/glass-style';

type PollType = 'single' | 'multiple';

export default function AdminNewPollPage() {
  const router = useRouter();
  const accessToken = getAdminAccessToken();

  const [title, setTitle] = useState('新投票');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<PollType>('single');
  const [maxSelections, setMaxSelections] = useState(2);
  const [options, setOptions] = useState<string[]>(['选项 A', '选项 B']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && options.filter((o) => o.trim()).length >= 2,
    [title, options],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return router.replace('/admin/login');
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ id: string }>('/admin/polls', {
        method: 'POST',
        accessToken,
        json: {
          title,
          description: description || null,
          type,
          maxSelections: type === 'multiple' ? maxSelections : 1,
          options: options.filter((o) => o.trim()).map((text) => ({ text })),
        },
      });
      router.replace(`/admin/polls/${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 800, ...fadeInUpSx }}>
      <Box sx={glassSx()}>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack component="form" onSubmit={onSubmit} spacing={2}>
            <Typography variant="h5" sx={{ color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>新建投票</Typography>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField label="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextField label="描述" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} />
            <TextField label="类型" select value={type} onChange={(e) => setType(e.target.value as PollType)}>
              <MenuItem value="single">单选</MenuItem>
              <MenuItem value="multiple">多选</MenuItem>
            </TextField>
            {type === 'multiple' ? (
              <TextField label="最多可选" type="number" value={maxSelections} onChange={(e) => setMaxSelections(Number(e.target.value))} />
            ) : null}

            <Stack spacing={1}>
              <Typography variant="subtitle1" sx={{ color: 'text.primary' }}>选项</Typography>
              {options.map((opt, idx) => (
                <Stack key={idx} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <TextField value={opt} onChange={(e) => setOptions((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))} fullWidth />
                  <IconButton onClick={() => setOptions((prev) => prev.filter((_, i) => i !== idx))} disabled={options.length <= 2} aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
              <Button onClick={() => setOptions((prev) => [...prev, `选项 ${prev.length + 1}`])} sx={glassSx()}>
                添加选项
              </Button>
            </Stack>

            <Button type="submit" variant="contained" disabled={!canSubmit || loading} sx={glassSx({ borderRadius: '8px', textTransform: 'none', width: { xs: '100%', sm: 'auto' } })}>
              {loading ? '创建中…' : '创建'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
