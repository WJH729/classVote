'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { apiFetch } from '@/lib/api';
import { setAdminTokens } from '@/lib/admin-auth';
import { glassSx } from '@/lib/glass-style';

function generateDeviceId(): string {
  const stored = window.localStorage.getItem('class_device_id');
  if (stored) return stored;
  const newId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  window.localStorage.setItem('class_device_id', newId);
  return newId;
}

const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return { value: num, label: `班级 ${num}` };
});

export default function ClassLoginPage() {
  const router = useRouter();
  const [classId, setClassId] = useState('01');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const email = `class${classId}@vote.system`;

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!agree) {
      setError('请确认本机为班级专用投票机');
      return;
    }

    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setLoading(true);
    try {
      const deviceId = generateDeviceId();

      const res = await apiFetch<{
        accessToken: string;
        refreshToken: string;
        classId: string;
        deviceIdBound: boolean;
      }>('/class/auth/login', {
        method: 'POST',
        json: { email, password, deviceId },
      });

      setAdminTokens(res);
      router.replace('/class/vote');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }, [agree, password, email, router]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', px: 2 }}>
      <Box sx={glassSx({ width: { xs: '100%', sm: 480 }, maxWidth: '100%', p: { xs: 2, sm: 3 } })}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Typography variant="h5" sx={{ color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' }, textAlign: 'center' }}>
              班级投票登录
            </Typography>
            
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
            )}

            <TextField
              select
              label="选择班级"
              value={classId}
              onChange={(e) => setClassId(e.target.value as string)}
              fullWidth
            >
              {CLASS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="邮箱"
              value={email}
              disabled
              fullWidth
              helperText="根据选择的班级自动生成"
            />

            <TextField
              label="密码"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <Button size="small" type="button" onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}>
                      {showPassword ? '隐藏' : '显示'}
                    </Button>
                  ),
                },
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={agree}
                  onChange={() => setAgree(!agree)}
                  sx={{ '& .MuiSvgIcon-root': { borderRadius: 4 } }}
                />
              }
              label={
                <Typography sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' }, userSelect: 'none' }}>
                  确认本机为班级专用投票机，绑定后不可更改
                </Typography>
              }
              sx={{
                py: 1.5,
                px: 1,
                borderRadius: 1,
                border: agree ? '2px solid #6750A4' : '1px solid rgba(0,0,0,0.23)',
                backgroundColor: agree ? 'rgba(103, 80, 164, 0.08)' : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': { backgroundColor: agree ? 'rgba(103, 80, 164, 0.12)' : 'rgba(0, 0, 0, 0.04)' },
              }}
            />

            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading || !agree || !password.trim()} sx={{ borderRadius: '8px', py: 1.5, fontSize: '1rem', fontWeight: 600 }}>
              {loading ? '登录中…' : '进入投票'}
            </Button>

            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.85rem' }, textAlign: 'center', mt: 1 }}>
              默认账号：class01@vote.system ~ class12@vote.system
              <br />
              默认密码：class01 ~ class12
            </Typography>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
