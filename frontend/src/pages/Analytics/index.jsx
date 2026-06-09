import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGlobalAnalytics, getTimebasedAnalytics } from '../../api/analytics.api';
import { getCampaigns } from '../../api/campaign.api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BarChart3, Download, TrendingUp, Mail, Users, MousePointerClick } from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [range, setRange] = useState('daily'); // daily, weekly, monthly

  // Fetch data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['globalStats'],
    queryFn: getGlobalAnalytics
  });

  const { data: timeStats, isLoading: timeLoading } = useQuery({
    queryKey: ['timebasedStats', range],
    queryFn: () => getTimebasedAnalytics(range)
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: getCampaigns
  });

  // Calculate industry rates for chart
  const industryChartData = stats?.statusBreakdown 
    ? Object.entries(stats.statusBreakdown).map(([status, count]) => ({ status, count }))
    : [];

  const campaignChartData = campaigns?.slice(0, 5).map(c => ({
    name: c.name,
    sent: c.sentCount || 0,
    opened: c.openCount || 0,
    replied: c.replyCount || 0
  })) || [];

  const handleExportData = () => {
    try {
      const exportObject = {
        stats,
        campaigns,
        timeStats,
        exportedAt: new Date().toISOString()
      };
      
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `abhi_outreach_report_${range}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Analytics report exported successfully!');
    } catch (e) {
      toast.error('Failed to export analytics report.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Outreach Analytics
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
            Deep dive into campaign performance and conversion metrics
          </p>
        </div>
        
        <Button
          variant="outline"
          icon={Download}
          onClick={handleExportData}
        >
          Export Report
        </Button>
      </div>

      {/* Grid: rates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Average Open Rate" value={statsLoading ? '...' : `${stats?.rates?.openRate || 0}%`} icon={Mail} />
        <Card title="Average Click Rate" value={statsLoading ? '...' : `${stats?.rates?.clickRate || 0}%`} icon={MousePointerClick} />
        <Card title="Average Reply Rate" value={statsLoading ? '...' : `${stats?.rates?.replyRate || 0}%`} icon={Users} />
        <Card title="Conversion Rate" value={statsLoading ? '...' : `${stats?.rates?.interestedRate || 0}%`} icon={TrendingUp} />
      </div>

      {/* Time Based chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-premium p-6 shadow-premium">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150">Conversion Trends</h3>
            <p className="text-xs text-slate-400 mt-1">Growth chart of open, click, and reply rates over time</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {['daily', 'weekly', 'monthly'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`text-xs font-semibold px-3 py-1 rounded-md transition-all ${
                  range === r
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-550 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72">
          {timeLoading ? (
            <div className="h-full flex items-center justify-center text-slate-400">Loading trends...</div>
          ) : !timeStats || timeStats.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">No time-series data available. Launch campaigns to populate logs.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="timeUnit" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line name="Open Rate (%)" type="monotone" dataKey="openRate" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line name="Click Rate (%)" type="monotone" dataKey="clickRate" stroke="#eab308" strokeWidth={2.5} />
                <Line name="Reply Rate (%)" type="monotone" dataKey="replyRate" stroke="#ec4899" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Campaign Comparison Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-premium p-6 shadow-premium">
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 mb-4">Top Campaigns comparison</h3>
          <div className="h-64">
            {campaignsLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400">Loading campaigns...</div>
            ) : campaignChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No active campaign data found.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar name="Sent" dataKey="sent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar name="Opened" dataKey="opened" fill="#eab308" radius={[4, 4, 0, 0]} />
                  <Bar name="Replied" dataKey="replied" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lead Status Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-premium p-6 shadow-premium">
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 mb-4">Lead conversion funnel</h3>
          <div className="h-64">
            {statsLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400">Loading funnel...</div>
            ) : industryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No leads loaded in database.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryChartData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis dataKey="status" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={14}>
                    {industryChartData.map((entry, index) => {
                      const colors = ['#3b82f6', '#4f46e5', '#eab308', '#a855f7', '#ec4899', '#16a34a', '#64748b', '#ef4444'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
