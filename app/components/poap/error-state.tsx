import { Button } from "@heroui/react";
import { Link, useNavigate } from "@remix-run/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect } from "react";

interface ErrorStateProps {
    error: string;
    isRateLimit?: boolean;
    address?: string;
    onOpen?: () => void;
}

export function ErrorState({ error, isRateLimit, address, onOpen }: ErrorStateProps) {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

    // Extract retry time from error message
    useEffect(() => {
        if (isRateLimit && error) {
            const match = error.match(/(\d+)\s+seconds/);
            if (match) {
                const seconds = parseInt(match[1], 10);
                setCountdown(seconds);
            }
        }
    }, [error, isRateLimit]);

    // Countdown timer
    useEffect(() => {
        if (countdown === null || countdown <= 0) return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    const handleRetry = async () => {
        if (!address) return;
        
        setIsRetrying(true);
        try {
            // Use navigate with replace to trigger a fresh load
            navigate(`/v/${address}`, { replace: true });
            // Force a hard reload to bypass any caching
            setTimeout(() => {
                window.location.reload();
            }, 100);
        } catch (err) {
            console.error('Retry failed:', err);
            setIsRetrying(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-center text-center p-8 rounded-large bg-background-50 shadow-sm">
                {isRateLimit ? (
                    <>
                        <div className="mb-6 p-4 rounded-full bg-warning-100">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-warning-500"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-medium tracking-tight text-background-800 mb-4">Rate Limit Exceeded</h1>
                        <p className="text-xl text-background-600 mb-4">{error}</p>
                        
                        {countdown !== null && countdown > 0 && (
                            <div className="mb-6 p-4 rounded-lg bg-warning-50 border border-warning-200">
                                <p className="text-warning-700 font-medium mb-2">Auto-retry in:</p>
                                <div className="text-2xl font-mono font-bold text-warning-800">
                                    {formatTime(countdown)}
                                </div>
                            </div>
                        )}
                        
                        <p className="text-medium text-background-500 mb-8">
                            The POAP API is temporarily rate limited to ensure fair usage for all users. 
                            {countdown === null || countdown <= 0 ? ' You can try again now.' : ' Please wait for the countdown to finish.'}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            {address && onOpen && (
                                <Button
                                    className="flex md:hidden border-background-200 hover:border-background-100 bg-background-100 bg-opacity-20 hover:bg-background-100 hover:bg-opacity-70 active:bg-opacity-70 text-background-600 hover:text-background-800 active:text-background-800"
                                    startContent={
                                        <Icon
                                            className="text-background-600 hover:text-background-800 active:text-background-800"
                                            height={16}
                                            icon="solar:filter-linear"
                                            width={16}
                                        />
                                    }
                                    variant="bordered"
                                    onPress={onOpen}
                                >
                                    Filters
                                </Button>
                            )}
                            {address && (
                                <Button 
                                    color="secondary" 
                                    onPress={handleRetry}
                                    isLoading={isRetrying}
                                    isDisabled={countdown !== null && countdown > 0}
                                    startContent={!isRetrying && countdown === null ? 
                                        <Icon icon="solar:refresh-linear" width={16} height={16} /> : undefined
                                    }
                                >
                                    {isRetrying ? 'Retrying...' : 
                                     countdown !== null && countdown > 0 ? `Wait ${formatTime(countdown)}` : 'Try Again'}
                                </Button>
                            )}
                        </div>
                        
                        {countdown === null && (
                            <p className="text-sm text-background-400 mt-4">
                                💡 Tip: Bookmark this page and come back later, or try a different address.
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        <div className="mb-6 p-4 rounded-full bg-danger-100">
                            <Icon 
                                icon="solar:danger-triangle-linear" 
                                width={48} 
                                height={48} 
                                className="text-danger-500"
                            />
                        </div>
                        <h1 className="text-3xl font-medium tracking-tight text-background-800 mb-4">Something went wrong</h1>
                        <p className="text-xl text-background-600 mb-6">{error}</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            {address && (
                                <Button 
                                    color="secondary" 
                                    onPress={handleRetry}
                                    isLoading={isRetrying}
                                    startContent={!isRetrying ? 
                                        <Icon icon="solar:refresh-linear" width={16} height={16} /> : undefined
                                    }
                                >
                                    {isRetrying ? 'Retrying...' : 'Try Again'}
                                </Button>
                            )}
                            <Button color="primary" as={Link} to="/">
                                Go to Homepage
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
