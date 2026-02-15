// Clamp a number between min and max
export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Format bytes to human-readable format (B, KB, MB, GB, TB)
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// Format speed (bytes per second) to human-readable format
export function formatSpeed(bytesPerSec) {
  if (bytesPerSec === null || bytesPerSec === undefined || bytesPerSec === 0) {
    return '0 B/s';
  }

  const mbit = (bytesPerSec * 8) / 1_000_000;

  // If speed is >= 1 Mbit/s, show in Mbit/s
  if (mbit >= 1.0) {
    return `${mbit.toFixed(1)} Mbit/s`;
  }

  // If speed is >= 1 KB/s, show in KB/s
  const kbytes = bytesPerSec / 1024;
  if (kbytes >= 1.0) {
    return `${kbytes.toFixed(1)} KB/s`;
  }

  // Otherwise show in B/s
  return `${Math.round(bytesPerSec)} B/s`;
}

// Format percentage with one decimal place
export function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

// Format temperature in Celsius
export function formatTemp(celsius) {
  return `${Math.round(celsius)}°C`;
}
