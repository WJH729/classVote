'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { apiFetch } from '@/lib/api';
import { setAdminTokens } from '@/lib/admin-auth';

export default function KeyLoginPage() {
  const router = useRouter();
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{
        accessToken: string;
        refreshToken: string;
        displayName: string;
      }>('/key/auth/login', {
        method: 'POST',
        json: { secretKey },
      });
      setAdminTokens(res);
      router.replace('/admin/polls');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Card sx={{ width: 480, maxWidth: '100%' }}>
        <CardContent>
          <Stack spacing={2} component="form" onSubmit={onSubmit}>
            <Typography variant="h5">管理员登录</Typography>
            {error ? <Alert severity="error">{error}</Alert> : null}

            <TextField
              label="密钥"
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              autoComplete="current-password"
              fullWidth
            />

            <Button type="submit" variant="contained" disabled={loading || !secretKey}>
              {loading ? '登录中…' : '登录'}
            </Button>

            <Typography variant="body2" color="text.secondary">
              使用管理员密钥登录系统
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
