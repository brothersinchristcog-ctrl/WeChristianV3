/**
 * Formats a YYYY-MM-DD date string to DD-MM-YYYY for display in the UI.
 * This ensures the underlying data remains easily sortable and queryable in Firebase,
 * while the UI presents it in a more user-friendly format for this region.
 * 
 * @param dateString The YYYY-MM-DD string
 * @returns The DD-MM-YYYY formatted string, or the original string if not matched
 */
export const formatDateDisplay = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  // Handle cases where time is appended (e.g. "YYYY-MM-DD • 10:00 AM" or "YYYY-MM-DD   10:00 AM")
  let separator = '';
  if (dateString.includes(' • ')) separator = ' • ';
  else if (dateString.includes('   ')) separator = '   ';
  else if (dateString.includes(' ? ')) separator = ' ? ';

  const dateParts = separator ? dateString.split(separator) : [dateString];
  const actualDate = dateParts[0];
  
  const parts = actualDate.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    if (dateParts.length > 1) {
      return `${formattedDate} • ${dateParts.slice(1).join(separator)}`;
    }
    return formattedDate;
  }
  
  return dateString;
};
