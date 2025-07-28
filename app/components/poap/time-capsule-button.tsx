import { Button } from "@heroui/react";
import { Icon } from '@iconify/react';
import { PlausibleEvents } from '~/utils/usePlausible';

interface TimeCapsuleButtonProps {
    isTimeCapsuleMode: boolean;
    isTransitioning: boolean;
    totalMomentsCount: number;
    totalPoapsCount: number;
    onToggle: () => void;
    address?: string;
}

export function TimeCapsuleButton({
    isTimeCapsuleMode,
    isTransitioning,
    totalMomentsCount,
    totalPoapsCount,
    onToggle,
    address
}: TimeCapsuleButtonProps) {
    // Custom click handler with tracking
    const handleToggle = () => {
        onToggle();
        // Track time capsule mode changes
        if (address) {
            if (!isTimeCapsuleMode) {
                // Entering Time Capsule mode
                PlausibleEvents.trackTimeCapsuleEnter(address, totalMomentsCount, totalPoapsCount);
            } else {
                // Exiting Time Capsule mode
                PlausibleEvents.trackTimeCapsuleExit(address);
            }
        }
    };
    return (
        <div className="flex justify-center items-center mb-6">
            <Button
                variant={isTimeCapsuleMode ? "solid" : "flat"}
                startContent={!isTimeCapsuleMode ? <Icon icon="fluent:timeline-20-filled" className={`w-6 h-6 ${isTimeCapsuleMode ? 'text-white' : ''}`} /> : <Icon icon="fluent:grid-20-filled" className={`w-6 h-6 ${isTimeCapsuleMode ? 'text-white' : ''}`} />}
                onClick={handleToggle}
                size="lg"
                className={`px-8 py-6 text-base font-medium transition-all duration-300 hover:scale-105 ${isTimeCapsuleMode
                        ? 'bg-gradient-to-r from-background-600 to-background-600 text-white border-2 border-background-400/50'
                        : 'text-white border-2 border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
                    }`}
                disabled={isTransitioning}
            >
                <div className="flex flex-col items-start py-2 gap-1">
                    <span className="text-sm opacity-80">
                        {!isTimeCapsuleMode ?
                            <div><span className="font-semibold font-mono">{totalMomentsCount}</span> Moments</div> :
                            <div><span className="font-semibold font-mono">{totalPoapsCount}</span> POAPs</div>}
                    </span>
                    <span className="text-xl font-semibold">
                        {!isTimeCapsuleMode ? 'Open Time Capsule' : 'Back to Classic View'}
                    </span>
                </div>
            </Button>
        </div>
    );
}
