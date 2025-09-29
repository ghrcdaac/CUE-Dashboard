// src/hooks/usePrivileges.js

import { useSelector } from 'react-redux';
import { useCallback } from 'react'; // --- 1. Import useCallback ---

/**
 * A custom hook to check if the current user has a specific privilege.
 * @returns {{hasPrivilege: (privilege: string) => boolean, privileges: string[]}}
 */
function usePrivileges() {
  const user = useSelector((state) => state.auth.user);
  const privileges = user?.privileges || [];

  // --- 2. Wrap the function in useCallback ---
  // This ensures the function reference is stable unless the user's privileges change.
  const hasPrivilege = useCallback((privilege) => {
    return privileges.includes(privilege);
  }, [privileges]); // --- 3. Add privileges as a dependency ---

  return { hasPrivilege, privileges };
}

export default usePrivileges;