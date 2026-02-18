#!/bin/bash
# Installation script for Net Speed Animals GNOME Shell Extension
# Script d installation pour l extension GNOME Shell Net Speed Animals

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Extension details
EXTENSION_UUID="net-speed-animals@spiderdev.fr"
GETTEXT_DOMAIN="net-speed-animals"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

# Get script directory (project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$SCRIPT_DIR/src"
PO_DIR="$SCRIPT_DIR/po"

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Net Speed Animals - GNOME Shell Extension Installer${NC}"
echo -e "${BLUE}  Animated system monitor with network, CPU, memory,${NC}"
echo -e "${BLUE}  temperature, disk I O, graphs, and notifications${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Check src directory exists
if [ ! -d "$SRC_DIR" ]; then
  echo -e "${RED}✗ src directory not found!${NC}"
  echo -e "${YELLOW}  Expected source files in: $SRC_DIR${NC}"
  exit 1
fi

# Check if GNOME Shell is running
if ! pgrep -x "gnome-shell" > /dev/null; then
  echo -e "${RED}✗ GNOME Shell is not running!${NC}"
  echo -e "${YELLOW}  This extension requires GNOME Shell.${NC}"
  exit 1
fi

# Get GNOME Shell version
GNOME_VERSION=$(gnome-shell --version | awk '{print $3}' | cut -d'.' -f1)
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

if ! command -v glib-compile-schemas &> /dev/null; then
  echo -e "${RED}✗ glib-compile-schemas not found!${NC}"
  MISSING_DEPS=1
fi

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

# Compile translations from po into src locale
echo ""
echo -e "${BLUE}Compiling translations...${NC}"



if [ -d "$PO_DIR" ]; then
  shopt -s nullglob
  for po_file in "$PO_DIR"/*.po; do
    lang="$(basename "$po_file" .po)"
    mkdir -p "$SRC_DIR/locale/$lang/LC_MESSAGES"
    msgfmt "$po_file" -o "$SRC_DIR/locale/$lang/LC_MESSAGES/$GETTEXT_DOMAIN.mo"
    echo -e "${GREEN}✓${NC} $lang translation compiled"
  done
  shopt -u nullglob
else
  echo -e "${YELLOW}⚠ No po directory found, skipping translations.${NC}"
fi

# Compile gschema
echo ""
echo -e "${BLUE}Compiling GSettings schema...${NC}"

if [ -d "$SRC_DIR/schemas" ] && compgen -G "$SRC_DIR/schemas/*.gschema.xml" > /dev/null; then
  glib-compile-schemas "$SRC_DIR/schemas/"
  echo -e "${GREEN}✓${NC} GSettings schema compiled"
else
  echo -e "${RED}✗ GSettings schema file not found!${NC}"
  echo -e "${YELLOW}  Expected .gschema.xml in: $SRC_DIR/schemas/${NC}"
  exit 1
fi

# Install: copy src contents to extension directory
echo ""
echo -e "${BLUE}Installing extension files...${NC}"

# Clean install: uninstall existing extension if present
if gnome-extensions list 2>/dev/null | grep -q "$EXTENSION_UUID"; then
  echo -e "${BLUE}Uninstalling existing extension for clean install...${NC}"
  gnome-extensions uninstall "$EXTENSION_UUID" 2>/dev/null || true
  sleep 1
fi

mkdir -p "$EXTENSION_DIR"

# Copy main files (if present)
for file in extension.js prefs.js metadata.json stylesheet.css prefs.css; do
  if [ -f "$SRC_DIR/$file" ]; then
    cp "$SRC_DIR/$file" "$EXTENSION_DIR/"
  fi
done

# Copy directories
if [ -d "$SRC_DIR/schemas" ]; then
  rm -rf "$EXTENSION_DIR/schemas"
  cp -r "$SRC_DIR/schemas" "$EXTENSION_DIR/"
fi

if [ -d "$SRC_DIR/icons" ]; then
  rm -rf "$EXTENSION_DIR/icons"
  cp -r "$SRC_DIR/icons" "$EXTENSION_DIR/"
fi

if [ -d "$SRC_DIR/locale" ]; then
  rm -rf "$EXTENSION_DIR/locale"
  cp -r "$SRC_DIR/locale" "$EXTENSION_DIR/"
fi

if [ -d "$SRC_DIR/monitors" ]; then
  rm -rf "$EXTENSION_DIR/monitors"
  cp -r "$SRC_DIR/monitors" "$EXTENSION_DIR/"
fi

if [ -d "$SRC_DIR/ui" ]; then
  rm -rf "$EXTENSION_DIR/ui"
  cp -r "$SRC_DIR/ui" "$EXTENSION_DIR/"
fi

if [ -d "$SRC_DIR/utils" ]; then
  rm -rf "$EXTENSION_DIR/utils"
  cp -r "$SRC_DIR/utils" "$EXTENSION_DIR/"
fi

if [ -d "$SRC_DIR/widgets" ]; then
  rm -rf "$EXTENSION_DIR/widgets"
  cp -r "$SRC_DIR/widgets" "$EXTENSION_DIR/"
fi

echo -e "${GREEN}✓${NC} Extension files installed to $EXTENSION_DIR"

echo ""
echo -e "${BLUE}Update extension translation...${NC}"

# update extension translattion
cp $SCRIPT_DIR/tools/translate.sh $EXTENSION_DIR
cp $SCRIPT_DIR/src/test.js $EXTENSION_DIR
chmod +x $EXTENSION_DIR/translate.sh
cd $EXTENSION_DIR
sh translate.sh
echo -e "${GREEN}✓${NC} Translate successfully updated"

# Enable extension (without restarting GNOME Shell yet)
echo ""
echo -e "${BLUE}Enabling extension...${NC}"

RETRY_COUNT=0
MAX_RETRIES=5

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  # Check if extension is visible to gnome-extensions
  if gnome-extensions list 2>/dev/null | grep -q "$EXTENSION_UUID"; then
    # Try to enable
    if gnome-extensions enable "$EXTENSION_UUID" 2>/dev/null; then
      echo -e "${GREEN}✓${NC} Extension enabled successfully"
      break
    else
      # Command failed, retry
      RETRY_COUNT=$((RETRY_COUNT + 1))
      if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo -e "${YELLOW}  Retrying... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
        sleep 1
      fi
    fi
  else
    # Extension not visible yet, retry
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo -e "${YELLOW}  Extension not detected yet, retrying... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
      sleep 1
    fi
  fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo -e "${YELLOW}⚠ Could not enable extension automatically after $MAX_RETRIES attempts.${NC}"
  echo -e "${YELLOW}  Please enable it manually using GNOME Extensions app.${NC}"
fi

# Restart GNOME Shell to load the enabled extension
echo ""
echo -e "${BLUE}Restarting GNOME Shell to load extension...${NC}"
busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'Meta.restart("Restarting...");' > /dev/null 2>&1 || true
echo -e "${GREEN}✓${NC} GNOME Shell restart requested"

sleep 3

# Success message
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Installation completed successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
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
