'use client';

import { useState, useEffect } from 'react';
import { Download, Users, Clock, Globe, TrendingUp, FileAudio, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Statistics {
  period: string;
  totalDownloads: number;
  totalUsers: number;
  totalSessions: number;
  downloadsByFormat: Record<string, number>;
  downloadsByQuality: Record<string, number>;
  avgSessionDuration: number;
  avgPageViews: number;
  usersByCountry: Record<string, number>;
  dailyDownloads: Record<string, number>;
  dailyUsers: Record<string, number>;
  monthlyDownloads?: Record<string, number>;
  monthlyUsers?: Record<string, number>;
  monthlySessions?: Record<string, number>;
  completedSessions: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AdminDashboard() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [stats, setStats] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare chart data
  const formatChartData = (data: Record<string, number>) => {
    return Object.entries(data).map(([key, value]) => ({
      name: key,
      value,
    }));
  };

  // Prepare daily or monthly data based on period
  const downloadsData = stats
    ? (period === 'year' && stats.monthlyDownloads
        ? Object.entries(stats.monthlyDownloads)
            .map(([month, count]) => ({
              date: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              downloads: count,
              month,
            }))
            .sort((a, b) => a.month.localeCompare(b.month))
        : Object.entries(stats.dailyDownloads)
            .map(([date, count]) => ({
              date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              downloads: count,
            }))
            .sort((a, b) => a.date.localeCompare(b.date)))
    : [];

  const usersData = stats
    ? (period === 'year' && stats.monthlyUsers
        ? Object.entries(stats.monthlyUsers)
            .map(([month, count]) => ({
              date: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              users: count,
              month,
            }))
            .sort((a, b) => a.month.localeCompare(b.month))
        : Object.entries(stats.dailyUsers)
            .map(([date, count]) => ({
              date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              users: count,
            }))
            .sort((a, b) => a.date.localeCompare(b.date)))
    : [];

  // Monthly sessions data for year view
  const monthlySessionsData = stats?.monthlySessions
    ? Object.entries(stats.monthlySessions)
        .map(([month, count]) => ({
          date: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          sessions: count,
          month,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
    : [];

  const formatData = formatChartData(stats?.downloadsByFormat || {});
  const qualityData = formatChartData(stats?.downloadsByQuality || {});
  const countryData = formatChartData(stats?.usersByCountry || {});

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        <Button
          variant={period === 'day' ? 'default' : 'outline'}
          onClick={() => setPeriod('day')}
        >
          Today
        </Button>
        <Button
          variant={period === 'week' ? 'default' : 'outline'}
          onClick={() => setPeriod('week')}
        >
          Week
        </Button>
        <Button
          variant={period === 'month' ? 'default' : 'outline'}
          onClick={() => setPeriod('month')}
        >
          Month
        </Button>
        <Button
          variant={period === 'year' ? 'default' : 'outline'}
          onClick={() => setPeriod('year')}
        >
          Year
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
              <p className="text-3xl font-bold mt-2">{stats.totalDownloads}</p>
            </div>
            <Download className="h-8 w-8 text-accent" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
              <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-accent" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Session</p>
              <p className="text-3xl font-bold mt-2">{formatTime(stats.avgSessionDuration)}</p>
            </div>
            <Clock className="h-8 w-8 text-accent" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Pages/Visit</p>
              <p className="text-3xl font-bold mt-2">{stats.avgPageViews.toFixed(1)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-accent" />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downloads by Format */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileAudio className="h-5 w-5" />
            Downloads by Format
          </h3>
          {formatData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">No data</p>
          )}
        </div>

        {/* Downloads by Quality */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Video className="h-5 w-5" />
            Downloads by Quality
          </h3>
          {qualityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={qualityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">No data</p>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downloads Chart (Daily or Monthly) */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {period === 'year' ? 'Monthly Downloads' : 'Daily Downloads'}
          </h3>
          {downloadsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={downloadsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="downloads" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">No data</p>
          )}
        </div>

        {/* Users Chart (Daily or Monthly) */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            {period === 'year' ? 'Monthly Users' : 'Daily Users'}
          </h3>
          {usersData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#00C49F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">No data</p>
          )}
        </div>
      </div>

      {/* Monthly Sessions Chart (only for year view) */}
      {period === 'year' && monthlySessionsData.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Monthly Sessions
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySessionsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sessions" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Users by Country */}
      {countryData.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Users by Country
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
          <p className="text-2xl font-bold mt-2">{stats.totalSessions}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Completed Sessions</p>
          <p className="text-2xl font-bold mt-2">{stats.completedSessions}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
          <p className="text-2xl font-bold mt-2">
            {stats.totalSessions > 0
              ? ((stats.completedSessions / stats.totalSessions) * 100).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
