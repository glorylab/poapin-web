import { useEffect } from 'react';
import { useLocation, useFetcher } from '@remix-run/react';

interface TabPreloaderProps {
    address: string;
    currentTab: 'index' | 'profile';
}

/**
 * TabPreloader - Intelligently preloads the other tab's data and components
 * 
 * Strategy:
 * 1. On mount: Start preloading the other tab after a short delay
 * 2. On hover: Immediate preload via prefetch="intent" (handled by NavLink)
 * 3. Caches results to avoid duplicate requests
 */
export function TabPreloader({ address, currentTab }: TabPreloaderProps) {
    const location = useLocation();
    const fetcher = useFetcher();

    useEffect(() => {
        // Determine which tab to preload
        const otherTab = currentTab === 'index' ? 'profile' : 'index';
        const otherTabUrl = currentTab === 'index' 
            ? `/v/${address}/profile`
            : `/v/${address}`;

        // Start preloading after a short delay to avoid blocking initial render
        const preloadTimer = setTimeout(() => {
            // Only preload if we haven't already fetched this route
            if (fetcher.state === 'idle' && !fetcher.data) {
                // Use fetcher.load to preload the route data
                fetcher.load(otherTabUrl);
            }
        }, 1000); // 1 second delay

        return () => clearTimeout(preloadTimer);
    }, [address, currentTab, fetcher, location.pathname]);

    // This component doesn't render anything visible
    return null;
}
