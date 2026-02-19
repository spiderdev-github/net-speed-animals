# 🐾 Net Speed Animals — GNOME Shell Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-Linux-blue)
![Desktop](https://img.shields.io/badge/desktop-GNOME-orange)
![GNOME Shell](https://img.shields.io/badge/GNOME-45%20|%2046%20|%2047-blueviolet)
![Languages](https://img.shields.io/badge/languages-5-success)

A **beautiful and comprehensive** GNOME Shell system monitoring extension featuring **animated animals** that change based on your network speed, accompanied by elegant visual indicators for CPU, memory, temperature, and disk activity.

Transform your boring system monitor into a delightful, animated experience! 🎨✨

------------------------------------------------------------------------

## ⚡ Quick Installation

``` bash
chmod +x install.sh
./install.sh
```

Then restart GNOME Shell:
- **X11**: `Alt+F2` → type `r` → `Enter`
- **Wayland**: Log out and log back in

------------------------------------------------------------------------

## 📖 Documentation

🇫🇷 **Lire en français** : [README.fr.md](docs/README.fr.md)  

------------------------------------------------------------------------

## 🎭 Icon Themes

Choose from **5 beautiful animated themes**, each with 3 speed levels:

| Theme | Slow Speed | Medium Speed | Fast Speed |
|-------|-----------|--------------|------------|
| 🌊 **Aquatic** | Fish 🐟 | Dolphin 🐬 | Whale 🐋 |
| 🐾 **Classic** | Snail 🐌 | Turtle 🐢 | Rabbit 🐇 |
| 🏡 **Domestic** | Cat 🐱 | Dog 🐕 | Horse 🐎 |
| 🦅 **Birds** | Duck 🦆 | Hummingbird 🐦 | Eagle 🦅 |
| 🐝 **Insects** | Ant 🐜 | Ladybug 🐞 | Bee 🐝 |

Each animal comes with **smooth frame-by-frame animations** that adapt to your network speed!

------------------------------------------------------------------------

## ✨ Features

### 🌐 Network Monitoring

-   🎬 **Animated animals** that change based on real-time network speed
-   📊 **Smart speed display** in Mbit/s, KB/s, or B/s (auto-adaptive)
-   🔄 **Multiple display modes**: 
    - Combined (total traffic)
    - Separate (↓ download / ↑ upload)
    - Download only
    - Upload only
-   🔌 **Interface selection**: automatic (highest traffic) or manual (eth0, wlan0, enp3s0, etc.)
-   📈 **Real-time bandwidth graph** in menu (60-second history with download/upload curves)
-   ⚙️ **Customizable animation speed**: adjust min/max intervals (90-450ms)
-   🎯 **Configurable speed thresholds** to control when animals change

### 🧠 Memory Monitoring

-   💧 **4-level blob icon** that grows with memory usage
-   📍 **Percentage label** displayed in panel
-   🎚️ **Configurable thresholds** (25%, 50%, 75% by default)
-   📊 **Memory usage graph** (yellow curve) in menu
-   🔔 **High memory alerts** (customizable threshold, default 90%)

### ⚡ CPU Monitoring

-   🔥 **4-level CPU activity icon**
-   📍 **Percentage label** displayed in panel
-   🎚️ **Configurable thresholds** (25%, 50%, 75% by default)
-   📊 **CPU usage graph** (blue curve) in menu
-   🔔 **High CPU alerts** (customizable threshold, default 90%)

### 🌡️ Temperature Monitoring

-   🌡️ **4-level thermometer icon** (cold → warm → hot → critical)
-   📍 **Temperature label** in °C displayed in panel
-   🔍 **Automatic thermal zone detection** (x86_pkg_temp, acpitz, etc.)
-   🎚️ **Configurable thresholds** (50°C, 70°C, 85°C by default)
-   📊 **Temperature graph** (red curve) in menu
-   🔔 **High temperature alerts** (customizable threshold, default 85°C)

### 💾 Disk I/O Monitoring

-   💿 **4-level disk activity icon** (idle → low → medium → high)
-   📍 **Speed label** in MB/s, KB/s, or B/s (auto-adaptive)
-   🔄 **Multiple display modes**:
    - Combined (total I/O)
    - Separate (R: read / W: write)
    - Read only
    - Write only
-   🔍 **Automatic device detection** (sda, sdb, nvme0n1, etc.)
-   🎚️ **Configurable activity thresholds** (1, 10, 50 MB/s by default)
-   📊 **Disk I/O graph** (purple curve) in menu

### 📊 Network Statistics Tracking

-   📅 **Multi-period tracking**: 
    - Session (since extension start)
    - Daily (last 24 hours)
    - Weekly (last 7 days)
    - Monthly (last 30 days)
-   💾 **Automatic save** every 60 seconds to persistent storage
-   🔄 **Session reset** option via menu
-   📈 **Detailed breakdown** of download/upload traffic

### 📈 Bandwidth Quota Management

-   🎯 **Visual progress bar** in menu with color coding:
    - 🟢 Green (0-50%): Safe zone
    - 🟡 Yellow (50-75%): Moderate usage
    - 🟠 Orange (75-90%): Warning zone
    - 🔴 Red (90-100%): Critical zone
-   📊 **Monthly quota** configurable in GB
-   🔔 **Smart notifications**:
    - ⚠️ Warning at 75% (customizable)
    - 🚨 Critical at 90% (customizable)
-   📍 **Live usage display**: "XX.X GB / YY GB (ZZ%)"

### 🔔 Intelligent Notification System

-   🌐 **Network dropout alerts**: notify when speed drops below threshold (1 Mbit/s default)
-   ⚡ **CPU overload alerts**: notify when CPU usage exceeds threshold (90% default)
-   🧠 **Memory pressure alerts**: notify when memory usage exceeds threshold (90% default)
-   🌡️ **Temperature warnings**: notify when temperature exceeds threshold (85°C default)
-   📊 **Bandwidth quota alerts**: warning and critical level notifications
-   🛡️ **Anti-spam protection**: 5-minute cooldown between identical alerts
-   ✅ **Fully customizable**: enable/disable individual alerts and adjust all thresholds

### 🎨 Visual Customization

-   🌈 **Adaptive color themes**: labels change color based on thresholds
    - 🟢 Green: Normal/safe range
    - 🟡 Yellow: Warning range
    - 🔴 Red: Critical range
-   📏 **Icon size adjustment**: 16-64px (default 32px)
-   📍 **Panel position**: left, center, or right box
-   🔢 **Position index**: fine-tune placement within chosen box
-   🎭 **Theme selection**: 5 built-in themes + custom mode (choose your 3 speed animals)
-   ⏸️ **Animation toggle**: use static icons if preferred

### 🩺 Diagnostics & Troubleshooting

-   🔎 **Dedicated Diagnostics page** in preferences
-   ♻️ **Refresh button** to re-run checks instantly
-   ✅ **Live checks** for `/proc/net/dev`, `/sys/class/thermal`, and `/proc/diskstats`
-   🌐 **Instant detection** of active interface, thermal zone, and disk device

### 🖱️ Interactive Click Actions

-   👆 **Left click**: cycle through network speed display modes *(optional)*
-   🖱️ **Middle click**: open preferences or menu *(configurable)*
-   🔄 **Scroll wheel**: switch between network interfaces *(optional)*

*All click actions are disabled by default for a clean experience*

### 🌍 Internationalization

-   🇬🇧 **English**
-   🇫🇷 **Français**
-   🇩🇪 **Deutsch**
-   🇪🇸 **Español**
-   🇮🇹 **Italiano**

Select your preferred language in preferences or use system default

### 🎚️ Threshold Preset Modes

Choose from preset threshold configurations:
-   **Stable**: Balanced thresholds for normal usage monitoring
-   **Spectacular**: More sensitive thresholds for visual feedback
-   **Stress**: Extreme thresholds for stress testing

Or customize each threshold individually!
------------------------------------------------------------------------

## 📸 Screenshots

Experience the beautiful interface:

### Panel Indicators
![Panel View](assets/screen-panel.png)
*Animated animals and system metrics at a glance*

### Dropdown Menu
![Menu](assets/screen-menu.png)
*Comprehensive system information with live graphs*

### Preferences Window

#### 🔧 General Settings
![General](assets/screen-general.png)
*Network interface, animation speed, panel position, statistics, and click actions*

#### 🎨 Display Options
![Display Part 1](assets/screen-display-part1.png)
*Icon theme, icon size, and network speed options*

![Display Part 2](assets/screen-display-part2.png)
*Memory, CPU, temperature, and disk display options*

#### 🎚️ Threshold Configuration
![Thresholds](assets/screen-thresholds.png)
*Fine-tune sensitivity for network, memory, CPU, temperature, and disk*

#### 🔔 Notification Settings
![Notifications](assets/screen-notifications.png)
*Configure alerts for network, system resources, and bandwidth quota*

#### ℹ️ About
![About](assets/screen-about.png)
*Extension information and support links*

------------------------------------------------------------------------

## ⚙️ Configuration

Open preferences window:

``` bash
gnome-extensions prefs net-speed-animals@spiderdev.fr
```

Or **middle-click** on the panel icon (if enabled in settings)

### 📋 Preferences Pages Overview

The preferences window includes built-in search and follows this order:
-   General → Display → Thresholds → Notifications → Diagnostics → About

#### 🔧 General
-   **Quick Profiles**
    -   One-click presets: Custom, Laptop, Gaming, Dev, Low-power
    -   Reset to Custom action
-   **Network Interface**
    -   Selection mode: Automatic (highest traffic) or Manual
    -   Interface name input for manual selection
-   **Panel Position**
    -   Choose box: left, center, or right
    -   Position index within box (0 = first position)
-   **Click Actions**
    -   Toggle left-click cycling
    -   Toggle middle-click preferences
    -   Toggle scroll interface switching
-   **Animation Control**
    -   Minimum animation speed (50-500ms)
    -   Maximum animation speed (100-1000ms)
    -   Animation disable option (use static icons)
-   **Network Statistics**
    -   Enable/disable tracking
    -   Show statistics in menu
-   **Language**
    -   System default or override (🇬🇧 🇫🇷 🇩🇪 🇪🇸 🇮🇹)
    -   Requires extension reload
-   **Backup & Restore**
    -   Export settings to JSON
    -   Import settings from JSON
-   **Reset Settings**
    -   Reset all extension settings to defaults

#### 🎨 Display
-   **Icon Theme Selection**
    -   5 built-in themes: Aquatic, Classic, Domestic, Birds, Insects
    -   Custom mode: choose slow/medium/fast animals manually
-   **Icon Size**
    -   Adjustable from 16 to 64 pixels (default: 32px)
    -   Applies to all panel icons
-   **Color Themes**
    -   Enable/disable adaptive label colors (green/yellow/red)
-   **Network Speed Options**
    -   Show/hide animated animal icon
    -   Show/hide speed text label
    -   Show/hide speed graph in menu
    -   Display mode: combined, separate, download-only, upload-only
-   **CPU Options**
    -   Show/hide CPU icon
    -   Show/hide CPU percentage label
    -   Show/hide CPU graph in menu
-   **Memory Options**
    -   Show/hide memory blob icon
    -   Show/hide memory percentage label
    -   Show/hide memory graph in menu
-   **Temperature Options**
    -   Show/hide thermometer icon
    -   Show/hide temperature label
    -   Show/hide temperature graph in menu
-   **Disk I/O Options**
    -   Show/hide disk activity icon
    -   Show/hide disk speed label
    -   Show/hide disk I/O graph in menu
    -   Display mode: combined, separate, read-only, write-only

#### 🎚️ Thresholds
-   **Threshold Mode**
    -   Preset: Stable, Spectacular, or Stress
    -   Apply consistent settings across all monitors
-   **Network Speed Thresholds**
    -   Turtle threshold (Mbit/s) - default: 2.0
    -   Rabbit threshold (Mbit/s) - default: 20.0
-   **Memory Level Thresholds** (%)
    -   Level 1 (low usage) - default: 25%
    -   Level 2 (medium usage) - default: 50%
    -   Level 3 (high usage) - default: 75%
-   **CPU Level Thresholds** (%)
    -   Level 1 - default: 25%
    -   Level 2 - default: 50%
    -   Level 3 - default: 75%
-   **Temperature Thresholds** (°C)
    -   Warm (yellow) - default: 50°C
    -   Hot (orange) - default: 70°C
    -   Critical (red) - default: 85°C
-   **Disk I/O Thresholds** (MB/s)
    -   Level 1 (low activity) - default: 1.0
    -   Level 2 (medium activity) - default: 10.0
    -   Level 3 (high activity) - default: 50.0

#### 🔔 Notifications
-   **Global Control**
    -   Master enable/disable switch
-   **Network Alerts**
    -   Enable dropout notification
    -   Dropout threshold (Mbit/s) - default: 1.0
-   **System Alerts**
    -   CPU high usage alert + threshold (%) - default: 90%
    -   Memory high usage alert + threshold (%) - default: 90%
    -   Temperature high alert + threshold (°C) - default: 85°C
-   **Bandwidth Quota**
    -   Monthly quota in GB (0 = disabled)
    -   Enable quota notifications
    -   Warning threshold (%) - default: 75%
    -   Critical threshold (%) - default: 90%

#### 🩺 Diagnostics
-   **Refresh Diagnostics**
    -   Re-run system checks on demand
-   **Live Detection**
    -   Active network interface
    -   Active thermal zone
    -   Active disk device
-   **Permission Status**
    -   Readability checks for `/proc/net/dev`, `/sys/class/thermal`, `/proc/diskstats`

#### ℹ️ About
-   Version, project links, and support links

------------------------------------------------------------------------

## 🏗️ Project Structure

Explore the well-organized codebase:

```
net-speed-animals@spiderdev.fr/
├── src/
│   ├── extension.js           # Main extension entry point
│   ├── prefs.js               # Preferences UI (Adwaita)
│   ├── metadata.json          # Extension metadata
│   ├── stylesheet.css         # Panel styling
│   ├── prefs.css              # Preferences styling
│   │
│   ├── monitors/              # System metric collectors
│   │   ├── networkMonitor.js  # /proc/net/dev parser
│   │   ├── cpuMonitor.js      # /proc/stat parser
│   │   ├── memoryMonitor.js   # /proc/meminfo parser
│   │   ├── temperatureMonitor.js  # /sys/class/thermal/ reader
│   │   └── diskMonitor.js     # /proc/diskstats parser
│   │
│   ├── ui/                    # User interface components
│   │   ├── panelIndicator.js  # Top bar icons and labels
│   │   ├── menuBuilder.js     # Dropdown menu builder
│   │   ├── iconLoader.js      # SVG icon loader
│   │   ├── animationController.js  # Animation manager
│   │   └── renderEngine.js    # Panel rendering engine
│   │
│   ├── widgets/               # Custom UI widgets
│   │   ├── speedGraph.js      # Network speed graph (2 curves)
│   │   ├── systemGraph.js     # Generic system graph widget
│   │   └── quotaBar.js        # Bandwidth quota progress bar
│   │
│   ├── utils/                 # Utility modules
│   │   ├── constants.js       # Configuration constants
│   │   ├── formatters.js      # Data formatting helpers
│   │   ├── notifications.js   # Notification manager
│   │   └── storage.js         # Statistics persistence
│   │
│   ├── icons/                 # Icon assets
│   │   └── themes/            # Theme folders
│   │       ├── aquatic/       # Fish → Dolphin → Whale
│   │       ├── classic/       # Snail → Turtle → Rabbit
│   │       ├── domestic/      # Cat → Dog → Horse
│   │       ├── birds/         # Duck → Hummingbird → Eagle
│   │       └── insects/       # Ant → Ladybug → Bee
│   │           ├── network/   # Network speed animals
│   │           ├── cpu/       # CPU activity icons (4 levels)
│   │           ├── memory/    # Memory blob icons (4 levels)
│   │           ├── temperature/ # Thermometer icons (4 levels)
│   │           └── disk/      # Disk activity icons (4 levels)
│   │
│   ├── schemas/               # GSettings schema
│   │   ├── gschemas.compiled
│   │   └── org.gnome.shell.extensions.net-speed-animals.gschema.xml
│   │
│   └── locale/                # Translations
│       ├── de/LC_MESSAGES/    # German
│       ├── en/LC_MESSAGES/    # English
│       ├── es/LC_MESSAGES/    # Spanish
│       ├── fr/LC_MESSAGES/    # French
│       └── it/LC_MESSAGES/    # Italian
│
├── docs/                      # Documentation
│   ├── README.fr.md           # French documentation
│   ├── CHANGELOG_IMPROVEMENTS.md
│   ├── CONSTANTS.md           # Constants documentation
│   ├── TESTING.md             # Testing guide
│   └── TRANSLATIONS.md        # Translation guide
│
├── po/                        # Translation sources
│   ├── *.po                   # Translation files
│   └── POTFILES.in            # Files to translate
│
├── tools/                     # Development tools
│   └── translate.sh           # Translation builder
│
├── install.sh                 # Installation script
└── uninstall.sh               # Uninstallation script
```

------------------------------------------------------------------------

## 🔧 Technical Details

### System Requirements
-   **GNOME Shell**: 45, 46, 47
-   **Display Server**: Wayland or X11
-   **Distributions**: Ubuntu 23.10+, Fedora 39+, Arch Linux, etc.

### Data Sources
-   **Network**: `/proc/net/dev` - bytes transmitted/received per interface
-   **CPU**: `/proc/stat` - CPU time statistics
-   **Memory**: `/proc/meminfo` - memory usage details
-   **Temperature**: `/sys/class/thermal/thermal_zone*/temp` - thermal sensors
-   **Disk**: `/proc/diskstats` - disk I/O statistics

### Performance
-   **Measurement interval**: 1000ms (1 second)
-   **Animation interval**: 90-450ms (configurable)
-   **Graph data points**: 60 points (1 minute history)
-   **Statistics autosave**: Every 60 seconds
-   **Memory footprint**: Minimal (~5-10 MB)
-   **CPU overhead**: Negligible (<1% on modern systems)

------------------------------------------------------------------------

## 🧪 Testing

The extension includes comprehensive unit tests covering all system parsers. See [docs/TESTING.md](docs/TESTING.md) for details.

```bash
cd src
gjs tests.js
```

**Test coverage**: 16 unit tests across 5 test suites
-   NetworkMonitorTests (4 tests)
-   CpuMonitorTests (3 tests)
-   MemoryMonitorTests (3 tests)
-   DiskMonitorTests (3 tests)
-   TemperatureMonitorTests (3 tests)

------------------------------------------------------------------------

## 🌍 Contributing

### Translations
We welcome translations! See [docs/TRANSLATIONS.md](docs/TRANSLATIONS.md) for the translation guide.

Currently supported:
-   🇬🇧 English (100%)
-   🇫🇷 French (100%)
-   🇩🇪 German (100%)
-   🇪🇸 Spanish (100%)
-   🇮🇹 Italian (100%)

### Bug Reports & Feature Requests
Please open an issue on GitHub with:
-   GNOME Shell version
-   Distribution and version
-   Detailed description
-   Steps to reproduce (for bugs)

------------------------------------------------------------------------

## 📝 License

MIT License - See [LICENSE](LICENSE) file

------------------------------------------------------------------------

## 👨‍💻 Author

**Spiderdev**
-   🌐 Website: [spiderdev.fr](https://spiderdev.fr)
-   💻 GitHub: [github.com/spiderdev-github/net-speed-animals](https://github.com/spiderdev-github/net-speed-animals)

------------------------------------------------------------------------

## 💖 Support

If you find this extension useful, consider supporting its development:

-   ⭐ **Star the project** on GitHub
-   ☕ **Buy me a coffee**: [Buy Me a Coffee](https://www.buymeacoffee.com/spiderdev)
-   💸 **PayPal**: [PayPal](https://paypal.me/spiderdev)
-   🐛 **Report bugs** to help improve the extension
-   🌍 **Contribute translations** in your language

------------------------------------------------------------------------

## 🗑️ Uninstallation

```bash
chmod +x uninstall.sh
./uninstall.sh
```

Or manually:
```bash
gnome-extensions uninstall net-speed-animals@spiderdev.fr
```

------------------------------------------------------------------------

## 📚 Additional Documentation

-   [🇫🇷 French README](docs/README.fr.md)
-   [📋 Changelog & Improvements](docs/CHANGELOG_IMPROVEMENTS.md)
-   [📊 Constants Documentation](docs/CONSTANTS.md)
-   [🧪 Testing Guide](docs/TESTING.md)
-   [🌍 Translation Guide](docs/TRANSLATIONS.md)

------------------------------------------------------------------------

**Made with ❤️ for the GNOME community**

*Transform your system monitoring into an enjoyable visual experience!* 🐾✨
