import { useState, useEffect, useCallback } from "react";
import { useAtom } from 'jotai';
import { timeCapsuleModeAtom } from '~/atoms/time-capsule-atoms';

export function useViewTransition() {
    const [isTimeCapsuleMode, setIsTimeCapsuleMode] = useAtom(timeCapsuleModeAtom);
    
    // Animation states for view transitions
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showClassic, setShowClassic] = useState(!isTimeCapsuleMode);
    const [showTimeline, setShowTimeline] = useState(isTimeCapsuleMode);

    // Sync animation states when Time Capsule mode changes externally
    useEffect(() => {
        if (!isTransitioning) {
            setShowClassic(!isTimeCapsuleMode);
            setShowTimeline(isTimeCapsuleMode);
        }
    }, [isTimeCapsuleMode, isTransitioning]);

    // Handle animated view transition
    const handleViewTransition = useCallback(() => {
        if (isTransitioning) return;

        setIsTransitioning(true);

        if (!isTimeCapsuleMode) {
            // Transitioning to timeline: start fade out animation, then switch mode
            setShowClassic(false);  // Trigger fade out animation

            setTimeout(() => {
                setIsTimeCapsuleMode(true);  // Update global state for background
                setShowTimeline(true);       // Show timeline
            }, 300); // Wait for fade out

            setTimeout(() => {
                setIsTransitioning(false);
            }, 800); // Complete transition
        } else {
            // Transitioning to classic: fade out timeline, then fade in classic
            setShowTimeline(false);

            setTimeout(() => {
                setIsTimeCapsuleMode(false); // Update global state for background
                setShowClassic(true);        // Show classic
            }, 300); // Wait for fade out

            setTimeout(() => {
                setIsTransitioning(false);
            }, 800); // Complete transition
        }
    }, [isTimeCapsuleMode, isTransitioning, setIsTimeCapsuleMode]);

    return {
        isTimeCapsuleMode,
        isTransitioning,
        showClassic,
        showTimeline,
        handleViewTransition
    };
}
