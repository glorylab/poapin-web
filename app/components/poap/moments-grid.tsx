import { type Moment } from "./moments-timeline-types";
import { formatDate } from "./moments-timeline-utils";

interface MomentsGridProps {
  moments: Moment[];
}

export function MomentsGrid({ moments }: MomentsGridProps) {
  return (
    <div className={`grid gap-0 auto-rows-[12rem] ${
      moments.length === 1 ? 'grid-cols-1' :
      moments.length === 2 ? 'grid-cols-2' :
      'grid-cols-2 lg:grid-cols-4'
    }`}>
      {moments.map((moment: Moment, idx) => {
        const thumbnailMedia = moment.media?.find(m =>
          m.gateways?.some(g => g.metadata?.gateway_type === 'thumbnail')
        );
        const thumbnailGateway = thumbnailMedia?.gateways?.find(g =>
          g.metadata?.gateway_type === 'thumbnail'
        ) || thumbnailMedia?.gateways?.[0];

        // Check if this is a video moment
        const videoMedia = moment.media?.find(m =>
          m.mime_type?.startsWith('video/')
        );
        const isVideoMoment = !!videoMedia && !thumbnailGateway;

        const hasMedia = !!thumbnailGateway;
        const hasDescription = !!moment.description;
        const hasLinks = (moment.links?.length ?? 0) > 0;
        const linkPreview = hasLinks ? moment.links?.[0] : null;
        const isOddLast = moments.length % 2 === 1 && idx === moments.length - 1 && moments.length > 2;

        return (
          <div
            key={moment.id}
            className={`relative overflow-hidden ${
              isOddLast ? 'col-span-2 lg:col-span-1' : ''
            }`}
          >
            {hasMedia ? (
              <div className="relative h-full">
                <img
                  src={thumbnailGateway.url}
                  alt="Moment media"
                  className="w-full h-full object-cover"
                />
                {/* Overlay with moment info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  {hasDescription && (
                    <div className="text-white text-xs mb-1 line-clamp-2">
                      {moment.description}
                    </div>
                  )}
                  <div className="text-white/80 text-xs">
                    {formatDate(moment.created_on)}
                  </div>
                </div>
              </div>
            ) : isVideoMoment ? (
              /* Video moment placeholder */
              <div className="relative h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {/* Video icon */}
                <div className="text-white text-center">
                  <div className="text-3xl mb-2">🎬</div>
                  <div className="text-xs font-medium mb-1">Video Moment</div>
                  <div className="text-xs opacity-80">Click to view</div>
                </div>
                {/* Overlay with moment info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  {hasDescription && (
                    <div className="text-white text-xs mb-1 line-clamp-2">
                      {moment.description}
                    </div>
                  )}
                  <div className="text-white/80 text-xs">
                    {formatDate(moment.created_on)}
                  </div>
                </div>
              </div>
            ) : (
              /* Text/Link only moment for desktop */
              <div className="bg-gray-50 dark:bg-gray-800 h-full p-3 flex flex-col justify-between">
                <div>
                  {hasDescription && (
                    <div className="text-gray-900 dark:text-white text-xs mb-2 leading-relaxed line-clamp-3">
                      {moment.description}
                    </div>
                  )}
                  {linkPreview && (
                    <div className="border border-gray-200 dark:border-gray-600 rounded overflow-hidden">
                      {linkPreview.image_url && (
                        <img
                          src={linkPreview.image_url}
                          alt={linkPreview.title}
                          className="w-full h-16 object-cover"
                        />
                      )}
                      <div className="p-1">
                        <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {linkPreview.title}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  {formatDate(moment.created_on)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
