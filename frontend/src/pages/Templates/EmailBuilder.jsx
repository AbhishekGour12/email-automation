import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTemplate, createTemplate, updateTemplate } from '../../api/template.api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import {
  ArrowLeft,
  Sparkles,
  Smartphone,
  Monitor,
  Link as LinkIcon,
  PenTool,
  FileText,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const PLACEHOLDERS = [
  '{{name}}', '{{company}}', '{{industry}}', '{{city}}', '{{phone}}'
];

const CATEGORIES = [
  'Indian Business', 'International Business', 'LinkedIn', 'IT Agency',
  'Project Outreach', 'AI Automation', 'Dental', 'Gym', 'Restaurant',
  'Real Estate', 'Hotel', 'Construction', 'Ecommerce'
];

const EmailBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const [activeTab, setActiveTab] = useState('initial'); // initial, followup1, followup2, followup3
  const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop | mobile

  // Template Form States
  const [templateName, setTemplateName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Project Outreach');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [followup1, setFollowup1] = useState('');
  const [followup2, setFollowup2] = useState('');
  const [followup3, setFollowup3] = useState('');

  // Auxiliary Builder States
  const [ctaText, setCtaText] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [sigName, setSigName] = useState('');
  const [sigTitle, setSigTitle] = useState('');
  const [sigPhone, setSigPhone] = useState('');

  const quillRef = useRef(null);
  const subjectInputRef = useRef(null);

  // Fetch existing if editing
  const { data: template, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: () => getTemplate(id),
    enabled: !isNew
  });

  // Populate form fields
  useEffect(() => {
    if (template && !isNew) {
      setTemplateName(template.name);
      setSelectedCategory(template.category);
      setSubject(template.subject);
      setBody(template.body);
      setFollowup1(template.followup1 || '');
      setFollowup2(template.followup2 || '');
      setFollowup3(template.followup3 || '');
    }
  }, [template, isNew]);

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (isNew) return createTemplate(payload);
      return updateTemplate(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      toast.success('Template saved successfully!');
      navigate('/templates');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save template.');
    }
  });

  const handleSave = () => {
    if (!templateName.trim()) return toast.error('Template name is required.');
    if (!subject.trim()) return toast.error('Subject line is required.');
    if (!body.trim()) return toast.error('Initial email body is required.');

    const payload = {
      name: templateName,
      category: selectedCategory,
      subject,
      body,
      followup1,
      followup2,
      followup3
    };

    saveMutation.mutate(payload);
  };

  // Get/Set current active editor text
  const getActiveText = () => {
    if (activeTab === 'initial') return body;
    if (activeTab === 'followup1') return followup1;
    if (activeTab === 'followup2') return followup2;
    if (activeTab === 'followup3') return followup3;
    return '';
  };

  const setActiveText = (val) => {
    if (activeTab === 'initial') setBody(val);
    if (activeTab === 'followup1') setFollowup1(val);
    if (activeTab === 'followup2') setFollowup2(val);
    if (activeTab === 'followup3') setFollowup3(val);
  };

  // Insert placeholder at caret position
  const handlePlaceholderInsert = (placeholder) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection(true);
      quill.insertText(range.index, placeholder);
      quill.setSelection(range.index + placeholder.length);
    } else {
      // Fallback: append
      setActiveText(getActiveText() + ` ${placeholder}`);
    }
  };

  // Insert CTA Button
  const handleInsertCta = () => {
    if (!ctaText.trim() || !ctaLink.trim()) return toast.error('Enter button text and link.');
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection(true);
      const ctaHtml = `<div style="text-align: center; margin: 20px 0;"><a href="${ctaLink}" target="_blank" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-family: sans-serif; font-size: 14px;">${ctaText}</a></div>`;
      quill.clipboard.dangerouslyPasteHTML(range.index, ctaHtml);
      setCtaText('');
      setCtaLink('');
      toast.success('CTA button inserted.');
    }
  };

  // Insert Signature
  const handleInsertSignature = () => {
    if (!sigName.trim()) return toast.error('Signature name is required.');
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection(true);
      const sigHtml = `<p><br/></p><p style="margin: 0; font-weight: bold; color: #1e293b;">Best regards,</p><p style="margin: 0; font-weight: bold; color: #16a34a;">${sigName}</p>${
        sigTitle ? `<p style="margin: 0; color: #64748b; font-size: 13px;">${sigTitle}</p>` : ''
      }${sigPhone ? `<p style="margin: 0; color: #64748b; font-size: 13px;">Phone: ${sigPhone}</p>` : ''}`;
      quill.clipboard.dangerouslyPasteHTML(range.index, sigHtml);
      setSigName('');
      setSigTitle('');
      setSigPhone('');
      toast.success('Signature inserted.');
    }
  };

  // Mock renderer for preview
  const getRenderedPreview = () => {
    const rawContent = getActiveText();
    const mockLead = {
      name: 'Abhishek Gupta',
      company: 'Abhi Services',
      industry: 'IT Agency',
      city: 'Delhi',
      phone: '+91 99999 88888'
    };

    let subjectLine = activeTab === 'initial' ? subject : `Followup: ${templateName}`;
    
    // Simple placeholder replacement
    const replaceMock = (text) => {
      if (!text) return '';
      return text.replace(/\{\{(\w+)\}\}/g, (match, field) => {
        return mockLead[field.toLowerCase()] || `[${field}]`;
      });
    };

    return {
      subject: replaceMock(subjectLine),
      body: replaceMock(rawContent)
    };
  };

  const preview = getRenderedPreview();

  if (isLoading && !isNew) {
    return <div className="text-slate-400 font-sans">Loading template builder...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="p-2"
            onClick={() => navigate('/templates')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-850 dark:text-slate-50">
              {isNew ? 'New Outreach Template' : `Edit Template: ${template?.name}`}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Design email content sequences and inject placeholders.</p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={Save}
          loading={saveMutation.isPending}
          onClick={handleSave}
        >
          Save Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: EDITOR BUILDER */}
        <div className="lg:col-span-7 space-y-5">
          {/* Metadata */}
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-premium p-5 space-y-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Template Name"
                placeholder="e.g. Dental Outreach sequence"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
              <Input
                type="select"
                label="Template Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={CATEGORIES.map(cat => ({ value: cat, label: cat }))}
              />
            </div>
            
            {activeTab === 'initial' && (
              <Input
                label="Subject Line"
                placeholder="e.g. Quick suggestion for {{company}}"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            )}
          </div>

          {/* Drip sequence step select tab */}
          <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {[
              { id: 'initial', label: '1. Initial Email' },
              { id: 'followup1', label: '2. Day 3 Followup' },
              { id: 'followup2', label: '3. Day 7 Followup' },
              { id: 'followup3', label: '4. Day 14 Final' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-premium'
                    : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Draggable Placeholder Chips */}
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-premium p-4 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary-600" /> Click to Insert Lead Placeholders
            </p>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDERS.map(p => (
                <button
                  key={p}
                  onClick={() => handlePlaceholderInsert(p)}
                  className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-200 rounded-lg hover:border-primary-500 hover:text-primary-600 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-premium p-5 shadow-sm space-y-4">
            <p className="text-xs font-bold text-slate-500">Edit Drip Body content</p>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={getActiveText()}
              onChange={setActiveText}
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['clean']
                ]
              }}
              placeholder="Write your email body copy..."
            />
          </div>

          {/* CTA & Signature builders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* CTA button generator */}
            <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-premium p-5 shadow-sm space-y-3">
              <p className="text-xs font-bold text-slate-550 flex items-center gap-1.5">
                <LinkIcon className="h-4 w-4 text-primary-600" /> CTA Button Builder
              </p>
              <Input
                label="Button Text"
                placeholder="e.g. Schedule Call"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
              />
              <Input
                label="Button Link"
                placeholder="e.g. https://calendly.com/abhi"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleInsertCta}
              >
                Insert Button
              </Button>
            </div>

            {/* Signature builder */}
            <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-premium p-5 shadow-sm space-y-3">
              <p className="text-xs font-bold text-slate-550 flex items-center gap-1.5">
                <PenTool className="h-4 w-4 text-primary-600" /> Signature Builder
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Name"
                  placeholder="Abhi"
                  value={sigName}
                  onChange={(e) => setSigName(e.target.value)}
                />
                <Input
                  label="Title"
                  placeholder="Founder"
                  value={sigTitle}
                  onChange={(e) => setSigTitle(e.target.value)}
                />
              </div>
              <Input
                label="Phone number"
                placeholder="+91..."
                value={sigPhone}
                onChange={(e) => setSigPhone(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleInsertSignature}
              >
                Insert Signature
              </Button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PREVIEW */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-premium p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-150">
                Live Personalization Preview
              </span>
              
              {/* Preview device toggler */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-md ${
                    previewDevice === 'desktop' ? 'bg-white dark:bg-slate-900 text-primary-600' : 'text-slate-400'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-md ${
                    previewDevice === 'mobile' ? 'bg-white dark:bg-slate-900 text-primary-600' : 'text-slate-400'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Desktop Chassis View */}
            {previewDevice === 'desktop' && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans shadow-sm">
                {/* Header bar */}
                <div className="bg-slate-150 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-slate-400 font-semibold ml-4">abhishek@abhi.services</span>
                </div>
                {/* Email headers */}
                <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                  <p className="text-slate-400">To: <span className="font-semibold text-slate-700 dark:text-slate-200">Abhishek Gupta &lt;abhishek@abhi.services&gt;</span></p>
                  <p className="text-slate-400">Subject: <span className="font-bold text-slate-800 dark:text-slate-100">{preview.subject || '(No Subject)'}</span></p>
                </div>
                {/* Email body preview */}
                <div 
                  className="p-6 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 leading-relaxed min-h-[250px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: preview.body || '<p className="text-slate-350">Write template text to see live preview...</p>' }}
                />
              </div>
            )}

            {/* Mobile Chassis View */}
            {previewDevice === 'mobile' && (
              <div className="max-w-[280px] mx-auto border-8 border-slate-800 dark:border-slate-750 rounded-[32px] overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans shadow-lg relative">
                {/* Camera Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-4 w-28 bg-slate-800 rounded-b-xl z-55" />
                
                {/* Email headers */}
                <div className="pt-6 px-4 pb-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850 text-[10px] space-y-1">
                  <p className="text-slate-400">To: <span className="font-semibold text-slate-700 dark:text-slate-200">Abhishek Gupta</span></p>
                  <p className="text-slate-800 dark:text-slate-100 font-bold truncate">{preview.subject || '(No Subject)'}</p>
                </div>
                {/* Email body preview */}
                <div 
                  className="p-4 bg-white dark:bg-slate-900 text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed min-h-[300px] max-h-[350px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: preview.body || '<p className="text-slate-350">Write template text to see live preview...</p>' }}
                />
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default EmailBuilder;
