/**
 *
 * @param duration - The duration in milliseconds
 * @returns The formatted duration in HH:MM:SS format
 */
export function format_HHMMSS(duration?: number): string {
  if (!duration) return '00:00';

  let seconds = Math.floor(duration / 1000);
  let minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  minutes %= 60;
  seconds %= 60;

  return (
    (hours > 0 ? hours.toString().padStart(2, '0') + ':' : '') +
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  );
}

export function format_HHMM_verbose(duration?: number): string {
  if (!duration) return '';

  let seconds = Math.floor(duration / 1000);
  let minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  minutes %= 60;
  seconds %= 60;

  return (
    (hours > 0 ? hours + ' hr ' : '') +
    (minutes > 0 ? minutes + ' min ' : '') +
    (seconds > 0 ? seconds + ' sec' : '')
  );
}
