// src/utils/date-utils.ts
/**
 * Parse date from DD/MM/YYYY format to Date object
 * @param dateString - Date string in DD/MM/YYYY format
 * @param isEndDate - If true, sets time to end of day (23:59:59), otherwise start of day (00:00:00)
 * @returns Date object
 */
export const parseDateFromDDMMYYYY = (dateString: string, isEndDate: boolean = false): Date => {
  const [day, month, year] = dateString.split('/');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  if (isEndDate) {
    // Set to end of day for due dates
    date.setHours(23, 59, 59, 999);
  } else {
    // Set to start of day for start dates
    date.setHours(0, 0, 0, 0);
  }
  
  return date;
};

/**
 * Format date to DD/MM/YYYY format for API response
 * @param date - Date object
 * @returns formatted date string (DD/MM/YYYY)
 */
export const formatDateToDDMMYYYY = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  return `${day}/${month}/${year}`;
};

/**
 * Format date to DD-MM-YY, HH:MM format (for backward compatibility)
 * @param date - Date object
 * @returns formatted date string (DD-MM-YY, HH:MM)
 */
export const formatDateWithTime = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}-${month}-${year}, ${hours}:${minutes}`;
};
