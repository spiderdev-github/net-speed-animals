# Testing Guide for Net Speed Animals Extension

This guide explains how to run the unit tests for the critical parsers.

## Overview

The extension includes comprehensive unit tests for all CPU, memory, network, disk, and temperature monitoring components. These tests verify:

- Correct parsing of `/proc/*` files
- Handling of edge cases and errors
- Data validation and bounds checking
- Robustness against malformed data

## Test Files

- **`tests.js`** - Main test suite with all unit tests

## Running Tests

### Method 1: GNOME Shell Looking Glass (Recommended for Quick Tests)

1. Press `Alt + F2`
2. Type `lg` and press Enter
3. In the Evaluator tab, paste and run:

```javascript
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Tests = Extension.imports.tests;
Tests.runAllTests();
```

### Method 2: From Extension Enable Hook (Development)

Temporarily add to `extension.js` `enable()` method:

```javascript
// Uncomment for testing
// import { runAllTests } from './tests.js';
// runAllTests();
```

Then restart the extension.

### Method 3: Terminal with GJS (If you have gjs installed)

```bash
cd /home/akhalfi/.local/share/gnome-shell/extensions/net-speed-animals@spiderdev.fr
gjs -m tests.js
```

Note: This may require adjusting imports for standalone execution.

## Test Suites

### NetworkMonitorTests
- `testReadNetDev()` - Verifies /proc/net/dev parsing
- `testMeasureWithZeroTime()` - Tests time delta handling
- `testInterfaceSelection()` - Validates interface filtering
- `testMissingInterface()` - Tests error handling for missing interfaces

### CpuMonitorTests
- `testReadPercent()` - Verifies /proc/stat parsing
- `testPercentBounds()` - Ensures values stay 0-100%
- `testConsecutiveReads()` - Tests sequential measurements

### MemoryMonitorTests
- `testReadPercent()` - Verifies /proc/meminfo parsing
- `testPercentBounds()` - Ensures values stay 0-100%
- `testNonZero()` - Validates realistic memory usage

### DiskMonitorTests
- `testDeviceDetection()` - Verifies /proc/diskstats parsing
- `testReadDiskIO()` - Tests I/O speed calculation
- `testNonNegativeSpeeds()` - Validates non-negative values

### TemperatureMonitorTests
- `testAvailability()` - Checks hardware sensor detection
- `testReadTemperature()` - Tests temperature reading
- `testReasonableBounds()` - Validates temperature range

## Expected Output

```
╔══════════════════════════════════════╗
║ Net Speed Animals - Unit Tests      ║
╚══════════════════════════════════════╝

=== NetworkMonitor Tests ===
✓ testReadNetDev passed
✓ testMeasureWithZeroTime passed
✓ testInterfaceSelection passed
✓ testMissingInterface passed

=== CpuMonitor Tests ===
✓ testReadPercent passed
✓ testPercentBounds passed
✓ testConsecutiveReads passed

... (additional test output)

╔══════════════════════════════════════╗
║ Test Suite Complete                  ║
╚══════════════════════════════════════╝
```

## Interpreting Results

- **✓** - Test passed successfully
- **✗** - Test failed (check error message)
- **⊘** - Test skipped (e.g., no temperature sensors available)
- **Warning** - Test passed but found unusual condition

## Adding New Tests

To add tests for new features:

1. Create a new test class in `tests.js`:
```javascript
export class MyNewMonitorTests {
  static runAll() {
    console.log('=== MyNewMonitor Tests ===');
    this.testFeature1();
    this.testFeature2();
  }
  
  static testFeature1() {
    try {
      // Test logic here
      console.log('✓ testFeature1 passed');
    } catch (e) {
      console.error(`✗ testFeature1 failed: ${e.message}`);
    }
  }
}
```

2. Add to `runAllTests()`:
```javascript
export function runAllTests() {
  // ...existing tests...
  MyNewMonitorTests.runAll();
}
```

## Continuous Testing

For automated testing during development:

```bash
# Watch extension logs
journalctl -f -o cat /usr/bin/gnome-shell

# Or use GNOME Shell's debug logging
G_MESSAGES_DEBUG=all gnome-shell --replace --wayland
```

## Common Issues

### Import Errors
If you get import errors, ensure all paths are correct and the extension is properly installed.

### Permission Errors
Tests read from `/proc/*` and `/sys/*` which require appropriate permissions (usually available by default).

### Missing Hardware
Some tests (e.g., temperature) may skip if hardware sensors are not available. This is normal.

## Contributing

When submitting patches that modify monitors or parsers, please:
1. Review existing tests
2. Add tests for new functionality
3. Ensure all tests pass
4. Include test output in your commit message

---

For more information, see the main README.md or visit the project repository.
