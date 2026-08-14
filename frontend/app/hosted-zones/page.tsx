'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Toast, { ToastType } from '../../components/ui/Toast';
import { getHostedZones, createHostedZone, deleteHostedZone, updateHostedZone } from '../../lib/api/hostedZones';
import { HostedZone, PaginationResponse } from '../../types';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Globe, 
  Lock, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

function HostedZonesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // API State
  const [data, setData] = useState<PaginationResponse<HostedZone> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/Search parameters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'public' | 'private'>('public');
  const [selectedZone, setSelectedZone] = useState<HostedZone | null>(null);
  const [editDesc, setEditDesc] = useState('');

  // Form errors
  const [formError, setFormError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Notification state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Load data from API
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHostedZones({
        page,
        page_size: 10,
        search: debouncedSearch || undefined,
        type: typeFilter || undefined
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load hosted zones.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open create modal if URL contains ?create=true
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) {
      setFormError("Domain name is required.");
      return;
    }

    setSubmitLoading(true);
    setFormError(null);
    try {
      await createHostedZone({
        name: newName,
        description: newDesc,
        type: newType,
        private_zone: newType === 'private'
      });
      setToast({ message: "Hosted zone created successfully.", type: "success" });
      setIsCreateOpen(false);
      // Reset form
      setNewName('');
      setNewDesc('');
      setNewType('public');
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to create hosted zone.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;

    setSubmitLoading(true);
    setFormError(null);
    try {
      await updateHostedZone(selectedZone.zone_id, {
        description: editDesc
      });
      setToast({ message: "Hosted zone updated successfully.", type: "success" });
      setIsEditOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to update hosted zone.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (!selectedZone) return;

    setSubmitLoading(true);
    try {
      await deleteHostedZone(selectedZone.zone_id);
      setToast({ message: "Hosted zone deleted successfully.", type: "success" });
      setIsDeleteOpen(false);
      // If it was the last item on the page, go to previous page
      if (data && data.items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadData();
      }
    } catch (err: any) {
      setToast({ message: err.message || "Failed to delete hosted zone.", type: "error" });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <AppLayout>
      <Breadcrumbs items={[{ name: 'Hosted zones' }]} />
      
      {/* Header section */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hosted zones</h1>
          <p className="text-xs text-aws-graytext">
            A hosted zone is a container for records, which define how you want to route traffic for a domain and its subdomains.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create hosted zone
        </Button>
      </div>

      {/* Control Panel (Search, Filter, Refresh) */}
      <div className="bg-white border border-gray-200 p-4 rounded-t-sm flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4 select-none">
        <div className="flex flex-1 max-w-md items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search hosted zones by name, ID, or description..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:border-aws-blue focus:ring-1 focus:ring-aws-blue"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2" />
          </div>
          <Button onClick={() => { setSearch(''); setTypeFilter(''); }} variant="secondary">
            Clear
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-40">
            <Select
              options={[
                { label: 'All types', value: '' },
                { label: 'Public', value: 'public' },
                { label: 'Private', value: 'private' }
              ]}
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            />
          </div>
          <Button onClick={loadData} title="Refresh Table">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Hosted Zones Table */}
      <div className="bg-white border border-t-0 border-gray-200 overflow-x-auto min-w-full">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-aws-orange animate-spin" />
            <span className="text-xs font-semibold text-aws-graytext uppercase tracking-wider">Loading Hosted Zones...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-800 bg-red-50 font-semibold border-b border-gray-200">
            {error}
            <div className="mt-2">
              <Button onClick={loadData} size="xs">Try again</Button>
            </div>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center select-none border-b border-gray-200">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-700">No hosted zones</h3>
            <p className="text-xs text-aws-graytext mt-1 mb-4">You don't have any hosted zones yet. Create a zone to manage DNS records.</p>
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              Create hosted zone
            </Button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 select-none">
              <tr>
                <th className="px-4 py-2.5 text-left font-bold text-gray-700">Hosted zone name</th>
                <th className="px-4 py-2.5 text-left font-bold text-gray-700">Hosted zone ID</th>
                <th className="px-4 py-2.5 text-left font-bold text-gray-700">Type</th>
                <th className="px-4 py-2.5 text-left font-bold text-gray-700">Record count</th>
                <th className="px-4 py-2.5 text-left font-bold text-gray-700">Description</th>
                <th className="px-4 py-2.5 text-right font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-150">
              {data.items.map((zone) => (
                <tr key={zone.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/hosted-zones/${zone.zone_id}`)}
                      className="text-aws-blue hover:text-aws-hoverblue hover:underline font-bold text-left flex items-center space-x-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{zone.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-600 select-all">{zone.zone_id}</td>
                  <td className="px-4 py-3 whitespace-nowrap select-none">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      zone.type === 'public' 
                        ? 'bg-blue-50 text-blue-800 border-blue-200' 
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}>
                      {zone.type === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{zone.type === 'public' ? 'Public' : 'Private'}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">{zone.record_count}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-aws-graytext" title={zone.description || ''}>
                    {zone.description || <span className="text-gray-300 italic">No description</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right space-x-2 select-none">
                    <Button 
                      size="xs"
                      onClick={() => {
                        setSelectedZone(zone);
                        setEditDesc(zone.description || '');
                        setIsEditOpen(true);
                      }}
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="xs" 
                      variant="secondary"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => {
                        setSelectedZone(zone);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && !error && data && data.total_pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border border-t-0 border-gray-200 rounded-b-sm select-none">
          <div className="text-xs text-aws-graytext">
            Showing <strong className="font-semibold text-gray-900">{data.items.length}</strong> of{' '}
            <strong className="font-semibold text-gray-900">{data.total}</strong> zones
          </div>
          <div className="flex items-center space-x-1.5">
            <Button
              size="xs"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: data.total_pages }).map((_, idx) => {
                const p = idx + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-2 py-1 text-xs rounded-sm font-bold border ${
                      page === p 
                        ? 'bg-aws-orange text-white border-aws-orange' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <Button
              size="xs"
              disabled={page === data.total_pages}
              onClick={() => setPage(page + 1)}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setFormError(null); }}
        title="Create hosted zone"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateSubmit} loading={submitLoading}>Create zone</Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-xs font-semibold text-red-800">
              {formError}
            </div>
          )}
          <Input
            label="Domain name"
            placeholder="example.com"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            helperText="Enter the domain name (e.g., example.com) for which you want to route traffic."
            required
          />
          <Input
            label="Description"
            placeholder="My main corporate domain"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            helperText="Optional: Enter a brief description for the hosted zone."
          />
          <Select
            label="Type"
            options={[
              { label: 'Public hosted zone', value: 'public' },
              { label: 'Private hosted zone', value: 'private' }
            ]}
            value={newType}
            onChange={(e: any) => setNewType(e.target.value)}
            helperText="Choose Public to route internet traffic, or Private to route traffic inside your Amazon VPCs."
          />
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setFormError(null); }}
        title="Edit hosted zone description"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSubmit} loading={submitLoading}>Save changes</Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-xs font-semibold text-red-800">
              {formError}
            </div>
          )}
          <div className="text-xs text-aws-graytext font-medium mb-2">
            Domain: <strong className="text-gray-900">{selectedZone?.name}</strong> (ID: {selectedZone?.zone_id})
          </div>
          <Input
            label="Description"
            placeholder="My main corporate domain"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            helperText="Provide a brief description of what this hosted zone is used for."
          />
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete hosted zone?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteSubmit} loading={submitLoading}>Delete hosted zone</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start space-x-2.5 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold uppercase tracking-wider mb-0.5">Warning: Deletion is permanent</h4>
              <p>Deleting this hosted zone will delete all DNS records associated with it. This action cannot be undone.</p>
            </div>
          </div>
          <p className="text-xs text-gray-700">
            Are you sure you want to delete the hosted zone for <strong className="text-gray-900">{selectedZone?.name}</strong> ({selectedZone?.zone_id})?
          </p>
        </div>
      </Modal>

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AppLayout>
  );
}

export default function HostedZonesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
        <RefreshCw className="w-8 h-8 text-aws-orange animate-spin mb-3" />
        <span className="text-xs font-semibold uppercase tracking-wider">Loading...</span>
      </div>
    }>
      <HostedZonesContent />
    </Suspense>
  );
}
