import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './EditPermissionsModal.css';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

interface EditPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleName: string;
  roleId: number;
  onSave: (roleId: number, permissions: string[]) => void;
}

const EditPermissionsModal: React.FC<EditPermissionsModalProps> = ({
  isOpen,
  onClose,
  roleName,
  roleId,
  onSave,
}) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && roleId) {
      fetchPermissions();
    }
  }, [isOpen, roleId]);

  const fetchPermissions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all available permissions and role's current permissions
      const [allPermissions, rolePermissions] = await Promise.all([
        adminAPI.getAllPermissions(),
        adminAPI.getRolePermissions(roleId),
      ]);

      const rolePermissionIds = rolePermissions.map((p: any) => p.id);

      // Merge to show all permissions with enabled state
      const mergedPermissions = allPermissions.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        category: p.category || 'general',
        enabled: rolePermissionIds.includes(p.id),
      }));

      setPermissions(mergedPermissions);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('Failed to load permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permissionId: string) => {
    setPermissions(prev =>
      prev.map(p => (p.id === permissionId ? { ...p, enabled: !p.enabled } : p))
    );
    setSuccessMessage(null);
  };

  const handleSelectAll = () => {
    setPermissions(prev => prev.map(p => ({ ...p, enabled: true })));
    setSuccessMessage(null);
  };

  const handleDeselectAll = () => {
    setPermissions(prev => prev.map(p => ({ ...p, enabled: false })));
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const enabledPermissionIds = permissions.filter(p => p.enabled).map(p => p.id);
      await adminAPI.updateRolePermissions(roleId, enabledPermissionIds);
      setSuccessMessage('Permissions saved successfully!');
      onSave(roleId, enabledPermissionIds);

      // Close after a short delay to show success message
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1500);
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError('Failed to save permissions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const categoryLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    users: 'User Management',
    appointments: 'Appointments',
    patients: 'Patient Records',
    lab: 'Lab & Tests',
    billing: 'Billing',
    system: 'System Settings',
    general: 'General',
  };

  if (!isOpen) return null;

  return (
    <div className="permissions-modal-overlay" onClick={onClose}>
      <div className="permissions-modal-content" onClick={e => e.stopPropagation()}>
        <div className="permissions-modal-header">
          <div>
            <h2>Edit Permissions</h2>
            <p className="role-name-badge">{roleName}</p>
          </div>
          <button className="permissions-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="permissions-modal-body">
          {loading ? (
            <div className="permissions-loading">Loading permissions...</div>
          ) : error ? (
            <div className="permissions-error">{error}</div>
          ) : (
            <>
              <div className="permissions-actions">
                <button className="select-all-btn" onClick={handleSelectAll}>
                  Select All
                </button>
                <button className="deselect-all-btn" onClick={handleDeselectAll}>
                  Deselect All
                </button>
              </div>

              {successMessage && (
                <div className="permissions-success">{successMessage}</div>
              )}

              <div className="permissions-list">
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="permissions-category">
                    <h4 className="category-title">{categoryLabels[category] || category}</h4>
                    {perms.map(permission => (
                      <div key={permission.id} className="permission-item">
                        <label className="permission-checkbox">
                          <input
                            type="checkbox"
                            checked={permission.enabled}
                            onChange={() => handleTogglePermission(permission.id)}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <div className="permission-info">
                          <span className="permission-name">{permission.name}</span>
                          <span className="permission-description">{permission.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {permissions.length === 0 && (
                  <div className="no-permissions">
                    No permissions available. Please seed permissions data.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="permissions-modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={saving || loading || permissions.length === 0}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPermissionsModal;
