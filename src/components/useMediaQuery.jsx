import { useState, useEffect } from 'react';

// this was for responsiveness for sm and md devices
const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(window.matchMedia(query).matches);

    useEffect(() => {
        const mediaQueryList = window.matchMedia(query);
        const handler = (event) => setMatches(event.matches);

        mediaQueryList.addEventListener('change', handler);
        return () => mediaQueryList.removeEventListener('change', handler);
    }, [query]);

    return matches;
};

export default useMediaQuery;
