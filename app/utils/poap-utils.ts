import { POAP } from "~/types/poap";

/**
 * Helper function to get a general description of collection size
 */
export function getCollectionSizeDescription(count: number): string {
    if (count < 5) return "A few POAPs";
    if (count < 10) return "Several POAPs";
    if (count < 20) return "A small collection";
    if (count < 50) return "A modest collection";
    if (count < 100) return "A medium-sized collection";
    if (count < 200) return "A substantial collection";
    if (count < 500) return "A large collection";
    if (count < 1000) return "A very large collection";
    return "An extensive collection";
}

/**
 * Helper function to format address for display
 */
export function formatDisplayAddress(address: string): string {
    if (!address) return '';
    
    // If it's an ENS name (contains a dot), return as is
    if (address.includes('.')) {
        return address;
    }
    
    // If it's an Ethereum address, format it
    if (address.length === 42 && address.startsWith('0x')) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    return address;
}

/**
 * Helper function to format timestamp in a user-friendly way
 */
export function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return 'Just now';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
        // For older timestamps, use date format
        return date.toLocaleDateString();
    }
}

/**
 * Get moments count for a specific POAP drop
 */
export function getMomentsCountOfDrop(poap: POAP, dropsWithMoments: number[]): number {
    const dropId = poap.event.id;
    return dropsWithMoments.includes(dropId) ? 1 : 0;
}
