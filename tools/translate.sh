#!/bin/bash
# Script to manage translations for Net Speed Animals extension

set -e

EXTENSION_PATH="$(cd "$(dirname "$0")" && pwd)"
LOCALE_DIR="$EXTENSION_PATH/locale"
POT_FILE="$LOCALE_DIR/net-speed-animals.pot"

# ANSI colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Net Speed Animals - Translation Manager${NC}\n"

# Extract translatable strings from source files
extract_strings() {
    echo "Extracting translatable strings..."
    xgettext \
        --keyword=_ \
        --keyword=ngettext:1,2 \
        --output="$POT_FILE" \
        --from-code=UTF-8 \
        "$EXTENSION_PATH/extension.js" \
        "$EXTENSION_PATH/prefs.js"
    echo -e "${GREEN}✓ POT file generated: $POT_FILE${NC}"
}

# Update .po files from template
update_translations() {
    echo "Updating translation files..."
    for lang in fr en de es it; do
        po_file="$LOCALE_DIR/$lang.po"
        if [ -f "$po_file" ]; then
            msgmerge --update "$po_file" "$POT_FILE"
            echo -e "${GREEN}✓ Updated $lang.po${NC}"
        fi
    done
}

# Compile .po files to .mo files
compile_translations() {
    echo "Compiling translations..."
    for lang in fr en de es it; do
        po_file="$LOCALE_DIR/$lang.po"
        mo_dir="$LOCALE_DIR/$lang/LC_MESSAGES"
        mo_file="$mo_dir/net-speed-animals.mo"
        
        if [ -f "$po_file" ]; then
            mkdir -p "$mo_dir"
            msgfmt -o "$mo_file" "$po_file"
            echo -e "${GREEN}✓ Compiled $lang: $mo_file${NC}"
        fi
    done
}

# Main action
case "${1:-build}" in
    extract)
        extract_strings
        ;;
    update)
        extract_strings
        update_translations
        ;;
    compile)
        compile_translations
        ;;
    build)
        extract_strings
        update_translations
        compile_translations
        echo -e "\n${GREEN}Translation build complete!${NC}"
        ;;
    *)
        echo "Usage: $0 {extract|update|compile|build}"
        echo ""
        echo "Commands:"
        echo "  extract  - Extract translatable strings from source files"
        echo "  update   - Extract and update .po files from template"
        echo "  compile  - Compile .po files to .mo files"
        echo "  build    - Full build: extract, update, and compile"
        exit 1
        ;;
esac
