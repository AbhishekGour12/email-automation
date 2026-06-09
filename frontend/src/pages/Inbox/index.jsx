import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReplies, tagReply } from '../../api/reply.api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Drawer from '../../components/Drawer';
import { Mail, Search, Sparkles, AlertCircle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const TAG_COLORS = {
  'Interested': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400',
  'Meeting Requested': 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400',
  'Not Interested': 'bg-red-50 text-red-700 border-red-250 dark:bg-red-950/20 dark:text-red-405',
  'Need Followup': 'bg-yellow-50 text-yellow-700 border-yellow-250 dark:bg-yellow-950/20 dark:text-yellow-400',
  'Closed': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
};

const Inbox = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  
  // Drawer states
  const [selectedReply, setSelectedReply] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 1. Fetch replies
  const { data: replies, isLoading } = useQuery({
    queryKey: ['replies'],
    queryFn: getReplies
  });

  // Mutation to tag/classify replies
  const tagMutation = useMutation({
    mutationFn: ({ id, tag }) => tagReply(id, tag),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['replies']);
      queryClient.invalidateQueries(['leads']);
      // Update drawer view with new data
      if (selectedReply && selectedReply.id === res.replyId) {
        setSelectedReply(prev => ({ ...prev, tag: res.tag }));
      }
      toast.success(`Reply tagged as ${res.tag} successfully.`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update tag.');
    }
  });

  // Filter in-memory
  const filteredReplies = replies?.filter(r => {
    const matchSearch = r.email?.toLowerCase().includes(search.toLowerCase()) || 
                        r.subject?.toLowerCase().includes(search.toLowerCase()) ||
                        r.body?.toLowerCase().includes(search.toLowerCase());
    
    const matchTag = selectedTag === '' || r.tag === selectedTag;

    return matchSearch && matchTag;
  }) || [];

  const handleRowClick = (reply) => {
    setSelectedReply(reply);
    setIsDrawerOpen(true);
  };

  const handleTagChange = (replyId, newTag) => {
    tagMutation.mutate({ id: replyId, tag: newTag });
  };

  const columns = [
    { header: 'Sender Email', accessor: 'email', render: (val) => <span className="font-bold text-slate-800 dark:text-slate-200">{val}</span> },
    { header: 'Subject', accessor: 'subject' },
    { header: 'Received At', accessor: 'receivedAt', render: (val) => new Date(val).toLocaleString() },
    {
      header: 'Sentiment Tag',
      accessor: 'tag',
      render: (val, row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${TAG_COLORS[val] || 'bg-slate-50 text-slate-650'}`}>
          {val}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Replies Inbox
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-550 font-semibold mt-1">
          Review, classify, and tag incoming lead outreach replies
        </p>
      </div>

      {/* Toolbar filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-grow max-w-md">
          <Input
            placeholder="Search email text, subjects, or addresses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="w-48">
          <Input
            type="select"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            options={[
              { value: '', label: 'All Sentiment Tags' },
              { value: 'Need Followup', label: 'Need Followup' },
              { value: 'Interested', label: 'Interested' },
              { value: 'Meeting Requested', label: 'Meeting Requested' },
              { value: 'Not Interested', label: 'Not Interested' },
              { value: 'Closed', label: 'Closed' }
            ]}
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium">
        <Table
          columns={columns}
          data={filteredReplies}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          selectable={false}
          emptyMessage="No outreach replies found matching filters."
        />
      </div>

      {/* Reply Details Drawer */}
      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Reply details"
      >
        {selectedReply && (
          <div className="space-y-6 font-sans">
            
            {/* Headers */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-premium border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
              <p className="text-slate-400">From: <span className="font-bold text-slate-700 dark:text-slate-250">{selectedReply.email}</span></p>
              <p className="text-slate-400">Subject: <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedReply.subject}</span></p>
              <p className="text-slate-400">Received: <span className="font-semibold text-slate-750 dark:text-slate-300">{new Date(selectedReply.receivedAt).toLocaleString()}</span></p>
            </div>

            {/* Classification */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary-600" /> Sentiment Classification
              </p>
              
              {/* Tag updates */}
              <div className="flex flex-wrap gap-2">
                {['Need Followup', 'Interested', 'Meeting Requested', 'Not Interested', 'Closed'].map(t => (
                  <button
                    key={t}
                    onClick={() => handleTagChange(selectedReply.id, t)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                      selectedReply.tag === t
                        ? 'bg-primary-600 border-primary-600 text-white shadow-premium'
                        : 'border-slate-200 dark:border-slate-750 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">Changing this tag will automatically update the lead status in your active campaign.</p>
            </div>

            {/* Email Message Content */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-primary-600" /> Reply message body
              </p>
              <div className="p-4 bg-slate-50 dark:bg-slate-850/40 rounded-premium border border-slate-100 dark:border-slate-800 text-xs leading-relaxed whitespace-pre-wrap min-h-[150px]">
                {selectedReply.body || 'No text content available in reply.'}
              </div>
            </div>

          </div>
        )}
      </Drawer>

    </div>
  );
};

export default Inbox;
