#!/bin/bash
# Uninstallation script for Net Speed Animals GNOME Shell Extension
# Script de désinstallation pour l extension GNOME Shell Net Speed Animals

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
GSETTINGS_PATH="/org/gnome/shell/extensions/net-speed-animals/"

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Net Speed Animals - GNOME Shell Extension Uninstaller${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Confirm uninstallation
read -p "Are you sure you want to uninstall $EXTENSION_UUID? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Uninstallation cancelled.${NC}"
  exit 0
fi

echo ""

# Uninstall extension
echo -e "${BLUE}Uninstalling extension...${NC}"

if gnome-extensions list 2>/dev/null | grep -q "$EXTENSION_UUID"; then
  gnome-extensions uninstall "$EXTENSION_UUID" 2>/dev/null || true
  echo -e "${GREEN}✓${NC} Extension uninstalled"
else
  echo -e "${YELLOW}⚠ Extension not found in GNOME Extensions list${NC}"
fi

# Reset preferences
echo ""
echo -e "${BLUE}Resetting preferences...${NC}"

if command -v dconf &> /dev/null; then
  dconf reset -f "$GSETTINGS_PATH" 2>/dev/null || true
  echo -e "${GREEN}✓${NC} Preferences reset"
else
  echo -e "${YELLOW}⚠ dconf not found, skipping preferences reset${NC}"
fi

# Remove extension directory
echo ""
echo -e "${BLUE}Removing extension files...${NC}"

if [ -d "$EXTENSION_DIR" ]; then
  rm -rf "$EXTENSION_DIR"
  echo -e "${GREEN}✓${NC} Extension directory removed"
else
  echo -e "${YELLOW}⚠ Extension directory not found${NC}"
fi

# Restart GNOME Shell
echo ""
echo -e "${BLUE}Restarting GNOME Shell...${NC}"
busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'Meta.restart("Restarting...");' > /dev/null 2>&1 || true
echo -e "${GREEN}✓${NC} GNOME Shell restart requested"

sleep 2

# Success message
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Uninstallation completed successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Net Speed Animals has been removed. See you soon! 🐌${NC}"
echo ""
