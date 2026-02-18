/**
 * Constants - Centralized configuration values
 * 
 * This file contains all magic numbers and configuration constants
 * used throughout the extension for better maintainability.
 */

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

/**
 * Animation frame interval in milliseconds
 * Controls how often the animal icon animation updates
 * @type {number} milliseconds
 */
export const ANIMATION_INTERVAL_MS = 250;

/**
 * Measurement interval in milliseconds
 * Controls how often network/system metrics are measured
 * @type {number} milliseconds
 */
export const MEASUREMENT_INTERVAL_MS = 1000;

/**
 * Statistics auto-save interval in seconds
 * Controls how often network usage statistics are persisted to disk
 * @type {number} seconds
 */
export const STATS_AUTOSAVE_INTERVAL_SEC = 60;

/**
 * Notification cooldown period in milliseconds
 * Prevents notification spam by enforcing minimum time between similar alerts
 * @type {number} milliseconds (5 minutes)
 */
export const NOTIFICATION_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Extension restart delay in milliseconds
 * Wait time before re-enabling extension after restart command
 * @type {number} milliseconds
 */
export const RESTART_DELAY_MS = 300;

// ============================================================================
// CONVERSION CONSTANTS
// ============================================================================

/**
 * Bytes per kilobyte (binary)
 * @type {number}
 */
export const BYTES_PER_KB = 1024;

/**
 * Bits per megabit (decimal)
 * @type {number}
 */
export const BITS_PER_MBIT = 1_000_000;

/**
 * Bytes per disk sector (standard size)
 * @type {number}
 */
export const BYTES_PER_SECTOR = 512;

/**
 * Microseconds per second
 * @type {number}
 */
export const MICROSECONDS_PER_SECOND = 1_000_000;

/**
 * Bits per byte
 * @type {number}
 */
export const BITS_PER_BYTE = 8;

// ============================================================================
// LIMITS & THRESHOLDS
// ============================================================================

/**
 * Minimum time delta for speed calculation to avoid division by zero
 * @type {number} seconds
 */
export const MIN_TIME_DELTA_SEC = 0.001;

/**
 * Maximum percentage value (used for clamping CPU/memory percentages)
 * @type {number}
 */
export const MAX_PERCENT = 100;

/**
 * Minimum percentage value (used for clamping CPU/memory percentages)
 * @type {number}
 */
export const MIN_PERCENT = 0;

/**
 * Default maximum speed for animation scaling
 * Used when rabbit threshold * 2 would be less than this
 * @type {number} Mbit/s
 */
export const DEFAULT_MAX_SPEED_MBIT = 100;

/**
 * Animation speed multiplier for threshold calculation
 * @type {number}
 */
export const SPEED_THRESHOLD_MULTIPLIER = 2;

// ============================================================================
// GRAPH & WIDGET SETTINGS
// ============================================================================

/**
 * Default number of data points in graphs
 * Represents 60 seconds of data at 1-second intervals
 * @type {number}
 */
export const GRAPH_MAX_DATA_POINTS = 60;

/**
 * Default graph width in pixels
 * @type {number}
 */
export const GRAPH_WIDTH = 300;

/**
 * Default graph height in pixels
 * @type {number}
 */
export const GRAPH_HEIGHT = 60;

// ============================================================================
// FILE & PATH CONSTANTS
// ============================================================================

/**
 * Linux proc filesystem paths
 */
export const PROC_PATHS = {
  NET_DEV: '/proc/net/dev',
  STAT: '/proc/stat',
  MEMINFO: '/proc/meminfo',
  DISKSTATS: '/proc/diskstats',
};

/**
 * System thermal paths
 */
export const THERMAL_PATHS = {
  THERMAL_CLASS: '/sys/class/thermal',
  HWMON: '/sys/class/hwmon',
};

// ============================================================================
// SIZE UNITS
// ============================================================================

/**
 * Byte size unit labels
 * @type {string[]}
 */
export const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/**
 * Powers of 1024 for GB calculation (for quota notifications)
 * @type {number}
 */
export const BYTES_TO_GB_POWER = 3;
