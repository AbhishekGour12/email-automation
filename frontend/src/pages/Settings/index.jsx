import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettingsSection, testSmtpConnection } from '../../api/settings.api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail, Building, Clock, ToggleLeft, ToggleRight, Webhook } from 'lucide-react';

const Settings = () => {
  const queryClient = useQueryClient();
  const [testingMode, setTestingMode] = useState(true);

  // 1. Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings
  });

  // Local form states
  const [host, setHost] = useState('');
  const [port, setPort] = useState(465);
  const [secure, setSecure] = useState(true);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [companyWeb, setCompanyWeb] = useState('');

  const [delay3, setDelay3] = useState(3);
  const [delay7, setDelay7] = useState(4);
  const [delay14, setDelay14] = useState(7);

  const [replyReceivedUrl, setReplyReceivedUrl] = useState('');
  const [statusUpdatedUrl, setStatusUpdatedUrl] = useState('');

  // Populate values when loaded
  useEffect(() => {
    if (settings) {
      const smtp = settings.smtp || {};
      setHost(smtp.host || '');
      setPort(smtp.port || 465);
      setSecure(smtp.secure !== false);
      setUser(smtp.user || '');
      setPass(smtp.pass || '');

      const company = settings.company || {};
      setCompanyName(company.name || '');
      setCompanyWeb(company.website || '');

      const followup = settings.followup || {};
      setDelay3(followup.delay3 || 3);
      setDelay7(followup.delay7 || 4);
      setDelay14(followup.delay14 || 7);

      const webhooks = settings.webhooks || {};
      setReplyReceivedUrl(webhooks.replyReceivedUrl || '');
      setStatusUpdatedUrl(webhooks.statusUpdatedUrl || '');
    }
  }, [settings]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ section, data }) => updateSettingsSection(section, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['settings']);
      toast.success(`Settings section [${variables.section}] updated successfully.`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    }
  });

  const testSmtpMutation = useMutation({
    mutationFn: testSmtpConnection,
    onSuccess: (res) => {
      toast.success(res.message || 'SMTP Connection verified successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'SMTP Connection failed. Verify settings.');
    }
  });

  const handleSmtpSave = () => {
    updateMutation.mutate({
      section: 'smtp',
      data: { host, port: parseInt(port, 10), secure, user, pass }
    });
  };

  const handleCompanySave = () => {
    updateMutation.mutate({
      section: 'company',
      data: { name: companyName, website: companyWeb }
    });
  };

  const handleFollowupSave = () => {
    updateMutation.mutate({
      section: 'followup',
      data: { delay3: parseInt(delay3, 10), delay7: parseInt(delay7, 10), delay14: parseInt(delay14, 10) }
    });
  };

  const handleWebhooksSave = () => {
    updateMutation.mutate({
      section: 'webhooks',
      data: { replyReceivedUrl, statusUpdatedUrl }
    });
  };

  if (isLoading) {
    return <div className="text-slate-400 font-sans">Loading configuration settings...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Global Settings
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
          Configure outreach triggers, sender profiles, and SMTP authorizations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column (SMTP & Webhooks) */}
        <div className="space-y-6">
          {/* SMTP settings */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium space-y-4">
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Mail className="h-4 w-4 text-primary-600" /> Hostinger SMTP Configurations
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="SMTP Host" placeholder="smtp.hostinger.com" value={host} onChange={(e) => setHost(e.target.value)} />
            <Input label="SMTP Port" type="number" placeholder="465" value={port} onChange={(e) => setPort(e.target.value)} />
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">SSL Connection:</label>
            <input type="checkbox" checked={secure} onChange={(e) => setSecure(e.target.checked)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="SMTP Username" placeholder="outreach@domain.com" value={user} onChange={(e) => setUser(e.target.value)} />
            <Input label="SMTP Password" type="password" placeholder="••••••••" value={pass} onChange={(e) => setPass(e.target.value)} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              loading={testSmtpMutation.isPending}
              onClick={() => testSmtpMutation.mutate({ host, port: parseInt(port, 10), secure, user, pass })}
            >
              Test Connection
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={updateMutation.isPending && updateMutation.variables?.section === 'smtp'}
              onClick={handleSmtpSave}
            >
              Save SMTP
            </Button>
          </div>
        </div>

        {/* Webhook Integrations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium space-y-4">
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Webhook className="h-4 w-4 text-primary-600" /> Webhook Integrations
          </h3>
          <p className="text-[10px] text-slate-400">Configure URL endpoints to notify n8n of outreach events in real time.</p>
          <div className="space-y-4">
            <Input 
              label="On Reply Received Webhook URL" 
              placeholder="https://your-n8n-instance.com/webhook/reply-received" 
              value={replyReceivedUrl} 
              onChange={(e) => setReplyReceivedUrl(e.target.value)} 
            />
            <Input 
              label="On Lead Status Updated Webhook URL" 
              placeholder="https://your-n8n-instance.com/webhook/status-updated" 
              value={statusUpdatedUrl} 
              onChange={(e) => setStatusUpdatedUrl(e.target.value)} 
            />
          </div>
          <Button
            variant="primary"
            className="w-full mt-2"
            loading={updateMutation.isPending && updateMutation.variables?.section === 'webhooks'}
            onClick={handleWebhooksSave}
          >
            Save Webhooks
          </Button>
        </div>
      </div>

        {/* Company profile & Delays */}
        <div className="space-y-6">
          {/* Company Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium space-y-4">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Building className="h-4 w-4 text-primary-600" /> Company Profile
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Company Name" placeholder="Abhi Services" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              <Input label="Website URL" placeholder="https://abhi.services" value={companyWeb} onChange={(e) => setCompanyWeb(e.target.value)} />
            </div>
            <Button
              variant="primary"
              className="w-full mt-2"
              loading={updateMutation.isPending && updateMutation.variables?.section === 'company'}
              onClick={handleCompanySave}
            >
              Save Company details
            </Button>
          </div>

          {/* Followup Intervals */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium space-y-4">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Clock className="h-4 w-4 text-primary-600" /> Outreach Follow-up Intervals
            </h3>
            <p className="text-[10px] text-slate-400">Define the delays (in days) between sequence drip segments.</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Day 3 Followup" type="number" placeholder="3" value={delay3} onChange={(e) => setDelay3(e.target.value)} />
              <Input label="Day 7 Followup" type="number" placeholder="4" value={delay7} onChange={(e) => setDelay7(e.target.value)} />
              <Input label="Day 14 Followup" type="number" placeholder="7" value={delay14} onChange={(e) => setDelay14(e.target.value)} />
            </div>
            <Button
              variant="primary"
              className="w-full mt-2"
              loading={updateMutation.isPending && updateMutation.variables?.section === 'followup'}
              onClick={handleFollowupSave}
            >
              Save intervals
            </Button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Settings;
