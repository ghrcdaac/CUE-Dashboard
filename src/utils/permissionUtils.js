// src/utils/permissionUtils.js

/**
 * Filters a list of all roles down to only those the current user can assign.
 * This function is now driven by privileges, not hard-coded role names.
 * @param {Array} allRoles - The complete list of role objects from the API.
 * @param {string[]} privileges - The current user's flat list of privilege strings.
 * @returns {Array} The filtered list of role objects that the user can assign.
 */
export const getEditableRoles = (allRoles, privileges = []) => {
    if (!Array.isArray(allRoles)) {
        return [];
    }

    // The 'admin' role is a special superuser case.
    // We confirm this by checking for a role named 'admin' in the role list.
    const isAdminRolePresent = allRoles.some(role => role.short_name === 'admin');
    if (isAdminRolePresent && privileges.includes('user:assign_role')) {
        // An admin can assign any role, so return the full list.
        return allRoles;
    }

    // The primary check is now based on whether the user has the privilege to assign roles.
    if (privileges.includes('user:assign_role')) {
        // This is the list of roles that a non-admin user (i.e., a DAAC Manager) can assign.
        const allowedRoleNames = new Set([
            'DAAC Manager',
            'DAAC Staff',
            'DAAC Observer',
            'Provider'
        ]);
        return allRoles.filter(role => allowedRoleNames.has(role.long_name));
    }

    // If the user lacks the 'user:assign_role' privilege, they cannot assign any roles.
    return [];
};

/**
 * Checks if the user has privileges for core user management tasks.
 * @param {string[]} privileges - The user's list of privileges.
 * @returns {boolean} True if the user can approve applications or assign roles.
 */
export const canManageUsers = (privileges = []) => {
    return privileges.includes('application:approve') || privileges.includes('user:assign_role');
};

/**
 * Checks if the user has full CRUD (Create, Read, Update, Delete) privileges for collections.
 * @param {string[]} privileges - The user's list of privileges.
 * @returns {boolean} True if the user has all necessary collection management privileges.
 */
export const canManageCollections = (privileges = []) => {
    return privileges.includes('collection:create') &&
           privileges.includes('collection:update') &&
           privileges.includes('collection:delete');
};

/**
 * Checks if a user's permissions are strictly read-only, typical of an observer role.
 * This is useful for disabling all form fields and action buttons in a UI.
 * @param {string[]} privileges - The user's list of privileges.
 * @returns {boolean} True if the user has at least one privilege, and all of them are read-only.
 */
export const isReadOnlyObserver = (privileges = []) => {
    if (privileges.length === 0) {
        return false;
    }
    const hasOnlyReadPrivileges = privileges.every(p => p.endsWith(':read'));
    return hasOnlyReadPrivileges;
};

/**
 * Checks if the user has full CRUD privileges for providers.
 * @param {string[]} privileges - The user's list of privileges.
 * @returns {boolean}
 */
export const canManageProviders = (privileges = []) => {
    return privileges.includes('provider:create') &&
           privileges.includes('provider:update') &&
           privileges.includes('provider:delete');
};

/**
 * Checks if the user has full CRUD privileges for egress targets (DAAC page).
 * @param {string[]} privileges - The user's list of privileges.
 * @returns {boolean}
 */
export const canManageEgress = (privileges = []) => {
    return privileges.includes('egress:create') &&
           privileges.includes('egress:update') &&
           privileges.includes('egress:delete');
};

/**
 * Checks if the user has privileges to manage API keys beyond just their own.
 * @param {string[]} privileges - The user's list of privileges.
 * @returns {boolean}
 */
export const canManageAllApiKeys = (privileges = []) => {
    // This assumes that only users who can update/delete keys can manage keys for others.
    return privileges.includes('api-key:update') || privileges.includes('api-key:delete');
};

/**
 * Checks for special security-related privileges.
 * @param {string[]} privileges - The user's list of privileges.
 * @returns {boolean}
 */
export const canPerformSecurityActions = (privileges = []) => {
    return privileges.includes('user:suspend') || privileges.includes('user:reinstate');
};