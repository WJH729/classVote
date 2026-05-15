'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
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
  Chip as MuiChip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { getAdminAccessToken } from '@/lib/admin-auth';
import { apiFetch } from '@/lib/api';
import { glassSx, appBarSx, chipSx, fadeInUpMobileSx } from '@/lib/glass-style';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const Results3D = dynamic(
  () => import('@/components/Results3D').then((mod) => mod.Results3D),
  { ssr: false },
);

type PollResult = {
  pollId: string;
  title: string;
  options: {
    optionId: string;
    text: string;
    votes: number;
  }[];
  totalVotes: number;
};

type ClassStat = {
  pollId: string;
  pollTitle: string;
  classId: string;
  totalVotes: number;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#6C5CE7', '#A8E6CF', '#FFD93D', '#FF6B6B'];

function SummaryCard({ totalVotes, pollCount }: { totalVotes: number; pollCount: number }) {
  return (
    <Box sx={glassSx({ p: { xs: 2, sm: 3 } })}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 3 }} sx={{ alignItems: 'center' }}>
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>投票总数</Typography>
          <Typography variant="h4">{totalVotes}</Typography>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>进行中投票</Typography>
          <Typography variant="h4">{pollCount}</Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function ResultTable({ result }: { result: PollResult }) {
  return (
    <Box sx={glassSx({ p: { xs: 2, sm: 3 } })}>
      <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.1rem' } }}>{result.title}</Typography>
      <TableContainer component={Paper} sx={{ mt: 2, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '12px', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead>
            <TableRow><TableCell>选项</TableCell><TableCell align="right">票数</TableCell><TableCell align="right">占比</TableCell><TableCell>分布</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {result.options.map((opt) => {
              const percentage = result.totalVotes > 0 ? ((opt.votes / result.totalVotes) * 100).toFixed(1) : '0.0';
              return (
                <TableRow key={opt.optionId}>
                  <TableCell sx={{ color: 'text.primary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{opt.text}</TableCell>
                  <TableCell align="right" sx={{ color: 'text.primary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{opt.votes}</TableCell>
                  <TableCell align="right" sx={{ color: 'text.primary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{percentage}%</TableCell>
                  <TableCell sx={{ minWidth: { xs: 100, sm: 200 } }}>
                    <Box sx={{ width: `${percentage}%`, height: 8, bgcolor: 'primary.main', borderRadius: 1, transition: 'width 0.3s' }} />
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell><Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>总计</Typography></TableCell>
              <TableCell align="right"><Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>{result.totalVotes}</Typography></TableCell>
              <TableCell align="right" /><TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>* 投票数据为匿名统计，不显示个人投票信息</Typography>
    </Box>
  );
}

function PieChartCard({ result }: { result: PollResult }) {
  return (
    <Grid size={{ xs: 12, md: 6 }} key={result.pollId}>
      <Box sx={glassSx({ p: { xs: 2, sm: 3 } })}>
        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.1rem' } }}>{result.title} - 投票分布</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={result.options.map(opt => ({ name: opt.text, value: opt.votes }))} cx="50%" cy="50%" labelLine label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
              {result.options.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Grid>
  );
}

function ClassStatsTable({ stats }: { stats: ClassStat[] }) {
  return (
    <>
      <Typography variant="h5" sx={{ color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>班级维度统计</Typography>
      <Box sx={glassSx({ p: { xs: 2, sm: 3 } })}>
        <TableContainer component={Paper} sx={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '12px', boxShadow: 'none' }}>
          <Table size="small">
            <TableHead><TableRow><TableCell>班级</TableCell><TableCell>投票</TableCell><TableCell align="right">总票数</TableCell><TableCell align="center">状态</TableCell></TableRow></TableHead>
            <TableBody>
              {stats.map((stat) => (
                <TableRow key={`${stat.classId}-${stat.pollId}`}>
                  <TableCell><MuiChip label={`班级 ${stat.classId}`} size="small" sx={chipSx()} /></TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{stat.pollTitle}</TableCell>
                  <TableCell align="right" sx={{ color: 'text.primary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{stat.totalVotes}</TableCell>
                  <TableCell align="center"><MuiChip label="匿名" size="small" color="info" variant="outlined" sx={chipSx()} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}

export default function ClassResultsPage() {
  const router = useRouter();
  const { token, mounted, logout } = useAdminAuth('/class/login');
  const [pollResults, setPollResults] = useState<PollResult[]>([]);
  const [classStats, setClassStats] = useState<ClassStat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setClassId(payload.email?.match(/class(\d+)/)?.[1] || null);
    } catch {
      setClassId(null);
    }

    Promise.all([
      apiFetch<PollResult[]>('/class/auth/results', { accessToken: token }),
      apiFetch<ClassStat[]>('/class/auth/class-stats', { accessToken: token }),
    ])
      .then(([polls, stats]) => { setPollResults(polls); setClassStats(stats); })
      .catch((err) => { setError(err.message); if (err.status === 401) logout(); })
      .finally(() => setLoading(false));
  }, [token, logout]);

  if (!mounted) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalVotesAllPolls = pollResults.reduce((sum, r) => sum + r.totalVotes, 0);

  return (
    <Box sx={{ minHeight: '100vh', overflowX: 'hidden', ...fadeInUpMobileSx }}>
      <AppBar position="static" sx={appBarSx()} elevation={0}>
        <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>投票统计结果</Typography>
          {classId ? <Box component="span" sx={chipSx({ px: 1.5, py: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } })}>班级 {classId}</Box> : null}
          <Link href="/class/vote" style={{ textDecoration: 'none' }}>
            <Button sx={{ color: 'text.primary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>返回投票</Button>
          </Link>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <SummaryCard totalVotes={totalVotesAllPolls} pollCount={pollResults.length} />

          <Typography variant="h5" sx={{ color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>多维统计表</Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}

          {pollResults.length === 0 ? (
            <Typography sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>暂无投票数据</Typography>
          ) : pollResults.map((result) => <ResultTable key={result.pollId} result={result} />)}

          {pollResults.length > 0 && (
            <>
              <Typography variant="h5" sx={{ mt: 3, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>可视化分析</Typography>

              <Grid container spacing={3}>
                {pollResults.slice(0, 4).map((result) => <PieChartCard key={result.pollId} result={result} />)}

                <Grid size={12}>
                  <Box sx={glassSx({ p: { xs: 2, sm: 3 } })}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.1rem' } }}>各选项票数对比</Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={pollResults.flatMap(r => r.options.map(opt => ({ poll: r.title, option: opt.text, votes: opt.votes })))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="option" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend />
                        <Bar dataKey="votes" fill="#8884d8" name="票数" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                <Grid size={12}>
                  <Box sx={glassSx({ p: { xs: 2, sm: 3 } })}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.1rem' } }}>投票趋势分析</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={pollResults.map((r, i) => ({ name: `投票${i + 1}`, title: r.title, votes: r.totalVotes }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend />
                        <Line type="monotone" dataKey="votes" stroke="#8884d8" name="总票数" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                {classStats.length > 0 && (
                  <Grid size={12}>
                    <Box sx={glassSx({ p: { xs: 2, sm: 3 } })}>
                      <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.1rem' } }}>班级参与度雷达图</Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={classStats.map(stat => ({ subject: `班级${stat.classId}`, votes: stat.totalVotes, fullMark: Math.max(...classStats.map(s => s.totalVotes), 1) }))}>
                          <PolarGrid /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} /><PolarRadiusAxis tick={{ fontSize: 12 }} />
                          <Radar name="票数" dataKey="votes" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} /><Legend /><Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </>
          )}

          {classStats.length > 0 && <ClassStatsTable stats={classStats} />}
        </Stack>
      </Container>
    </Box>
  );
}
