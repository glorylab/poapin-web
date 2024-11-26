import { useEffect, useRef } from "react";
import { Image } from "@nextui-org/react";
import { useAtom } from 'jotai';
import { createOGImageAtom, ogImageAtomsMap } from '../../atoms/og-image-atom';

interface OGImageStatus {
    status: "completed" | "not_found" | "pending";
    url?: string;
    message?: string;
    placeholder_url?: string;
}

interface OGImageCardProps {
    address: string;
    theme: "default" | "letter";
    className?: string;
}

function useOGImage(address: string, theme: "default" | "letter") {
    const key = `${address}-${theme}`;
    if (!ogImageAtomsMap.has(key)) {
        ogImageAtomsMap.set(key, createOGImageAtom(address, theme));
    }
    const ogImageAtom = ogImageAtomsMap.get(key)!;
    const [state, setState] = useAtom(ogImageAtom);

    const abortControllerRef = useRef<AbortController>();
    const timeoutIdRef = useRef<NodeJS.Timeout>();
    const isMountedRef = useRef(true);
    const MAX_RETRIES = 60;
    const RETRY_INTERVAL = 1000;

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const checkImageStatus = async () => {
            try {
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
                
                abortControllerRef.current = new AbortController();

                console.log(`[${theme}] Fetching status...`);
                const response = await fetch(
                    `https://og.poap.in/api/poap/status/${address}/${theme}`,
                    { 
                        signal: abortControllerRef.current.signal,
                        cache: 'no-store'
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: OGImageStatus = await response.json();
                console.log(`[${theme}] Response:`, data);

                if (!isMountedRef.current) return;

                if (data.status === "completed" && data.url) {
                    console.log(`[${theme}] Completed with URL:`, data.url);
                    setState({
                        status: "completed",
                        url: data.url,
                        retryCount: 0
                    });
                } else if (data.status === "not_found") {
                    console.log(`[${theme}] Not found, triggering generation...`);
                    const triggerUrl = `https://og.poap.in/api/poap/v/${address}/${theme}`;
                    await fetch(triggerUrl);
                    setState(prev => ({
                        status: "pending",
                        url: `https://og.poap.in/api/poap/v/${address}/${theme}`,
                        retryCount: 0
                    }));
                    
                    if (timeoutIdRef.current) {
                        clearTimeout(timeoutIdRef.current);
                    }
                    
                    timeoutIdRef.current = setTimeout(() => {
                        if (isMountedRef.current) {
                            checkImageStatus();
                        }
                    }, RETRY_INTERVAL);
                } else if (data.status === "pending" && state.retryCount < MAX_RETRIES) {
                    console.log(`[${theme}] Pending, retry count:`, state.retryCount);
                    setState(prev => ({
                        status: "pending",
                        url: data.placeholder_url || `https://og.poap.in/api/poap/v/${address}/${theme}`,
                        retryCount: prev.retryCount + 1
                    }));
                    
                    if (timeoutIdRef.current) {
                        clearTimeout(timeoutIdRef.current);
                    }
                    
                    timeoutIdRef.current = setTimeout(() => {
                        if (isMountedRef.current && state.status === "pending") {
                            checkImageStatus();
                        }
                    }, RETRY_INTERVAL);
                } else {
                    console.log(`[${theme}] Max retries reached or unknown status`);
                    setState({
                        status: "not_found",
                        url: `https://og.poap.in/api/poap/v/${address}/${theme}`,
                        retryCount: 0
                    });
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    console.log(`[${theme}] Request aborted`);
                    return;
                }
                console.error(`[${theme}] Error:`, error);
                setState({
                    status: "not_found",
                    url: `https://og.poap.in/api/poap/v/${address}/${theme}`,
                    retryCount: 0
                });
            }
        };

        if (state.status === "pending" || state.status === "not_found") {
            checkImageStatus();
        }

        return () => {
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [address, theme, state.status, state.retryCount]);

    return state.url;
}

export function OGImageCard({ address, theme, className }: OGImageCardProps) {
    const imageUrl = useOGImage(address, theme);

    return (
        <div className={`relative w-full aspect-[1200/630] rounded-lg overflow-hidden ${className}`}>
            <Image
                src={imageUrl}
                alt={`${address} ${theme} card`}
                classNames={{
                    img: "object-cover w-full h-full"
                }}
            />
        </div>
    );
}