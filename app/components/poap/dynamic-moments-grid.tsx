import { useState, useEffect, useRef } from "react";
import { type Moment } from "./moments-timeline-types";
import { formatDate } from "./moments-timeline-utils";

interface DynamicMomentsGridProps {
  moments: Moment[];
  onLayoutCalculated?: (maxWidth: number) => void;
}

interface MomentDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  hasMedia: boolean;
  isVideo: boolean;
}

const MAX_HEIGHT = 240; // Max height of a moment
const MAX_NON_MEDIA_WIDTH = 350; // Max width of a non-media moment
const GAP_SIZE = 0; // Gap between moments

export function DynamicMomentsGrid({ moments, onLayoutCalculated }: DynamicMomentsGridProps) {
  const [momentDimensions, setMomentDimensions] = useState<MomentDimensions[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate dimensions for each moment
  useEffect(() => {
    const calculateDimensions = () => {
      const dimensions = moments.map((moment): MomentDimensions => {
        const thumbnailMedia = moment.media?.find(m =>
          m.gateways?.some(g => g.metadata?.gateway_type === 'thumbnail')
        );
        const thumbnailGateway = thumbnailMedia?.gateways?.find(g =>
          g.metadata?.gateway_type === 'thumbnail'
        ) || thumbnailMedia?.gateways?.[0];

        const videoMedia = moment.media?.find(m =>
          m.mime_type?.startsWith('video/')
        );
        const isVideo = !!videoMedia && !thumbnailGateway;
        const hasMedia = !!thumbnailGateway;

        if (hasMedia && thumbnailGateway?.metadata) {
          // Get image dimensions from metadata
          const { width: originalWidth, height: originalHeight } = thumbnailGateway.metadata;
          
          if (originalWidth && originalHeight) {
            const aspectRatio = originalWidth / originalHeight;
            const scaledWidth = MAX_HEIGHT * aspectRatio;
            
            return {
              width: scaledWidth,
              height: MAX_HEIGHT,
              aspectRatio,
              hasMedia: true,
              isVideo: false
            };
          }
        }
        
        if (isVideo) {
          // Video content uses 16:9 aspect ratio
          return {
            width: MAX_HEIGHT * (16/9),
            height: MAX_HEIGHT,
            aspectRatio: 16/9,
            hasMedia: false,
            isVideo: true
          };
        }
        
        // Non-media content or media without dimensions uses fixed width
        return {
          width: MAX_NON_MEDIA_WIDTH,
          height: MAX_HEIGHT,
          aspectRatio: MAX_NON_MEDIA_WIDTH / MAX_HEIGHT,
          hasMedia: !!hasMedia,
          isVideo: false
        };
      });
      
      setMomentDimensions(dimensions);
    };

    calculateDimensions();
  }, [moments]);

  // Listen for container width changes
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.offsetWidth;
        if (newWidth !== containerWidth) {
          setContainerWidth(newWidth);
        }
      }
    };

    // Use ResizeObserver to accurately listen for container size changes
    const resizeObserver = new ResizeObserver(updateContainerWidth);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      updateContainerWidth(); // Initialize
    }
    
    // Also listen for window size changes as a fallback
    window.addEventListener('resize', updateContainerWidth);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, [containerWidth]);

  // Calculate dynamic layout
  const calculateLayout = () => {
    // If moments data is empty, return an empty array
    if (!moments.length) return [];
    
    // If dimensions data has not been calculated, return an empty array
    if (!momentDimensions.length) return [];
    
    // If container width is 0, use default width
    const effectiveContainerWidth = containerWidth || 800;

    // Step 1: Distribute moments into rows based on original dimensions
    const rawRows: { moments: Moment[]; dimensions: MomentDimensions[]; totalWidth: number }[] = [];
    let currentRow: { moments: Moment[]; dimensions: MomentDimensions[]; totalWidth: number } = {
      moments: [],
      dimensions: [],
      totalWidth: 0
    };

    momentDimensions.forEach((dim, index) => {
      const moment = moments[index];
      const widthWithGap = dim.width + (currentRow.moments.length > 0 ? GAP_SIZE : 0);
      
      // Check if it can fit in the current row
      if (currentRow.totalWidth + widthWithGap <= effectiveContainerWidth) {
        currentRow.moments.push(moment);
        currentRow.dimensions.push(dim);
        currentRow.totalWidth += widthWithGap;
      } else {
        // If the current row is full, start a new row
        if (currentRow.moments.length > 0) {
          rawRows.push(currentRow);
        }
        currentRow = {
          moments: [moment],
          dimensions: [dim],
          totalWidth: dim.width
        };
      }
    });

    // Add the last row if it's not empty
    if (currentRow.moments.length > 0) {
      rawRows.push(currentRow);
    }

    if (rawRows.length === 0) return [];

    // Step 2: Find the widest row as the target width
    const maxRowWidth = Math.max(...rawRows.map(row => row.totalWidth));
    const targetWidth = Math.min(maxRowWidth, effectiveContainerWidth);

    // Step 3: Adjust each row proportionally to reach the target width
    const adjustedRows = rawRows.map(row => {
      if (row.moments.length === 1) {
        // Single element row, scale directly
        const scaleFactor = targetWidth / row.totalWidth;
        const adjustedDim = {
          ...row.dimensions[0],
          width: row.dimensions[0].width * scaleFactor,
          height: row.dimensions[0].height * scaleFactor
        };
        
        return {
          moments: row.moments,
          dimensions: [adjustedDim],
          totalWidth: targetWidth,
          scaleFactor
        };
      } else {
        // Multiple element row, consider spacing
        const totalGapWidth = (row.moments.length - 1) * GAP_SIZE;
        const availableWidth = targetWidth - totalGapWidth;
        const originalContentWidth = row.totalWidth - totalGapWidth;
        const scaleFactor = availableWidth / originalContentWidth;
        
        const adjustedDimensions = row.dimensions.map(dim => ({
          ...dim,
          width: dim.width * scaleFactor,
          height: dim.height * scaleFactor
        }));
        
        return {
          moments: row.moments,
          dimensions: adjustedDimensions,
          totalWidth: targetWidth,
          scaleFactor
        };
      }
    });

    return adjustedRows;
  };

  const layout = calculateLayout();
  
  // Report actual content width to parent component
  useEffect(() => {
    if (layout.length > 0 && onLayoutCalculated) {
      const maxWidth = Math.max(...layout.map(row => row.totalWidth));
      onLayoutCalculated(maxWidth);
    }
  }, [layout, onLayoutCalculated]);

  return (
    <div ref={containerRef} className="w-full">
      {layout.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-start"
          style={{ gap: `${GAP_SIZE}px` }}
        >
          {row.moments.map((moment, momentIndex) => {
            const dim = row.dimensions[momentIndex];
            
            const thumbnailMedia = moment.media?.find(m =>
              m.gateways?.some(g => g.metadata?.gateway_type === 'thumbnail')
            );
            const thumbnailGateway = thumbnailMedia?.gateways?.find(g =>
              g.metadata?.gateway_type === 'thumbnail'
            ) || thumbnailMedia?.gateways?.[0];

            const videoMedia = moment.media?.find(m =>
              m.mime_type?.startsWith('video/')
            );
            const isVideoMoment = !!videoMedia && !thumbnailGateway;
            const hasMedia = !!thumbnailGateway;
            const hasDescription = !!moment.description;
            const hasLinks = (moment.links?.length ?? 0) > 0;
            const linkPreview = hasLinks ? moment.links?.[0] : null;

            return (
              <div
                key={moment.id}
                className="relative overflow-hidden rounded-none flex-shrink-0"
                style={{
                  width: `${dim.width}px`,
                  height: `${dim.height}px`
                }}
              >
                {hasMedia ? (
                  <div className="relative h-full">
                    <img
                      src={thumbnailGateway.url}
                      alt="Moment media"
                      className="w-full h-full object-contain"
                      style={{
                        width: `${dim.width}px`,
                        height: `${dim.height}px`
                      }}
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
                  /* Text/Link only moment */
                  <div className="bg-gray-50 dark:bg-gray-800 h-full p-3 flex flex-col justify-between">
                    <div>
                      {hasDescription && (
                        <div className="text-gray-900 dark:text-white text-xs mb-2 leading-relaxed line-clamp-3">
                          {moment.description}
                        </div>
                      )}
                      {linkPreview && (
                        <div className="border border-gray-200 dark:border-gray-600 rounded-none overflow-hidden">
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
                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-auto">
                      {formatDate(moment.created_on)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
