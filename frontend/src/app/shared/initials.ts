/** Two-letter initials from a full name, e.g. "Sarah Jenkins" -> "SJ", used for avatar placeholders. */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}
