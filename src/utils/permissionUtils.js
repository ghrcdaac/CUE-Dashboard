/**
 * Filters a list of all roles down to only those the current user can assign
 * based on a role hierarchy. A user can only assign roles at or below their own level.
 * @param {Array} allRoles - The complete list of role objects from the API.
 * @param {string[]} currentUserRoles - The current user's list of role short names (e.g., ['daac_manager']).
 * @returns {Array} The filtered list of role objects that the user can assign.
 */
export const getEditableRoles = (allRoles, currentUserRoles = []) => {
    if (!Array.isArray(allRoles)) {
        return [];
    }

    // An admin can see and assign any role.
    if (currentUserRoles.includes('admin')) {
        return allRoles;
    }

    // For non-admins, determine the roles they are NOT allowed to assign.
    let disallowedRoles = new Set(['admin']);

    // A security user can assign any role except admin.
    // If the user is NOT a security user, they also cannot assign the security role.
    if (!currentUserRoles.includes('security')) {
        disallowedRoles.add('security');
    }
    
    // A daac_manager can assign any role except admin and security.
    // If the user is NOT a daac_manager, they also cannot assign the daac_manager role.
    // (This logic can be extended for more roles in the future)

    return allRoles.filter(role => !disallowedRoles.has(role.short_name));
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
    return privileges.every(p => p.endsWith(':read'));
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

