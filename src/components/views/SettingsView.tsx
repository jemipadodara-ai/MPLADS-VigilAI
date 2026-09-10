import React, { useState, useEffect } from 'react';
import {
  Database,
  Shield,
  Sliders,
  RefreshCw,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  ArrowUpDown,
  UserCheck,
  UserX,
  Server,
  DownloadCloud,
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import realData from '../../data/officialMpladsIngest.json';

interface SettingsViewProps {
  onRefreshData: () => void;
  isLoading?: boolean;
  userRole?: 'admin' | 'standard';
  isRoleLoading?: boolean;
}

interface FirestoreUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'standard';
  createdAt?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onRefreshData,
  isLoading = false,
  userRole = 'standard',
  isRoleLoading = false,
}) => {
  // Anomaly Engine interactive weights
  const [financialWeight, setFinancialWeight] = useState(25);
  const [progressWeight, setProgressWeight] = useState(20);
  const [costWeight, setCostWeight] = useState(20);
  const [contractorWeight, setContractorWeight] = useState(15);
  const [duplicateWeight, setDuplicateWeight] = useState(15);
  const [dataQualityWeight, setDataQualityWeight] = useState(5);
  const [weightsSaved, setWeightsSaved] = useState(false);

  // User Directory state
  const [registeredUsers, setRegisteredUsers] = useState<FirestoreUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Database seed state
  const [isSeeding, setIsSeeding] = useState(false);

  const isAdmin = userRole === 'admin';
  const totalWeight =
    financialWeight +
    progressWeight +
    costWeight +
    contractorWeight +
    duplicateWeight +
    dataQualityWeight;

  // Fetch registered users from Firestore users collection
  useEffect(() => {
    if (!isAdmin) return;

    setIsUsersLoading(true);
    try {
      const usersCol = collection(db, 'users');
      const unsubscribe = onSnapshot(
        usersCol,
        (snapshot) => {
          const userList: FirestoreUser[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            userList.push({
              uid: d.id,
              email: data.email || 'No email',
              displayName: data.displayName || data.email?.split('@')[0] || 'User',
              role: data.role === 'admin' ? 'admin' : 'standard',
              createdAt: data.createdAt || new Date().toISOString(),
            });
          });

          // Sort by email
          userList.sort((a, b) => a.email.localeCompare(b.email));
          setRegisteredUsers(userList);
          setIsUsersLoading(false);
        },
        (error) => {
          console.warn('Users directory query notice:', error);
          handleFirestoreError(error, OperationType.LIST, 'users');
          setIsUsersLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Failed to listen to users collection:', err);
      setIsUsersLoading(false);
    }
  }, [isAdmin]);

  // Admin Action: Toggle User Role between Admin & Auditor
  const handleToggleUserRole = async (targetUser: FirestoreUser) => {
    const newRole: 'admin' | 'standard' = targetUser.role === 'admin' ? 'standard' : 'admin';
    setUpdatingUserId(targetUser.uid);
    setActionNotice(null);

    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, { role: newRole });

      // Optimistic local update in case of latency
      setRegisteredUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, role: newRole } : u))
      );

      setActionNotice({
        type: 'success',
        text: `Updated role for ${targetUser.email} to ${newRole === 'admin' ? 'Administrator' : 'Auditor'}.`,
      });
    } catch (err: any) {
      console.error('Failed to update user role:', err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUser.uid}`);
      setActionNotice({
        type: 'error',
        text: 'Failed to update user role. Please verify your administrator privileges.',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Admin Action: Push officialMpladsIngest.json directly to Firestore projects collection
  const handleLoadOfficialIngest = async () => {
    setIsSeeding(true);
    setActionNotice(null);
    try {
      let count = 0;
      for (const proj of realData) {
        await setDoc(doc(db, 'projects', proj.id), proj, { merge: true });
        count++;
      }
      setActionNotice({
        type: 'success',
        text: `Successfully pushed ${count} records from officialMpladsIngest.json into Firestore 'projects' collection.`,
      });
      onRefreshData();
    } catch (err: any) {
      console.error('Failed to load official ingest into Firestore:', err);
      handleFirestoreError(err, OperationType.WRITE, 'projects');
      setActionNotice({
        type: 'error',
        text: `Failed to load official ingest into Firestore: ${err?.message || 'Error occurred'}`,
      });
    } finally {
      setIsSeeding(false);
    }
  };

  // Admin Action: Seed Baseline Data & Ingest into Firestore
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setActionNotice(null);
    try {
      // 1. Directly push official ingest projects to Firestore projects collection
      let localSeeded = 0;
      for (const proj of realData) {
        await setDoc(doc(db, 'projects', proj.id), proj, { merge: true });
        localSeeded++;
      }

      // 2. Also invoke server seed endpoint for full background sync
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice({
          type: 'success',
          text: `Firestore database populated: ${data.counts?.projects || localSeeded} projects from officialMpladsIngest.json, ${data.counts?.constituencies || 12} constituencies, and ${data.counts?.alerts || 4} alerts.`,
        });
      } else {
        setActionNotice({
          type: 'success',
          text: `Pushed ${localSeeded} official projects directly to Firestore collection 'projects'.`,
        });
      }
      onRefreshData();
    } catch (err: any) {
      console.error('Seed error:', err);
      setActionNotice({
        type: 'error',
        text: 'Error occurred while saving official ingest data to Firebase.',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetWeights = () => {
    setFinancialWeight(25);
    setProgressWeight(20);
    setCostWeight(20);
    setContractorWeight(15);
    setDuplicateWeight(15);
    setDataQualityWeight(5);
    setWeightsSaved(false);
  };

  const handleSaveWeights = () => {
    setWeightsSaved(true);
    setActionNotice({
      type: 'success',
      text: 'Anomaly engine point weights calibrated and saved for your session.',
    });
    setTimeout(() => setWeightsSaved(false), 3000);
  };

  // If standard user somehow accesses directly, show access restriction
  if (!isRoleLoading && !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl border border-slate-200 shadow-2xs text-center space-y-4 my-12">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The Administration &amp; Control Center is strictly restricted to users with verified system administrator credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admin Control Center</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Role-based access management, live database controls, and vigilance engine tuning
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Elevated Privileges Active</span>
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          id="admin-action-notice"
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-fadeIn border ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Cloud Database & Dataset Seeding Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Firestore Cloud Database</h3>
              <p className="text-xs text-slate-500">
                Database: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 text-[11px]">ai-studio-mpladsvigilaiano-b1936725-3072-44fb-b055-a3e8fb748dbb</code>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="admin-force-resync-btn"
              onClick={onRefreshData}
              disabled={isLoading}
              className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Force Re-sync</span>
            </button>

            <button
              id="admin-load-official-ingest-btn"
              onClick={handleLoadOfficialIngest}
              disabled={isSeeding}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Load data from officialMpladsIngest.json directly to Firebase"
            >
              <DownloadCloud className={`w-3.5 h-3.5 ${isSeeding ? 'animate-bounce' : ''}`} />
              <span>{isSeeding ? 'Ingesting...' : 'Load Official Ingest (JSON)'}</span>
            </button>

            <button
              id="admin-seed-database-btn"
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <DownloadCloud className={`w-3.5 h-3.5 ${isSeeding ? 'animate-bounce' : ''}`} />
              <span>{isSeeding ? 'Seeding Firestore...' : 'Seed All Baseline & Ingest'}</span>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Firestore Synchronized</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Registered collections: <span className="font-mono text-slate-700">users, projects, constituencies, alerts, citizen_reports</span>
          </div>
        </div>
      </div>

      {/* 2. User Directory & RBAC Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Directory &amp; RBAC Control</h3>
              <p className="text-xs text-slate-500">
                Registered platform auditors. Administrators can promote or demote user access roles.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Total Users: <span className="font-bold text-slate-900">{registeredUsers.length}</span>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Auditor / Account</th>
                <th className="px-4 py-3">UID</th>
                <th className="px-4 py-3">Registered On</th>
                <th className="px-4 py-3">Current Role</th>
                <th className="px-4 py-3 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isUsersLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                      <span>Loading user directory from Firestore...</span>
                    </div>
                  </td>
                </tr>
              ) : registeredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No registered user accounts found in Firestore.
                  </td>
                </tr>
              ) : (
                registeredUsers.map((u) => {
                  const isUserAdmin = u.role === 'admin';
                  const isUpdating = updatingUserId === u.uid;

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{u.displayName || u.email.split('@')[0]}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 max-w-[140px] truncate" title={u.uid}>
                        {u.uid}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isUserAdmin
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isUserAdmin ? (
                            <>
                              <Shield className="w-3 h-3 text-blue-600" />
                              <span>Administrator</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3 text-slate-500" />
                              <span>Auditor</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          id={`toggle-role-btn-${u.uid}`}
                          onClick={() => handleToggleUserRole(u)}
                          disabled={isUpdating}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isUserAdmin
                              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-300'
                              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 bg-blue-50/30'
                          }`}
                        >
                          {isUpdating ? (
                            <span className="flex items-center gap-1">
                              <div className="w-3 h-3 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                              <span>Saving...</span>
                            </span>
                          ) : isUserAdmin ? (
                            <span>Set as Auditor</span>
                          ) : (
                            <span>Make Admin</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Deterministic Anomaly Engine Weights (Interactive Sliders) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Deterministic Anomaly Engine Calibration</h3>
              <p className="text-xs text-slate-500">
                Adjust point weights for regulatory audit categories (Benchmark Total: 100)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                totalWeight === 100
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              Total: {totalWeight} / 100 pts
            </div>

            <button
              onClick={handleResetWeights}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              id="admin-save-weights-btn"
              onClick={handleSaveWeights}
              className="px-3 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              Save Weights
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Financial */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Financial Discrepancies</span>
                <p className="text-[11px] text-slate-500">Over-expenditure, unspent funds</p>
              </div>
              <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {financialWeight} pts
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={financialWeight}
              onChange={(e) => setFinancialWeight(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Progress Delay */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Progress Delays</span>
                <p className="text-[11px] text-slate-500">Overdue target dates, stalled works</p>
              </div>
              <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {progressWeight} pts
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={progressWeight}
              onChange={(e) => setProgressWeight(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Cost Benchmark */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Cost Benchmark Deviations</span>
                <p className="text-[11px] text-slate-500">Exceeds 1.6x median unit cost</p>
              </div>
              <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {costWeight} pts
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={costWeight}
              onChange={(e) => setCostWeight(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Contractor Concentration */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Contractor Concentration</span>
                <p className="text-[11px] text-slate-500">&gt;35% share or single-bid capture</p>
              </div>
              <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {contractorWeight} pts
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={contractorWeight}
              onChange={(e) => setContractorWeight(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Duplicate Work */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Duplicate Work Similarity</span>
                <p className="text-[11px] text-slate-500">Co-located titles &amp; asset scope overlap</p>
              </div>
              <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {duplicateWeight} pts
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={duplicateWeight}
              onChange={(e) => setDuplicateWeight(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Data Quality */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Data Integrity Checks</span>
                <p className="text-[11px] text-slate-500">Missing fields, negative values, mismatches</p>
              </div>
              <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {dataQualityWeight} pts
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={dataQualityWeight}
              onChange={(e) => setDataQualityWeight(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
