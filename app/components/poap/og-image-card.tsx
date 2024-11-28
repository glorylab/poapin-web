import { useEffect, useRef, useState } from "react";
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

                const timestamp = new Date().getTime();
                const response = await fetch(
                    `https://og.poap.in/api/poap/status/${address}/${theme}`,
                    {
                        signal: abortControllerRef.current.signal,
                        cache: 'no-store',
                        headers: {
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: OGImageStatus = await response.json();

                if (!isMountedRef.current) return;

                if (data.status === "completed" && data.url) {
                    const imageUrl = new URL(data.url);
                    imageUrl.searchParams.set('_t', timestamp.toString());

                    setState({
                        status: "completed",
                        url: imageUrl.toString(),
                        retryCount: 0
                    });
                } else if (data.status === "not_found") {
                    const triggerUrl = `https://og.poap.in/api/poap/v/${address}/${theme}`;
                    await fetch(triggerUrl);
                    setState(prev => ({
                        status: "pending",
                        url: `${triggerUrl}`,
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
                    const triggerUrl = `https://og.poap.in/api/poap/v/${address}/${theme}`;
                    setState(prev => ({
                        status: "pending",
                        url: data.placeholder_url ? `${data.placeholder_url}` : `${triggerUrl}`,
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
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }
                setState(prev => ({
                    status: "not_found",
                    url: `https://og.poap.in/api/poap/v/${address}/${theme}}`,
                    retryCount: 0
                }));
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
    const [key, setKey] = useState(Date.now());

    useEffect(() => {
        setKey(Date.now());
    }, [imageUrl]);

    return (
        <div className={`relative w-full aspect-[1200/630] rounded-lg overflow-hidden ${className}`}>
            <Image
                key={key}
                src={imageUrl}
                alt={`${address} ${theme} card`}
                classNames={{
                    img: "object-cover w-full h-full"
                }}
            />
        </div>
    );
}