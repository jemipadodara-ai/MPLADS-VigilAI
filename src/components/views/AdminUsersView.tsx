import React, { useState, useEffect } from 'react';
import { Users, Shield, Edit3, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface AdminUsersViewProps {
  currentUser?: any;
}

const ROLE_COLORS: Record<string, string> = {
  minister: 'bg-red-100 text-red-700 border-red-200',
  admin: 'bg-red-100 text-red-700 border-red-200',
  district: 'bg-blue-100 text-blue-700 border-blue-200',
  nodal_officer: 'bg-blue-100 text-blue-700 border-blue-200',
  mp: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  analyst: 'bg-violet-100 text-violet-700 border-violet-200',
  state_nodal: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  citizen: 'bg-slate-100 text-slate-600 border-slate-200',
  viewer: 'bg-slate-100 text-slate-600 border-slate-200',
};

const ALL_ROLES = ['admin', 'minister', 'district', 'nodal_officer', 'mp', 'analyst', 'state_nodal', 'citizen', 'viewer'];

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = ['admin', 'minister'].includes(currentUser?.role?.toLowerCase() || '');

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    fetch('/api/users')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data && data.users) setUsers(data.users); })
      .catch(err => console.warn('Users fetch notice:', err))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleRoleUpdate = async (email: string) => {
    if (!newRole || !email) return;
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(email)}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.email === email ? { ...u, role: newRole } : u));
        setFeedback({ type: 'success', message: `Role of ${email} updated to '${newRole}'.` });
        setEditingUser(null);
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update role' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const filteredUsers = users.filter(u =>
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-center">
        <Shield className="w-12 h-12 text-slate-300 mb-3" />
        <h2 className="text-lg font-bold text-slate-700">Admin Access Required</h2>
        <p className="text-sm text-slate-500 mt-1">Only administrators can manage user accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider">Admin Panel</span>
            <span className="text-xs text-slate-500 font-medium">User Account Management</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">USER MANAGEMENT</h1>
          <p className="text-slate-600 text-sm mt-1">Manage officer accounts, roles, and access levels across the VigilAI platform.</p>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-bold uppercase text-slate-400">Total Users</div>
          <div className="text-xl font-black text-slate-900">{users.length}</div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="ml-2 text-slate-500 text-sm">Loading users...</span>
          </div>
        )}
        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2" />
            <div className="text-sm">No users found.</div>
          </div>
        )}
        {!loading && filteredUsers.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Role</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Department</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Source</th>
                {currentUser?.role === 'admin' && (
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(u => (
                <tr key={u.email} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{u.name || u.email.split('@')[0]}</div>
                    <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {editingUser === u.email ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={newRole}
                          onChange={e => setNewRole(e.target.value)}
                          className="text-xs border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          <option value="">Select role...</option>
                          {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button
                          onClick={() => handleRoleUpdate(u.email)}
                          className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        ROLE_COLORS[u.role?.toLowerCase() || 'viewer'] || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {u.role || 'viewer'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">{u.department || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      u.source === 'firestore' ? 'bg-emerald-50 text-emerald-700'
                      : u.source === 'registered' ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-50 text-slate-600'
                    }`}>
                      {u.source || 'system'}
                    </span>
                  </td>
                  {currentUser?.role === 'admin' && (
                    <td className="px-4 py-3">
                      {u.source !== 'pre-configured' && (
                        <button
                          onClick={() => { setEditingUser(u.email); setNewRole(u.role || ''); }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Change Role
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Legend */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="text-xs font-bold uppercase text-slate-400 mb-3">Role Permission Levels</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { role: 'minister/admin', level: 'Executive', desc: 'Full platform access + financial directives', color: 'red' },
            { role: 'district/nodal_officer', level: 'District Officer', desc: 'Case management, inspections, field ops', color: 'blue' },
            { role: 'mp', level: 'MP', desc: 'Constituency monitoring, citizen reports', color: 'indigo' },
            { role: 'analyst', level: 'Analyst', desc: 'Read all data, export compliance reports', color: 'violet' },
            { role: 'citizen', level: 'Citizen', desc: 'View projects, submit ground reports', color: 'slate' },
            { role: 'viewer', level: 'Viewer', desc: 'Read-only access to public data', color: 'slate' },
          ].map(({ role, level, desc, color }) => (
            <div key={role} className={`p-2.5 rounded-lg border text-xs ${
              color === 'red' ? 'bg-red-50 border-red-200' : color === 'blue' ? 'bg-blue-50 border-blue-200'
              : color === 'indigo' ? 'bg-indigo-50 border-indigo-200' : color === 'violet' ? 'bg-violet-50 border-violet-200'
              : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="font-bold text-slate-800">{level}</div>
              <div className="text-slate-500 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminUsersView;
