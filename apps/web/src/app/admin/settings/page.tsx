'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { apiFetch } from '@/lib/api';
import { getAdminAccessToken } from '@/lib/admin-auth';
import { glassSx } from '@/lib/glass-style';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

export default function AdminSettingsPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>系统设置</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="管理员密钥" />
          <Tab label="站点设置" />
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}>
        <KeyChangeTab />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <SiteSettingsTab />
      </TabPanel>
    </Box>
  );
}

function KeyChangeTab() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleChangeKey(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      setError('新密码至少 6 个字符');
      return;
    }

    setLoading(true);
    try {
      const token = getAdminAccessToken();
      if (!token) throw new Error('未登录');

      await apiFetch('/key/auth/change-password', {
        method: 'POST',
        json: { oldPassword, newPassword },
        accessToken: token,
      });
      setSuccess('密码修改成功！');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={glassSx({ p: 3, maxWidth: 500 })}>
      <Typography variant="h6" sx={{ mb: 3 }}>修改管理员密钥</Typography>

      <form onSubmit={handleChangeKey}>
        <Stack spacing={2.5}>
          <TextField
            label="当前密码"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            fullWidth
            size="medium"
          />
          <TextField
            label="新密码"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            size="medium"
            helperText="至少 6 个字符"
          />
          <TextField
            label="确认新密码"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            size="medium"
          />

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Button
            type="submit"
            variant="contained"
            disabled={loading || !oldPassword || !newPassword || !confirmPassword}
            sx={{ py: 1.5 }}
          >
            {loading ? '修改中…' : '修改密码'}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

function SiteSettingsTab() {
  const [siteUrl, setSiteUrl] = useState('');
  const [extraAllowedOrigins, setExtraAllowedOrigins] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = getAdminAccessToken();
    if (!token) {
      setFetching(false);
      return;
    }

    apiFetch<{ siteUrl: string; extraAllowedOrigins: string }>('/admin/settings', {
      accessToken: token,
    })
      .then((data) => {
        setSiteUrl(data.siteUrl ?? '');
        setExtraAllowedOrigins(data.extraAllowedOrigins ?? '');
        setFetching(false);
      })
      .catch((err) => {
        setError(err.message);
        setFetching(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    setLoading(true);
    try {
      const token = getAdminAccessToken();
      if (!token) throw new Error('未登录');

      await apiFetch('/admin/settings', {
        method: 'PATCH',
        json: { siteUrl, extraAllowedOrigins },
        accessToken: token,
      });
      setSuccess('站点设置已保存！请重启前后端服务使配置生效。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <Box sx={glassSx({ p: 3, maxWidth: 600 })}>
        <Typography>加载中…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={glassSx({ p: 3, maxWidth: 600 })}>
      <Typography variant="h6" sx={{ mb: 1 }}>站点域名 / IP 设置</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        用于内网穿透场景。修改后需重启服务生效。
      </Typography>

      <form onSubmit={handleSave}>
        <Stack spacing={2.5}>
          <TextField
            label="站点 URL（可选）"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            fullWidth
            size="medium"
            placeholder="例如：https://vote.example.com"
            helperText="完整域名地址（含协议），用于生成分享链接等"
          />

          <TextField
            label="允许访问的来源（IP/域名）"
            value={extraAllowedOrigins}
            onChange={(e) => setExtraAllowedOrigins(e.target.value)}
            fullWidth
            size="medium"
            multiline
            minRows={2}
            maxRows={4}
            placeholder="例如：192.168.3.5,tunnel.example.com"
            helperText="逗号分隔。这些地址将被加入 CORS 白名单和 Next.js dev 允许列表。localhost 默认已包含。"
          />

          {error && <Alert severity="error">{error}</Alert>}
          {success && (
            <Alert severity="success">
              {success}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ py: 1.5 }}
          >
            {loading ? '保存中…' : '保存设置'}
          </Button>

          {success && (
            <Alert severity="info" sx={{ mt: 2 }}>
              保存后，需要手动重启服务（重新运行 <code>npm run dev</code>）使新域名/IP 生效。
              <br />保存操作已自动更新 <code>.env</code> 和 <code>next.config.ts</code> 文件。
            </Alert>
          )}
        </Stack>
      </form>
    </Box>
  );
}