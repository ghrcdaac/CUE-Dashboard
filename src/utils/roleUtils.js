// src/utils/roleUtils.js

/**
 * Filters a list of all roles down to only those the current user can assign.
 * @param {Array} allRoles - The complete list of role objects from the API.
 * @param {Array} currentUserRoles - A list of the current user's role names (e.g., ['admin']).
 * @returns {Array} The filtered list of role objects.
 */
export const getEditableRoles = (allRoles, currentUserRoles = []) => {
    if (currentUserRoles.includes('admin')) {
        return allRoles; // Admins can assign any role
    }
    
    const allowedRoleNames = new Set();
    if (currentUserRoles.includes('daac_manager')) {
        // DAAC Managers can assign these specific roles
        ['DAAC Staff', 'DAAC Observer', 'Provider'].forEach(r => allowedRoleNames.add(r));
    }
    if (currentUserRoles.includes('security')) {
        // Security can only assign the Security role
        allowedRoleNames.add('Security');
    }

    return allRoles.filter(role => allowedRoleNames.has(role.long_name));
};