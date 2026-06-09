import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign, startCampaign, pauseCampaign, resumeCampaign, cancelCampaign, getCampaignFollowups } from '../../api/campaign.api';
import { getTemplates } from '../../api/template.api';
import { getLeads } from '../../api/lead.api';
import { getEmailHistory } from '../../api/email.api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import StatusBadge from '../../components/StatusBadge';
import { Plus, Play, Pause, RotateCcw, Trash, Users, BarChart3, ChevronRight, ChevronLeft, Check, Sparkles, Send, Mail, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const INDUSTRIES = [
  'Dental', 'Gym', 'Restaurant', 'Real Estate', 'Hotel',
  'Construction', 'Ecommerce', 'Retail', 'Salon', 'Clinic',
  'Education', 'Finance', 'Manufacturing', 'Logistics',
  'SaaS', 'Startup', 'IT Agency', 'Other'
];

const Campaigns = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list'); // list | create | details
  const [selectedId, setSelectedId] = useState(null);
  const [detailsTab, setDetailsTab] = useState('activity'); // activity | followups
  
  // Create Campaign Wizard states
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('Other');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');

  // 1. Fetch campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: getCampaigns
  });

  // 2. Fetch templates for wizard
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates,
    enabled: view === 'create'
  });

  // 3. Fetch leads for wizard (supporting pagination/search inside step)
  const { data: leadsData } = useQuery({
    queryKey: ['wizardLeads'],
    queryFn: () => getLeads({ page: 1, limit: 100 }), // Fetch first 100 leads for selection
    enabled: view === 'create' && step === 4
  });

  // 4. Fetch details for a specific campaign
  const { data: activeCampaign, isLoading: detailsLoading } = useQuery({
    queryKey: ['campaign', selectedId],
    queryFn: () => getCampaign(selectedId),
    enabled: view === 'details' && !!selectedId
  });

  // 5. Fetch email history for details view
  const { data: emailHistory, isLoading: emailHistoryLoading } = useQuery({
    queryKey: ['emailHistory'],
    queryFn: getEmailHistory,
    enabled: view === 'details' && !!selectedId
  });

  // 6. Fetch followups for details view
  const { data: campaignFollowups, isLoading: followupsLoading } = useQuery({
    queryKey: ['campaignFollowups', selectedId],
    queryFn: () => getCampaignFollowups(selectedId),
    enabled: view === 'details' && !!selectedId
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      toast.success('Campaign created successfully!');
      resetWizard();
      setView('list');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create campaign.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      toast.success('Campaign deleted successfully.');
      if (view === 'details') setView('list');
    }
  });

  const controlMutation = useMutation({
    mutationFn: ({ id, action }) => {
      if (action === 'start') return startCampaign(id);
      if (action === 'pause') return pauseCampaign(id);
      if (action === 'resume') return resumeCampaign(id);
      if (action === 'cancel') return cancelCampaign(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['campaigns']);
      if (selectedId) queryClient.invalidateQueries(['campaign', selectedId]);
      toast.success(`Campaign action [${variables.action}] executed successfully.`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  });

  const resetWizard = () => {
    setStep(1);
    setCampaignName('');
    setSelectedIndustry('Other');
    setSelectedTemplateId('');
    setSelectedLeadIds(new Set());
    setSenderName('');
    setSenderEmail('');
  };

  const handleCreateLaunch = async () => {
    const payload = {
      name: campaignName,
      templateId: selectedTemplateId,
      leadIds: Array.from(selectedLeadIds),
      settings: {
        senderName,
        senderEmail,
      }
    };
    
    try {
      const created = await createMutation.mutateAsync(payload);
      // Automatically trigger launch
      await controlMutation.mutateAsync({ id: created.id || created._id, action: 'start' });
    } catch (e) {
      // Errors handled
    }
  };

  const handleLeadCheckbox = (leadId) => {
    const newSelected = new Set(selectedLeadIds);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeadIds(newSelected);
  };

  const toggleAllLeads = () => {
    if (selectedLeadIds.size === (leadsData?.leads?.length || 0)) {
      setSelectedLeadIds(new Set());
    } else {
      const allIds = new Set(leadsData?.leads?.map(l => l.id || l._id));
      setSelectedLeadIds(allIds);
    }
  };

  const pendingFollowups = campaignFollowups ? campaignFollowups.filter(f => f.status === 'pending') : [];
  const nextFollowup = pendingFollowups.length > 0 ? pendingFollowups[0] : null;
  const nextFollowupText = nextFollowup
    ? `Step ${nextFollowup.step} scheduled at ${new Date(nextFollowup.scheduledAt).toLocaleString()}`
    : 'No pending follow-ups initiated';

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. LIST VIEW */}
      {view === 'list' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Outreach Campaigns
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-550 font-semibold mt-1">
                Launch and monitor email drip automation campaigns
              </p>
            </div>
            
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                resetWizard();
                setView('create');
              }}
            >
              Create Campaign
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaignsLoading ? (
              <p className="text-slate-400">Loading campaigns...</p>
            ) : !campaigns || campaigns.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 rounded-premium border border-slate-200 dark:border-slate-800 p-12 text-center">
                <Send className="mx-auto h-8 w-8 text-slate-350 mb-3" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No campaigns found</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">Get started by creating your first outreach drip.</p>
                <Button variant="primary" size="sm" onClick={() => setView('create')}>Create Campaign</Button>
              </div>
            ) : (
              campaigns.map((camp) => (
                <div
                  key={camp.id}
                  onClick={() => {
                    setSelectedId(camp.id);
                    setView('details');
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <StatusBadge status={camp.status} />
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {camp.status === 'Draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 text-slate-400 hover:text-green-600"
                            onClick={() => controlMutation.mutate({ id: camp.id, action: 'start' })}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {camp.status === 'Running' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 text-slate-400 hover:text-yellow-600"
                            onClick={() => controlMutation.mutate({ id: camp.id, action: 'pause' })}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {camp.status === 'Paused' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 text-slate-400 hover:text-green-600"
                            onClick={() => controlMutation.mutate({ id: camp.id, action: 'resume' })}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 text-slate-400 hover:text-red-650"
                          onClick={() => {
                            if (window.confirm('Delete this campaign?')) deleteMutation.mutate(camp.id);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-850 dark:text-slate-150 mb-2 truncate">
                      {camp.name}
                    </h3>
                    <p className="text-xs text-slate-400 mb-6">Created {new Date(camp.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-center text-xs">
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-200">{camp.leadIds?.length || 0}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Leads</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-200">{camp.sentCount || 0}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Sent</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-200">{camp.replyCount || 0}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Replies</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* 2. CAMPAIGN WIZARD VIEW */}
      {view === 'create' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium shadow-premium p-8 font-sans">
          
          {/* Progress bar */}
          <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Step {step} of 7: {
                step === 1 ? 'Campaign Name' :
                step === 2 ? 'Industry Hooks' :
                step === 3 ? 'Choose Template' :
                step === 4 ? 'Select Target Leads' :
                step === 5 ? 'Sender Details' :
                step === 6 ? 'Review Settings' : 'Launch'
              }
            </span>
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
              {Math.round((step / 7) * 100)}% Complete
            </span>
          </div>

          {/* Steps contents */}
          <div className="min-h-[250px]">
            {/* Step 1: Name */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-150">Name your campaign</h3>
                <p className="text-xs text-slate-400">Enter a clear name to track this campaign inside your dashboard.</p>
                <Input
                  label="Campaign Name"
                  placeholder="e.g. Q3 Dental Outreach Campaign"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
            )}

            {/* Step 2: Choose Industry */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-150">Select Target Industry</h3>
                <p className="text-xs text-slate-400">The personalization engine will automatically inject specific hooks matching this industry.</p>
                <Input
                  type="select"
                  label="Industry hooks type"
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  options={INDUSTRIES.map(ind => ({ value: ind, label: ind }))}
                />
              </div>
            )}

            {/* Step 3: Choose Template */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-150">Select Outreach Template</h3>
                <p className="text-xs text-slate-400">Choose the template structure (subject, initial body, and follow-ups).</p>
                <Input
                  type="select"
                  label="Outreach Template"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  options={[
                    { value: '', label: 'Select a template...' },
                    ...(templates?.map(t => ({ value: t.id || t._id, label: `${t.name} (${t.category})` })) || [])
                  ]}
                />
              </div>
            )}

            {/* Step 4: Select Leads */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-slate-850 dark:text-slate-150">Assign Leads</h3>
                    <p className="text-xs text-slate-400">Check the leads you want to enroll in this outreach drip.</p>
                  </div>
                  <span className="text-xs font-bold text-primary-600">{selectedLeadIds.size} Selected</span>
                </div>

                <div className="max-h-[300px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 text-xs font-bold text-slate-500">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.size === (leadsData?.leads?.length || 0)}
                      onChange={toggleAllLeads}
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                    <div className="grid grid-cols-3 gap-2 flex-grow">
                      <span>Name</span>
                      <span>Email</span>
                      <span>Company</span>
                    </div>
                  </div>
                  {leadsData?.leads?.map((lead) => (
                    <label key={lead.id} className="flex items-center gap-3 p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.has(lead.id)}
                        onChange={() => handleLeadCheckbox(lead.id)}
                        className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                      />
                      <div className="grid grid-cols-3 gap-2 flex-grow">
                        <span className="font-semibold text-slate-700 dark:text-slate-250">{lead.name}</span>
                        <span className="text-slate-450 dark:text-slate-450 truncate">{lead.email}</span>
                        <span className="text-slate-450 dark:text-slate-450 truncate">{lead.company || '-'}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Sender details */}
            {step === 5 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-150">Sender Configuration</h3>
                <p className="text-xs text-slate-400">Configure the display name and SMTP settings for this specific outreach.</p>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Sender Display Name"
                    placeholder="e.g. Abhishek Gupta"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                  <Input
                    label="Sender Email Address"
                    placeholder="e.g. abhishek@yourdomain.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-slate-400">Note: The sender email must align with your configured Hostinger SMTP authorizations to prevent delivery bounces.</p>
              </div>
            )}

            {/* Step 6: Review */}
            {step === 6 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-150">Review Settings</h3>
                <p className="text-xs text-slate-400">Double check everything before starting the automation flow.</p>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-premium border border-slate-150 dark:border-slate-800 text-xs space-y-3">
                  <div className="grid grid-cols-2">
                    <span className="text-slate-400">Campaign Name:</span>
                    <span className="font-bold text-right text-slate-700 dark:text-slate-200">{campaignName}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-slate-400">Industry:</span>
                    <span className="font-semibold text-right text-slate-700 dark:text-slate-200">{selectedIndustry}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-slate-400">Target Contacts:</span>
                    <span className="font-semibold text-right text-slate-700 dark:text-slate-200">{selectedLeadIds.size} Leads</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-slate-400">Sender:</span>
                    <span className="font-semibold text-right text-slate-700 dark:text-slate-200">{senderName ? `"${senderName}" <${senderEmail}>` : 'Default SMTP Account'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Launch */}
            {step === 7 && (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="p-4 bg-primary-100 dark:bg-primary-950/20 text-primary-600 rounded-full animate-bounce">
                  <Sparkles className="h-10 w-10" />
                </div>
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-150">Ready to Launch!</h3>
                <p className="text-xs text-slate-450 max-w-sm">
                  Clicking launch will save the campaign, schedule followup intervals, and queue the initial outreach emails into BullMQ.
                </p>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
            <Button
              variant="outline"
              icon={ChevronLeft}
              onClick={() => {
                if (step === 1) {
                  setView('list');
                } else {
                  setStep(step - 1);
                }
              }}
            >
              Back
            </Button>
            
            {step < 7 ? (
              <Button
                variant="primary"
                disabled={
                  (step === 1 && !campaignName.trim()) ||
                  (step === 3 && !selectedTemplateId) ||
                  (step === 4 && selectedLeadIds.size === 0)
                }
                onClick={() => setStep(step + 1)}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={Check}
                loading={createMutation.isPending || controlMutation.isPending}
                onClick={handleCreateLaunch}
              >
                Launch Campaign
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 3. CAMPAIGN DETAILS VIEW */}
      {view === 'details' && (
        <div className="space-y-6 font-sans">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <Button variant="outline" size="sm" onClick={() => setView('list')} className="mb-2">
                &larr; Back to Campaigns
              </Button>
              <h2 className="text-xl font-bold text-slate-850 dark:text-slate-100 flex items-center gap-3">
                {detailsLoading ? 'Loading...' : activeCampaign?.name}
                {activeCampaign && <StatusBadge status={activeCampaign.status} />}
              </h2>
            </div>
            
            {activeCampaign && (
              <div className="flex items-center gap-2">
                {activeCampaign.status === 'Running' && (
                  <Button
                    variant="outline"
                    icon={Pause}
                    onClick={() => controlMutation.mutate({ id: activeCampaign.id, action: 'pause' })}
                  >
                    Pause Campaign
                  </Button>
                )}
                {activeCampaign.status === 'Paused' && (
                  <Button
                    variant="primary"
                    icon={Play}
                    onClick={() => controlMutation.mutate({ id: activeCampaign.id, action: 'resume' })}
                  >
                    Resume Campaign
                  </Button>
                )}
                {activeCampaign.status === 'Draft' && (
                  <Button
                    variant="primary"
                    icon={Play}
                    onClick={() => controlMutation.mutate({ id: activeCampaign.id, action: 'start' })}
                  >
                    Start Campaign
                  </Button>
                )}
                <Button
                  variant="outline"
                  icon={RotateCcw}
                  onClick={() => controlMutation.mutate({ id: activeCampaign.id, action: 'cancel' })}
                >
                  Reset to Draft
                </Button>
              </div>
            )}
          </div>

          {activeCampaign && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Followup schedule banner */}
              <div className="md:col-span-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-premium p-4 flex items-center justify-between text-xs font-sans">
                <span className="font-semibold text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary-600" /> Next Scheduled Follow-up:
                </span>
                <span className={`font-bold ${nextFollowup ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-450'}`}>
                  {nextFollowupText}
                </span>
              </div>

              {/* Stats blocks */}
              <div className="md:col-span-1 space-y-4">
                <Card title="Open Rate" value={`${Math.round((activeCampaign.openCount / (activeCampaign.sentCount || 1)) * 100)}%`} icon={BarChart3} />
                <Card title="Reply Rate" value={`${Math.round((activeCampaign.replyCount / (activeCampaign.sentCount || 1)) * 100)}%`} icon={Users} />
              </div>

              {/* Grid performance summary */}
              <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium">
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 mb-4">Outreach Statistics</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{activeCampaign.leadIds?.length || 0}</p>
                    <p className="text-xs text-slate-455 mt-1">Total Enrolled</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{activeCampaign.sentCount || 0}</p>
                    <p className="text-xs text-slate-455 mt-1">Emails Sent</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{activeCampaign.openCount || 0}</p>
                    <p className="text-xs text-slate-455 mt-1">Total Opened</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{activeCampaign.replyCount || 0}</p>
                    <p className="text-xs text-slate-455 mt-1">Total Replied</p>
                  </div>
                </div>
              </div>

              {/* Tab Switcher Panel */}
              <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium">
                <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
                  <button
                    onClick={() => setDetailsTab('activity')}
                    className={`pb-3 px-4 text-xs font-bold transition-all duration-200 border-b-2 flex items-center gap-1.5 ${
                      detailsTab === 'activity'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <Mail className="h-4 w-4" /> Outreach Activity Logs
                  </button>
                  <button
                    onClick={() => setDetailsTab('followups')}
                    className={`pb-3 px-4 text-xs font-bold transition-all duration-200 border-b-2 flex items-center gap-1.5 ${
                      detailsTab === 'followups'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <Clock className="h-4 w-4" /> Follow-up Schedules
                  </button>
                </div>

                {detailsTab === 'activity' ? (
                  /* Outreach Activity / Logs */
                  emailHistoryLoading ? (
                    <p className="text-xs text-slate-400">Loading email logs...</p>
                  ) : !emailHistory || emailHistory.filter(e => e.campaignId === selectedId).length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No emails have been sent or queued yet for this campaign.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                            <th className="py-3 px-4">Lead Email</th>
                            <th className="py-3 px-4">Outreach Step</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Sending / Sent Time</th>
                            <th className="py-3 px-4">Error / Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {emailHistory.filter(e => e.campaignId === selectedId).map((emailLog) => (
                            <tr key={emailLog.id || emailLog._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                              <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-350">{emailLog.email}</td>
                              <td className="py-3 px-4 capitalize text-slate-550 dark:text-slate-400">{emailLog.followupStep}</td>
                              <td className="py-3 px-4">
                                <StatusBadge status={emailLog.status} />
                              </td>
                              <td className="py-3 px-4 text-slate-550 dark:text-slate-400">
                                {emailLog.sentAt 
                                  ? new Date(emailLog.sentAt).toLocaleString() 
                                  : new Date(emailLog.createdAt).toLocaleString()
                                }
                              </td>
                              <td className="py-3 px-4 text-red-550 dark:text-red-405 font-medium max-w-[250px] truncate" title={emailLog.error || ''}>
                                {emailLog.error || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  /* Follow-up Schedules List */
                  followupsLoading ? (
                    <p className="text-xs text-slate-400">Loading follow-ups...</p>
                  ) : !campaignFollowups || campaignFollowups.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No follow-up emails have been scheduled yet for this campaign.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                            <th className="py-3 px-4">Lead ID / Email</th>
                            <th className="py-3 px-4">Follow-up Step</th>
                            <th className="py-3 px-4">Scheduled Date & Time</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {campaignFollowups.map((followup) => (
                            <tr key={followup.id || followup._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                              <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-350">
                                {followup.email || followup.leadId}
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                                Step {followup.step} (followup{followup.step})
                              </td>
                              <td className="py-3 px-4 text-slate-550 dark:text-slate-400">
                                {new Date(followup.scheduledAt).toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <StatusBadge status={
                                  followup.status === 'pending' ? 'Paused' : // amber
                                  followup.status === 'sent' ? 'Completed' : // green
                                  'Closed' // slate/grey
                                } />
                                <span className="ml-2 capitalize text-[10px] text-slate-400">({followup.status})</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default Campaigns;
