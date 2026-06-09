import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLeads, createLead, updateLead, deleteLead, importLeadsFile } from '../../api/lead.api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Drawer from '../../components/Drawer';
import StatusBadge from '../../components/StatusBadge';
import { useForm } from 'react-hook-form';
import { Plus, Download, Trash, Tag, Edit, UserCheck, Eye, Upload, CheckCircle2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

const INDUSTRIES = [
  'Dental', 'Gym', 'Restaurant', 'Real Estate', 'Hotel',
  'Construction', 'Ecommerce', 'Retail', 'Salon', 'Clinic',
  'Education', 'Finance', 'Manufacturing', 'Logistics',
  'SaaS', 'Startup', 'IT Agency', 'Other'
];

const Leads = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  // Dialog/Drawer states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Import/Uploader states
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 1. Fetch leads query
  const { data, isLoading } = useQuery({
    queryKey: ['leads', page, search, statusFilter, industryFilter],
    queryFn: () => getLeads({
      page,
      limit: 10,
      search,
      status: statusFilter,
      industry: industryFilter
    })
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      setIsAddOpen(false);
      toast.success('Lead created successfully.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      setIsEditOpen(false);
      toast.success('Lead updated successfully.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      toast.success('Lead deleted successfully.');
    }
  });

  const importMutation = useMutation({
    mutationFn: importLeadsFile,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['leads']);
      setIsImportOpen(false);
      setUploadedFile(null);
      toast.success(`Successfully imported ${res.importedCount} leads! Skipped ${res.skippedDbDuplicates} duplicates.`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to import file.');
    }
  });

  // Forms
  const { register: registerAdd, handleSubmit: handleAddSubmit, reset: resetAdd, formState: { errors: addErrors } } = useForm();
  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: editErrors } } = useForm();

  // Dropzone setup
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const handleUploadClick = async () => {
    if (!uploadedFile) return;
    setUploading(true);
    try {
      await importMutation.mutateAsync(uploadedFile);
    } catch (e) {
      // Handled
    } finally {
      setUploading(false);
    }
  };

  const handleRowClick = (lead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  const handleEditClick = (e, lead) => {
    e.stopPropagation();
    setSelectedLead(lead);
    resetEdit(lead);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this lead?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = (ids) => {
    if (window.confirm(`Are you sure you want to delete these ${ids.length} leads?`)) {
      ids.forEach(id => deleteMutation.mutate(id));
    }
  };

  // Columns definition for Custom Table
  const columns = [
    { header: 'Name', accessor: 'name', render: (val, row) => <span className="font-bold text-slate-800 dark:text-slate-100">{val}</span> },
    { header: 'Email', accessor: 'email' },
    { header: 'Company', accessor: 'company' },
    { header: 'Industry', accessor: 'industry' },
    { header: 'City', accessor: 'city' },
    { header: 'Status', accessor: 'status', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleEditClick(e, row)}
            className="p-1 text-slate-400 hover:text-primary-600"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeleteClick(e, row.id)}
            className="p-1 text-slate-400 hover:text-red-600"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Leads Management
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
            Manage, import, and classify B2B contacts
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={Upload}
            onClick={() => setIsImportOpen(true)}
          >
            Import Leads
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              resetAdd({});
              setIsAddOpen(true);
            }}
          >
            Add Single Lead
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search leads by name, email, company, city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-48">
          <Input
            type="select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'New', label: 'New' },
              { value: 'Contacted', label: 'Contacted' },
              { value: 'Opened', label: 'Opened' },
              { value: 'Clicked', label: 'Clicked' },
              { value: 'Replied', label: 'Replied' },
              { value: 'Interested', label: 'Interested' },
              { value: 'Closed', label: 'Closed' },
              { value: 'Unsubscribed', label: 'Unsubscribed' }
            ]}
          />
        </div>
        <div className="w-48">
          <Input
            type="select"
            value={industryFilter}
            onChange={(e) => {
              setIndustryFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Industries' },
              ...INDUSTRIES.map(ind => ({ value: ind, label: ind }))
            ]}
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium">
        <Table
          columns={columns}
          data={data?.leads || []}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          bulkActions={[
            { label: 'Delete Selected', onClick: handleBulkDelete, variant: 'danger' }
          ]}
          pagination={{
            total: data?.pagination?.total || 0,
            page: data?.pagination?.page || 1,
            limit: data?.pagination?.limit || 10,
            totalPages: data?.pagination?.totalPages || 1,
            onPageChange: (newPage) => setPage(newPage)
          }}
        />
      </div>

      {/* Add Lead Dialog */}
      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Lead">
        <form onSubmit={handleAddSubmit(data => createMutation.mutate(data))} className="space-y-4 font-sans">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" placeholder="John Doe" error={addErrors.name} {...registerAdd('name', { required: 'Name is required' })} />
            <Input label="Email" type="email" placeholder="john@domain.com" error={addErrors.email} {...registerAdd('email', { required: 'Email is required' })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" placeholder="+12345678" {...registerAdd('phone')} />
            <Input label="Company" placeholder="Acme Corp" {...registerAdd('company')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Industry" type="select" options={INDUSTRIES.map(i => ({ value: i, label: i }))} {...registerAdd('industry')} />
            <Input label="City" placeholder="Boston" {...registerAdd('city')} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Save Lead</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Lead Dialog */}
      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Lead">
        <form onSubmit={handleEditSubmit(data => updateMutation.mutate({ id: selectedLead?.id, data }))} className="space-y-4 font-sans">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" placeholder="John Doe" error={editErrors.name} {...registerEdit('name', { required: 'Name is required' })} />
            <Input label="Email" type="email" placeholder="john@domain.com" error={editErrors.email} {...registerEdit('email', { required: 'Email is required' })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" placeholder="+12345678" {...registerEdit('phone')} />
            <Input label="Company" placeholder="Acme Corp" {...registerEdit('company')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Industry" type="select" options={INDUSTRIES.map(i => ({ value: i, label: i }))} {...registerEdit('industry')} />
            <Input label="City" placeholder="Boston" {...registerEdit('city')} />
          </div>
          <Input label="Status" type="select" options={[
            { value: 'New', label: 'New' },
            { value: 'Contacted', label: 'Contacted' },
            { value: 'Opened', label: 'Opened' },
            { value: 'Clicked', label: 'Clicked' },
            { value: 'Replied', label: 'Replied' },
            { value: 'Interested', label: 'Interested' },
            { value: 'Closed', label: 'Closed' },
            { value: 'Unsubscribed', label: 'Unsubscribed' }
          ]} {...registerEdit('status')} />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="submit" loading={updateMutation.isPending}>Update Lead</Button>
          </div>
        </form>
      </Modal>

      {/* Lead Details Slide-out Drawer */}
      <Drawer
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedLead ? `Lead Details: ${selectedLead.name}` : ''}
      >
        {selectedLead && (
          <div className="space-y-6 font-sans">
            {/* Status overview */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-premium border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Outreach Status:</span>
              <StatusBadge status={selectedLead.status} />
            </div>

            {/* Profile Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Info</h4>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <span className="text-slate-400">Email:</span>
                <span className="font-semibold text-right truncate">{selectedLead.email}</span>
                <span className="text-slate-400">Phone:</span>
                <span className="font-semibold text-right">{selectedLead.phone || '-'}</span>
                <span className="text-slate-400">Company:</span>
                <span className="font-semibold text-right">{selectedLead.company || '-'}</span>
                <span className="text-slate-400">Industry:</span>
                <span className="font-semibold text-right">{selectedLead.industry || '-'}</span>
                <span className="text-slate-400">City:</span>
                <span className="font-semibold text-right">{selectedLead.city || '-'}</span>
              </div>
            </div>

            {/* Timelines */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outreach Timeline</h4>
              <div className="border-l-2 border-slate-200 dark:border-slate-800 pl-4 ml-2 space-y-4 text-xs">
                <div className="relative">
                  <div className="absolute -left-[23px] top-0.5 h-2.5 w-2.5 rounded-full bg-primary-600 border border-white"></div>
                  <p className="font-semibold text-slate-700 dark:text-slate-350">Lead Imported</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(selectedLead.createdAt).toLocaleString()}</p>
                </div>
                {selectedLead.status !== 'New' && (
                  <div className="relative">
                    <div className="absolute -left-[23px] top-0.5 h-2.5 w-2.5 rounded-full bg-indigo-500 border border-white"></div>
                    <p className="font-semibold text-slate-700 dark:text-slate-350">First Outreach Email Sent</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Status changed to Contacted</p>
                  </div>
                )}
                {['Opened', 'Clicked', 'Replied', 'Interested'].includes(selectedLead.status) && (
                  <div className="relative">
                    <div className="absolute -left-[23px] top-0.5 h-2.5 w-2.5 rounded-full bg-yellow-500 border border-white"></div>
                    <p className="font-semibold text-slate-700 dark:text-slate-350">Recipient Opened Email</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tracking Pixel requested</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Import CSV/Excel Modal */}
      <Modal open={isImportOpen} onClose={() => setIsImportOpen(false)} title="Bulk Import Contacts">
        <div className="space-y-6 font-sans">
          
          {/* Sample Template File Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-premium border border-slate-200/60 dark:border-slate-850 gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Sample Template File
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                Download a demo format to ensure your columns match correctly.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/leads_demo.csv"
                download="leads_demo.csv"
                className="inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none rounded-lg active:scale-95 text-xs px-3 py-1.5 gap-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900"
              >
                <Download className="h-3.5 w-3.5" />
                CSV Format
              </a>
              <a
                href="/leads_demo.xlsx"
                download="leads_demo.xlsx"
                className="inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none rounded-lg active:scale-95 text-xs px-3 py-1.5 gap-1.5 bg-primary-600 hover:bg-primary-700 text-white shadow-premium hover:shadow-lg"
              >
                <Download className="h-3.5 w-3.5" />
                Excel Format
              </a>
            </div>
          </div>

          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-premium p-8 text-center cursor-pointer transition-all duration-150 ${
              isDragActive 
                ? 'border-primary-500 bg-primary-50/20' 
                : 'border-slate-300 dark:border-slate-700 hover:border-primary-500 hover:bg-slate-50/20'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-8 w-8 text-slate-400 mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Drag & drop Excel or CSV file here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports .csv, .xlsx, .xls formats (required: Email column)
            </p>
          </div>

          {uploadedFile && (
            <div className="p-3 bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/50 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-600 dark:text-primary-400 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{uploadedFile.name}</p>
                  <p className="text-slate-400 mt-0.5">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setUploadedFile(null)}
              >
                Clear
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>Cancel</Button>
            <Button 
              disabled={!uploadedFile} 
              loading={uploading}
              onClick={handleUploadClick}
            >
              Parse and Import
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Leads;
