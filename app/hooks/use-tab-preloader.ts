import { useEffect, useRef } from 'react';
import { useFetcher } from '@remix-run/react';

interface UseTabPreloaderOptions {
    address: string;
    currentTab: 'index' | 'profile';
    delay?: number; // Delay before starting preload (default: 1000ms)
    enabled?: boolean; // Whether preloading is enabled (default: true)
}

/**
 * useTabPreloader - Smart hook for preloading tab data and components
 * 
 * Features:
 * 1. Automatic preloading after delay
 * 2. Avoids duplicate requests
 * 3. Respects user preferences (can be disabled)
 * 4. Preloads both route data and components
 */
export function useTabPreloader({ 
    address, 
    currentTab, 
    delay = 1000,
    enabled = true 
}: UseTabPreloaderOptions) {
    const fetcher = useFetcher();
    const preloadedRoutes = useRef(new Set<string>());

    useEffect(() => {
        if (!enabled || !address) return;

        // Determine which tab to preload
        const otherTabUrl = currentTab === 'index' 
            ? `/v/${address}/profile`
            : `/v/${address}`;

        // Skip if already preloaded
        if (preloadedRoutes.current.has(otherTabUrl)) {
            return;
        }

        // Start preloading after delay
        const preloadTimer = setTimeout(() => {
            if (fetcher.state === 'idle') {
                try {
                    // Mark as preloaded to avoid duplicates
                    preloadedRoutes.current.add(otherTabUrl);
                    
                    // Preload the route data
                    fetcher.load(otherTabUrl);
                    
                    // Also preload the JavaScript bundle for the route
                    if (typeof window !== 'undefined') {
                        // Create a link element to preload the route's JS bundle
                        const link = document.createElement('link');
                        link.rel = 'modulepreload';
                        link.href = otherTabUrl;
                        document.head.appendChild(link);
                        
                        // Clean up after a delay
                        setTimeout(() => {
                            if (document.head.contains(link)) {
                                document.head.removeChild(link);
                            }
                        }, 30000); // Remove after 30 seconds
                    }
                } catch (error) {
                    console.warn('Tab preloading failed:', error);
                    // Remove from preloaded set so it can be retried
                    preloadedRoutes.current.delete(otherTabUrl);
                }
            }
        }, delay);

        return () => clearTimeout(preloadTimer);
    }, [address, currentTab, delay, enabled, fetcher]);

    return {
        isPreloading: fetcher.state === 'loading',
        preloadError: fetcher.data && typeof fetcher.data === 'object' && 'error' in fetcher.data ? fetcher.data.error : undefined,
        preloadedRoutes: Array.from(preloadedRoutes.current)
    };
}
