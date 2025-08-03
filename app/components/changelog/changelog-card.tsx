import { Card, CardBody, CardHeader, Chip, Spacer } from "@heroui/react";
import { Changelog } from "~/types/changelog";
import { formatISO8601DateWithTimezone } from "~/utils/date-utils";
import { marked } from 'marked';

interface ChangelogCardProps {
    changelog: Changelog;
}

export default function ChangelogCard({ changelog }: ChangelogCardProps) {
    const formattedDate = formatISO8601DateWithTimezone(changelog.release_date);
    
    return (
        <Card className="w-full mb-6">
            <CardHeader className="flex flex-col items-start px-6 pt-6 pb-0">
                <div className="flex justify-between items-start w-full mb-2">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-bold text-foreground">
                            {changelog.title}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <Chip 
                                size="sm" 
                                variant="flat" 
                                color="primary"
                                className="font-mono"
                            >
                                v{changelog.version}
                            </Chip>
                            <span className="text-sm text-foreground-500">
                                {formattedDate}
                            </span>
                        </div>
                    </div>
                </div>
                
                {changelog.tags && changelog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {changelog.tags.map((tag, index) => (
                            <Chip 
                                key={index}
                                size="sm" 
                                variant="bordered"
                                color="secondary"
                            >
                                {tag}
                            </Chip>
                        ))}
                    </div>
                )}
            </CardHeader>
            
            <CardBody className="px-6 pb-6">
                <Spacer y={4} />
                <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div 
                        className="text-foreground-700 leading-relaxed
                                   [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-foreground
                                   [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-foreground
                                   [&_p]:mb-3
                                   [&_img]:rounded-lg [&_img]:shadow-md [&_img]:max-w-full [&_img]:h-auto
                                   [&_code]:bg-content2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
                                   [&_pre]:bg-content2 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4
                                   [&_ul]:mb-3 [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:pl-6
                                   [&_li]:mb-1"
                        dangerouslySetInnerHTML={{ 
                            __html: marked.parse(changelog.content || '', {
                                breaks: true,
                                gfm: true
                            }) as string
                        }}
                    />
                </div>
            </CardBody>
        </Card>
    );
}
