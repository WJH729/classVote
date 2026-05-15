'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { apiFetch } from '@/lib/api';
import { getAdminAccessToken } from '@/lib/admin-auth';
import { glassSx, appBarSx, fadeInUpSx } from '@/lib/glass-style';
import { useAdminAuth } from '@/hooks/use-admin-auth';

type Announcement = {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
};

const AnnouncementItem = ({
  a,
  onEdit,
  onDelete,
  onToggle,
}: {
  a: Announcement;
  onEdit: (a: Announcement) => void;
  onDelete: (id: string) => void;
  onToggle: (a: Announcement) => void;
}) => (
  <Box key={a.id} sx={glassSx({ transition: 'all 0.3s ease', '&:hover': { background: 'rgba(255, 255, 255, 0.35)' }, p: 2 })}>
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <Box sx={{ flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
          <Typography variant="h6" sx={{ color: 'text.primary' }}>{a.title}</Typography>
          <FormControlLabel
            control={<Switch size="small" checked={a.isActive} onChange={() => onToggle(a)} />}
            label={a.isActive ? '启用' : '停用'}
            sx={{ m: 0 }}
          />
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{a.content}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>优先级: {a.priority} | {new Date(a.createdAt).toLocaleString()}</Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <IconButton onClick={() => onEdit(a)} aria-label="编辑"><EditIcon /></IconButton>
        <IconButton onClick={() => onDelete(a.id)} aria-label="删除"><DeleteIcon /></IconButton>
      </Stack>
    </Stack>
  </Box>
);

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const { token, mounted, logout } = useAdminAuth('/admin/login');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPriority, setFormPriority] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function fetchAnnouncements(t: string) {
    try {
      const data = await apiFetch<Announcement[]>('/announcement', { accessToken: t });
      setAnnouncements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) fetchAnnouncements(token);
  }, [token]);

  function handleOpenNew() {
    setEditId(null);
    setFormTitle('');
    setFormContent('');
    setFormPriority(0);
    setFormActive(true);
    setOpenDialog(true);
  }

  function handleOpenEdit(a: Announcement) {
    setEditId(a.id);
    setFormTitle(a.title);
    setFormContent(a.content);
    setFormPriority(a.priority);
    setFormActive(a.isActive);
    setOpenDialog(true);
  }

  async function handleSubmit() {
    if (!token) return;
    setSubmitting(true);
    try {
      if (editId) {
        await apiFetch(`/announcement/${editId}`, {
          method: 'PATCH',
          accessToken: token,
          json: { title: formTitle, content: formContent, priority: formPriority, isActive: formActive },
        });
      } else {
        await apiFetch('/announcement', {
          method: 'POST',
          accessToken: token,
          json: { title: formTitle, content: formContent, priority: formPriority },
        });
      }
      setOpenDialog(false);
      fetchAnnouncements(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token || !confirm('确定删除？')) return;
    try {
      await apiFetch(`/announcement/${id}`, { method: 'DELETE', accessToken: token });
      fetchAnnouncements(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  }

  async function handleToggleActive(a: Announcement) {
    if (!token) return;
    try {
      await apiFetch(`/announcement/${a.id}`, {
        method: 'PATCH',
        accessToken: token,
        json: { isActive: !a.isActive },
      });
      fetchAnnouncements(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  }

  if (!mounted) return null;

  return (
    <Box sx={{ minHeight: '100vh', ...fadeInUpSx }}>
      <AppBar position="static" sx={appBarSx()} elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'text.primary' }}>公告管理</Typography>
          <Button onClick={handleOpenNew} sx={glassSx({ borderRadius: '8px', textTransform: 'none' })}>
            <AddIcon sx={{ mr: 0.5 }} /> 新建
          </Button>
          <Link href="/admin/polls" style={{ textDecoration: 'none' }}>
            <Button sx={{ color: 'text.primary', ml: 1 }}>返回</Button>
          </Link>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 3 }}>
        <Stack spacing={2}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
          ) : (
            <Stack spacing={1.5}>
              {announcements.map((a) => (
                <AnnouncementItem
                  key={a.id}
                  a={a}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggleActive}
                />
              ))}
              {announcements.length === 0 && <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}>暂无公告</Typography>}
            </Stack>
          )}
        </Stack>
      </Container>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'text.primary' }}>{editId ? '编辑公告' : '新建公告'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="标题" fullWidth value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            <TextField label="内容" fullWidth multiline minRows={3} value={formContent} onChange={(e) => setFormContent(e.target.value)} />
            <TextField label="优先级" type="number" fullWidth value={formPriority} onChange={(e) => setFormPriority(Number(e.target.value))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>取消</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!formTitle || !formContent || submitting} sx={glassSx()}>
            {submitting ? '保存中…' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
