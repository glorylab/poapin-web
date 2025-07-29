import React from 'react';
import { Card, CardBody, Image } from "@heroui/react";
import type { TimelineItem, Moment } from "./moments-timeline-utils";
import { formatDate } from "./moments-timeline-utils";

interface PoapWithMomentsProps {
  item: TimelineItem;
  isInTimeCapsule: boolean;
}

export const PoapWithMoments: React.FC<PoapWithMomentsProps> = ({ 
  item, 
  isInTimeCapsule 
}) => {
  const animationClass = isInTimeCapsule 
    ? 'animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 ease-out' 
    : '';

  return (
    <div className={`mb-8 ${animationClass}`}>
      {/* Mobile Layout: Stacked */}
      <div className="block sm:hidden">
        {/* POAP Header */}
        <div className="flex items-center mb-4 p-4 bg-background-100 rounded-lg">
          <img
            src={item.poap.event.image_url}
            alt={item.poap.event.name}
            className="w-16 h-16 rounded-lg object-cover mr-4"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {item.poap.event.name}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-bold text-lg font-mono text-background mb-1">
                {formatDate(item.poap.event.start_date)}
              </p>
              <p>
                {item.moments.length} moment{item.moments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Moments Grid */}
        <div className={`grid gap-2 auto-rows-[12rem] ${
          item.moments.length === 1 ? 'grid-cols-1' :
          item.moments.length === 2 ? 'grid-cols-2' :
          'grid-cols-2'
        }`}>
          {item.moments.map((moment: Moment, idx) => (
            <MomentCard key={moment.id} moment={moment} />
          ))}
        </div>
      </div>

      {/* Desktop Layout: Side by side */}
      <div className="hidden sm:flex">
        {/* POAP Image and Date Info */}
        <div className="flex-shrink-0 p-2">
          <img
            src={item.poap.event.image_url}
            alt={item.poap.event.name}
            className="w-20 h-20 rounded-lg object-cover mb-3"
          />
          <div className="w-20">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <p className="font-bold text-lg font-mono text-background mb-1">
                {formatDate(item.poap.event.start_date)}
              </p>
              <p>
                {item.moments.length} moment{item.moments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Moments - Responsive grid with overlay title */}
        <div className="flex-1 relative">
          {/* Overlay POAP Title */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 pb-8">
            <h3 className="text-lg font-semibold text-white mb-1">
              {item.poap.event.name}
            </h3>
          </div>

          <div className={`grid gap-0 auto-rows-[12rem] ${
            item.moments.length === 1 ? 'grid-cols-1' :
            item.moments.length === 2 ? 'grid-cols-2' :
            'grid-cols-2 lg:grid-cols-4'
          }`}>
            {item.moments.map((moment: Moment, idx) => (
              <MomentCard key={moment.id} moment={moment} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Moment card component for individual moments
interface MomentCardProps {
  moment: Moment;
}

const MomentCard: React.FC<MomentCardProps> = ({ moment }) => {
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

  return (
    <div className="relative overflow-hidden">
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
        <div className="h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
          <div className="text-center text-white">
            <div className="text-4xl mb-2">🎥</div>
            <div className="text-sm font-medium mb-2">Video Moment</div>
            {hasDescription && (
              <div className="text-xs opacity-90 line-clamp-3 mb-2">
                {moment.description}
              </div>
            )}
            <div className="text-xs opacity-75">
              {formatDate(moment.created_on)}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full bg-gradient-to-br from-blue-500 to-purple-500 flex flex-col justify-between p-4">
          <div>
            {hasDescription && (
              <div className="text-white text-sm mb-3 line-clamp-4">
                {moment.description}
              </div>
            )}
            {linkPreview && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg overflow-hidden">
                {linkPreview.title && (
                  <div className="p-2">
                    <div className="text-xs font-medium text-white truncate">
                      {linkPreview.title}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-white/80 text-xs mt-2">
            {formatDate(moment.created_on)}
          </div>
        </div>
      )}
    </div>
  );
};
