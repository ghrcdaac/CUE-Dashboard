// src/hooks/useMenuSelection.js (NEW FILE)
import { useOutletContext } from 'react-router-dom';
import { useEffect } from 'react';

function useMenuSelection(menuName) {
    const { setSelectedMenu } = useOutletContext();

    useEffect(() => {
        // Check if setSelectedMenu is a function *before* calling it.
        if (typeof setSelectedMenu === 'function') {
            setSelectedMenu(menuName);
        }
    }, [setSelectedMenu, menuName]); // Depend on both
}

export default useMenuSelection;