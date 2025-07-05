import { Button } from "@heroui/react";
import { Link } from "@remix-run/react";
import { Icon } from "@iconify/react/dist/iconify.js";

interface ErrorStateProps {
    error: string;
    isRateLimit?: boolean;
    address?: string;
    onOpen?: () => void;
}

export function ErrorState({ error, isRateLimit, address, onOpen }: ErrorStateProps) {
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
                        <p className="text-xl text-background-600 mb-6">{error}</p>
                        <p className="text-medium text-background-500 mb-8">The POAP API is currently rate limited. This helps ensure fair usage for all users.</p>
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
                                <Button color="secondary" as={Link} to={`/v/${address}`} reloadDocument>
                                    Try Again
                                </Button>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="text-4xl font-medium tracking-tight text-background-800">{error}</h1>
                        <Button className="mt-8" color="primary" as={Link} to="/">
                            Go to Homepage
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
