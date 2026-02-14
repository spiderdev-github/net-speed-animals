#!/bin/bash
# Script pour recompiler les fichiers de traduction
# À exécuter dans le dossier de l'extension

set -e

echo "Compilation des traductions..."

# Compiler la traduction française
msgfmt locale/fr.po -o locale/fr/LC_MESSAGES/net-speed-animals.mo
echo "✓ Traduction française compilée"

# Compiler la traduction anglaise
msgfmt locale/en.po -o locale/en/LC_MESSAGES/net-speed-animals.mo
echo "✓ Traduction anglaise compilée"

echo ""
echo "Traductions compilées avec succès !"
echo ""
echo "Pour recharger l'extension :"
echo "  gnome-extensions disable net-speed-animals@spiderdev.fr"
echo "  gnome-extensions enable net-speed-animals@spiderdev.fr"
echo ""
echo "Ou redémarrer GNOME Shell : Alt+F2, taper 'r', puis Entrée"
