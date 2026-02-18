# Constants Documentation

This document explains the centralized configuration system for Net Speed Animals extension.

## Overview

All magic numbers and configuration values have been extracted into `utils/constants.js` to:
- Improve code maintainability
- Make tuning easier
- Provide clear documentation of all thresholds
- Enable easier testing and customization

## File Structure

### `utils/constants.js`

Contains all configuration constants organized into logical sections:

1. **Timing Constants** - Intervals for animations, measurements, auto-saves
2. **Conversion Constants** - Unit conversion factors
3. **Limits & Thresholds** - Bounds and limits for calculations
4. **Graph & Widget Settings** - UI component defaults
5. **File & Path Constants** - System file paths
6. **Size Units** - Array of size unit labels

## Usage

### Importing Constants

```javascript
import { 
  ANIMATION_INTERVAL_MS,
  MEASUREMENT_INTERVAL_MS,
  BYTES_PER_KB
} from './utils/constants.js';
```

### Example: Using Timing Constants

```javascript
// OLD (before refactoring)
this._animController.start(250);  // What is 250? Magic number!

// NEW (after refactoring)
this._animController.start(ANIMATION_INTERVAL_MS);  // Clear intent!
```

### Example: Using Conversion Constants

```javascript
// OLD
const mbit = (bytesPerSec * 8) / 1_000_000;  // Why 8? Why 1_000_000?

// NEW
const mbit = (bytesPerSec * BITS_PER_BYTE) / BITS_PER_MBIT;  // Self-documenting!
```

## Key Constants Reference

### Timing

| Constant | Value | Description |
|----------|-------|-------------|
| `ANIMATION_INTERVAL_MS` | 250 | Animation frame update rate (ms) |
| `MEASUREMENT_INTERVAL_MS` | 1000 | System metrics measurement rate (ms) |
| `STATS_AUTOSAVE_INTERVAL_SEC` | 60 | Statistics save frequency (seconds) |
| `NOTIFICATION_COOLDOWN_MS` | 300000 | Notification spam prevention (5 minutes) |
| `RESTART_DELAY_MS` | 300 | Extension restart delay (ms) |

### Conversions

| Constant | Value | Description |
|----------|-------|-------------|
| `BYTES_PER_KB` | 1024 | Binary kilobyte conversion |
| `BITS_PER_MBIT` | 1,000,000 | Decimal megabit conversion |
| `BITS_PER_BYTE` | 8 | Bits in a byte |
| `BYTES_PER_SECTOR` | 512 | Standard disk sector size |
| `MICROSECONDS_PER_SECOND` | 1,000,000 | Time conversion |

### Limits

| Constant | Value | Description |
|----------|-------|-------------|
| `MIN_TIME_DELTA_SEC` | 0.001 | Prevents division by zero in speed calculations |
| `MAX_PERCENT` | 100 | Upper bound for percentage values |
| `MIN_PERCENT` | 0 | Lower bound for percentage values |
| `DEFAULT_MAX_SPEED_MBIT` | 100 | Fallback max speed for animation |

### Graphs

| Constant | Value | Description |
|----------|-------|-------------|
| `GRAPH_WIDTH` | 300 | Default graph width (pixels) |
| `GRAPH_HEIGHT` | 60 | Default graph height (pixels) |
| `GRAPH_MAX_DATA_POINTS` | 60 | Data points to store (60 seconds @ 1Hz) |

### System Paths

| Constant | Value | Description |
|----------|-------|-------------|
| `PROC_PATHS.NET_DEV` | '/proc/net/dev' | Network interface statistics |
| `PROC_PATHS.STAT` | '/proc/stat' | CPU statistics |
| `PROC_PATHS.MEMINFO` | '/proc/meminfo' | Memory information |
| `PROC_PATHS.DISKSTATS` | '/proc/diskstats' | Disk I/O statistics |
| `THERMAL_PATHS.THERMAL_CLASS` | '/sys/class/thermal' | Temperature sensors |
| `THERMAL_PATHS.HWMON` | '/sys/class/hwmon' | Hardware monitoring |

## Customization Guide

### Changing Animation Speed

Edit `ANIMATION_INTERVAL_MS` in `utils/constants.js`:

```javascript
// Faster animation (smoother but more CPU)
export const ANIMATION_INTERVAL_MS = 125;  // 8 FPS

// Default
export const ANIMATION_INTERVAL_MS = 250;  // 4 FPS

// Slower animation (less CPU usage)
export const ANIMATION_INTERVAL_MS = 500;  // 2 FPS
```

### Changing Measurement Frequency

Edit `MEASUREMENT_INTERVAL_MS`:

```javascript
// More responsive (updates twice per second)
export const MEASUREMENT_INTERVAL_MS = 500;

// Default (once per second)
export const MEASUREMENT_INTERVAL_MS = 1000;

// Less frequent (every 2 seconds, saves CPU)
export const MEASUREMENT_INTERVAL_MS = 2000;
```

### Adjusting Notification Cooldown

Edit `NOTIFICATION_COOLDOWN_MS`:

```javascript
// Shorter cooldown (more frequent notifications)
export const NOTIFICATION_COOLDOWN_MS = 2 * 60 * 1000;  // 2 minutes

// Default
export const NOTIFICATION_COOLDOWN_MS = 5 * 60 * 1000;  // 5 minutes

// Longer cooldown (less interruption)
export const NOTIFICATION_COOLDOWN_MS = 10 * 60 * 1000;  // 10 minutes
```

## Benefits of This Approach

### 1. Self-Documenting Code
Instead of seeing `250` in code, you see `ANIMATION_INTERVAL_MS`, making intent clear.

### 2. Single Source of Truth
Change a value once in `constants.js`, it updates everywhere it's used.

### 3. Easier Testing
Mock constants during testing without changing production code.

### 4. Type Safety
Constants can be documented with JSDoc types for better IDE support.

### 5. Maintainability
Future developers can quickly find and understand all configuration values.

## Adding New Constants

When adding new hardcoded values:

1. **Check if it's truly a constant** - Is it configuration or business logic?

2. **Add to appropriate section** in `constants.js`:
```javascript
/**
 * Description of what this constant controls
 * @type {number} unit
 */
export const MY_NEW_CONSTANT = 42;
```

3. **Import where needed**:
```javascript
import { MY_NEW_CONSTANT } from './utils/constants.js';
```

4. **Update this documentation** with the new constant.

## Migration Checklist

When refactoring code to use constants:

- [ ] Identify magic number/string
- [ ] Add to `constants.js` with documentation
- [ ] Import constant in target file
- [ ] Replace magic value with constant
- [ ] Update documentation
- [ ] Run tests to verify behavior unchanged

## Best Practices

1. **Use descriptive names** - `ANIMATION_INTERVAL_MS` not `ANIM_INT`
2. **Include units** - `_MS`, `_SEC`, `_BYTES` etc. in name
3. **Group related constants** - Keep timing constants together
4. **Document why** - Explain reasoning for specific values
5. **Avoid over-extraction** - Don't extract every single number

## See Also

- [TESTING.md](TESTING.md) - Unit test documentation
- [extension.js](extension.js) - Main extension file
- [utils/constants.js](utils/constants.js) - Constants source file
