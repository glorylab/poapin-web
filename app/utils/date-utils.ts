/**
 * Formats a date string to ISO 8601 format
 * @param dateString The date string to format
 * @param includeTime Whether to include time in the result (default: false)
 * @returns Formatted date string in ISO 8601 format
 */
export function formatISO8601Date(dateString: string, includeTime: boolean = false): string {
    if (!dateString) return '';
    
    try {
        // Try to parse the date
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            // If valid date, return ISO string
            if (includeTime) {
                return date.toISOString(); // Full ISO with time and timezone: YYYY-MM-DDTHH:mm:ss.sssZ
            } else {
                return date.toISOString().split('T')[0]; // Just date part: YYYY-MM-DD
            }
        }
    } catch (e) {
        console.error('Error formatting date:', e);
    }
    
    // If we couldn't parse the date, return the original string
    return dateString;
}

/**
 * Formats a date string to ISO 8601 format with timezone information
 * @param dateString The date string to format
 * @returns Formatted date string in ISO 8601 format with timezone
 */
export function formatISO8601DateWithTimezone(dateString: string): string {
    if (!dateString) return '';
    
    try {
        // Try to parse the date
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            // If valid date, return full ISO string with timezone
            return date.toISOString();
        }
    } catch (e) {
        console.error('Error formatting date with timezone:', e);
    }
    
    // Fallback: manually append Z if it has T but no timezone
    if (dateString.includes('T') && 
        !dateString.endsWith('Z') && 
        !dateString.includes('+') && 
        !dateString.includes('-')) {
        return `${dateString}Z`;
    }
    
    // If we couldn't parse the date, return the original string
    return dateString;
}
