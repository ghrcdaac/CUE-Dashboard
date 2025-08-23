import { useSelector } from 'react-redux';

/**
 * A custom hook to check if the current user has a specific privilege.
 * @returns {{hasPrivilege: (privilege: string) => boolean, privileges: string[]}}
 */
function usePrivileges() {
    // Get the entire user object from the Redux store
    const user = useSelector((state) => state.auth.user);

    // The user's flat list of permissions
    const privileges = user?.privileges || [];

    /**
     * Checks if the user's privilege list includes a specific privilege.
     * @param {string} privilege - The name of the privilege to check (e.g., "create_provider").
     * @returns {boolean} - True if the user has the privilege, false otherwise.
     */
    const hasPrivilege = (privilege) => {
        return privileges.includes(privilege);
    };

    return { hasPrivilege, privileges };
}

export default usePrivileges;
