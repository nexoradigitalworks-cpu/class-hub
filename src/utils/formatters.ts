/**
 * Format volunteer name to display only first name and initial of last name
 * Example: "Matteo Ferrari" -> "Matteo F."
 * Example: "Matteo C." -> "Matteo C."
 */
export function formatVolunteerName(firstNameOrFullName: string, lastName?: string): string {
  if (!firstNameOrFullName) return '';

  if (lastName && lastName.trim().length > 0) {
    const cleanLast = lastName.trim();
    const cleanChar = cleanLast.replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase();
    return cleanChar ? `${firstNameOrFullName.trim()} ${cleanChar}.` : firstNameOrFullName.trim();
  }

  const trimmed = firstNameOrFullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return trimmed;

  const firstName = parts[0];
  const lastPart = parts.slice(1).join(' ');
  const cleanChar = lastPart.replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase();

  return cleanChar ? `${firstName} ${cleanChar}.` : firstName;
}
