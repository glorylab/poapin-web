import type { POAP } from "~/types/poap";

// Timeline item type for internal use
export interface TimelineItem {
  poap: POAP;
  moments: Moment[];
  hasMoments: boolean;
  date: Date;
}

// Moment interface (extracted from main component)
export interface Moment {
  id: string;
  author: string;
  created_on: string;
  description?: string;
  drops: {
    drop: {
      id: number;
      image_url: string;
      name: string;
      description: string;
      start_date: string;
    };
  }[];
  media?: {
    mime_type: string;
    gateways?: {
      metadata?: {
        size?: number;
        width?: number;
        height?: number;
        gateway_type?: string;
      };
      url: string;
      type: string;
    }[];
  }[];
  links?: {
    url: string;
    title: string;
  }[];
  user_tags?: {
    ens: string | null;
    address: string;
  }[];
}

// Date formatting utilities
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const getDateString = (date: Date): string => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const getMonthString = (date: Date): string => {
  return date.toISOString().substring(0, 7); // YYYY-MM format
};

export const getQuarterString = (date: Date): string => {
  const year = date.getFullYear();
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${year}-Q${quarter}`; // YYYY-Q1 format
};

// Grouping strategy determination
export const determineGroupingStrategy = (items: TimelineItem[]): 'day' | 'month' | 'quarter' => {
  if (items.length === 0) return 'day';

  // Get unique dates
  const uniqueDates = [...new Set(items.map(item => getDateString(item.date)))];

  // If 10 days or fewer, group by day
  if (uniqueDates.length <= 10) return 'day';

  // Check time span
  const dates = items.map(item => item.date).sort((a, b) => a.getTime() - b.getTime());
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
    (lastDate.getMonth() - firstDate.getMonth());

  // If spans less than 1 month, group by day
  if (monthsDiff < 1) return 'day';

  // Try month grouping first
  const uniqueMonths = [...new Set(items.map(item => getMonthString(item.date)))];

  // If 10 months or fewer, group by month
  if (uniqueMonths.length <= 10) return 'month';

  // Otherwise, group by quarter
  return 'quarter';
};

// Group items by strategy
export const groupItemsByStrategy = (
  items: TimelineItem[],
  strategy: 'day' | 'month' | 'quarter'
): TimelineItem[][] => {
  const groups: Record<string, TimelineItem[]> = {};

  items.forEach(item => {
    let key: string;
    switch (strategy) {
      case 'day':
        key = getDateString(item.date);
        break;
      case 'month':
        key = getMonthString(item.date);
        break;
      case 'quarter':
        key = getQuarterString(item.date);
        break;
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });

  // Sort groups by date (newest first)
  return Object.values(groups).sort((a, b) => 
    b[0].date.getTime() - a[0].date.getTime()
  );
};

// Check if items should be grouped by month
export const shouldGroupByMonth = (items: TimelineItem[]): boolean => {
  if (items.length <= 1) return false;
  
  const uniqueDates = [...new Set(items.map(item => getDateString(item.date)))];
  return uniqueDates.length > 10;
};

// Layout calculation utilities
export const calculateUnifiedLayout = (
  containerWidth: number,
  cardWidth: number,
  cardGap: number,
  totalGroups: number
) => {
  const availableWidth = containerWidth;
  const totalCardsWidth = totalGroups * cardWidth;
  const totalGapsWidth = Math.max(0, (totalGroups - 1) * cardGap);
  const totalRequiredWidth = totalCardsWidth + totalGapsWidth;

  let actualGap = cardGap;
  let containerStartX = 0;

  if (totalRequiredWidth <= availableWidth) {
    // Sufficient space: center the layout
    containerStartX = (availableWidth - totalRequiredWidth) / 2;
  } else {
    // Insufficient space: distribute evenly, allow negative gaps (overlap)
    if (totalGroups > 1) {
      actualGap = (availableWidth - totalCardsWidth) / (totalGroups - 1);
    }
    containerStartX = 0;
  }

  return {
    availableWidth,
    actualGap,
    containerStartX,
    totalRequiredWidth
  };
};

// Create timeline items from POAPs and moments
export const createTimelineItems = (
  poaps: POAP[],
  moments: Moment[]
): TimelineItem[] => {
  // Group moments by drop_id for easier lookup
  const momentsByDrop: Record<number, Moment[]> = {};
  moments.forEach(moment => {
    // Each moment can have multiple drops, but typically has one
    if (moment.drops && Array.isArray(moment.drops)) {
      moment.drops.forEach(dropWrapper => {
        if (dropWrapper?.drop?.id) {
          const dropId = dropWrapper.drop.id;
          if (!momentsByDrop[dropId]) {
            momentsByDrop[dropId] = [];
          }
          momentsByDrop[dropId].push(moment);
        }
      });
    }
  });

  // Create all timeline items with chronological sorting
  return poaps.map(poap => {
    // Try both poap.event.id and poap.tokenId for matching
    const poapMoments = momentsByDrop[poap.event.id] || momentsByDrop[Number(poap.tokenId)] || [];
    return {
      poap,
      moments: poapMoments,
      hasMoments: poapMoments.length > 0,
      date: new Date(poap.event.start_date)
    };
  }).sort((a, b) => b.date.getTime() - a.date.getTime());
};
