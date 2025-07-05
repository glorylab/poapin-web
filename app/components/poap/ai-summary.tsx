import { Button, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { formatDisplayAddress, formatTimestamp } from "~/utils/poap-utils";

interface AiSummaryProps {
    aiSummary: string;
    aiGenerationTime: string | null;
    address: string;
}

export function AiSummary({ aiSummary, aiGenerationTime, address }: AiSummaryProps) {
    if (!aiSummary) return null;

    return (
        <div className="flex flex-col gap-2 p-4 bg-secondary-50 bg-opacity-90 backdrop-blur-sm rounded-medium mx-auto mb-4">
            <h2 className="text-medium font-medium text-background-700">
                Quick Insights: {formatDisplayAddress(address)}
            </h2>
            <p className="text-background-800">{aiSummary}</p>
            <div className="flex justify-between items-center">
                <div></div> {/* Empty div to push the popover to the right */}
                <Popover>
                    <PopoverTrigger>
                        <Button size="sm" variant="light" className="flex items-center gap-1 text-xs text-background-500">
                            <Icon icon="basil:info-rect-solid" width="24" height="24" />
                            {aiGenerationTime ? formatTimestamp(aiGenerationTime) : 'Unknown'}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        {(titleProps) => (
                            <div className="px-3 py-2 max-w-xs">
                                <h3 className="text-small font-bold" {...titleProps}>
                                    Quick Insights
                                </h3>
                                <div className="text-tiny mt-1">
                                    We periodically analyze POAP collections to help you quickly understand {formatDisplayAddress(address)}'s POAP footprint.
                                </div>
                                <div className="text-tiny mt-2 text-background-500">
                                    Generated on: {aiGenerationTime ? new Date(aiGenerationTime).toLocaleString() : 'Unknown'}
                                </div>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
