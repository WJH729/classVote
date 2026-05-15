'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { apiFetch } from '@/lib/api';
import { setAdminTokens } from '@/lib/admin-auth';
import { glassSx, fadeInUpMobileSx } from '@/lib/glass-style';

export default function AdminLoginPage() {
  const router = useRouter();
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

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
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', px: 2, ...fadeInUpMobileSx }}>
      <Box sx={glassSx({ width: { xs: '100%', sm: 480 }, maxWidth: '100%', p: { xs: 2, sm: 3 } })}>
        <Stack spacing={2} component="form" onSubmit={onSubmit}>
          <Typography variant="h5" sx={{ color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' }, textAlign: 'center' }}>管理员登录</Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="管理员密钥"
            type={showKey ? 'text' : 'password'}
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            autoComplete="current-password"
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <Button size="small" onClick={() => setShowKey(!showKey)} sx={{ minWidth: 'auto', px: 1 }}>
                    {showKey ? '隐藏' : '显示'}
                  </Button>
                ),
              },
            }}
          />

          <Button type="submit" variant="contained" sx={glassSx({ borderRadius: '8px', width: '100%' })} disabled={loading || !secretKey}>
            {loading ? '登录中…' : '登录'}
          </Button>

          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.8rem' }, textAlign: 'center' }}>
            使用管理员密钥登录系统，密钥由系统管理员生成
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
