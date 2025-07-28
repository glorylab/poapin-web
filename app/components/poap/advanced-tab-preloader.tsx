import { useEffect, useRef } from 'react';
import { useFetcher, useLocation } from '@remix-run/react';

interface AdvancedTabPreloaderProps {
    address: string;
    currentTab: 'index' | 'profile';
    enabled?: boolean;
}

/**
 * AdvancedTabPreloader - Comprehensive preloading solution for tab switching
 * 
 * Features:
 * 1. Route data preloading via fetcher
 * 2. JavaScript module preloading via dynamic imports
 * 3. Component preloading for instant rendering
 * 4. Smart caching to avoid duplicate requests
 * 5. Progressive enhancement approach
 */
export function AdvancedTabPreloader({ 
    address, 
    currentTab, 
    enabled = true 
}: AdvancedTabPreloaderProps) {
    const fetcher = useFetcher();
    const location = useLocation();
    const preloadedAssets = useRef(new Set<string>());
    const preloadStarted = useRef(false);

    useEffect(() => {
        if (!enabled || !address || preloadStarted.current) return;

        const otherTab = currentTab === 'index' ? 'profile' : 'index';
        const otherTabUrl = currentTab === 'index' 
            ? `/v/${address}/profile`
            : `/v/${address}`;

        // Start comprehensive preloading after a delay
        const preloadTimer = setTimeout(async () => {
            preloadStarted.current = true;

            try {
                // 1. Preload route data
                if (fetcher.state === 'idle' && !preloadedAssets.current.has(`data-${otherTabUrl}`)) {
                    fetcher.load(otherTabUrl);
                    preloadedAssets.current.add(`data-${otherTabUrl}`);
                }

                // 2. Preload JavaScript modules
                if (typeof window !== 'undefined') {
                    const moduleKey = `module-${otherTab}`;
                    if (!preloadedAssets.current.has(moduleKey)) {
                        // Create modulepreload link for faster loading
                        const link = document.createElement('link');
                        link.rel = 'modulepreload';
                        link.as = 'script';
                        
                        // Determine the module path based on the tab
                        if (otherTab === 'profile') {
                            // Preload profile-specific components
                            link.href = `/build/routes/v.$address.profile-*.js`;
                        } else {
                            // Preload index-specific components
                            link.href = `/build/routes/v.$address._index-*.js`;
                        }
                        
                        document.head.appendChild(link);
                        preloadedAssets.current.add(moduleKey);

                        // Clean up after 60 seconds
                        setTimeout(() => {
                            if (document.head.contains(link)) {
                                document.head.removeChild(link);
                            }
                        }, 60000);
                    }

                    // 3. Preload critical assets via link prefetch
                    const assetKey = `assets-${otherTab}`;
                    if (!preloadedAssets.current.has(assetKey)) {
                        // Create prefetch links for critical assets
                        const prefetchLink = document.createElement('link');
                        prefetchLink.rel = 'prefetch';
                        prefetchLink.href = otherTabUrl;
                        document.head.appendChild(prefetchLink);
                        
                        preloadedAssets.current.add(assetKey);

                        // Clean up after 60 seconds
                        setTimeout(() => {
                            if (document.head.contains(prefetchLink)) {
                                document.head.removeChild(prefetchLink);
                            }
                        }, 60000);
                    }
                }

            } catch (error) {
                console.warn('Advanced tab preloading failed:', error);
                preloadStarted.current = false; // Allow retry
            }
        }, 2000); // 2 second delay for non-blocking preload

        return () => clearTimeout(preloadTimer);
    }, [address, currentTab, enabled, fetcher, location.pathname]);

    // This component doesn't render anything
    return null;
}
