import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lead } from '../lib/types';
import { Search, Filter, ChevronDown, Mail, Phone, Clock, Tag, MessageSquare, Calendar, X, Megaphone } from 'lucide-react';

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'closed'] as const;
const INTEREST_LABELS: Record<string, string> = {
  ongoing_project: 'Ongoing Project',
  completed_project: 'Completed Project',
  investment: 'Investment',
  general: 'General Enquiry',
};
const CONTACT_TIME_LABELS: Record<string, string> = {
  morning: 'Morning (9am-12pm)',
  afternoon: 'Afternoon (12pm-5pm)',
  evening: 'Evening (5pm-8pm)',
  anytime: 'Anytime',
};
const HEARD_FROM_LABELS: Record<string, string> = {
  google_search: 'Google Search',
  social_media: 'Social Media',
  friend_family: 'Friend / Family',
  newspaper_magazine: 'Newspaper / Magazine',
  hoarding_banner: 'Hoarding / Banner',
  site_visit: 'Site Visit',
  existing_customer: 'Existing Customer',
  other: 'Other',
};
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  qualified: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};
const INTEREST_COLORS: Record<string, string> = {
  ongoing_project: 'bg-teal-100 text-teal-700',
  completed_project: 'bg-[#2F6F6B]/10 text-[#2F6F6B]',
  investment: 'bg-[#D4A24C]/10 text-[#b8872e]',
  general: 'bg-gray-100 text-gray-600',
};

interface LeadsManagerProps {
  onMessage: (type: 'success' | 'error', text: string) => void;
}

export function LeadsManager({ onMessage }: LeadsManagerProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterInterest, setFilterInterest] = useState('');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      onMessage('error', 'Failed to load leads: ' + error.message);
    } else {
      setLeads(data ?? []);
    }
    setLoading(false);
  }

  async function updateLeadStatus(id: string, status: Lead['status']) {
    setUpdatingStatus(id);
    const { error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id);

    if (error) {
      onMessage('error', 'Failed to update status: ' + error.message);
    } else {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    }
    setUpdatingStatus(null);
  }

  const filtered = leads.filter((lead) => {
    const matchSearch =
      !search ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search);
    const matchStatus = !filterStatus || lead.status === filterStatus;
    const matchInterest = !filterInterest || lead.interest === filterInterest;
    return matchSearch && matchStatus && matchInterest;
  });

  const counts = {
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    closed: leads.filter((l) => l.status === 'closed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#2DB6E8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              filterStatus === status
                ? 'border-[#2DB6E8] bg-[#2DB6E8]/5'
                : 'border-gray-200 bg-white hover:border-[#2DB6E8]/40'
            }`}
          >
            <div className={`text-2xl font-bold mb-1 ${STATUS_COLORS[status].split(' ')[1]}`}>
              {counts[status]}
            </div>
            <div className="text-xs font-medium text-[#2F6F6B]/70 capitalize">{status}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2F6F6B]/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2DB6E8]/20 focus:border-[#2DB6E8]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2F6F6B]/40 pointer-events-none" />
          <select
            value={filterInterest}
            onChange={(e) => setFilterInterest(e.target.value)}
            className="pl-8 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2DB6E8]/20 focus:border-[#2DB6E8] appearance-none bg-white min-w-[200px]"
          >
            <option value="">All Interests</option>
            {Object.entries(INTEREST_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2F6F6B]/40 pointer-events-none" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#2F6F6B]/50">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No leads found</p>
          <p className="text-sm mt-1">{leads.length === 0 ? 'Leads submitted via the contact form will appear here.' : 'Try adjusting your search or filters.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <div key={lead.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2F6F6B]/10 flex items-center justify-center">
                    <span className="text-[#2F6F6B] font-semibold text-sm">
                      {lead.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[#1A3D3B] truncate">{lead.name}</div>
                    <div className="text-sm text-[#2F6F6B]/60 truncate">{lead.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className={`hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${INTEREST_COLORS[lead.interest]}`}>
                    {INTEREST_LABELS[lead.interest]}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[lead.status]}`}>
                    {lead.status}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-[#2F6F6B]/40 transition-transform ${expandedLead === lead.id ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {expandedLead === lead.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-[#2DB6E8] flex-shrink-0" />
                        <a href={`tel:${lead.phone}`} className="text-[#2F6F6B] hover:text-[#2DB6E8] transition-colors">
                          {lead.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={14} className="text-[#2DB6E8] flex-shrink-0" />
                        <a href={`mailto:${lead.email}`} className="text-[#2F6F6B] hover:text-[#2DB6E8] transition-colors truncate">
                          {lead.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-[#2DB6E8] flex-shrink-0" />
                        <span className="text-[#2F6F6B]/70">{CONTACT_TIME_LABELS[lead.preferred_contact_time]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Tag size={14} className="text-[#2DB6E8] flex-shrink-0" />
                        <span className="text-[#2F6F6B]/70">{INTEREST_LABELS[lead.interest]}</span>
                      </div>
                      {lead.heard_from && (
                        <div className="flex items-center gap-2 text-sm">
                          <Megaphone size={14} className="text-[#2DB6E8] flex-shrink-0" />
                          <span className="text-[#2F6F6B]/70">{HEARD_FROM_LABELS[lead.heard_from] ?? lead.heard_from}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-[#2DB6E8] flex-shrink-0" />
                        <span className="text-[#2F6F6B]/70">
                          {new Date(lead.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <div>
                      {lead.message ? (
                        <div className="bg-white rounded-lg p-3 border border-gray-200 h-full">
                          <p className="text-xs font-medium text-[#2F6F6B]/50 mb-1.5 uppercase tracking-wide">Message</p>
                          <p className="text-sm text-[#2F6F6B]/80 leading-relaxed">{lead.message}</p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-3 border border-dashed border-gray-200 h-full flex items-center justify-center">
                          <p className="text-sm text-[#2F6F6B]/30 italic">No message provided</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs font-medium text-[#2F6F6B]/50 uppercase tracking-wide mb-2">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((status) => (
                        <button
                          key={status}
                          onClick={() => updateLeadStatus(lead.id, status)}
                          disabled={lead.status === status || updatingStatus === lead.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                            lead.status === status
                              ? `${STATUS_COLORS[status]} border-transparent cursor-default`
                              : 'border-gray-200 text-[#2F6F6B]/60 hover:border-[#2DB6E8] hover:text-[#2DB6E8] bg-white'
                          } disabled:opacity-50`}
                        >
                          {updatingStatus === lead.id && lead.status !== status ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
                              {status}
                            </span>
                          ) : status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-sm text-[#2F6F6B]/50 text-right">
        Showing {filtered.length} of {leads.length} leads
      </div>
    </div>
  );
}
