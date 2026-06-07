'use client';

import AdminLayout from '../../(admin)/layout';
import { KeyRound, Plus, Shield, Users, Trash2, Pencil, ChevronRight, ChevronDown, Check, X, Minus } from 'lucide-react';
import DataTable from '@/components/DataTable';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import StatusBadge from '@/components/StatusBadge';
import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { usePermissions } from '@/context/AuthContext';

// ─── Nested Page Access Tree Definition ──────────────────────────────

interface PageEntry {
  path: string;
  label: string;
}

interface PageSection {
  label: string;
  children: PageEntry[];
}

interface PageGroup {
  group: string;
  pages?: PageEntry[];
  sections?: PageSection[];
}

const PAGE_TREE: PageGroup[] = [
  {
    group: 'Overview',
    pages: [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/dashboard/live-map', label: 'Live Map' },
    ],
  },
  {
    group: 'Management',
    sections: [
      {
        label: 'Operators',
        children: [
          { path: '/operators', label: 'Operators List' },
          { path: '/operators/[id]', label: 'Operator Detail' },
          { path: '/operators/[id]/channels/[channelId]', label: 'Operator Channel Detail' },
        ],
      },
      {
        label: 'Channels',
        children: [
          { path: '/channels', label: 'Channels List' },
          { path: '/channels/create', label: 'Create Channel' },
          { path: '/channels/[id]', label: 'Channel Detail' },
        ],
      },
      {
        label: 'Passengers',
        children: [
          { path: '/passengers', label: 'Passengers List' },
          { path: '/passengers/[id]', label: 'Passenger Detail' },
        ],
      },
      {
        label: 'Staff',
        children: [
          { path: '/staff-global', label: 'Staff' },
        ],
      },
    ],
  },
  {
    group: 'Operations',
    sections: [
      {
        label: 'Trips',
        children: [
          { path: '/trips/analytics', label: 'Trip Analytics' },
          { path: '/trips/explorer', label: 'Trip Explorer' },
        ],
      },
      {
        label: 'Bookings',
        children: [
          { path: '/bookings/analytics', label: 'Booking Analytics' },
          { path: '/bookings/funnel', label: 'Booking Funnel' },
        ],
      },
      {
        label: 'Finances',
        children: [
          { path: '/finances', label: 'Revenue Dashboard' },
          { path: '/finances/channels', label: 'Channel Financials' },
          { path: '/finances/integrations', label: 'Integration Revenue' },
          { path: '/finances/payroll', label: 'Payroll' },
        ],
      },
      {
        label: 'Integrations',
        children: [
          { path: '/integrations', label: 'Integration Partners' },
          { path: '/integrations/[id]', label: 'Integration Detail' },
          { path: '/integrations/analytics', label: 'Integration Analytics' },
        ],
      },
      {
        label: 'Reviews',
        children: [
          { path: '/reviews', label: 'Reviews' },
        ],
      },
    ],
  },
  {
    group: 'Resources',
    sections: [
      {
        label: 'Fleet',
        children: [
          { path: '/fleet', label: 'Fleet Map' },
          { path: '/fleet/analytics', label: 'Fleet Analytics' },
        ],
      },
      {
        label: 'HR',
        children: [
          { path: '/hr/attendance', label: 'HR Attendance' },
          { path: '/hr/salary', label: 'HR Salary' },
        ],
      },
      {
        label: 'Promotions',
        children: [
          { path: '/promotions', label: 'Promotions' },
        ],
      },
    ],
  },
  {
    group: 'Administration',
    sections: [
      {
        label: 'Audit',
        children: [
          { path: '/audit', label: 'Audit Log' },
          { path: '/audit/logins', label: 'Login History' },
          { path: '/audit/sessions', label: 'Active Sessions' },
        ],
      },
      {
        label: 'System',
        children: [
          { path: '/system/health', label: 'System Health' },
          { path: '/system/features', label: 'Feature Flags' },
          { path: '/system/config', label: 'System Config' },
        ],
      },
      {
        label: 'Communications',
        children: [
          { path: '/communications/announcements', label: 'Announcements' },
        ],
      },
      {
        label: 'Reports',
        children: [
          { path: '/reports', label: 'Reports' },
        ],
      },
    ],
  },
  {
    group: 'Settings',
    sections: [
      {
        label: 'Account',
        children: [
          { path: '/settings/profile', label: 'Profile' },
        ],
      },
      {
        label: 'Team',
        children: [
          { path: '/settings/team', label: 'Team Management' },
          { path: '/settings/roles', label: 'Roles & Permissions' },
        ],
      },
      {
        label: 'Platform',
        children: [
          { path: '/settings/platform', label: 'Platform Settings' },
        ],
      },
    ],
  },
];

// Only show action permissions for pages that have actionable buttons
const ACTION_RESOURCES = [
  { key: 'operators', label: 'Operators' },
  { key: 'channels', label: 'Channels' },
  { key: 'passengers', label: 'Passengers' },
  { key: 'staff', label: 'Staff' },
  { key: 'promotions', label: 'Promotions' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'team', label: 'Team' },
  { key: 'roles', label: 'Roles' },
  { key: 'features', label: 'Feature Flags' },
  { key: 'system', label: 'System Config' },
  { key: 'platform', label: 'Platform Settings' },
  { key: 'reports', label: 'Reports' },
  { key: 'sessions', label: 'Sessions' },
] as const;

const ACTION_TYPES = ['read', 'create', 'update', 'delete', 'suspend'] as const;

// Helper: get all paths from a group (flattened)
function getAllPathsFromGroup(group: PageGroup): string[] {
  const paths: string[] = [];
  if (group.pages) {
    group.pages.forEach(p => paths.push(p.path));
  }
  if (group.sections) {
    group.sections.forEach(s => {
      s.children.forEach(p => paths.push(p.path));
    });
  }
  return paths;
}

// Helper: get all paths from a section
function getAllPathsFromSection(section: PageSection): string[] {
  return section.children.map(p => p.path);
}

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  const { hasAction, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasAction('roles', 'create');

  const fetchRoles = useCallback(async () => {
    try {
      const res = await apiClient.get('/super-admin/roles');
      setRoles(res.data.data || res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role? Users assigned to it will lose their custom permissions.')) return;
    try {
      await apiClient.delete(`/super-admin/roles/${id}`);
      toast.success('Role deleted');
      fetchRoles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  if (error) return (
    <AdminLayout>
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">Error</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">Retry</button>
        </div>
      </div>
    </AdminLayout>
  );

  const columns = [
    { key: 'name', label: 'Role Name', render: (row: any) => (
      <span className="font-medium text-gray-900 dark:text-gray-100">{row.name}</span>
    )},
    { key: 'description', label: 'Description', render: (row: any) => (
      <span className="text-sm text-gray-500">{row.description || '-'}</span>
    )},
    { key: 'usersCount', label: 'Users', render: (row: any) => (
      <span className="inline-flex items-center gap-1 text-sm">
        <Users size="14" className="text-gray-400" />
        {row.usersCount || 0}
      </span>
    )},
    { key: 'pagesCount', label: 'Pages', render: (row: any) => (
      <span className="inline-flex items-center gap-1 text-sm">
        <Shield size="14" className="text-gray-400" />
        {row.pagesCount || 0}
      </span>
    )},
    { key: 'isActive', label: 'Status', render: (row: any) => (
      <StatusBadge status={row.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />
    )},
    { key: 'actions', label: '', render: (row: any) => {
      const canEdit = isSuperAdmin || hasAction('roles', 'update');
      const canDel = isSuperAdmin || hasAction('roles', 'delete');
      return (
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); setEditingRole(row); setShowCreateModal(true); }}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Pencil size="14" />
            </button>
          )}
          {canDel && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size="14" />
            </button>
          )}
        </div>
      );
    }},
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Roles & Permissions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage custom roles and page access for team members</p>
          </div>
          {canCreate && (
            <button
              onClick={() => { setEditingRole(null); setShowCreateModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              <Plus size="16" /> Create Role
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Roles" value={roles.length} icon={<KeyRound size="20" />} color="indigo" />
          <KPICard title="Active" value={roles.filter(r => r.isActive !== false).length} color="green" />
          <KPICard title="Assigned Users" value={roles.reduce((sum, r) => sum + (r.usersCount || 0), 0)} icon={<Users size="20" />} color="blue" />
        </div>

        {loading ? <LoadingSkeleton /> : (
          <DataTable columns={columns} data={roles} emptyMessage="No custom roles created yet" />
        )}

        {/* Create/Edit Role Modal */}
        {showCreateModal && (
          <RoleModal
            role={editingRole}
            onClose={() => { setShowCreateModal(false); setEditingRole(null); }}
            onSaved={() => { setShowCreateModal(false); setEditingRole(null); fetchRoles(); }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// ─── Tri-State Checkbox ──────────────────────────────────────────
function TriCheckbox({ checked, onChange }: {
  checked: 'checked' | 'indeterminate' | 'unchecked';
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        checked === 'checked'
          ? 'bg-indigo-600 border-indigo-600'
          : checked === 'indeterminate'
            ? 'bg-indigo-100 border-indigo-400'
            : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      {checked === 'checked' && <Check size="14" className="text-white" />}
      {checked === 'indeterminate' && <Minus size="12" className="text-indigo-600" />}
    </button>
  );
}

// ─── Role Create/Edit Modal ──────────────────────────────────────
function RoleModal({ role, onClose, onSaved }: {
  role: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [pageAccess, setPageAccess] = useState<string[]>(role?.pageAccess || []);
  const [permissions, setPermissions] = useState<Record<string, string[]>>(role?.permissions || {});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(PAGE_TREE.map(g => [g.group, true]))
  );
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const sections: Record<string, boolean> = {};
    PAGE_TREE.forEach(g => {
      if (g.sections) {
        g.sections.forEach(s => {
          sections[s.label] = true;
        });
      }
    });
    return sections;
  });
  const [saving, setSaving] = useState(false);

  const togglePage = (path: string) => {
    setPageAccess(prev => {
      if (prev.includes(path)) return prev.filter(p => p !== path);
      return [...prev, path];
    });
  };

  const toggleSection = (section: PageSection) => {
    const allPaths = getAllPathsFromSection(section);
    const allChecked = allPaths.every(p => pageAccess.includes(p));
    if (allChecked) {
      setPageAccess(prev => prev.filter(p => !allPaths.includes(p)));
    } else {
      setPageAccess(prev => {
        const newAccess = [...prev];
        allPaths.forEach(p => {
          if (!newAccess.includes(p)) newAccess.push(p);
        });
        return newAccess;
      });
    }
  };

  const toggleGroup = (group: PageGroup) => {
    const allPaths = getAllPathsFromGroup(group);
    const allChecked = allPaths.every(p => pageAccess.includes(p));
    if (allChecked) {
      setPageAccess(prev => prev.filter(p => !allPaths.includes(p)));
    } else {
      setPageAccess(prev => {
        const newAccess = [...prev];
        allPaths.forEach(p => {
          if (!newAccess.includes(p)) newAccess.push(p);
        });
        return newAccess;
      });
    }
  };

  const getGroupState = (group: PageGroup): 'checked' | 'indeterminate' | 'unchecked' => {
    const allPaths = getAllPathsFromGroup(group);
    const checkedCount = allPaths.filter(p => pageAccess.includes(p)).length;
    if (checkedCount === 0) return 'unchecked';
    if (checkedCount === allPaths.length) return 'checked';
    return 'indeterminate';
  };

  const getSectionState = (section: PageSection): 'checked' | 'indeterminate' | 'unchecked' => {
    const allPaths = getAllPathsFromSection(section);
    const checkedCount = allPaths.filter(p => pageAccess.includes(p)).length;
    if (checkedCount === 0) return 'unchecked';
    if (checkedCount === allPaths.length) return 'checked';
    return 'indeterminate';
  };

  const toggleAction = (resource: string, action: string) => {
    setPermissions(prev => {
      const current = prev[resource] || [];
      if (current.includes(action)) {
        return { ...prev, [resource]: current.filter(a => a !== action) };
      }
      return { ...prev, [resource]: [...current, action] };
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Role name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        pageAccess,
        permissions,
      };
      if (role?.id) {
        await apiClient.put(`/super-admin/roles/${role.id}`, payload);
        toast.success('Role updated');
      } else {
        await apiClient.post('/super-admin/roles', payload);
        toast.success('Role created');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-3xl space-y-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="font-semibold text-lg">{role?.id ? 'Edit Role' : 'Create Role'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg dark:text-gray-400">
            <X size="18" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Finance Analyst, Fleet Monitor"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this role can do..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Page Access Tree (Nested) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Page Access</label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {PAGE_TREE.map((group) => {
                const groupState = getGroupState(group);
                const isExpanded = expandedGroups[group.group] !== false;
                const totalPaths = getAllPathsFromGroup(group);
                const checkedCount = totalPaths.filter(p => pageAccess.includes(p)).length;

                return (
                  <div key={group.group} className="border-b border-gray-100 last:border-b-0">
                    {/* Group Header */}
                    <button
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [group.group]: !isExpanded }))}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div onClick={(e) => { e.stopPropagation(); toggleGroup(group); }}>
                        <TriCheckbox checked={groupState} onChange={() => toggleGroup(group)} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 flex-1 text-left">{group.group}</span>
                      <span className="text-xs text-gray-400">{checkedCount}/{totalPaths.length}</span>
                      {isExpanded ? <ChevronDown size="16" className="text-gray-400" /> : <ChevronRight size="16" className="text-gray-400" />}
                    </button>

                    {/* Contents */}
                    {isExpanded && (
                      <div className="pb-3">
                        {/* Flat pages (for groups like Overview) */}
                        {group.pages && (
                          <div className="pl-12 pr-4 space-y-1">
                            {group.pages.map((page) => (
                              <label
                                key={page.path}
                                className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={pageAccess.includes(page.path)}
                                  onChange={() => togglePage(page.path)}
                                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-600">{page.label}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Sections (nested parent-child) */}
                        {group.sections && group.sections.map((section) => {
                          const sectionState = getSectionState(section);
                          const sectionExpanded = expandedSections[section.label] !== false;
                          const sectionPaths = getAllPathsFromSection(section);
                          const sectionChecked = sectionPaths.filter(p => pageAccess.includes(p)).length;

                          return (
                            <div key={section.label} className="ml-8 border-l-2 border-gray-100">
                              {/* Section Header (parent) */}
                              <button
                                onClick={() => setExpandedSections(prev => ({ ...prev, [section.label]: !sectionExpanded }))}
                                className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-50 transition-colors"
                              >
                                <div onClick={(e) => { e.stopPropagation(); toggleSection(section); }}>
                                  <TriCheckbox checked={sectionState} onChange={() => toggleSection(section)} />
                                </div>
                                <span className="text-sm font-medium text-gray-600 flex-1 text-left">{section.label}</span>
                                <span className="text-xs text-gray-400">{sectionChecked}/{sectionPaths.length}</span>
                                {sectionExpanded ? <ChevronDown size="14" className="text-gray-400" /> : <ChevronRight size="14" className="text-gray-400" />}
                              </button>

                              {/* Children */}
                              {sectionExpanded && (
                                <div className="pl-12 pr-4 space-y-1">
                                  {section.children.map((page) => (
                                    <label
                                      key={page.path}
                                      className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={pageAccess.includes(page.path)}
                                        onChange={() => togglePage(page.path)}
                                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                      />
                                      <span className="text-sm text-gray-600">{page.label}</span>
                                      <span className="text-xs text-gray-400 ml-auto font-mono">{page.path}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Permissions — only for actionable resources */}
          {pageAccess.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Action Permissions</label>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                      {ACTION_TYPES.map(a => (
                        <th key={a} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">{a}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ACTION_RESOURCES.map(resource => (
                      <tr key={resource.key}>
                        <td className="px-4 py-2 text-sm font-medium text-gray-700">{resource.label}</td>
                        {ACTION_TYPES.map(action => {
                          const resourceActions = permissions[resource.key] || [];
                          const isChecked = resourceActions.includes(action) || resourceActions.includes('*');
                          const isRead = action === 'read';
                          return (
                            <td key={action} className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isRead || isChecked}
                                disabled={isRead}
                                onChange={() => toggleAction(resource.key, action)}
                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : role?.id ? 'Update Role' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
