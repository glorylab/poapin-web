import { useEffect } from "react";
import { useSearchParams } from "@remix-run/react";

interface UseAutoTimeCapsuleProps {
    totalMomentsCount: number;
    isTimeCapsuleMode: boolean;
    isTransitioning: boolean;
    handleViewTransition: () => void;
}

export function useAutoTimeCapsule({
    totalMomentsCount,
    isTimeCapsuleMode,
    isTransitioning,
    handleViewTransition
}: UseAutoTimeCapsuleProps) {
    const [searchParams] = useSearchParams();

    // Auto-activate time capsule if URL parameter is present and conditions are met
    useEffect(() => {
        const autoTimeCapsule = searchParams.get('auto_time_capsule');
        
        if (autoTimeCapsule === 'true' && totalMomentsCount > 0 && !isTimeCapsuleMode && !isTransitioning) {
            
            // Remove the query parameter from URL to clean it up
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('auto_time_capsule');
            const newURL = window.location.pathname + (newSearchParams.toString() ? '?' + newSearchParams.toString() : '');
            window.history.replaceState({}, '', newURL);
            
            // Auto-activate time capsule after 2 seconds
            const timer = setTimeout(() => {
                if (!isTimeCapsuleMode && !isTransitioning) {
                    handleViewTransition();
                }
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [searchParams, totalMomentsCount, isTimeCapsuleMode, isTransitioning, handleViewTransition]);
}
