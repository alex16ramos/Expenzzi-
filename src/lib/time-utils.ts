/**
 * Time Utility Helper for Expenzzi
 * Manages extraction and formatting of real transaction times,
 * handling legacy date-only records with unique realistic fallback times.
 */

export function safeToISOString(dateVal?: Date | string | null): string {
  if (!dateVal) return new Date().toISOString();
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function extractTimeFromItem(
  id: string | number | bigint,
  comentario?: string | null,
  fechaRaw?: string | null
): { cleanComment: string; time: string } {
  let cleanComment = (comentario || '').trim();
  let time = '';

  // 1. Check if comment contains explicit [time:HH:mm] tag
  const match = cleanComment.match(/\[time:(\d{2}:\d{2})\]/);
  if (match) {
    time = match[1];
    cleanComment = cleanComment.replace(/\[time:\d{2}:\d{2}\]/, '').trim();
  }

  // 2. Check if ISO string has non-zero UTC time
  if (!time && fechaRaw && fechaRaw.includes('T')) {
    const d = new Date(fechaRaw);
    if (!isNaN(d.getTime()) && (d.getUTCHours() !== 0 || d.getUTCMinutes() !== 0)) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      time = `${hh}:${mm}`;
    }
  }

  // 3. Fallback for legacy items: generate distinct realistic time based on ID
  if (!time) {
    const numId = Math.abs(Number(id) || 1);
    const baseHour = 9 + ((numId * 3) % 12); // Range: 09:00 to 20:00
    const baseMin = (numId * 17) % 60;
    time = `${String(baseHour).padStart(2, '0')}:${String(baseMin).padStart(2, '0')}`;
  }

  return { cleanComment, time };
}

export function formatCommentWithTime(comentario?: string | null, fechaInput?: string): string {
  let clean = (comentario || '').replace(/\[time:\d{2}:\d{2}\]/g, '').trim();
  
  let timeStr = '';
  if (fechaInput && fechaInput.includes('T')) {
    timeStr = fechaInput.split('T')[1].slice(0, 5);
  } else {
    const now = new Date();
    timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  if (timeStr && /^\d{2}:\d{2}$/.test(timeStr)) {
    clean = clean ? `${clean} [time:${timeStr}]` : `[time:${timeStr}]`;
  }

  return clean;
}
