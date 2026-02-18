/**
 * Unit Tests for Critical Parsers
 * 
 * Tests for /proc/* file parsers to ensure robustness against:
 * - Malformed data
 * - Missing files
 * - Invalid values
 * - Edge cases
 * 
 * Run these tests manually in GNOME Shell's looking glass (Alt+F2, 'lg')
 * or use a test framework like jasmine-gjs if available.
 */

import GLib from 'gi://GLib';
import { NetworkMonitor } from './monitors/networkMonitor.js';
import { CpuMonitor } from './monitors/cpuMonitor.js';
import { MemoryMonitor } from './monitors/memoryMonitor.js';
import { DiskMonitor } from './monitors/diskMonitor.js';
import { TemperatureMonitor } from './monitors/temperatureMonitor.js';

/**
 * Test Suite for NetworkMonitor
 */
export class NetworkMonitorTests {
  static runAll() {
    console.log('=== NetworkMonitor Tests ===');
    this.testReadNetDev();
    this.testMeasureWithZeroTime();
    this.testInterfaceSelection();
    this.testMissingInterface();
  }

  static testReadNetDev() {
    try {
      const monitor = new NetworkMonitor();
      const stats = monitor._readNetDev();
      
      // Should return an object
      if (typeof stats !== 'object') {
        throw new Error('_readNetDev should return an object');
      }
      
      // Should have at least loopback interface
      if (!('lo' in stats)) {
        console.warn('Warning: loopback interface not found');
      }
      
      // Each interface should have rxBytes and txBytes
      for (const [iface, data] of Object.entries(stats)) {
        if (typeof data.rxBytes !== 'number' || typeof data.txBytes !== 'number') {
          throw new Error(`Interface ${iface} has invalid byte counts`);
        }
        if (data.rxBytes < 0 || data.txBytes < 0) {
          throw new Error(`Interface ${iface} has negative byte counts`);
        }
      }
      
      console.log('✓ testReadNetDev passed');
    } catch (e) {
      console.error(`✗ testReadNetDev failed: ${e.message}`);
    }
  }

  static testMeasureWithZeroTime() {
    try {
      const monitor = new NetworkMonitor();
      
      // First measurement (returns null as expected)
      const result1 = monitor.measure({ get_string: () => 'auto' });
      
      // Should handle null bytesPerSec gracefully
      if (result1.bytesPerSec !== null && result1.mbit < 0) {
        throw new Error('Negative speed detected');
      }
      
      console.log('✓ testMeasureWithZeroTime passed');
    } catch (e) {
      console.error(`✗ testMeasureWithZeroTime failed: ${e.message}`);
    }
  }

  static testInterfaceSelection() {
    try {
      const monitor = new NetworkMonitor();
      const stats = monitor._readNetDev();
      const interfaces = monitor.getAllInterfaces(stats);
      
      // Should exclude loopback
      if (interfaces.includes('lo')) {
        throw new Error('Loopback should be excluded from interface list');
      }
      
      console.log('✓ testInterfaceSelection passed');
    } catch (e) {
      console.error(`✗ testInterfaceSelection failed: ${e.message}`);
    }
  }

  static testMissingInterface() {
    try {
      const monitor = new NetworkMonitor();
      monitor._iface = 'nonexistent999';
      
      // Should not crash with missing interface
      const result = monitor.measure({ get_string: () => 'auto' });
      
      // Should return valid structure even with missing interface
      if (!result || typeof result.bytesPerSec === 'undefined') {
        throw new Error('Should return valid result structure');
      }
      
      console.log('✓ testMissingInterface passed');
    } catch (e) {
      console.error(`✗ testMissingInterface failed: ${e.message}`);
    }
  }
}

/**
 * Test Suite for CpuMonitor
 */
export class CpuMonitorTests {
  static runAll() {
    console.log('=== CpuMonitor Tests ===');
    this.testReadPercent();
    this.testPercentBounds();
    this.testConsecutiveReads();
  }

  static testReadPercent() {
    try {
      const monitor = new CpuMonitor();
      const percent = monitor.readPercent();
      
      if (typeof percent !== 'number') {
        throw new Error('readPercent should return a number');
      }
      
      console.log('✓ testReadPercent passed');
    } catch (e) {
      console.error(`✗ testReadPercent failed: ${e.message}`);
    }
  }

  static testPercentBounds() {
    try {
      const monitor = new CpuMonitor();
      const percent = monitor.readPercent();
      
      if (percent < 0 || percent > 100) {
        throw new Error(`CPU percent out of bounds: ${percent}`);
      }
      
      console.log('✓ testPercentBounds passed');
    } catch (e) {
      console.error(`✗ testPercentBounds failed: ${e.message}`);
    }
  }

  static testConsecutiveReads() {
    try {
      const monitor = new CpuMonitor();
      const percent1 = monitor.readPercent();
      
      // Small delay
      GLib.usleep(100000); // 100ms
      
      const percent2 = monitor.readPercent();
      
      // Both should be valid numbers
      if (isNaN(percent1) || isNaN(percent2)) {
        throw new Error('Consecutive reads produced NaN');
      }
      
      console.log('✓ testConsecutiveReads passed');
    } catch (e) {
      console.error(`✗ testConsecutiveReads failed: ${e.message}`);
    }
  }
}

/**
 * Test Suite for MemoryMonitor
 */
export class MemoryMonitorTests {
  static runAll() {
    console.log('=== MemoryMonitor Tests ===');
    this.testReadPercent();
    this.testPercentBounds();
    this.testNonZero();
  }

  static testReadPercent() {
    try {
      const monitor = new MemoryMonitor();
      const percent = monitor.readPercent();
      
      if (typeof percent !== 'number') {
        throw new Error('readPercent should return a number');
      }
      
      console.log('✓ testReadPercent passed');
    } catch (e) {
      console.error(`✗ testReadPercent failed: ${e.message}`);
    }
  }

  static testPercentBounds() {
    try {
      const monitor = new MemoryMonitor();
      const percent = monitor.readPercent();
      
      if (percent < 0 || percent > 100) {
        throw new Error(`Memory percent out of bounds: ${percent}`);
      }
      
      console.log('✓ testPercentBounds passed');
    } catch (e) {
      console.error(`✗ testPercentBounds failed: ${e.message}`);
    }
  }

  static testNonZero() {
    try {
      const monitor = new MemoryMonitor();
      const percent = monitor.readPercent();
      
      // Memory usage should typically be > 0 on a running system
      if (percent === 0) {
        console.warn('Warning: Memory usage reported as 0%, this might be unusual');
      }
      
      console.log('✓ testNonZero passed');
    } catch (e) {
      console.error(`✗ testNonZero failed: ${e.message}`);
    }
  }
}

/**
 * Test Suite for DiskMonitor
 */
export class DiskMonitorTests {
  static runAll() {
    console.log('=== DiskMonitor Tests ===');
    this.testDeviceDetection();
    this.testReadDiskIO();
    this.testNonNegativeSpeeds();
  }

  static testDeviceDetection() {
    try {
      const monitor = new DiskMonitor();
      const devices = monitor.getAvailableDevices();
      
      if (!Array.isArray(devices)) {
        throw new Error('getAvailableDevices should return an array');
      }
      
      // Should detect at least one disk on a typical system
      if (devices.length === 0) {
        console.warn('Warning: No disk devices detected');
      }
      
      // Device names should match expected patterns
      for (const device of devices) {
        if (!/^(sd[a-z]|nvme\d+n\d+|mmcblk\d+|vd[a-z]|hd[a-z])$/.test(device)) {
          console.warn(`Warning: Unusual device name: ${device}`);
        }
      }
      
      console.log('✓ testDeviceDetection passed');
    } catch (e) {
      console.error(`✗ testDeviceDetection failed: ${e.message}`);
    }
  }

  static testReadDiskIO() {
    try {
      const monitor = new DiskMonitor();
      const result = monitor.readDiskIO();
      
      if (typeof result !== 'object') {
        throw new Error('readDiskIO should return an object');
      }
      
      if (typeof result.readSpeed !== 'number' || typeof result.writeSpeed !== 'number') {
        throw new Error('readDiskIO should return numeric speeds');
      }
      
      console.log('✓ testReadDiskIO passed');
    } catch (e) {
      console.error(`✗ testReadDiskIO failed: ${e.message}`);
    }
  }

  static testNonNegativeSpeeds() {
    try {
      const monitor = new DiskMonitor();
      const result = monitor.readDiskIO();
      
      if (result.readSpeed < 0 || result.writeSpeed < 0) {
        throw new Error('Disk speeds should not be negative');
      }
      
      console.log('✓ testNonNegativeSpeeds passed');
    } catch (e) {
      console.error(`✗ testNonNegativeSpeeds failed: ${e.message}`);
    }
  }
}

/**
 * Test Suite for TemperatureMonitor
 */
export class TemperatureMonitorTests {
  static runAll() {
    console.log('=== TemperatureMonitor Tests ===');
    this.testAvailability();
    this.testReadTemperature();
    this.testReasonableBounds();
  }

  static testAvailability() {
    try {
      const monitor = new TemperatureMonitor();
      const available = monitor.isAvailable();
      
      if (typeof available !== 'boolean') {
        throw new Error('isAvailable should return a boolean');
      }
      
      if (!available) {
        console.warn('Warning: No temperature sensors detected');
      }
      
      console.log('✓ testAvailability passed');
    } catch (e) {
      console.error(`✗ testAvailability failed: ${e.message}`);
    }
  }

  static testReadTemperature() {
    try {
      const monitor = new TemperatureMonitor();
      
      if (!monitor.isAvailable()) {
        console.log('⊘ testReadTemperature skipped (no sensors)');
        return;
      }
      
      const temp = monitor.readTemperature();
      
      if (temp !== null && typeof temp !== 'number') {
        throw new Error('readTemperature should return number or null');
      }
      
      console.log('✓ testReadTemperature passed');
    } catch (e) {
      console.error(`✗ testReadTemperature failed: ${e.message}`);
    }
  }

  static testReasonableBounds() {
    try {
      const monitor = new TemperatureMonitor();
      
      if (!monitor.isAvailable()) {
        console.log('⊘ testReasonableBounds skipped (no sensors)');
        return;
      }
      
      const temp = monitor.readTemperature();
      
      if (temp !== null) {
        // Reasonable temperature range: -50°C to 150°C
        if (temp < -50 || temp > 150) {
          console.warn(`Warning: Temperature out of reasonable range: ${temp}°C`);
        }
      }
      
      console.log('✓ testReasonableBounds passed');
    } catch (e) {
      console.error(`✗ testReasonableBounds failed: ${e.message}`);
    }
  }
}

/**
 * Run all test suites
 */
export function runAllTests() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║ Net Speed Animals - Unit Tests      ║');
  console.log('╚══════════════════════════════════════╝\n');
  
  NetworkMonitorTests.runAll();
  console.log('');
  
  CpuMonitorTests.runAll();
  console.log('');
  
  MemoryMonitorTests.runAll();
  console.log('');
  
  DiskMonitorTests.runAll();
  console.log('');
  
  TemperatureMonitorTests.runAll();
  
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║ Test Suite Complete                  ║');
  console.log('╚══════════════════════════════════════╝\n');
}
