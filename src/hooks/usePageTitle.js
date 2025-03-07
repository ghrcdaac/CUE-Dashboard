// src/hooks/usePageTitle.js  
import { useState, useEffect } from 'react';

function usePageTitle(title) {
    const [pageTitle, setPageTitle] = useState(title); // Add local state

    useEffect(() => {
        document.title = title ? `CUE - ${title}` : "CUE Dashboard"; // Set document title, default if title is empty
      setPageTitle(title || "CUE Dashboard");     //update the state
    }, [title]);

    return pageTitle; // Return the current title
}

export default usePageTitle;

