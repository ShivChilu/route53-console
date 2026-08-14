'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../../components/layout/AppLayout';
import Breadcrumbs from '../../../components/layout/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import Toast, { ToastType } from '../../../components/ui/Toast';
import { getHostedZone } from '../../../lib/api/hostedZones';
import { getRecords, createRecord, updateRecord, deleteRecord } from '../../../lib/api/records';
import { HostedZone, DNSRecord, PaginationResponse } from '../../../types';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Globe, 
  Lock, 
  Info,
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  Server,
  Eye,
  EyeOff
} from 'lucide-react';

const RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"];
const ROUTING_POLICIES = [
  { label: 'Simple routing', value: 'Simple' },
  { label: 'Weighted', value: 'Weighted' },
  { label: 'Geolocation', value: 'Geolocation' },
  { label: 'Latency', value: 'Latency' },
  { label: 'Failover', value: 'Failover' }
];

export default function HostedZoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const zoneId = params.id as string;

  // Domain states
  const [zone, setZone] = useState<HostedZone | null>(null);
  const [zoneLoading, setZoneLoading] = useState(true);
  const [zoneError, setZoneError] = useState<string | null>(null);

  // Records states
  const [data, setData] = useState<PaginationResponse<DNSRecord> | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  // Filters & search
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'records' | 'details'>('records');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DNSRecord | null>(null);
  const [expandedRecordValue, setExpandedRecordValue] = useState<string | null>(null);

  // Form states
  const [recName, setRecName] = useState('');
  const [recType, setRecType] = useState('A');
  const [recTtl, setRecTtl] = useState(300);
  const [recValue, setRecValue] = useState('');
  const [recPolicy, setRecPolicy] = useState('Simple');
  const [recAlias, setRecAlias] = useState(false);
  
  const [editValue, setEditValue] = useState('');
  const [editTtl, setEditTtl] = useState(300);
  const [editPolicy, setEditPolicy] = useState('Simple');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Load hosted zone details
  const loadZoneDetails = useCallback(async () => {
    setZoneLoading(true);
    setZoneError(null);
    try {
      const z = await getHostedZone(zoneId);
      setZone(z);
    } catch (err: any) {
      setZoneError(err.message || "Failed to load hosted zone information.");
    } finally {
      setZoneLoading(false);
    }
  }, [zoneId]);

  // Load records
  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const res = await getRecords(zoneId, {
        page,
        page_size: 15,
        search: debouncedSearch || undefined,
        type: typeFilter || undefined
      });
      setData(res);
    } catch (err: any) {
      setRecordsError(err.message || "Failed to load records.");
    } finally {
      setRecordsLoading(false);
    }
  }, [zoneId, page, debouncedSearch, typeFilter]);

  useEffect(() => {
    loadZoneDetails();
  }, [loadZoneDetails]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Handle create submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recValue.trim()) {
      setFormError("Record value/target is required.");
      return;
    }

    setSubmitLoading(true);
    setFormError(null);
    try {
      await createRecord(zoneId, {
        name: recName,
        type: recType,
        ttl: recTtl,
        value: recValue,
        routing_policy: recPolicy,
        alias: recAlias
      });
      setToast({ message: "DNS record created successfully.", type: "success" });
      setIsCreateOpen(false);
      // Reset fields
      setRecName('');
      setRecType('A');
      setRecTtl(300);
      setRecValue('');
      setRecPolicy('Simple');
      setRecAlias(false);
      loadRecords();
      loadZoneDetails(); // refresh record count
    } catch (err: any) {
      setFormError(err.message || "Failed to create DNS record.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    if (!editValue.trim()) {
      setFormError("Record value is required.");
      return;
    }

    setSubmitLoading(true);
    setFormError(null);
    try {
      await updateRecord(zoneId, selectedRecord.id, {
        value: editValue,
        ttl: editTtl,
        routing_policy: editPolicy
      });
      setToast({ message: "DNS record updated successfully.", type: "success" });
      setIsEditOpen(false);
      loadRecords();
    } catch (err: any) {
      setFormError(err.message || "Failed to update record.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle delete submit
  const handleDeleteSubmit = async () => {
    if (!selectedRecord) return;

    setSubmitLoading(true);
    try {
      await deleteRecord(zoneId, selectedRecord.id);
      setToast({ message: "DNS record deleted successfully.", type: "success" });
      setIsDeleteOpen(false);
      loadRecords();
      loadZoneDetails(); // refresh record count
    } catch (err: any) {
      setToast({ message: err.message || "Failed to delete DNS record.", type: "error" });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Dynamically change placeholders/helper text depending on record type
  const getValueHelperText = (type: string) => {
    switch (type) {
      case 'A':
        return 'Enter IPv4 addresses (one per line) e.g., 192.0.2.4';
      case 'AAAA':
        return 'Enter IPv6 addresses (one per line) e.g., 2001:db8::8a2e:370:7334';
      case 'CNAME':
        return 'Enter a fully qualified domain target (one per line) e.g., web.example.com.';
      case 'MX':
        return 'Enter priority and mail server targets (one per line) e.g., 10 mail.example.com';
      case 'TXT':
        return 'Enter values inside double quotes e.g., "v=spf1 include:_spf.google.com ~all"';
      case 'SRV':
        return 'Format: priority weight port target e.g., 10 5 5060 sip.example.com';
      case 'CAA':
        return 'Format: flags tag value e.g., 0 issue "letsencrypt.org"';
      case 'NS':
        return 'Enter nameservers (one per line) e.g., ns-1.awsdns.com.';
      case 'PTR':
        return 'Enter the pointer target hostname e.g., host.example.com.';
      case 'SOA':
        return 'Format: primaryNS adminEmail serial refresh retry expire minimum e.g., ns.example.com. host.example.com. 1 7200 900 1209600 86400';
      default:
        return 'Enter DNS values (one per line).';
    }
  };

  if (zoneLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-24 space-y-3">
          <RefreshCw className="w-8 h-8 text-aws-orange animate-spin" />
          <span className="text-xs font-semibold text-aws-graytext uppercase tracking-wider">Loading Hosted Zone Details...</span>
        </div>
      </AppLayout>
    );
  }

  if (zoneError || !zone) {
    return (
      <AppLayout>
        <div className="bg-white border border-gray-200 p-6 rounded-sm text-center max-w-lg mx-auto mt-12 select-none">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-800">Hosted zone not found</h3>
          <p className="text-xs text-aws-graytext mt-1 mb-6">{zoneError || "The hosted zone does not exist or you do not have permission to view it."}</p>
          <Button variant="primary" onClick={() => router.push('/hosted-zones')}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to hosted zones
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Breadcrumbs 
        items={[
          { name: 'Hosted zones', href: '/hosted-zones' },
          { name: zone.name }
        ]} 
      />

      {/* Domain Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-1">
          <button 
            onClick={() => router.push('/hosted-zones')}
            className="text-aws-graytext hover:text-gray-900 border border-gray-300 p-1 rounded-sm bg-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{zone.name}</h1>
          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            zone.type === 'public' 
              ? 'bg-blue-50 text-blue-800 border-blue-200' 
              : 'bg-purple-50 text-purple-800 border-purple-200'
          }`}>
            {zone.type === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            <span>{zone.type === 'public' ? 'Public' : 'Private'}</span>
          </span>
        </div>
        <p className="text-xs text-aws-graytext pl-8">
          Manage DNS records, routing policies, and configuration details for this domain.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 select-none">
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition-colors ${
            activeTab === 'records'
              ? 'border-aws-orange text-aws-orange'
              : 'border-transparent text-aws-graytext hover:text-gray-900'
          }`}
        >
          Records ({zone.record_count})
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition-colors ${
            activeTab === 'details'
              ? 'border-aws-orange text-aws-orange'
              : 'border-transparent text-aws-graytext hover:text-gray-900'
          }`}
        >
          Hosted zone details
        </button>
      </div>

      {activeTab === 'details' ? (
        /* DETAILS TAB */
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 max-w-2xl select-none">
          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-150 pb-2">
            Zone Details
          </h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="block text-aws-graytext font-bold uppercase tracking-wider text-[10px] mb-1">Hosted Zone Name</span>
              <span className="text-gray-900 font-semibold">{zone.name}</span>
            </div>
            <div>
              <span className="block text-aws-graytext font-bold uppercase tracking-wider text-[10px] mb-1">Hosted Zone ID</span>
              <span className="text-gray-600 font-mono select-all bg-gray-50 px-2 py-0.5 rounded border border-gray-150">{zone.zone_id}</span>
            </div>
            <div>
              <span className="block text-aws-graytext font-bold uppercase tracking-wider text-[10px] mb-1">Type</span>
              <span className="text-gray-900 font-semibold capitalize">{zone.type} zone</span>
            </div>
            <div>
              <span className="block text-aws-graytext font-bold uppercase tracking-wider text-[10px] mb-1">Created Date</span>
              <span className="text-gray-900 font-medium">{new Date(zone.created_at).toLocaleString()}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-aws-graytext font-bold uppercase tracking-wider text-[10px] mb-1">Description</span>
              <span className="text-gray-900 font-medium">{zone.description || <span className="text-gray-300 italic">No description</span>}</span>
            </div>
          </div>
        </div>
      ) : (
        /* RECORDS TAB */
        <div className="space-y-4">
          {/* Actions & Filters */}
          <div className="bg-white border border-gray-200 p-4 rounded-t-sm flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 lg:space-x-4 select-none">
            <div className="flex flex-1 max-w-lg items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search records by name or target value..."
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
                    ...RECORD_TYPES.map(t => ({ label: t, value: t }))
                  ]}
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                />
              </div>
              <Button onClick={loadRecords} title="Refresh Table">
                <RefreshCw className={`w-3.5 h-3.5 ${recordsLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Create record
              </Button>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white border border-t-0 border-gray-200 overflow-x-auto min-w-full">
            {recordsLoading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-aws-orange animate-spin" />
                <span className="text-xs font-semibold text-aws-graytext uppercase tracking-wider">Loading DNS Records...</span>
              </div>
            ) : recordsError ? (
              <div className="p-8 text-center text-xs text-red-800 bg-red-50 font-semibold border-b border-gray-200">
                {recordsError}
                <div className="mt-2">
                  <Button onClick={loadRecords} size="xs">Try again</Button>
                </div>
              </div>
            ) : !data || data.items.length === 0 ? (
              <div className="p-12 text-center select-none border-b border-gray-200">
                <Server className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-700">No records found</h3>
                <p className="text-xs text-aws-graytext mt-1">This hosted zone doesn't contain any records matching your search.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 select-none">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-700">Record name</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-700">Type</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-700">Value/Route traffic to</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-700">TTL (seconds)</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-700">Routing policy</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-700">Alias</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-150">
                  {data.items.map((record) => {
                    const isLongValue = record.value.length > 50;
                    const isSystemRecord = record.type in ["NS", "SOA"] && record.name.toLowerCase() === `${zone.name.toLowerCase()}.`;

                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{record.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                            {record.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-sm">
                          <div className="flex items-center space-x-1.5">
                            <span 
                              className="font-mono text-gray-600 truncate block flex-1 whitespace-pre-line"
                              title={record.value}
                            >
                              {expandedRecordValue === String(record.id) 
                                ? record.value 
                                : isLongValue 
                                  ? `${record.value.slice(0, 48)}...` 
                                  : record.value
                              }
                            </span>
                            {isLongValue && (
                              <button
                                onClick={() => {
                                  if (expandedRecordValue === String(record.id)) {
                                    setExpandedRecordValue(null);
                                  } else {
                                    setExpandedRecordValue(String(record.id));
                                  }
                                }}
                                className="text-aws-blue hover:text-aws-hoverblue"
                                title={expandedRecordValue === String(record.id) ? "Show Less" : "Expand Value"}
                              >
                                {expandedRecordValue === String(record.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">{record.ttl}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-aws-graytext font-medium">{record.routing_policy}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-aws-graytext select-none">
                          {record.alias ? (
                            <span className="text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-200">Yes</span>
                          ) : 'No'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right space-x-2 select-none">
                          <Button 
                            size="xs"
                            onClick={() => {
                              setSelectedRecord(record);
                              setEditValue(record.value);
                              setEditTtl(record.ttl);
                              setEditPolicy(record.routing_policy);
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
                              setSelectedRecord(record);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {!recordsLoading && !recordsError && data && data.total_pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border border-t-0 border-gray-200 rounded-b-sm select-none">
              <div className="text-xs text-aws-graytext">
                Showing <strong className="font-semibold text-gray-900">{data.items.length}</strong> of{' '}
                <strong className="font-semibold text-gray-900">{data.total}</strong> records
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
        </div>
      )}

      {/* CREATE RECORD MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setFormError(null); }}
        title="Create record"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateSubmit} loading={submitLoading}>Create record</Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-xs font-semibold text-red-800">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Record name"
                placeholder="www"
                value={recName}
                onChange={(e) => setRecName(e.target.value)}
                helperText={`Appended: .${zone.name}`}
              />
            </div>
            <div>
              <Select
                label="Record type"
                options={RECORD_TYPES.map(t => ({ label: `${t} - DNS Record`, value: t }))}
                value={recType}
                onChange={(e) => setRecType(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="TTL (seconds)"
                type="number"
                value={recTtl}
                onChange={(e) => setRecTtl(Number(e.target.value))}
                helperText="Time to live: How long DNS resolvers cache this record."
                required
              />
            </div>
            <div>
              <Select
                label="Routing policy"
                options={ROUTING_POLICIES}
                value={recPolicy}
                onChange={(e) => setRecPolicy(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 py-1 select-none">
            <input
              id="alias-toggle"
              type="checkbox"
              className="w-4 h-4 text-aws-blue focus:ring-aws-blue border-gray-300 rounded"
              checked={recAlias}
              onChange={(e) => setRecAlias(e.target.checked)}
            />
            <label htmlFor="alias-toggle" className="text-xs font-bold text-gray-700">
              Alias to another resource (Route 53 alias)
            </label>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Value/Route traffic to</label>
            <textarea
              rows={4}
              placeholder={getValueHelperText(recType)}
              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-sm text-xs font-mono focus:outline-none focus:border-aws-blue focus:ring-1 focus:ring-aws-blue"
              value={recValue}
              onChange={(e) => setRecValue(e.target.value)}
              required
            />
            <span className="text-[11px] text-aws-graytext font-normal mt-1 block">
              {getValueHelperText(recType)}
            </span>
          </div>
        </form>
      </Modal>

      {/* EDIT RECORD MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setFormError(null); }}
        title="Edit DNS record"
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

          <div className="text-xs text-aws-graytext border-b border-gray-150 pb-2">
            Record: <strong className="text-gray-900">{selectedRecord?.name}</strong> • Type: <strong className="text-gray-700">{selectedRecord?.type}</strong>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="TTL (seconds)"
                type="number"
                value={editTtl}
                onChange={(e) => setEditTtl(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Select
                label="Routing policy"
                options={ROUTING_POLICIES}
                value={editPolicy}
                onChange={(e) => setEditPolicy(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Value/Route traffic to</label>
            <textarea
              rows={4}
              placeholder={selectedRecord ? getValueHelperText(selectedRecord.type) : ''}
              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-sm text-xs font-mono focus:outline-none focus:border-aws-blue focus:ring-1 focus:ring-aws-blue"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              required
            />
            <span className="text-[11px] text-aws-graytext font-normal mt-1 block">
              {selectedRecord ? getValueHelperText(selectedRecord.type) : ''}
            </span>
          </div>
        </form>
      </Modal>

      {/* DELETE RECORD MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete record?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteSubmit} loading={submitLoading}>Delete record</Button>
          </>
        }
      >
        <div className="space-y-3">
          {/* If it's a default NS/SOA show restrictions warning */}
          {selectedRecord && selectedRecord.type in ["NS", "SOA"] && selectedRecord.name.toLowerCase() === `${zone.name.toLowerCase()}.` ? (
            <div className="flex items-start space-x-2.5 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold uppercase tracking-wider mb-0.5">Restricted Operation</h4>
                <p>You cannot delete system-generated NS and SOA records at the zone root level. These records are necessary for nameserver lookup delegation.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-2.5 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold uppercase tracking-wider mb-0.5">Confirm Deletion</h4>
                <p>Are you sure you want to delete this DNS record? This action will interrupt traffic routing for this record target immediately.</p>
              </div>
            </div>
          )}

          {selectedRecord && (
            <p className="text-xs text-gray-700">
              Are you sure you want to delete the <strong className="text-gray-900">{selectedRecord.type}</strong> record for <strong className="text-gray-900">{selectedRecord.name}</strong>?
            </p>
          )}
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
