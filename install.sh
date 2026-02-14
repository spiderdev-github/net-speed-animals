#!/bin/bash
# Installation script for Net Speed Animals GNOME Shell Extension
# Script d'installation pour l'extension GNOME Shell Net Speed Animals

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Extension details
EXTENSION_UUID="net-speed-animals@spiderdev.fr"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

# Get script directory (where the source files are)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Net Speed Animals - GNOME Shell Extension Installer${NC}"
echo -e "${BLUE}  Animated system monitor with network, CPU, memory,${NC}"
echo -e "${BLUE}  temperature, disk I/O, graphs, and notifications${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if GNOME Shell is running
if ! pgrep -x "gnome-shell" > /dev/null; then
    echo -e "${RED}✗ GNOME Shell is not running!${NC}"
    echo -e "${YELLOW}  This extension requires GNOME Shell.${NC}"
    exit 1
fi

# Get GNOME Shell version
GNOME_VERSION=$(gnome-shell --version | cut -d' ' -f3 | cut -d'.' -f1)
echo -e "${GREEN}✓${NC} GNOME Shell detected (version $GNOME_VERSION)"

# Check if version is supported
if [ "$GNOME_VERSION" -lt 45 ]; then
    echo -e "${RED}✗ Unsupported GNOME Shell version!${NC}"
    echo -e "${YELLOW}  This extension requires GNOME Shell 45 or higher.${NC}"
    exit 1
fi

# Check for required tools
echo ""
echo -e "${BLUE}Checking dependencies...${NC}"

MISSING_DEPS=0

# Check for glib-compile-schemas
if ! command -v glib-compile-schemas &> /dev/null; then
    echo -e "${RED}✗ glib-compile-schemas not found!${NC}"
    MISSING_DEPS=1
fi

# Check for msgfmt (gettext)
if ! command -v msgfmt &> /dev/null; then
    echo -e "${RED}✗ msgfmt (gettext) not found!${NC}"
    MISSING_DEPS=1
fi

if [ "$MISSING_DEPS" -eq 1 ]; then
    echo -e "${YELLOW}  Installing missing dependencies...${NC}"

    if command -v apt-get &> /dev/null; then
        sudo apt-get update -qq
        sudo apt-get install -y gettext libglib2.0-dev-bin
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y gettext glib2-devel
    elif command -v pacman &> /dev/null; then
        sudo pacman -S --noconfirm gettext glib2
    else
        echo -e "${RED}✗ Cannot install dependencies automatically.${NC}"
        echo -e "${YELLOW}  Please install gettext and glib-compile-schemas manually.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} All dependencies are installed"

# Compile translations
echo ""
echo -e "${BLUE}Compiling translations...${NC}"

cd "$SCRIPT_DIR"

if [ -f "po/fr.po" ]; then
    mkdir -p locale/fr/LC_MESSAGES
    msgfmt po/fr.po -o locale/fr/LC_MESSAGES/net-speed-animals.mo
    echo -e "${GREEN}✓${NC} French translation compiled"
fi

if [ -f "po/en.po" ]; then
    mkdir -p locale/en/LC_MESSAGES
    msgfmt po/en.po -o locale/en/LC_MESSAGES/net-speed-animals.mo
    echo -e "${GREEN}✓${NC} English translation compiled"
fi

# Compile gschema
echo ""
echo -e "${BLUE}Compiling GSettings schema...${NC}"

if [ -f "schemas/org.gnome.shell.extensions.net-speed-animals.gschema.xml" ]; then
    glib-compile-schemas schemas/
    echo -e "${GREEN}✓${NC} GSettings schema compiled"
else
    echo -e "${RED}✗ GSettings schema file not found!${NC}"
    exit 1
fi

# Check if installing from a different location than the extension dir
if [ "$SCRIPT_DIR" != "$EXTENSION_DIR" ]; then
    # Check if extension is already installed
    if [ -d "$EXTENSION_DIR" ]; then
        echo ""
        echo -e "${YELLOW}⚠ Extension is already installed.${NC}"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Installation cancelled.${NC}"
            exit 0
        fi

        # Disable extension before removing
        if gnome-extensions list | grep -q "$EXTENSION_UUID"; then
            echo -e "${BLUE}Disabling existing extension...${NC}"
            gnome-extensions disable "$EXTENSION_UUID" 2>/dev/null || true
        fi

        echo -e "${BLUE}Removing old installation...${NC}"
        rm -rf "$EXTENSION_DIR"
    fi

    # Create extension directory and copy files
    echo ""
    echo -e "${BLUE}Installing extension files...${NC}"
    mkdir -p "$EXTENSION_DIR"

    # Copy core extension files
    cp "$SCRIPT_DIR/extension.js" "$EXTENSION_DIR/"
    cp "$SCRIPT_DIR/prefs.js" "$EXTENSION_DIR/"
    cp "$SCRIPT_DIR/metadata.json" "$EXTENSION_DIR/"
    cp "$SCRIPT_DIR/stylesheet.css" "$EXTENSION_DIR/"

    # Copy directories
    cp -r "$SCRIPT_DIR/schemas" "$EXTENSION_DIR/"
    cp -r "$SCRIPT_DIR/icons" "$EXTENSION_DIR/"
    cp -r "$SCRIPT_DIR/locale" "$EXTENSION_DIR/"
    cp -r "$SCRIPT_DIR/utils" "$EXTENSION_DIR/"
    cp -r "$SCRIPT_DIR/monitors" "$EXTENSION_DIR/"
    cp -r "$SCRIPT_DIR/widgets" "$EXTENSION_DIR/"

    echo -e "${GREEN}✓${NC} Extension files copied to $EXTENSION_DIR"
else
    echo ""
    echo -e "${GREEN}✓${NC} Running from extension directory, no copy needed"
fi

# Enable extension
echo ""
echo -e "${BLUE}Enabling extension...${NC}"

if gnome-extensions enable "$EXTENSION_UUID" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Extension enabled successfully"
else
    echo -e "${YELLOW}⚠ Could not enable extension automatically.${NC}"
    echo -e "${YELLOW}  Please enable it manually using GNOME Extensions app.${NC}"
fi

# Restart GNOME Shell
echo ""
echo -e "${BLUE}Restarting GNOME Shell...${NC}"
busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'Meta.restart("Restarting…");' > /dev/null 2>&1 || true
echo -e "${GREEN}✓${NC} GNOME Shell restart requested"

sleep 2

# Success message
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Installation completed successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Features installed:${NC}"
echo -e "  • Network speed monitoring with animated animals"
echo -e "  • CPU, Memory, Temperature & Disk I/O monitoring"
echo -e "  • Interactive graphs (speed, CPU, memory, temp, disk)"
echo -e "  • Bandwidth quota tracking with progress bar"
echo -e "  • Desktop notifications for system alerts"
echo -e "  • Color-coded thresholds"
echo -e "  • Full French translation"
echo ""
echo -e "${BLUE}To configure:${NC}"
echo -e "  gnome-extensions prefs $EXTENSION_UUID"
echo ""
echo -e "${BLUE}To uninstall:${NC}"
echo -e "  gnome-extensions uninstall $EXTENSION_UUID"
echo ""

# Offer to open preferences
read -p "Open preferences now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    gnome-extensions prefs "$EXTENSION_UUID" &
fi

echo -e "${GREEN}Enjoy Net Speed Animals! 🐌🐢🐰${NC}"
