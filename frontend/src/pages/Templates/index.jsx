import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTemplates, deleteTemplate, duplicateTemplate, previewTemplate } from '../../api/template.api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Plus, Copy, Trash, Edit, Eye, Sparkles, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Indian Business', 'International Business', 'LinkedIn', 'IT Agency',
  'Project Outreach', 'AI Automation', 'Dental', 'Gym', 'Restaurant',
  'Real Estate', 'Hotel', 'Construction', 'Ecommerce'
];

const Templates = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Preview states
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 1. Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      toast.success('Template deleted successfully.');
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      toast.success('Template duplicated successfully.');
    }
  });

  // Filter templates in-memory
  const filteredTemplates = templates?.filter(t => {
    if (!selectedCategory) return true;
    return t.category === selectedCategory;
  }) || [];

  const handlePreviewClick = async (id) => {
    setPreviewLoading(true);
    setIsPreviewOpen(true);
    try {
      const data = await previewTemplate(id);
      setPreviewData(data.preview);
    } catch (e) {
      toast.error('Failed to generate template preview.');
      setIsPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Outreach Templates
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
            Build and personalize your email copy templates
          </p>
        </div>
        
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/templates/builder/new')}
        >
          Create Template
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-4 shadow-sm">
        <button
          onClick={() => setSelectedCategory('')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            selectedCategory === ''
              ? 'bg-primary-600 border-primary-600 text-white shadow-premium'
              : 'border-slate-250 dark:border-slate-700 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          All Categories
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              selectedCategory === cat
                ? 'bg-primary-600 border-primary-600 text-white shadow-premium'
                : 'border-slate-250 dark:border-slate-700 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates grid list */}
      {isLoading ? (
        <p className="text-slate-400">Loading templates...</p>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-premium border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Layout className="mx-auto h-8 w-8 text-slate-350 mb-3" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 font-sans">No templates found</h4>
          <p className="text-xs text-slate-400 mt-1 mb-4">Create your first personalized email layout.</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/templates/builder/new')}>Create Template</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-primary-50 text-primary-750 dark:bg-primary-950/20 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50">
                    {template.category}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 text-slate-400 hover:text-primary-600"
                      onClick={() => handlePreviewClick(template.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 text-slate-400 hover:text-primary-600"
                      onClick={() => duplicateMutation.mutate(template.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 text-slate-400 hover:text-primary-600"
                      onClick={() => navigate(`/templates/builder/${template.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 text-slate-400 hover:text-red-650"
                      onClick={() => {
                        if (window.confirm('Delete this template?')) deleteMutation.mutate(template.id);
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 mb-2 truncate">
                  {template.name}
                </h3>
                <p className="text-xs text-slate-400 font-bold mb-3 truncate">
                  Subject: <span className="font-normal text-slate-500">{template.subject}</span>
                </p>
                <div className="text-xs text-slate-400 line-clamp-3 bg-slate-50 dark:bg-slate-850/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed min-h-[50px]">
                  {template.body.replace(/<[^>]*>/g, '')}
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between text-[10px] text-slate-400">
                <span>Follow-ups: {[template.followup1, template.followup2, template.followup3].filter(Boolean).length}</span>
                <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Modal open={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="Template Preview" maxWidth="md">
        {previewLoading ? (
          <p className="text-slate-400 text-sm">Rendering personalized mockups...</p>
        ) : !previewData ? (
          <p className="text-slate-400 text-sm">Failed to generate preview.</p>
        ) : (
          <div className="space-y-6 max-h-[500px] overflow-y-auto font-sans">
            <div>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-primary-100 text-primary-750 dark:bg-primary-950/20 dark:text-primary-400 rounded-full">
                Initial outreach email
              </span>
              <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-premium">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  Subject: <span className="font-semibold text-slate-600 dark:text-slate-200">{previewData.initial?.subject}</span>
                </p>
                <div 
                  className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-150 dark:border-slate-850 pt-3"
                  dangerouslySetInnerHTML={{ __html: previewData.initial?.body }}
                />
              </div>
            </div>

            {previewData.followup1 && (
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-full">
                  Day 3 Follow-up (Follow-up 1)
                </span>
                <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-premium">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Subject: <span className="font-semibold text-slate-600 dark:text-slate-200">{previewData.followup1?.subject}</span>
                  </p>
                  <div 
                    className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-150 dark:border-slate-850 pt-3"
                    dangerouslySetInnerHTML={{ __html: previewData.followup1?.body }}
                  />
                </div>
              </div>
            )}

            {previewData.followup2 && (
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-full">
                  Day 7 Follow-up (Follow-up 2)
                </span>
                <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-premium">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Subject: <span className="font-semibold text-slate-600 dark:text-slate-200">{previewData.followup2?.subject}</span>
                  </p>
                  <div 
                    className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-150 dark:border-slate-850 pt-3"
                    dangerouslySetInnerHTML={{ __html: previewData.followup2?.body }}
                  />
                </div>
              </div>
            )}

            {previewData.followup3 && (
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-full">
                  Day 14 Final Follow-up (Follow-up 3)
                </span>
                <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-premium">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Subject: <span className="font-semibold text-slate-600 dark:text-slate-200">{previewData.followup3?.subject}</span>
                  </p>
                  <div 
                    className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-150 dark:border-slate-850 pt-3"
                    dangerouslySetInnerHTML={{ __html: previewData.followup3?.body }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Templates;
