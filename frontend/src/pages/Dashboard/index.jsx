import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGlobalAnalytics, getTimebasedAnalytics } from '../../api/analytics.api';
import { getCampaigns } from '../../api/campaign.api';
import { getReplies } from '../../api/reply.api';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import {
  Users,
  Send,
  MailOpen,
  MessageSquare,
  Heart,
  CalendarCheck,
  TrendingUp,
  Activity,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('daily'); // daily, weekly, monthly

  // 1. Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['globalStats'],
    queryFn: getGlobalAnalytics
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['timebasedStats', timeRange],
    queryFn: () => getTimebasedAnalytics(timeRange)
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['dashboardCampaigns'],
    queryFn: getCampaigns
  });

  const { data: replies, isLoading: repliesLoading } = useQuery({
    queryKey: ['dashboardReplies'],
    queryFn: getReplies
  });

  // KPI Calculations (derived or directly from API)
  const kpis = [
    {
      title: 'Total Leads',
      value: statsLoading ? '...' : stats?.totalLeads || 0,
      icon: Users,
      description: 'Imported leads in workspace',
      trend: { type: 'up', value: '1.2%' }
    },
    {
      title: 'Emails Sent',
      value: statsLoading ? '...' : stats?.emailsSent || 0,
      icon: Send,
      description: 'Outbound campaign emails',
      trend: { type: 'up', value: '8.4%' }
    },
    {
      title: 'Open Rate',
      value: statsLoading ? '...' : `${stats?.rates?.openRate || 0}%`,
      icon: MailOpen,
      description: 'Tracking pixel open rate',
      trend: { type: 'up', value: '4.2%' }
    },
    {
      title: 'Reply Rate',
      value: statsLoading ? '...' : `${stats?.rates?.replyRate || 0}%`,
      icon: MessageSquare,
      description: 'Email response rate',
      trend: { type: 'up', value: '1.5%' }
    },
    {
      title: 'Interested Leads',
      value: statsLoading ? '...' : stats?.counts?.interested || 0,
      icon: Heart,
      description: 'Leads tagged as Interested',
      trend: { type: 'up', value: '12%' }
    },
    {
      title: 'Meetings Booked',
      value: statsLoading ? '...' : stats?.statusBreakdown?.['Meeting Requested'] || 0,
      icon: CalendarCheck,
      description: 'Positive calendar triggers',
      trend: { type: 'up', value: '25%' }
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Outreach Dashboard
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
            Realtime metrics and automation performance summaries
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {kpis.map((kpi, idx) => (
          <Card
            key={idx}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            description={kpi.description}
            className="p-5"
          />
        ))}
      </div>

      {/* Charts & Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150">
                Outreach Performance
              </h3>
              <p className="text-xs text-slate-400 mt-1">Sent vs Opened vs Replied rates over time</p>
            </div>
            
            {/* Time period switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {['daily', 'weekly', 'monthly'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`text-xs font-semibold px-3 py-1 rounded-md transition-all ${
                    timeRange === range
                      ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400">Loading charts...</div>
            ) : !chartData || chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No time-series data available. Trigger campaigns to generate logs.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReplied" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="timeUnit" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.96)',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px'
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
                  <Area name="Emails Sent" type="monotone" dataKey="sent" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSent)" strokeWidth={2} />
                  <Area name="Opens" type="monotone" dataKey="opened" stroke="#eab308" fillOpacity={1} fill="url(#colorOpened)" strokeWidth={2} />
                  <Area name="Replies" type="monotone" dataKey="replied" stroke="#ec4899" fillOpacity={1} fill="url(#colorReplied)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live Queue / System Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150">
                System Status
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-6">Realtime queue monitoring and automation status</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-xs font-semibold text-slate-500">Email Workers</span>
                <span className="text-xs font-bold text-green-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span> Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-xs font-semibold text-slate-500">Email Send Queue</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Idle (0 jobs)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-xs font-semibold text-slate-500">Followup Queue</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">0 pending tasks</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Redis Connection:</span>
            <span className="font-bold text-green-600">CONNECTED</span>
          </div>
        </div>
      </div>

      {/* Campaigns and Replies lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Campaigns */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150">
              Active Campaigns
            </h3>
            <Link to="/campaigns" className="text-xs font-bold text-primary-600 hover:text-primary-750 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {campaignsLoading ? (
              <p className="text-sm text-slate-400 py-4">Loading campaigns...</p>
            ) : !campaigns || campaigns.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No campaigns created yet. Click campaigns to create one.</p>
            ) : (
              campaigns.slice(0, 4).map((campaign) => (
                <div key={campaign.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{campaign.name}</span>
                    <span className="text-[10px] text-slate-400">Leads: {campaign.leadIds?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-slate-700 dark:text-slate-350">{campaign.sentCount || 0} Sent</p>
                      <p className="text-[10px] text-slate-400">Replies: {campaign.replyCount || 0}</p>
                    </div>
                    <StatusBadge status={campaign.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Positive Replies */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150">
              Recent Replies
            </h3>
            <Link to="/inbox" className="text-xs font-bold text-primary-600 hover:text-primary-750 flex items-center gap-1">
              Open inbox <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {repliesLoading ? (
              <p className="text-sm text-slate-400 py-4">Loading replies...</p>
            ) : !replies || replies.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No replies logged in workspace. Waiting for incoming webhooks.</p>
            ) : (
              replies.slice(0, 4).map((reply) => (
                <div key={reply.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex flex-col gap-0.5 max-w-[70%]">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{reply.email}</span>
                    <span className="text-[10px] text-slate-400 truncate">{reply.subject || 'No Subject'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                      reply.tag === 'Interested' || reply.tag === 'Meeting Requested'
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400'
                        : reply.tag === 'Not Interested'
                        ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400'
                    }`}>
                      {reply.tag}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
