# Traductions - Net Speed Animals

Ce document explique comment gérer les traductions pour l'extension GNOME Shell "Net Speed Animals".

## Structure des fichiers

```
locale/
├── POTFILES.in                    # Liste des fichiers source à scanner
├── net-speed-animals.pot          # Template de traduction (généré automatiquement)
├── fr.po                          # Traduction française
├── en.po                          # Traduction anglaise
├── fr/
│   └── LC_MESSAGES/
│       └── net-speed-animals.mo   # Fichier compilé français
└── en/
    └── LC_MESSAGES/
        └── net-speed-animals.mo   # Fichier compilé anglais
```

## Utilisation

### Générer le fichier POT (Template)
```bash
./translate.sh extract
```

### Mettre à jour les traductions existantes
```bash
./translate.sh update
```
Cela met à jour les fichiers `.po` avec les nouvelles chaînes à traduire.

### Compiler les traductions
```bash
./translate.sh compile
```
Génère les fichiers `.mo` binaires utilisés par gettext.

### Build complet
```bash
./translate.sh build
```
Effectue les trois étapes : extract, update, compile.

## Ajouter une nouvelle langue

1. **Créer un nouveau fichier `.po`** à partir du template:
   ```bash
   cp locale/net-speed-animals.pot locale/xx.po
   ```
   Où `xx` est le code de langue (ex: `de`, `es`, `it`).

2. **Modifier l'en-tête du fichier** `.po`:
   - Changer `Language:` à la langue appropriée
   - Mettre à jour `Language-Team:` avec le nom de l'équipe
   - Mettre à jour `Last-Translator:`

3. **Traduire les chaînes**:
   ```po
   msgid "Original string"
   msgstr "Chaîne traduite"
   ```

4. **Compiler la traduction**:
   ```bash
   ./translate.sh compile
   ```

## Ajouter de nouvelles chaînes à traduire

1. **Entourer les chaînes avec `_()`** dans les fichiers JavaScript:
   ```javascript
   const title = _('My Title');
   const message = _('This is a message to translate');
   ```

2. **Générer et mettre à jour les fichiers `.po`**:
   ```bash
   ./translate.sh build
   ```

3. **Les traducteurs complètent les traductions manquantes** dans chaque fichier `.po`.

4. **Compiler les traductions**:
   ```bash
   ./translate.sh compile
   ```

## Notes importantes

- Les fichiers `.mo` sont binaires et ne doivent pas être édités directement
- Utilisez toujours `msgfmt` pour compiler les traductions
- Les fichiers `.po` sont au format texte et peuvent être édités avec n'importe quel éditeur
- L'extension GNOME Shell a besoin de fichiers `.mo` compilés pour fonctionner
- Les chaînes vides (`msgstr ""`) dans le fichier POT sont le template par défaut

## Pour les contributeurs

Si vous souhaitez contribuer une traduction:

1. Téléchargez le fichier POT et créez un nouveau fichier `.po` pour votre langue
2. Traduisez chaque `msgstr ""` avec votre traduction
3. Compilez avec `msgfmt` pour vérifier qu'il n'y a pas d'erreurs
4. Soumettez le fichier `.po` compilé en tant que `.mo` et le fichier source `.po`

## Références

- [GNU gettext - Format PO](https://www.gnu.org/software/gettext/manual/gettext.html#PO-Files)
- [GNOME i18n Documentation](https://wiki.gnome.org/GettextUsage)
