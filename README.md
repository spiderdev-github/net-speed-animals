# Net Speed Animals - Extension GNOME Shell

Extension GNOME Shell complète de monitoring système avec des animations d'animaux (escargot 🐌, tortue 🐢, lapin 🐰) qui changent selon la vitesse du réseau, et des indicateurs visuels pour CPU, mémoire, température et disque.

## Installation rapide

```bash
chmod +x install.sh
./install.sh
```

## Fonctionnalités

### 🌐 Réseau
- **Animation animée** selon la vitesse réseau (escargot → tortue → lapin)
- **Affichage de la vitesse** en Mbit/s, KB/s ou B/s (adaptatif)
- **Modes d'affichage** : combiné, séparé (↓/↑), téléchargement seul, envoi seul
- **Sélection d'interface** : automatique ou manuelle (eth0, wlan0, etc.)
- **Graphique de débit** en temps réel dans le menu (60s d'historique)

### 🧠 Mémoire
- **Icône blob** à 4 niveaux selon l'utilisation mémoire
- **Étiquette %** affichée dans le panneau
- **Seuils configurables** (25%, 50%, 75% par défaut)
- **Graphique mémoire** (jaune) dans le menu

### ⚡ CPU
- **Icône CPU** à 4 niveaux d'activité
- **Étiquette %** affichée dans le panneau
- **Seuils configurables** (25%, 50%, 75% par défaut)
- **Graphique CPU** (bleu) dans le menu

### 🌡️ Température
- **Icône thermomètre** à 4 niveaux (froid, tiède, chaud, critique)
- **Étiquette °C** affichée dans le panneau
- **Détection automatique** des zones thermiques
- **Seuils configurables** (50°C, 70°C, 85°C par défaut)
- **Graphique température** (rouge) dans le menu

### 💾 Disque (E/S)
- **Icône disque** à 4 niveaux d'activité (inactif, faible, moyen, élevé)
- **Étiquette vitesse** en Mbit/s, KB/s ou B/s (adaptatif)
- **Modes d'affichage** : combiné, séparé (R:/W:), lecture seule, écriture seule
- **Détection automatique** des périphériques (sda, nvme0n1, etc.)
- **Graphique E/S disque** (violet) dans le menu

### 📊 Statistiques réseau
- **Suivi du trafic** : session, journalier, hebdomadaire, mensuel
- **Sauvegarde automatique** toutes les 60 secondes
- **Réinitialisation** des stats de session

### 📈 Quota de bande passante
- **Barre de progression** dans le menu (vert → jaune → orange → rouge)
- **Quota mensuel configurable** en Go
- **Notifications** à 75% (avertissement) et 90% (critique)

### 🔔 Notifications
- **Alerte réseau** : vitesse sous le seuil
- **Alerte CPU** : utilisation > 90% (configurable)
- **Alerte mémoire** : utilisation > 90% (configurable)
- **Alerte température** : température > 85°C (configurable)
- **Alerte quota** : avertissement et critique
- **Anti-spam** : délai de 5 minutes entre les mêmes alertes

### 🎨 Thèmes de couleur
- **Couleurs adaptatives** sur les étiquettes selon les seuils (vert/jaune/rouge)
- Applicable à la vitesse réseau, mémoire, CPU et température

### 🖱️ Actions de clic (désactivées par défaut)
- **Clic gauche** : parcourir les modes d'affichage de vitesse
- **Clic molette** : ouvrir les préférences
- **Défilement** : changer d'interface réseau

## Configuration

Ouvrir les préférences :
```bash
gnome-extensions prefs net-speed-animals@spiderdev.fr
```

### Pages de préférences

#### Général
- Seuils de vitesse des animaux (tortue/lapin)
- Vitesse d'animation (min/max)
- Seuils mémoire et CPU (4 niveaux)
- Seuils température (tiède/chaud/critique)
- Mode d'affichage de la vitesse réseau
- Sélection d'interface réseau
- Thèmes de couleur
- Actions de clic (clic gauche, défilement)
- Statistiques et graphiques (vitesse, mémoire, CPU, température, disque)

#### Affichage
- Activer/désactiver chaque icône et étiquette
- Graphiques individuels pour chaque métrique
- Mode d'affichage E/S disque

#### Notifications
- Activation/désactivation globale
- Alertes réseau avec seuil configurable
- Alertes CPU avec seuil configurable
- Alertes mémoire avec seuil configurable
- Alertes température avec seuil configurable
- Quota de bande passante mensuel avec seuils d'avertissement/critique

## Structure du projet

```
net-speed-animals@spiderdev.fr/
├── extension.js           # Code principal de l'extension
├── prefs.js               # Interface de préférences
├── metadata.json          # Métadonnées de l'extension
├── stylesheet.css         # Styles CSS
├── install.sh             # Script d'installation
├── icons/
│   ├── snail/             # Animations escargot (7 frames)
│   ├── turtle/            # Animations tortue (7 frames)
│   ├── rabbit/            # Animations lapin (7 frames)
│   ├── blob/              # Icônes mémoire (4 niveaux)
│   ├── cpu/               # Icônes CPU (4 niveaux)
│   ├── temperature/       # Icônes température (4 niveaux)
│   └── disk/              # Icônes disque (4 niveaux)
├── monitors/
│   ├── temperatureMonitor.js  # Lecture /sys/class/thermal/
│   └── diskMonitor.js         # Lecture /proc/diskstats
├── widgets/
│   ├── speedGraph.js      # Graphique réseau (download/upload)
│   ├── systemGraph.js     # Graphique générique (mémoire, CPU, temp)
│   └── quotaBar.js        # Barre de progression du quota
├── utils/
│   ├── storage.js         # Stockage des statistiques réseau
│   ├── formatters.js      # Formatage (octets, température)
│   └── notifications.js   # Gestionnaire de notifications
├── schemas/
│   └── org.gnome.shell.extensions.net-speed-animals.gschema.xml
├── po/
│   └── fr.po              # Traduction française
└── locale/
    └── fr/LC_MESSAGES/    # Traduction compilée
```

## Compatibilité

- GNOME Shell 45, 46, 47, 48
- Wayland et X11
- Ubuntu, Fedora, Arch Linux

## Désinstallation

```bash
gnome-extensions uninstall net-speed-animals@spiderdev.fr
```
