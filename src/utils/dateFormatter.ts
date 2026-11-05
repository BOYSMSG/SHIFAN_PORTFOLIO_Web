/**
 * Standardized Date and Time Formatter for SHIFAN Portfolio
 *
 * Mandatory standard:
 * - Timestamps stored in UTC (ISO 8601)
 * - Timestamps displayed in Asia/Kolkata (IST)
 * - Handles invalid or missing timestamps gracefully
 */

export function formatDateTimeIST(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';

    const formatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);

    return `${formatted} IST`;
  } catch {
    return '—';
  }
}

export function formatTimeAgo(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';

    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return 'just now';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;

    return formatDateTimeIST(isoString);
  } catch {
    return '';
  }
}
