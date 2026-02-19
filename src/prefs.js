import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class NetSpeedAnimalsPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    // Load prefs CSS (GTK)
    try {
      const cssProvider = new Gtk.CssProvider();
      cssProvider.load_from_path(`${this.path}/prefs.css`);
      Gtk.StyleContext.add_provider_for_display(
        window.get_display(),
        cssProvider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
      );
    } catch (e) {
      // Ignore CSS errors
    }

    const settings = this.getSettings();
    window.set_search_enabled(true);

    // Apply language override before any gettext calls
    const lang = settings.get_string('language');
    if (lang) {
      GLib.setenv('LANGUAGE', lang, true);
    }

    const _ = this.gettext.bind(this);

    const setSettingValue = (key, value) => {
      if (typeof value === 'boolean') {
        settings.set_boolean(key, value);
        return;
      }
      if (typeof value === 'number') {
        if (Number.isInteger(value)) settings.set_int(key, value);
        else settings.set_double(key, value);
        return;
      }
      settings.set_string(key, String(value));
    };

    const getSettingType = (key) => {
      const variant = settings.get_default_value(key);
      return variant ? variant.get_type_string() : null;
    };

    const getSettingValue = (key) => {
      const variant = settings.get_value(key);
      return variant ? variant.deepUnpack() : null;
    };

    const exportSettingsToPath = (filePath) => {
      const allKeys = settings.list_keys();
      const exportableKeys = allKeys.filter(key => !['did-initialize', 'prefs-start-page'].includes(key));

      const payload = {
        format: 'net-speed-animals-settings',
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: {},
      };

      for (const key of exportableKeys) {
        payload.settings[key] = getSettingValue(key);
      }

      const json = JSON.stringify(payload, null, 2);
      GLib.file_set_contents(filePath, json);
    };

    const importSettingsFromPath = (filePath) => {
      const [ok, bytes] = GLib.file_get_contents(filePath);
      if (!ok) throw new Error('Unable to read file');

      const text = new TextDecoder('utf-8').decode(bytes);
      const parsed = JSON.parse(text);
      const source = parsed?.settings && typeof parsed.settings === 'object'
        ? parsed.settings
        : parsed;

      if (!source || typeof source !== 'object') {
        throw new Error('Invalid JSON settings payload');
      }

      const validKeys = new Set(settings.list_keys());
      const keys = Object.keys(source).filter(k => validKeys.has(k));

      for (const key of keys) {
        const value = source[key];
        const type = getSettingType(key);

        switch (type) {
          case 'b':
            settings.set_boolean(key, Boolean(value));
            break;
          case 'i': {
            const parsedInt = Number.parseInt(value, 10);
            if (Number.isFinite(parsedInt)) settings.set_int(key, parsedInt);
            break;
          }
          case 'd': {
            const parsedDouble = Number(value);
            if (Number.isFinite(parsedDouble)) settings.set_double(key, parsedDouble);
            break;
          }
          case 's':
            settings.set_string(key, String(value));
            break;
          default:
            break;
        }
      }
    };

    const QUICK_PROFILE_IDS = ['custom', 'laptop', 'gaming', 'dev', 'low-power'];
    const QUICK_PROFILE_PRESETS = {
      laptop: {
        'threshold-mode': 'stable',
        'disable-animation': false,
        'min-anim-speed': 120,
        'max-anim-speed': 520,
        'show-speed-label': false,
        'show-memory-icon': true,
        'show-memory-label': true,
        'show-cpu-icon': false,
        'show-cpu-label': false,
        'show-temperature-icon': true,
        'show-temperature-label': true,
        'show-disk-icon': false,
        'show-disk-label': false,
        'show-speed-graph': true,
        'show-memory-graph': false,
        'show-cpu-graph': false,
        'show-temperature-graph': true,
        'show-disk-graph': false,
        'enable-notifications': true,
        'notify-cpu-high': false,
        'notify-memory-high': true,
        'notify-temperature-high': true,
        'cpu-alert-threshold': 95.0,
        'memory-alert-threshold': 92.0,
        'temperature-alert-threshold': 82.0,
      },
      gaming: {
        'threshold-mode': 'spectacular',
        'disable-animation': false,
        'min-anim-speed': 70,
        'max-anim-speed': 260,
        'show-speed-label': true,
        'show-memory-icon': true,
        'show-memory-label': true,
        'show-cpu-icon': true,
        'show-cpu-label': true,
        'show-temperature-icon': true,
        'show-temperature-label': true,
        'show-disk-icon': true,
        'show-disk-label': true,
        'show-speed-graph': true,
        'show-memory-graph': true,
        'show-cpu-graph': true,
        'show-temperature-graph': true,
        'show-disk-graph': true,
        'enable-notifications': true,
        'notify-cpu-high': true,
        'notify-memory-high': true,
        'notify-temperature-high': true,
        'cpu-alert-threshold': 92.0,
        'memory-alert-threshold': 92.0,
        'temperature-alert-threshold': 80.0,
        'enable-color-themes': true,
      },
      dev: {
        'threshold-mode': 'stable',
        'disable-animation': false,
        'min-anim-speed': 90,
        'max-anim-speed': 420,
        'speed-display-mode': 'separate',
        'show-speed-label': true,
        'show-memory-icon': true,
        'show-memory-label': true,
        'show-cpu-icon': true,
        'show-cpu-label': true,
        'show-temperature-icon': true,
        'show-temperature-label': true,
        'show-disk-icon': true,
        'show-disk-label': true,
        'show-speed-graph': true,
        'show-memory-graph': true,
        'show-cpu-graph': true,
        'show-temperature-graph': true,
        'show-disk-graph': true,
        'track-statistics': true,
        'show-statistics': true,
        'enable-notifications': true,
        'cpu-alert-threshold': 90.0,
        'memory-alert-threshold': 90.0,
        'temperature-alert-threshold': 85.0,
      },
      'low-power': {
        'threshold-mode': 'stable',
        'disable-animation': true,
        'show-animal-icon': true,
        'show-speed-label': false,
        'show-memory-icon': false,
        'show-memory-label': false,
        'show-cpu-icon': false,
        'show-cpu-label': false,
        'show-temperature-icon': false,
        'show-temperature-label': false,
        'show-disk-icon': false,
        'show-disk-label': false,
        'show-speed-graph': false,
        'show-memory-graph': false,
        'show-cpu-graph': false,
        'show-temperature-graph': false,
        'show-disk-graph': false,
        'show-statistics': false,
        'enable-notifications': false,
        'enable-color-themes': false,
      },
    };

    const QUICK_PROFILE_MANAGED_KEYS = [...new Set(
      Object.values(QUICK_PROFILE_PRESETS).flatMap(preset => Object.keys(preset))
    )];

    const applyQuickProfile = (profileId) => {
      const preset = QUICK_PROFILE_PRESETS[profileId];
      if (!preset) {
        settings.set_string('quick-profile', 'custom');
        return false;
      }

      for (const [key, value] of Object.entries(preset)) {
        setSettingValue(key, value);
      }

      settings.set_string('quick-profile', profileId);
      return true;
    };

    const resetQuickProfileToCustom = () => {
      for (const key of QUICK_PROFILE_MANAGED_KEYS) {
        settings.reset(key);
      }
      settings.set_string('quick-profile', 'custom');
    };

    // Available languages with flags and native names
    const LANGUAGES = [
      { code: '', label: `🌐  ${_('System Default')}` },
      { code: 'en', label: '🇬🇧  English' },
      { code: 'fr', label: '🇫🇷  Français' },
      { code: 'de', label: '🇩🇪  Deutsch' },
      { code: 'es', label: '🇪🇸  Español' },
      { code: 'it', label: '🇮🇹  Italiano' },
    ];

    // Filter to only show languages that have compiled .mo files
    const availableLanguages = LANGUAGES.filter(l => {
      if (l.code === '') return true; // Always show "System Default"
      const moPath = `${this.path}/locale/${l.code}/LC_MESSAGES/net-speed-animals.mo`;
      const file = Gio.File.new_for_path(moPath);
      return file.query_exists(null);
    });

    const makePill = (text) => {
      const l = new Gtk.Label({
        label: text,
        xalign: 0,
      });
      l.add_css_class('pill');
      return l;
    };

    const makeLinkButton = (label, uri) => {
      const b = new Gtk.LinkButton({ label, uri });
      b.add_css_class('suggested-action');
      return b;
    };

    // ========== General Page ==========
    const page = new Adw.PreferencesPage({
      title: _('General'),
      icon_name: 'preferences-system-symbolic',
    });
    window.add(page);

    // Network Interface group
    const interfaceGroup = new Adw.PreferencesGroup({
      title: _('Network Interface'),
      description: _('Select which network interface to monitor'),
    });
    page.add(interfaceGroup);

    const interfaceModeCombo = new Gtk.StringList();
    interfaceModeCombo.append(_('Automatic (smart detection)'));
    interfaceModeCombo.append(_('Manual (select below)'));

    const interfaceModeRow = new Adw.ComboRow({
      title: _('Interface Selection Mode'),
      subtitle: _('How to choose the network interface'),
      model: interfaceModeCombo,
    });

    const interfaceMode = settings.get_string('interface-mode');
    interfaceModeRow.selected = interfaceMode === 'manual' ? 1 : 0;

    interfaceModeRow.connect('notify::selected', () => {
      const modes = ['auto', 'manual'];
      settings.set_string('interface-mode', modes[interfaceModeRow.selected]);
    });

    interfaceGroup.add(interfaceModeRow);

    const interfaceEntry = new Adw.EntryRow({
      title: _('Interface Name'),
      text: settings.get_string('pinned-interface'),
    });

    interfaceEntry.connect('changed', () => {
      settings.set_string('pinned-interface', interfaceEntry.text);
    });

    interfaceGroup.add(interfaceEntry);

    const ignoreVirtualSwitch = new Gtk.Switch({
      active: settings.get_boolean('auto-ignore-virtual-ifaces'),
      valign: Gtk.Align.CENTER,
    });

    const ignoreVirtualRow = new Adw.ActionRow({
      title: _('Auto: Ignore Virtual Interfaces'),
      subtitle: _('Ignore virtual/VPN-like interfaces (tun/tap/wg/virbr, etc.) when selecting automatically'),
      activatable_widget: ignoreVirtualSwitch,
    });
    ignoreVirtualRow.add_suffix(ignoreVirtualSwitch);
    settings.bind('auto-ignore-virtual-ifaces', ignoreVirtualSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    interfaceGroup.add(ignoreVirtualRow);

    const ignoreDockerSwitch = new Gtk.Switch({
      active: settings.get_boolean('auto-ignore-docker-ifaces'),
      valign: Gtk.Align.CENTER,
    });

    const ignoreDockerRow = new Adw.ActionRow({
      title: _('Auto: Ignore Docker/Container Interfaces'),
      subtitle: _('Ignore docker0, veth*, br-*, cni*, and related container interfaces'),
      activatable_widget: ignoreDockerSwitch,
    });
    ignoreDockerRow.add_suffix(ignoreDockerSwitch);
    settings.bind('auto-ignore-docker-ifaces', ignoreDockerSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    interfaceGroup.add(ignoreDockerRow);

    const ignoreTailscaleSwitch = new Gtk.Switch({
      active: settings.get_boolean('auto-ignore-tailscale-ifaces'),
      valign: Gtk.Align.CENTER,
    });

    const ignoreTailscaleRow = new Adw.ActionRow({
      title: _('Auto: Ignore Tailscale Interfaces'),
      subtitle: _('Ignore tailscale interfaces during automatic selection'),
      activatable_widget: ignoreTailscaleSwitch,
    });
    ignoreTailscaleRow.add_suffix(ignoreTailscaleSwitch);
    settings.bind('auto-ignore-tailscale-ifaces', ignoreTailscaleSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    interfaceGroup.add(ignoreTailscaleRow);

    // Quick profiles group
    const quickProfileGroup = new Adw.PreferencesGroup({
      title: _('Quick Profiles'),
      description: _('Apply ready-to-use preset configurations'),
    });
    page.add(quickProfileGroup);

    const quickProfileList = new Gtk.StringList();
    quickProfileList.append(_('Custom')); 
    quickProfileList.append(_('Laptop')); 
    quickProfileList.append(_('Gaming')); 
    quickProfileList.append(_('Dev')); 
    quickProfileList.append(_('Low-power')); 

    const quickProfileRow = new Adw.ComboRow({
      title: _('Preset Profile'),
      subtitle: _('Laptop, Gaming, Dev, or Low-power (applies immediately)'),
      model: quickProfileList,
    });

    const currentProfileId = settings.get_string('quick-profile');
    const currentProfileIndex = QUICK_PROFILE_IDS.indexOf(currentProfileId);
    quickProfileRow.selected = currentProfileIndex >= 0 ? currentProfileIndex : 0;

    quickProfileRow.connect('notify::selected', () => {
      const profileId = QUICK_PROFILE_IDS[quickProfileRow.selected] ?? 'custom';

      if (profileId === 'custom') {
        settings.set_string('quick-profile', 'custom');
        return;
      }

      const applied = applyQuickProfile(profileId);
      if (!applied) return;

      const toast = new Adw.Toast({
        title: _('Profile applied. Changes are active immediately.'),
        timeout: 3,
      });
      window.add_toast(toast);
    });

    settings.connect('changed::quick-profile', () => {
      const profileId = settings.get_string('quick-profile');
      const profileIndex = QUICK_PROFILE_IDS.indexOf(profileId);
      const index = profileIndex >= 0 ? profileIndex : 0;
      if (quickProfileRow.selected !== index) quickProfileRow.selected = index;
    });

    quickProfileGroup.add(quickProfileRow);

    const resetProfileRow = new Adw.ActionRow({
      title: _('Reset to Custom'),
      subtitle: _('Restore default values for all profile-managed settings and switch to Custom'),
    });

    const resetProfileButton = new Gtk.Button({
      label: _('Reset'),
      valign: Gtk.Align.CENTER,
      css_classes: ['destructive-action'],
    });

    resetProfileButton.connect('clicked', () => {
      resetQuickProfileToCustom();
      const toast = new Adw.Toast({
        title: _('Profile reset to Custom.'),
        timeout: 3,
      });
      window.add_toast(toast);
    });

    resetProfileRow.add_suffix(resetProfileButton);
    resetProfileRow.activatable_widget = resetProfileButton;
    quickProfileGroup.add(resetProfileRow);

    // const profilePreviewGroup = new Adw.PreferencesGroup({
    //   title: _('Profile Preview'),
    //   description: _('Quick visual summary of each preset'),
    // });
    // page.add(profilePreviewGroup);

    // const createProfilePreviewRow = (emoji, title, subtitle) => {
    //   const row = new Adw.ActionRow({
    //     title,
    //     subtitle,
    //     activatable: false,
    //   });
    //   row.add_prefix(new Gtk.Label({
    //     label: emoji,
    //     valign: Gtk.Align.CENTER,
    //   }));
    //   return row;
    // };

    // profilePreviewGroup.add(createProfilePreviewRow(
    //   '💻',
    //   _('Laptop'),
    //   _('Balanced and cooler setup: fewer indicators, calm alerts, battery-friendly behavior')
    // ));
    // profilePreviewGroup.add(createProfilePreviewRow(
    //   '🎮',
    //   _('Gaming'),
    //   _('Full visibility with all indicators and graphs enabled, responsive animations, active alerts')
    // ));
    // profilePreviewGroup.add(createProfilePreviewRow(
    //   '🧑‍💻',
    //   _('Dev'),
    //   _('Detailed monitoring for coding sessions: separate network view, full graphs, and statistics')
    // ));
    // profilePreviewGroup.add(createProfilePreviewRow(
    //   '🔋',
    //   _('Low-power'),
    //   _('Minimal resource usage: static icon, compact display, graphs and notifications mostly disabled')
    // ));
    // profilePreviewGroup.add(createProfilePreviewRow(
    //   '🛠️',
    //   _('Custom'),
    //   _('Manual mode: your own mix of options and thresholds without preset constraints')
    // ));

    // Animation group
    const animGroup = new Adw.PreferencesGroup({
      title: _('Animation'),
      description: _('Adjust animation speed'),
    });
    page.add(animGroup);

    const minAnimRow = new Adw.SpinRow({
      title: _('Min Animation Speed'),
      subtitle: _('Fastest animation interval (ms) at high speed'),
      adjustment: new Gtk.Adjustment({
        lower: 50,
        upper: 500,
        step_increment: 10,
        page_increment: 50,
        value: 90,
      }),
      digits: 0,
    });

    settings.bind('min-anim-speed', minAnimRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    animGroup.add(minAnimRow);

    const maxAnimRow = new Adw.SpinRow({
      title: _('Max Animation Speed'),
      subtitle: _('Slowest animation interval (ms) at low speed'),
      adjustment: new Gtk.Adjustment({
        lower: 100,
        upper: 1000,
        step_increment: 10,
        page_increment: 50,
        value: 450,
      }),
      digits: 0,
    });

    settings.bind('max-anim-speed', maxAnimRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    animGroup.add(maxAnimRow);

    const disableAnimSwitch = new Gtk.Switch({
      active: settings.get_boolean('disable-animation'),
      valign: Gtk.Align.CENTER,
    });

    const disableAnimRow = new Adw.ActionRow({
      title: _('Disable Animation'),
      subtitle: _('Show a static icon instead of animated frames (uses fixed-animal.svg if available)'),
      activatable_widget: disableAnimSwitch,
    });
    disableAnimRow.add_suffix(disableAnimSwitch);

    settings.bind('disable-animation', disableAnimSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    animGroup.add(disableAnimRow);

    // Grey out animation speed rows when animation is disabled
    const updateAnimSensitivity = () => {
      const disabled = settings.get_boolean('disable-animation');
      minAnimRow.sensitive = !disabled;
      maxAnimRow.sensitive = !disabled;
    };
    updateAnimSensitivity();
    settings.connect('changed::disable-animation', updateAnimSensitivity);

    // Panel Position group
    const positionGroup = new Adw.PreferencesGroup({
      title: _('Panel Position'),
      description: _('Choose where the indicator appears in the top bar'),
    });
    page.add(positionGroup);

    const panelBoxCombo = new Gtk.StringList();
    panelBoxCombo.append(_('Left'));
    panelBoxCombo.append(_('Center'));
    panelBoxCombo.append(_('Right'));

    const panelBoxRow = new Adw.ComboRow({
      title: _('Position in Panel'),
      subtitle: _('Place the indicator on the left, center, or right of the top bar'),
      model: panelBoxCombo,
    });

    const panelBoxValue = settings.get_string('panel-box');
    const panelBoxMap = { 'left': 0, 'center': 1, 'right': 2 };
    panelBoxRow.selected = panelBoxMap[panelBoxValue] ?? 2;

    panelBoxRow.connect('notify::selected', () => {
      const boxValues = ['left', 'center', 'right'];
      settings.set_string('panel-box', boxValues[panelBoxRow.selected]);
    });

    positionGroup.add(panelBoxRow);

    const panelPositionRow = new Adw.SpinRow({
      title: _('Position Index'),
      subtitle: _('Order within the chosen panel area (0 = first)'),
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 20,
        step_increment: 1,
        page_increment: 5,
        value: 0,
      }),
      digits: 0,
    });

    settings.bind('panel-position', panelPositionRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    positionGroup.add(panelPositionRow);

    // Statistics group
    const statisticsGroup = new Adw.PreferencesGroup({
      title: _('Network Statistics'),
      description: _('Track and display network traffic statistics'),
    });
    page.add(statisticsGroup);

    const trackStatsSwitch = new Gtk.Switch({
      active: settings.get_boolean('track-statistics'),
      valign: Gtk.Align.CENTER,
    });

    const trackStatsRow = new Adw.ActionRow({
      title: _('Track Statistics'),
      subtitle: _('Record network traffic data (session/daily/weekly/monthly)'),
      activatable_widget: trackStatsSwitch,
    });
    trackStatsRow.add_suffix(trackStatsSwitch);

    settings.bind('track-statistics', trackStatsSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    statisticsGroup.add(trackStatsRow);

    const showStatsSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-statistics'),
      valign: Gtk.Align.CENTER,
    });

    const showStatsRow = new Adw.ActionRow({
      title: _('Show Statistics in Menu'),
      subtitle: _('Display traffic statistics in the popup menu'),
      activatable_widget: showStatsSwitch,
    });
    showStatsRow.add_suffix(showStatsSwitch);

    settings.bind('show-statistics', showStatsSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    statisticsGroup.add(showStatsRow);

    // Click actions group
    const clickActionsGroup = new Adw.PreferencesGroup({
      title: _('Click Actions'),
      description: _('Configure mouse click and scroll interactions'),
    });
    page.add(clickActionsGroup);

    const enableMiddleClickSwitch = new Gtk.Switch({
      active: settings.get_boolean('enable-middle-click-preference'),
      valign: Gtk.Align.CENTER,
    });

    const enableMiddleClickRow = new Adw.ActionRow({
      title: _('Middle-Click to Open Preferences'),
      subtitle: _('Middle-click the panel icon to open preferences (off = open popup menu)'),
      activatable_widget: enableMiddleClickSwitch,
    });
    enableMiddleClickRow.add_suffix(enableMiddleClickSwitch);

    settings.bind('enable-middle-click-preference', enableMiddleClickSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    clickActionsGroup.add(enableMiddleClickRow);
    
    const enableLeftClickSwitch = new Gtk.Switch({
      active: settings.get_boolean('enable-left-click-cycle'),
      valign: Gtk.Align.CENTER,
    });

    const enableLeftClickRow = new Adw.ActionRow({
      title: _('Left-Click to Cycle Speed Display'),
      subtitle: _('Click the panel icon to cycle through speed display modes'),
      activatable_widget: enableLeftClickSwitch,
    });
    enableLeftClickRow.add_suffix(enableLeftClickSwitch);

    settings.bind('enable-left-click-cycle', enableLeftClickSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    clickActionsGroup.add(enableLeftClickRow);

    const enableScrollSwitch = new Gtk.Switch({
      active: settings.get_boolean('enable-scroll-interface-switch'),
      valign: Gtk.Align.CENTER,
    });

    const enableScrollRow = new Adw.ActionRow({
      title: _('Scroll to Switch Network Interface'),
      subtitle: _('Scroll on the panel icon to switch network interfaces'),
      activatable_widget: enableScrollSwitch,
    });
    enableScrollRow.add_suffix(enableScrollSwitch);

    settings.bind('enable-scroll-interface-switch', enableScrollSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    clickActionsGroup.add(enableScrollRow);

    

    // Language group
    const languageGroup = new Adw.PreferencesGroup({
      title: _('Language'),
      description: _('Choose the extension language'),
    });
    page.add(languageGroup);

    const languageModel = new Gtk.StringList();
    for (const l of availableLanguages) {
      languageModel.append(l.label);
    }

    const languageRow = new Adw.ComboRow({
      title: _('Extension Language'),
      subtitle: _('Select language for this extension (requires reload)'),
      model: languageModel,
    });

    // Set current selection
    const currentLang = settings.get_string('language');
    const currentIndex = availableLanguages.findIndex(l => l.code === currentLang);
    languageRow.selected = currentIndex >= 0 ? currentIndex : 0;

    languageRow.connect('notify::selected', () => {
      const selectedLang = availableLanguages[languageRow.selected];
      if (!selectedLang) return;

      const prevLang = settings.get_string('language');
      if (selectedLang.code === prevLang) return;

      settings.set_string('language', selectedLang.code);

      // Show info banner that prefs need to be reopened
      const banner = new Adw.Banner({
        title: _('Language changed. Reopen preferences to apply.'),
        revealed: true,
      });
      banner.add_css_class('warning');
      window.add(banner);
    });

    languageGroup.add(languageRow);

    const backupGroup = new Adw.PreferencesGroup({
      title: _('Backup & Restore'),
      description: _('Export or import extension settings as JSON'),
    });
    page.add(backupGroup);

    const exportRow = new Adw.ActionRow({
      title: _('Export Settings (JSON)'),
      subtitle: _('Save current configuration to a .json file'),
    });

    const exportButton = new Gtk.Button({
      label: _('Export'),
      valign: Gtk.Align.CENTER,
      css_classes: ['suggested-action'],
    });

    exportButton.connect('clicked', () => {
      const chooser = new Gtk.FileChooserNative({
        title: _('Export Settings'),
        transient_for: window,
        action: Gtk.FileChooserAction.SAVE,
        accept_label: _('Save'),
        cancel_label: _('Cancel'),
      });

      chooser.set_current_name('net-speed-animals-settings.json');

      const filter = new Gtk.FileFilter();
      filter.set_name(_('JSON files'));
      filter.add_pattern('*.json');
      chooser.add_filter(filter);

      chooser.connect('response', (_dialog, response) => {
        if (response !== Gtk.ResponseType.ACCEPT) return;

        const file = chooser.get_file();
        const filePath = file ? file.get_path() : null;
        if (!filePath) return;

        try {
          exportSettingsToPath(filePath);
          window.add_toast(new Adw.Toast({
            title: _('Settings exported successfully.'),
            timeout: 3,
          }));
        } catch (e) {
          window.add_toast(new Adw.Toast({
            title: _('Export failed. Check file permissions.'),
            timeout: 4,
          }));
          console.error('Export settings failed:', e);
        }
      });

      chooser.show();
    });

    exportRow.add_suffix(exportButton);
    exportRow.activatable_widget = exportButton;
    backupGroup.add(exportRow);

    const importRow = new Adw.ActionRow({
      title: _('Import Settings (JSON)'),
      subtitle: _('Load configuration from a .json file and apply immediately'),
    });

    const importButton = new Gtk.Button({
      label: _('Import'),
      valign: Gtk.Align.CENTER,
      css_classes: ['destructive-action'],
    });

    importButton.connect('clicked', () => {
      const chooser = new Gtk.FileChooserNative({
        title: _('Import Settings'),
        transient_for: window,
        action: Gtk.FileChooserAction.OPEN,
        accept_label: _('Open'),
        cancel_label: _('Cancel'),
      });

      const filter = new Gtk.FileFilter();
      filter.set_name(_('JSON files'));
      filter.add_pattern('*.json');
      chooser.add_filter(filter);

      chooser.connect('response', (_dialog, response) => {
        if (response !== Gtk.ResponseType.ACCEPT) return;

        const file = chooser.get_file();
        const filePath = file ? file.get_path() : null;
        if (!filePath) return;

        try {
          importSettingsFromPath(filePath);
          window.add_toast(new Adw.Toast({
            title: _('Settings imported successfully.'),
            timeout: 3,
          }));
        } catch (e) {
          window.add_toast(new Adw.Toast({
            title: _('Import failed. Invalid or incompatible JSON file.'),
            timeout: 4,
          }));
          console.error('Import settings failed:', e);
        }
      });

      chooser.show();
    });

    importRow.add_suffix(importButton);
    importRow.activatable_widget = importButton;
    backupGroup.add(importRow);

    // Reset Settings group
    const resetGroup = new Adw.PreferencesGroup({
      title: _('Reset Settings'),
      description: _('Restore all settings to their default values'),
    });
    page.add(resetGroup);

    const resetRow = new Adw.ActionRow({
      title: _('Reset All Settings'),
      subtitle: _('This will restore all extension settings to defaults'),
      icon_name: 'edit-clear-all-symbolic',
    });

    const resetButton = new Gtk.Button({
      label: _('Reset'),
      valign: Gtk.Align.CENTER,
      css_classes: ['destructive-action'],
    });

    resetButton.connect('clicked', () => {
      // Create confirmation dialog
      const dialog = new Adw.MessageDialog({
        transient_for: window,
        modal: true,
        heading: _('Reset All Settings?'),
        body: _('This will restore all settings to their default values. This action cannot be undone.'),
      });

      dialog.add_response('cancel', _('Cancel'));
      dialog.add_response('reset', _('Reset'));
      dialog.set_response_appearance('reset', Adw.ResponseAppearance.DESTRUCTIVE);
      dialog.set_default_response('cancel');
      dialog.set_close_response('cancel');

      dialog.connect('response', (dialog, response) => {
        if (response === 'reset') {
          // Reset all settings except 'did-initialize'
          const keys = settings.list_keys();
          for (const key of keys) {
            if (key === 'did-initialize') continue; // Keep initialization flag
            settings.reset(key);
          }

          // Show success toast notification
          const toast = new Adw.Toast({
            title: _('Settings reset. Please reopen preferences to see changes.'),
            timeout: 0, // Keep visible until dismissed
          });
          toast.set_button_label(_('Close'));
          toast.connect('button-clicked', () => {
            window.close();
          });
          window.add_toast(toast);
        }
      });

      dialog.present();
    });

    resetRow.add_suffix(resetButton);
    resetRow.activatable_widget = resetButton;
    resetGroup.add(resetRow);

    // ========== Display Page ==========
    const displayPage = new Adw.PreferencesPage({
      title: _('Display'),
      icon_name: 'preferences-desktop-wallpaper-symbolic',
    });
    window.add(displayPage);

    // Icon Theme group
    const iconThemeGroup = new Adw.PreferencesGroup({
      title: _('Icon Theme'),
      description: _('Choose the animal icon theme'),
    });
    displayPage.add(iconThemeGroup);

    const ICON_THEMES = [
      { code: 'classic',  label: `🐌  ${_('Classic')} (${_('Snail / Turtle / Rabbit')})` },
      { code: 'aquatic',  label: `🐟  ${_('Aquatic')} (${_('Fish / Dolphin / Shark')})` },
      { code: 'domestic', label: `🐱  ${_('Domestic')} (${_('Cat / Dog / Horse')})` },
      { code: 'birds',    label: `🐧  ${_('Birds')} (${_('Penguin / Duck / Eagle')})` },
      { code: 'insects',  label: `🐜  ${_('Insects')} (${_('Ant / Ladybug / Bee')})` },
      { code: 'custom',   label: `🛠️  ${_('Custom')} (${_('Choose your 3 speed animals')})` },
    ];

    const iconThemeModel = new Gtk.StringList();
    for (const t of ICON_THEMES) {
      iconThemeModel.append(t.label);
    }

    const iconThemeRow = new Adw.ComboRow({
      title: _('Icon Theme'),
      subtitle: _('Select the animal icon set for speed indication'),
      model: iconThemeModel,
    });

    const currentTheme = settings.get_string('icon-theme');
    const themeIndex = ICON_THEMES.findIndex(t => t.code === currentTheme);
    iconThemeRow.selected = themeIndex >= 0 ? themeIndex : 0;

    iconThemeRow.connect('notify::selected', () => {
      const selected = ICON_THEMES[iconThemeRow.selected];
      if (selected) settings.set_string('icon-theme', selected.code);
    });

    iconThemeGroup.add(iconThemeRow);

    const CUSTOM_NETWORK_ANIMALS = [
      { code: 'snail', label: _('Snail') },
      { code: 'turtle', label: _('Turtle') },
      { code: 'rabbit', label: _('Rabbit') },
      { code: 'fish', label: _('Fish') },
      { code: 'dolphin', label: _('Dolphin') },
      { code: 'whale', label: _('Whale') },
      { code: 'cat', label: _('Cat') },
      { code: 'dog', label: _('Dog') },
      { code: 'horse', label: _('Horse') },
      { code: 'duck', label: _('Duck') },
      { code: 'hummingbird', label: _('Hummingbird') },
      { code: 'eagle', label: _('Eagle') },
      { code: 'ant', label: _('Ant') },
      { code: 'ladybug', label: _('Ladybug') },
      { code: 'bee', label: _('Bee') },
    ];

    const buildAnimalModel = () => {
      const model = new Gtk.StringList();
      for (const animal of CUSTOM_NETWORK_ANIMALS) {
        model.append(animal.label);
      }
      return model;
    };

    const findAnimalIndex = (code) => {
      const idx = CUSTOM_NETWORK_ANIMALS.findIndex(a => a.code === code);
      return idx >= 0 ? idx : 0;
    };

    const customSlowRow = new Adw.ComboRow({
      title: _('Custom: Slow speed animal'),
      subtitle: _('Used for low network speed range'),
      model: buildAnimalModel(),
    });
    customSlowRow.selected = findAnimalIndex(settings.get_string('custom-animal-slow'));
    customSlowRow.connect('notify::selected', () => {
      const selected = CUSTOM_NETWORK_ANIMALS[customSlowRow.selected];
      if (selected) settings.set_string('custom-animal-slow', selected.code);
    });
    iconThemeGroup.add(customSlowRow);

    const customMediumRow = new Adw.ComboRow({
      title: _('Custom: Medium speed animal'),
      subtitle: _('Used for medium network speed range'),
      model: buildAnimalModel(),
    });
    customMediumRow.selected = findAnimalIndex(settings.get_string('custom-animal-medium'));
    customMediumRow.connect('notify::selected', () => {
      const selected = CUSTOM_NETWORK_ANIMALS[customMediumRow.selected];
      if (selected) settings.set_string('custom-animal-medium', selected.code);
    });
    iconThemeGroup.add(customMediumRow);

    const customFastRow = new Adw.ComboRow({
      title: _('Custom: Fast speed animal'),
      subtitle: _('Used for high network speed range'),
      model: buildAnimalModel(),
    });
    customFastRow.selected = findAnimalIndex(settings.get_string('custom-animal-fast'));
    customFastRow.connect('notify::selected', () => {
      const selected = CUSTOM_NETWORK_ANIMALS[customFastRow.selected];
      if (selected) settings.set_string('custom-animal-fast', selected.code);
    });
    iconThemeGroup.add(customFastRow);

    const updateCustomThemeRowsVisibility = () => {
      const isCustom = settings.get_string('icon-theme') === 'custom';
      customSlowRow.visible = isCustom;
      customMediumRow.visible = isCustom;
      customFastRow.visible = isCustom;
    };
    updateCustomThemeRowsVisibility();
    settings.connect('changed::icon-theme', updateCustomThemeRowsVisibility);


// Icon Size group
    const iconSizeGroup = new Adw.PreferencesGroup({
      title: _('Icon Size'),
      description: _('Adjust the size of panel icons'),
    });
    displayPage.add(iconSizeGroup);

    const iconSizeRow = new Adw.SpinRow({
      title: _('Icon Size (px)'),
      subtitle: _('Applies to all panel icons (network, memory, CPU, temperature, disk)'),
      adjustment: new Gtk.Adjustment({
        lower: 16,
        upper: 64,
        step_increment: 1,
        page_increment: 4,
        value: settings.get_int('icon-size') || 32,
      }),
      digits: 0,
    });

    iconSizeRow.connect('notify::value', () => {
      settings.set_int('icon-size', iconSizeRow.value);
    });

    iconSizeGroup.add(iconSizeRow);


    const displaySpeedGroup = new Adw.PreferencesGroup({
      title: _('Network speed options')
    });
    displayPage.add(displaySpeedGroup);

    const showAnimalIconSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-animal-icon'),
      valign: Gtk.Align.CENTER,
    });

    const showAnimalIconRow = new Adw.ActionRow({
      title: _('Show Animal Icon'),
      subtitle: _('Display the animated animal icon (snail/turtle/rabbit)'),
      activatable_widget: showAnimalIconSwitch,
    });
    showAnimalIconRow.add_suffix(showAnimalIconSwitch);

    settings.bind('show-animal-icon', showAnimalIconSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displaySpeedGroup.add(showAnimalIconRow);

    const showSpeedLabelSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-speed-label'),
      valign: Gtk.Align.CENTER,
    });

    const showSpeedLabelRow = new Adw.ActionRow({
      title: _('Show Speed Label'),
      subtitle: _('Display network speed text value'),
      activatable_widget: showSpeedLabelSwitch,
    });
    showSpeedLabelRow.add_suffix(showSpeedLabelSwitch);

    settings.bind('show-speed-label', showSpeedLabelSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displaySpeedGroup.add(showSpeedLabelRow);

    const showGraphSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-speed-graph'),
      valign: Gtk.Align.CENTER,
    });

    const showGraphRow = new Adw.ActionRow({
      title: _('Show Speed Graph'),
      subtitle: _('Display a historical speed graph in the popup menu'),
      activatable_widget: showGraphSwitch,
    });
    showGraphRow.add_suffix(showGraphSwitch);

    settings.bind('show-speed-graph', showGraphSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displaySpeedGroup.add(showGraphRow);

    const showSpeedAdvancedStatsSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-speed-advanced-stats'),
      valign: Gtk.Align.CENTER,
    });

    const showSpeedAdvancedStatsRow = new Adw.ActionRow({
      title: _('Show Peak & Averages'),
      subtitle: _('Display Peak, Average (1m), and Average (5m) in the popup menu'),
      activatable_widget: showSpeedAdvancedStatsSwitch,
    });
    showSpeedAdvancedStatsRow.add_suffix(showSpeedAdvancedStatsSwitch);

    settings.bind('show-speed-advanced-stats', showSpeedAdvancedStatsSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displaySpeedGroup.add(showSpeedAdvancedStatsRow);

    const speedModeCombo = new Gtk.StringList();
    speedModeCombo.append(_('Combined (Total Speed)'));
    speedModeCombo.append(_('Separate (Download/Upload)'));
    speedModeCombo.append(_('Download Only'));
    speedModeCombo.append(_('Upload Only'));

    const speedModeRow = new Adw.ComboRow({
      title: _('Speed Display Mode'),
      subtitle: _('How to display network speed'),
      model: speedModeCombo,
    });
    
    const speedModeValue = settings.get_string('speed-display-mode');
    const speedModeMap = {
      'combined': 0,
      'separate': 1,
      'download-only': 2,
      'upload-only': 3,
    };
    speedModeRow.selected = speedModeMap[speedModeValue] ?? 0;

    speedModeRow.connect('notify::selected', () => {
      const modeValues = ['combined', 'separate', 'download-only', 'upload-only'];
      settings.set_string('speed-display-mode', modeValues[speedModeRow.selected]);
    });

    displaySpeedGroup.add(speedModeRow);

    const displayMemoryGroup = new Adw.PreferencesGroup({
      title: _('Memory options')
    });
    displayPage.add(displayMemoryGroup);

    const showMemoryIconSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-memory-icon'),
      valign: Gtk.Align.CENTER,
    });

    const showMemoryIconRow = new Adw.ActionRow({
      title: _('Show Memory Icon'),
      subtitle: _('Display the memory blob icon'),
      activatable_widget: showMemoryIconSwitch,
    });
    showMemoryIconRow.add_suffix(showMemoryIconSwitch);

    settings.bind('show-memory-icon', showMemoryIconSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displayMemoryGroup.add(showMemoryIconRow);

    const showMemoryLabelSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-memory-label'),
      valign: Gtk.Align.CENTER,
    });

    const showMemoryLabelRow = new Adw.ActionRow({
      title: _('Show Memory Label'),
      subtitle: _('Display memory usage percentage text'),
      activatable_widget: showMemoryLabelSwitch,
    });
    showMemoryLabelRow.add_suffix(showMemoryLabelSwitch);

    settings.bind('show-memory-label', showMemoryLabelSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displayMemoryGroup.add(showMemoryLabelRow);

    const showMemoryGraphSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-memory-graph'),
      valign: Gtk.Align.CENTER,
    });

    const showMemoryGraphRow = new Adw.ActionRow({
      title: _('Show Memory Graph'),
      subtitle: _('Display a memory usage history graph in the popup menu'),
      activatable_widget: showMemoryGraphSwitch,
    });
    showMemoryGraphRow.add_suffix(showMemoryGraphSwitch);

    settings.bind('show-memory-graph', showMemoryGraphSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displayMemoryGroup.add(showMemoryGraphRow);

    const displayCpuGroup = new Adw.PreferencesGroup({
      title: _('CPU options')
    });
    displayPage.add(displayCpuGroup);

    const showCpuIconSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-cpu-icon'),
      valign: Gtk.Align.CENTER,
    });

    const showCpuIconRow = new Adw.ActionRow({
      title: _('Show CPU Icon'),
      subtitle: _('Display the CPU icon'),
      activatable_widget: showCpuIconSwitch,
    });
    showCpuIconRow.add_suffix(showCpuIconSwitch);

    settings.bind('show-cpu-icon', showCpuIconSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displayCpuGroup.add(showCpuIconRow);

    const showCpuLabelSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-cpu-label'),
      valign: Gtk.Align.CENTER,
    });

    const showCpuLabelRow = new Adw.ActionRow({
      title: _('Show CPU Label'),
      subtitle: _('Display CPU usage percentage text'),
      activatable_widget: showCpuLabelSwitch,
    });
    showCpuLabelRow.add_suffix(showCpuLabelSwitch);

    settings.bind('show-cpu-label', showCpuLabelSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displayCpuGroup.add(showCpuLabelRow);

    const showCpuGraphSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-cpu-graph'),
      valign: Gtk.Align.CENTER,
    });

    const showCpuGraphRow = new Adw.ActionRow({
      title: _('Show CPU Graph'),
      subtitle: _('Display a CPU usage history graph in the popup menu'),
      activatable_widget: showCpuGraphSwitch,
    });
    showCpuGraphRow.add_suffix(showCpuGraphSwitch);

    settings.bind('show-cpu-graph', showCpuGraphSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displayCpuGroup.add(showCpuGraphRow);

    const displayTempGroup = new Adw.PreferencesGroup({
      title: _('Temperature options')
    });
    displayPage.add(displayTempGroup);

    const showTemperatureIconSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-temperature-icon'),
      valign: Gtk.Align.CENTER,
    });

    const showTemperatureIconRow = new Adw.ActionRow({
      title: _('Show Temperature Icon'),
      subtitle: _('Display the temperature thermometer icon'),
      activatable_widget: showTemperatureIconSwitch,
    });
    showTemperatureIconRow.add_suffix(showTemperatureIconSwitch);

    settings.bind('show-temperature-icon', showTemperatureIconSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displayTempGroup.add(showTemperatureIconRow);

    const showTemperatureLabelSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-temperature-label'),
      valign: Gtk.Align.CENTER,
    });

    const showTemperatureLabelRow = new Adw.ActionRow({
      title: _('Show Temperature Label'),
      subtitle: _('Display temperature value text'),
      activatable_widget: showTemperatureLabelSwitch,
    });
    showTemperatureLabelRow.add_suffix(showTemperatureLabelSwitch);

    settings.bind('show-temperature-label', showTemperatureLabelSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displayTempGroup.add(showTemperatureLabelRow);

    const showTemperatureGraphSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-temperature-graph'),
      valign: Gtk.Align.CENTER,
    });

    const showTemperatureGraphRow = new Adw.ActionRow({
      title: _('Show Temperature Graph'),
      subtitle: _('Display a temperature history graph in the popup menu'),
      activatable_widget: showTemperatureGraphSwitch,
    });
    showTemperatureGraphRow.add_suffix(showTemperatureGraphSwitch);

    settings.bind('show-temperature-graph', showTemperatureGraphSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displayTempGroup.add(showTemperatureGraphRow);

    const displayDiskGroup = new Adw.PreferencesGroup({
      title: _('Disk I/O Display'),
    });
    displayPage.add(displayDiskGroup);

    const showDiskIconSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-disk-icon'),
      valign: Gtk.Align.CENTER,
    });

    const showDiskIconRow = new Adw.ActionRow({
      title: _('Show Disk Icon'),
      subtitle: _('Display the disk I/O activity icon'),
      activatable_widget: showDiskIconSwitch,
    });
    showDiskIconRow.add_suffix(showDiskIconSwitch);

    settings.bind('show-disk-icon', showDiskIconSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displayDiskGroup.add(showDiskIconRow);

    const showDiskLabelSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-disk-label'),
      valign: Gtk.Align.CENTER,
    });

    const showDiskLabelRow = new Adw.ActionRow({
      title: _('Show Disk Label'),
      subtitle: _('Display disk I/O speed text'),
      activatable_widget: showDiskLabelSwitch,
    });
    showDiskLabelRow.add_suffix(showDiskLabelSwitch);

    settings.bind('show-disk-label', showDiskLabelSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displayDiskGroup.add(showDiskLabelRow);

    const showDiskGraphSwitch = new Gtk.Switch({
      active: settings.get_boolean('show-disk-graph'),
      valign: Gtk.Align.CENTER,
    });

    const showDiskGraphRow = new Adw.ActionRow({
      title: _('Show Disk I/O Graph'),
      subtitle: _('Display a disk I/O history graph in the popup menu'),
      activatable_widget: showDiskGraphSwitch,
    });
    showDiskGraphRow.add_suffix(showDiskGraphSwitch);

    settings.bind('show-disk-graph', showDiskGraphSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displayDiskGroup.add(showDiskGraphRow);

    const diskModeCombo = new Gtk.StringList();
    diskModeCombo.append(_('Combined (Total I/O)'));
    diskModeCombo.append(_('Separate (Read/Write)'));
    diskModeCombo.append(_('Read Only'));
    diskModeCombo.append(_('Write Only'));

    const diskModeRow = new Adw.ComboRow({
      title: _('Disk I/O Display Mode'),
      subtitle: _('How to display disk I/O speed'),
      model: diskModeCombo,
    });

    const diskModeValue = settings.get_string('disk-display-mode');
    const diskModeMap = {
      'combined': 0,
      'separate': 1,
      'read-only': 2,
      'write-only': 3,
    };
    diskModeRow.selected = diskModeMap[diskModeValue] ?? 0;

    diskModeRow.connect('notify::selected', () => {
      const modeValues = ['combined', 'separate', 'read-only', 'write-only'];
      settings.set_string('disk-display-mode', modeValues[diskModeRow.selected]);
    });

    displayDiskGroup.add(diskModeRow);
    

    const displayOtherGroup = new Adw.PreferencesGroup({
      title: _("Color themes")
    });
    displayPage.add(displayOtherGroup);

   
    const enableColorThemesSwitch = new Gtk.Switch({
      active: settings.get_boolean('enable-color-themes'),
      valign: Gtk.Align.CENTER,
    });

    const enableColorThemesRow = new Adw.ActionRow({
      title: _('Enable Color Themes'),
      subtitle: _('Apply color coding to labels (green/yellow/red) based on thresholds'),
      activatable_widget: enableColorThemesSwitch,
    });
    enableColorThemesRow.add_suffix(enableColorThemesSwitch);

    settings.bind('enable-color-themes', enableColorThemesSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    displayOtherGroup.add(enableColorThemesRow);

    // ========== Thresholds Page ==========
    const thresholdsPage = new Adw.PreferencesPage({
      title: _('Thresholds'),
      icon_name: 'dialog-warning-symbolic',
    });
    window.add(thresholdsPage);

    // Threshold mode group
    const thresholdModeGroup = new Adw.PreferencesGroup({
      title: _('Threshold Mode'),
      description: _('Choose how sensitive the thresholds are (more or less animated)'),
    });
    thresholdsPage.add(thresholdModeGroup);

    const thresholdModeList = new Gtk.StringList();
    thresholdModeList.append(_('Stable'));
    thresholdModeList.append(_('Spectacular'));
    thresholdModeList.append(_('Stress Test'));

    const thresholdModeRow = new Adw.ComboRow({
      title: _('Mode'),
      subtitle: _('Apply a preset to all thresholds'),
      model: thresholdModeList,
    });

    const applyThresholdPreset = (mode) => {
      const presets = {
        stable: {
          turtle: 5.0,
          rabbit: 50.0,
          mem1: 40.0,
          mem2: 65.0,
          mem3: 85.0,
          cpu1: 30.0,
          cpu2: 60.0,
          cpu3: 85.0,
          tempWarm: 55.0,
          tempHot: 70.0,
          tempCritical: 85.0,
          disk1: 1.0,
          disk2: 20.0,
          disk3: 100.0,
        },
        spectacular: {
          turtle: 2.0,
          rabbit: 20.0,
          mem1: 30.0,
          mem2: 55.0,
          mem3: 75.0,
          cpu1: 20.0,
          cpu2: 45.0,
          cpu3: 70.0,
          tempWarm: 50.0,
          tempHot: 65.0,
          tempCritical: 75.0,
          disk1: 0.5,
          disk2: 10.0,
          disk3: 50.0,
        },
        stress: {
          turtle: 1.0,
          rabbit: 10.0,
          mem1: 20.0,
          mem2: 40.0,
          mem3: 60.0,
          cpu1: 10.0,
          cpu2: 30.0,
          cpu3: 50.0,
          tempWarm: 45.0,
          tempHot: 55.0,
          tempCritical: 65.0,
          disk1: 0.1,
          disk2: 2.0,
          disk3: 10.0,
        },
      };

      const p = presets[mode];
      if (!p) return;

      settings.set_double('turtle-threshold', p.turtle);
      settings.set_double('rabbit-threshold', p.rabbit);

      settings.set_double('memory-level-1', p.mem1);
      settings.set_double('memory-level-2', p.mem2);
      settings.set_double('memory-level-3', p.mem3);

      settings.set_double('cpu-level-1', p.cpu1);
      settings.set_double('cpu-level-2', p.cpu2);
      settings.set_double('cpu-level-3', p.cpu3);

      settings.set_double('temperature-threshold-warm', p.tempWarm);
      settings.set_double('temperature-threshold-hot', p.tempHot);
      settings.set_double('temperature-threshold-critical', p.tempCritical);

      settings.set_double('disk-level-1', p.disk1);
      settings.set_double('disk-level-2', p.disk2);
      settings.set_double('disk-level-3', p.disk3);
    };

    const modeToIndex = { stable: 0, spectacular: 1, stress: 2 };
    const indexToMode = ['stable', 'spectacular', 'stress'];

    const currentThresholdMode = settings.get_string('threshold-mode') || 'spectacular';
    thresholdModeRow.selected = modeToIndex[currentThresholdMode] ?? 1;

    thresholdModeRow.connect('notify::selected', () => {
      const mode = indexToMode[thresholdModeRow.selected] ?? 'spectacular';
      settings.set_string('threshold-mode', mode);
      applyThresholdPreset(mode);
    });

    thresholdModeGroup.add(thresholdModeRow);

    // Animal thresholds group
    const thresholdGroup = new Adw.PreferencesGroup({
      title: _('Animal Speed Thresholds'),
      description: _('Change the network speed thresholds for switching animals'),
    });
    thresholdsPage.add(thresholdGroup);

    const turtleRow = new Adw.SpinRow({
      title: _('Turtle Threshold'),
      subtitle: _('Switch to turtle when above (Mbit/s)'),
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 100,
        step_increment: 0.1,
        page_increment: 1,
        value: 2,
      }),
      digits: 1,
    });

    settings.bind('turtle-threshold', turtleRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    thresholdGroup.add(turtleRow);

    const rabbitRow = new Adw.SpinRow({
      title: _('Rabbit Threshold'),
      subtitle: _('Switch to rabbit when above (Mbit/s)'),
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 100,
        step_increment: 0.1,
        page_increment: 1,
        value: 20,
      }),
      digits: 1,
    });

    settings.bind('rabbit-threshold', rabbitRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    thresholdGroup.add(rabbitRow);

    // Memory thresholds group
    const memoryThresholdGroup = new Adw.PreferencesGroup({
      title: _('Memory Level Thresholds'),
      description: _('Change the memory usage thresholds for switching blob levels'),
    });
    thresholdsPage.add(memoryThresholdGroup);

    const memLevel1Row = new Adw.SpinRow({
      title: _('Memory Level 1 Threshold'),
      subtitle: _('Switch to blob level 1 when above (%)'),
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 100,
        step_increment: 1,
        page_increment: 5,
        value: 25,
      }),
      digits: 1,
    });

    settings.bind('memory-level-1', memLevel1Row.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    memoryThresholdGroup.add(memLevel1Row);

    const memLevel2Row = new Adw.SpinRow({
      title: _('Memory Level 2 Threshold'),
      subtitle: _('Switch to blob level 2 when above (%)'),
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 100,
        step_increment: 1,
        page_increment: 5,
        value: 50,
      }),
      digits: 1,
    });

    settings.bind('memory-level-2', memLevel2Row.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    memoryThresholdGroup.add(memLevel2Row);

    const memLevel3Row = new Adw.SpinRow({
      title: _('Memory Level 3 Threshold'),
      subtitle: _('Switch to blob level 3 when above (%)'),
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 100,
        step_increment: 1,
        page_increment: 5,
        value: 75,
      }),
      digits: 1,
    });

    settings.bind('memory-level-3', memLevel3Row.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    memoryThresholdGroup.add(memLevel3Row);

    // CPU thresholds group
    const cpuThresholdGroup = new Adw.PreferencesGroup({
      title: _('CPU Level Thresholds'),
      description: _('Change the CPU usage thresholds for switching CPU icon levels'),
    });
    thresholdsPage.add(cpuThresholdGroup);

    const cpuLevel1Row = new Adw.SpinRow({
      title: _('CPU Level 1 Threshold'),
      subtitle: _('Switch to CPU level 1 when above (%)'),
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 100,
        step_increment: 1,
        page_increment: 5,
        value: 25,
      }),
      digits: 1,
    });

    settings.bind('cpu-level-1', cpuLevel1Row.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    cpuThresholdGroup.add(cpuLevel1Row);

    const cpuLevel2Row = new Adw.SpinRow({
      title: _('CPU Level 2 Threshold'),
      subtitle: _('Switch to CPU level 2 when above (%)'),
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 100,
        step_increment: 1,
        page_increment: 5,
        value: 50,
      }),
      digits: 1,
    });

    settings.bind('cpu-level-2', cpuLevel2Row.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    cpuThresholdGroup.add(cpuLevel2Row);

    const cpuLevel3Row = new Adw.SpinRow({
      title: _('CPU Level 3 Threshold'),
      subtitle: _('Switch to CPU level 3 when above (%)'),
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 100,
        step_increment: 1,
        page_increment: 5,
        value: 75,
      }),
      digits: 1,
    });

    settings.bind('cpu-level-3', cpuLevel3Row.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    cpuThresholdGroup.add(cpuLevel3Row);

    // Temperature thresholds group
    const temperatureThresholdGroup = new Adw.PreferencesGroup({
      title: _('Temperature Thresholds'),
      description: _('Change the temperature thresholds for switching thermometer levels'),
    });
    thresholdsPage.add(temperatureThresholdGroup);

    const tempWarmRow = new Adw.SpinRow({
      title: _('Warm Temperature Threshold'),
      subtitle: _('Switch to warm (yellow) when above (°C)'),
      adjustment: new Gtk.Adjustment({
        lower: 20,
        upper: 100,
        step_increment: 5,
        page_increment: 10,
        value: 50,
      }),
      digits: 0,
    });

    settings.bind('temperature-threshold-warm', tempWarmRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    temperatureThresholdGroup.add(tempWarmRow);

    const tempHotRow = new Adw.SpinRow({
      title: _('Hot Temperature Threshold'),
      subtitle: _('Switch to hot (orange) when above (°C)'),
      adjustment: new Gtk.Adjustment({
        lower: 30,
        upper: 110,
        step_increment: 5,
        page_increment: 10,
        value: 70,
      }),
      digits: 0,
    });

    settings.bind('temperature-threshold-hot', tempHotRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    temperatureThresholdGroup.add(tempHotRow);

    const tempCriticalRow = new Adw.SpinRow({
      title: _('Critical Temperature Threshold'),
      subtitle: _('Switch to critical (red) when above (°C)'),
      adjustment: new Gtk.Adjustment({
        lower: 40,
        upper: 120,
        step_increment: 5,
        page_increment: 10,
        value: 85,
      }),
      digits: 0,
    });

    settings.bind('temperature-threshold-critical', tempCriticalRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    temperatureThresholdGroup.add(tempCriticalRow);

    // Disk I/O thresholds group
    const diskThresholdGroup = new Adw.PreferencesGroup({
      title: _('Disk I/O Thresholds'),
      description: _('Change the disk I/O speed thresholds for switching disk icon levels'),
    });
    thresholdsPage.add(diskThresholdGroup);

    const diskLevel1Row = new Adw.SpinRow({
      title: _('Disk Level 1 Threshold'),
      subtitle: _('Switch to low activity when above (MB/s)'),
      adjustment: new Gtk.Adjustment({
        lower: 0.1,
        upper: 500,
        step_increment: 0.5,
        page_increment: 5,
        value: 1,
      }),
      digits: 1,
    });

    settings.bind('disk-level-1', diskLevel1Row.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    diskThresholdGroup.add(diskLevel1Row);

    const diskLevel2Row = new Adw.SpinRow({
      title: _('Disk Level 2 Threshold'),
      subtitle: _('Switch to medium activity when above (MB/s)'),
      adjustment: new Gtk.Adjustment({
        lower: 1,
        upper: 1000,
        step_increment: 1,
        page_increment: 10,
        value: 10,
      }),
      digits: 1,
    });

    settings.bind('disk-level-2', diskLevel2Row.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    diskThresholdGroup.add(diskLevel2Row);

    const diskLevel3Row = new Adw.SpinRow({
      title: _('Disk Level 3 Threshold'),
      subtitle: _('Switch to high activity when above (MB/s)'),
      adjustment: new Gtk.Adjustment({
        lower: 5,
        upper: 5000,
        step_increment: 5,
        page_increment: 50,
        value: 50,
      }),
      digits: 1,
    });

    settings.bind('disk-level-3', diskLevel3Row.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    diskThresholdGroup.add(diskLevel3Row);

    // ========== Notifications Page ==========
    const notificationsPage = new Adw.PreferencesPage({
      title: _('Notifications'),
      icon_name: 'preferences-system-notifications-symbolic',
    });
    window.add(notificationsPage);

    const notificationsMasterGroup = new Adw.PreferencesGroup({
      title: _('Notifications'),
      description: _('Configure desktop notifications for system alerts'),
    });
    notificationsPage.add(notificationsMasterGroup);

    const enableNotificationsSwitch = new Gtk.Switch({
      active: settings.get_boolean('enable-notifications'),
      valign: Gtk.Align.CENTER,
    });

    const enableNotificationsRow = new Adw.ActionRow({
      title: _('Enable Notifications'),
      subtitle: _('Show desktop notifications for alerts and warnings'),
      activatable_widget: enableNotificationsSwitch,
    });
    enableNotificationsRow.add_suffix(enableNotificationsSwitch);

    settings.bind('enable-notifications', enableNotificationsSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    notificationsMasterGroup.add(enableNotificationsRow);

    const temporarySilenceGroup = new Adw.PreferencesGroup({
      title: _('Temporary Silence'),
      description: _('Mute notifications for a limited time, then resume automatically'),
    });
    notificationsPage.add(temporarySilenceGroup);

    const silenceDurationRow = new Adw.SpinRow({
      title: _('Silence Duration (minutes)'),
      subtitle: _('Duration used by the Silence Now button'),
      adjustment: new Gtk.Adjustment({
        lower: 5,
        upper: 480,
        step_increment: 5,
        page_increment: 15,
        value: settings.get_int('notifications-snooze-duration-minutes'),
      }),
      digits: 0,
    });
    settings.bind('notifications-snooze-duration-minutes', silenceDurationRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    temporarySilenceGroup.add(silenceDurationRow);

    const temporarySilenceRow = new Adw.ActionRow({
      title: _('Silence Notifications'),
      subtitle: _('Notifications are active'),
    });

    const temporarySilenceButton = new Gtk.Button({
      label: _('Silence Now'),
      valign: Gtk.Align.CENTER,
      css_classes: ['suggested-action'],
    });

    const getSilenceUntilMs = () => {
      const iso = settings.get_string('notifications-snooze-until');
      if (!iso) return 0;
      const parsed = Date.parse(iso);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const updateTemporarySilenceRow = () => {
      const now = Date.now();
      const untilMs = getSilenceUntilMs();
      const active = untilMs > now;

      if (active) {
        const remainingMinutes = Math.max(1, Math.ceil((untilMs - now) / 60000));
        temporarySilenceRow.subtitle = `${_('Notifications are muted for about')} ${remainingMinutes} ${_('minute(s)')}.`;
        temporarySilenceButton.label = _('Resume Now');
        temporarySilenceButton.remove_css_class('suggested-action');
        temporarySilenceButton.add_css_class('destructive-action');
      } else {
        if (untilMs > 0) settings.set_string('notifications-snooze-until', '');
        temporarySilenceRow.subtitle = _('Notifications are active');
        temporarySilenceButton.label = _('Silence Now');
        temporarySilenceButton.remove_css_class('destructive-action');
        temporarySilenceButton.add_css_class('suggested-action');
      }

      temporarySilenceButton.sensitive = settings.get_boolean('enable-notifications');
    };

    temporarySilenceButton.connect('clicked', () => {
      const now = Date.now();
      const untilMs = getSilenceUntilMs();

      if (untilMs > now) {
        settings.set_string('notifications-snooze-until', '');
        window.add_toast(new Adw.Toast({
          title: _('Notifications resumed.'),
          timeout: 3,
        }));
      } else {
        const duration = Math.max(1, settings.get_int('notifications-snooze-duration-minutes'));
        const until = new Date(now + duration * 60 * 1000).toISOString();
        settings.set_string('notifications-snooze-until', until);
        window.add_toast(new Adw.Toast({
          title: `${_('Notifications silenced for')} ${duration} ${_('minute(s)')}.`,
          timeout: 3,
        }));
      }

      updateTemporarySilenceRow();
    });

    settings.connect('changed::notifications-snooze-until', updateTemporarySilenceRow);
    settings.connect('changed::enable-notifications', updateTemporarySilenceRow);
    updateTemporarySilenceRow();

    temporarySilenceRow.add_suffix(temporarySilenceButton);
    temporarySilenceRow.activatable_widget = temporarySilenceButton;
    temporarySilenceGroup.add(temporarySilenceRow);

    const networkAlertsGroup = new Adw.PreferencesGroup({ title: _('Network Alerts') });
    notificationsPage.add(networkAlertsGroup);

    const notifyNetworkDropoutSwitch = new Gtk.Switch({
      active: settings.get_boolean('notify-network-dropout'),
      valign: Gtk.Align.CENTER,
    });

    const notifyNetworkDropoutRow = new Adw.ActionRow({
      title: _('Network Dropout Alert'),
      subtitle: _('Notify when network speed drops below threshold'),
      activatable_widget: notifyNetworkDropoutSwitch,
    });
    notifyNetworkDropoutRow.add_suffix(notifyNetworkDropoutSwitch);

    settings.bind('notify-network-dropout', notifyNetworkDropoutSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    networkAlertsGroup.add(notifyNetworkDropoutRow);

    const networkDropoutThresholdRow = new Adw.SpinRow({
      title: _('Network Dropout Threshold'),
      subtitle: _('Minimum speed to trigger alert (Mbit/s)'),
      adjustment: new Gtk.Adjustment({
        lower: 0.1,
        upper: 100,
        step_increment: 0.1,
        page_increment: 1,
        value: settings.get_double('network-dropout-threshold'),
      }),
      digits: 1,
    });

    settings.bind('network-dropout-threshold', networkDropoutThresholdRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    networkAlertsGroup.add(networkDropoutThresholdRow);

    const systemAlertsGroup = new Adw.PreferencesGroup({ title: _('System Alerts') });
    notificationsPage.add(systemAlertsGroup);

    const notifyCpuHighSwitch = new Gtk.Switch({
      active: settings.get_boolean('notify-cpu-high'),
      valign: Gtk.Align.CENTER,
    });

    const notifyCpuHighRow = new Adw.ActionRow({
      title: _('High CPU Usage Alert'),
      subtitle: _('Notify when CPU usage exceeds threshold'),
      activatable_widget: notifyCpuHighSwitch,
    });
    notifyCpuHighRow.add_suffix(notifyCpuHighSwitch);

    settings.bind('notify-cpu-high', notifyCpuHighSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    systemAlertsGroup.add(notifyCpuHighRow);

    const cpuAlertThresholdRow = new Adw.SpinRow({
      title: _('CPU Alert Threshold'),
      subtitle: _('CPU usage percentage to trigger alert (%)'),
      adjustment: new Gtk.Adjustment({
        lower: 50,
        upper: 100,
        step_increment: 1,
        page_increment: 5,
        value: settings.get_double('cpu-alert-threshold'),
      }),
      digits: 0,
    });

    settings.bind('cpu-alert-threshold', cpuAlertThresholdRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    systemAlertsGroup.add(cpuAlertThresholdRow);

    const notifyMemoryHighSwitch = new Gtk.Switch({
      active: settings.get_boolean('notify-memory-high'),
      valign: Gtk.Align.CENTER,
    });

    const notifyMemoryHighRow = new Adw.ActionRow({
      title: _('High Memory Usage Alert'),
      subtitle: _('Notify when memory usage exceeds threshold'),
      activatable_widget: notifyMemoryHighSwitch,
    });
    notifyMemoryHighRow.add_suffix(notifyMemoryHighSwitch);

    settings.bind('notify-memory-high', notifyMemoryHighSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    systemAlertsGroup.add(notifyMemoryHighRow);

    const memoryAlertThresholdRow = new Adw.SpinRow({
      title: _('Memory Alert Threshold'),
      subtitle: _('Memory usage percentage to trigger alert (%)'),
      adjustment: new Gtk.Adjustment({
        lower: 50,
        upper: 100,
        step_increment: 1,
        page_increment: 5,
        value: settings.get_double('memory-alert-threshold'),
      }),
      digits: 0,
    });

    settings.bind('memory-alert-threshold', memoryAlertThresholdRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    systemAlertsGroup.add(memoryAlertThresholdRow);

    const notifyTemperatureHighSwitch = new Gtk.Switch({
      active: settings.get_boolean('notify-temperature-high'),
      valign: Gtk.Align.CENTER,
    });

    const notifyTemperatureHighRow = new Adw.ActionRow({
      title: _('High Temperature Alert'),
      subtitle: _('Notify when temperature exceeds threshold'),
      activatable_widget: notifyTemperatureHighSwitch,
    });
    notifyTemperatureHighRow.add_suffix(notifyTemperatureHighSwitch);

    settings.bind('notify-temperature-high', notifyTemperatureHighSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    systemAlertsGroup.add(notifyTemperatureHighRow);

    const temperatureAlertThresholdRow = new Adw.SpinRow({
      title: _('Temperature Alert Threshold'),
      subtitle: _('Temperature to trigger alert (°C)'),
      adjustment: new Gtk.Adjustment({
        lower: 50,
        upper: 100,
        step_increment: 1,
        page_increment: 5,
        value: settings.get_double('temperature-alert-threshold'),
      }),
      digits: 0,
    });

    settings.bind('temperature-alert-threshold', temperatureAlertThresholdRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    systemAlertsGroup.add(temperatureAlertThresholdRow);

    const quotaAlertsGroup = new Adw.PreferencesGroup({ title: _('Bandwidth Quota Alerts') });
    notificationsPage.add(quotaAlertsGroup);

    const bandwidthQuotaRow = new Adw.SpinRow({
      title: _('Monthly Bandwidth Quota'),
      subtitle: _('Monthly bandwidth limit in GB (0 = disabled)'),
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 10000,
        step_increment: 1,
        page_increment: 10,
        value: settings.get_double('bandwidth-quota-gb'),
      }),
      digits: 0,
    });

    settings.bind('bandwidth-quota-gb', bandwidthQuotaRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    quotaAlertsGroup.add(bandwidthQuotaRow);

    const notifyQuotaWarningSwitch = new Gtk.Switch({
      active: settings.get_boolean('notify-quota-warning'),
      valign: Gtk.Align.CENTER,
    });

    const notifyQuotaWarningRow = new Adw.ActionRow({
      title: _('Bandwidth Quota Alert'),
      subtitle: _('Notify when approaching bandwidth quota limit'),
      activatable_widget: notifyQuotaWarningSwitch,
    });
    notifyQuotaWarningRow.add_suffix(notifyQuotaWarningSwitch);

    settings.bind('notify-quota-warning', notifyQuotaWarningSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    quotaAlertsGroup.add(notifyQuotaWarningRow);

    const quotaWarningThresholdRow = new Adw.SpinRow({
      title: _('Warning Threshold'),
      subtitle: _('Show warning at percentage of quota (%)'),
      adjustment: new Gtk.Adjustment({
        lower: 50,
        upper: 95,
        step_increment: 1,
        page_increment: 5,
        value: settings.get_double('quota-warning-threshold'),
      }),
      digits: 0,
    });

    settings.bind('quota-warning-threshold', quotaWarningThresholdRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    quotaAlertsGroup.add(quotaWarningThresholdRow);

    const quotaCriticalThresholdRow = new Adw.SpinRow({
      title: _('Critical Threshold'),
      subtitle: _('Show critical alert at percentage of quota (%)'),
      adjustment: new Gtk.Adjustment({
        lower: 80,
        upper: 100,
        step_increment: 1,
        page_increment: 5,
        value: settings.get_double('quota-critical-threshold'),
      }),
      digits: 0,
    });

    settings.bind('quota-critical-threshold', quotaCriticalThresholdRow.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    quotaAlertsGroup.add(quotaCriticalThresholdRow);

    // ========== Diagnostics Page ==========
    const diagnosticsPage = new Adw.PreferencesPage({
      title: _('Diagnostics'),
      icon_name: 'search-symbolic',
    });
    window.add(diagnosticsPage);

    const diagnoseSystemHealth = () => {
      const results = {
        networkOk: false,
        thermalOk: false,
        diskOk: false,
      };

      // Check network interface availability
      try {
        const procNetDev = Gio.File.new_for_path('/proc/net/dev');
        results.networkOk = procNetDev.query_exists(null);
      } catch (e) {
        results.networkOk = false;
      }

      // Check thermal zone availability
      try {
        const thermalDir = Gio.File.new_for_path('/sys/class/thermal');
        results.thermalOk = thermalDir.query_exists(null);
      } catch (e) {
        results.thermalOk = false;
      }

      // Check diskstats availability
      try {
        const diskStats = Gio.File.new_for_path('/proc/diskstats');
        results.diskOk = diskStats.query_exists(null);
      } catch (e) {
        results.diskOk = false;
      }

      return results;
    };

    const readTextFile = (path) => {
      try {
        const [ok, bytes] = GLib.file_get_contents(path);
        if (!ok) return null;
        return new TextDecoder('utf-8').decode(bytes).trim();
      } catch (e) {
        return null;
      }
    };

    const listDirectories = (path, prefix = '') => {
      const out = [];
      try {
        const dir = Gio.File.new_for_path(path);
        if (!dir.query_exists(null)) return out;

        const en = dir.enumerate_children(
          'standard::name,standard::type',
          Gio.FileQueryInfoFlags.NONE,
          null
        );

        let info;
        while ((info = en.next_file(null)) !== null) {
          if (info.get_file_type() !== Gio.FileType.DIRECTORY) continue;
          const name = info.get_name();
          if (!prefix || name.startsWith(prefix)) out.push(name);
        }
        en.close(null);
      } catch (e) {
        return out;
      }
      return out;
    };

    const detectActiveInterfaceNow = () => {
      const text = readTextFile('/proc/net/dev');
      if (!text) return null;

      const availableIfaces = text
        .split('\n')
        .filter(line => line.includes(':'))
        .map(line => line.split(':')[0].trim())
        .filter(iface => iface && iface !== 'lo');

      if (availableIfaces.length === 0) return null;

      const interfaceModeStr = settings.get_string('interface-mode');
      const pinnedIface = settings.get_string('pinned-interface').trim();
      if (interfaceModeStr === 'manual' && pinnedIface && availableIfaces.includes(pinnedIface)) {
        return pinnedIface;
      }

      const routeText = readTextFile('/proc/net/route');
      if (routeText) {
        const lines = routeText.split('\n').slice(1);
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length < 4) continue;
          const iface = parts[0];
          const destination = parts[1];
          const flags = Number.parseInt(parts[3], 16);
          const routeUp = Number.isFinite(flags) && (flags & 0x1) !== 0;
          if (destination === '00000000' && routeUp && availableIfaces.includes(iface)) {
            return iface;
          }
        }
      }

      return availableIfaces[0] || null;
    };

    const detectThermalZoneNow = () => {
      const chosenZone = settings.get_string('temperature-zone').trim();
      if (chosenZone) return chosenZone;

      const thermalBase = '/sys/class/thermal';
      const zones = listDirectories(thermalBase, 'thermal_zone');
      for (const zoneDir of zones) {
        const tempPath = `${thermalBase}/${zoneDir}/temp`;
        const tempStr = readTextFile(tempPath);
        if (!tempStr) continue;
        const type = readTextFile(`${thermalBase}/${zoneDir}/type`);
        return type || zoneDir;
      }

      const hwmonBase = '/sys/class/hwmon';
      const hwmons = listDirectories(hwmonBase, 'hwmon');
      for (const hwmon of hwmons) {
        const chip = readTextFile(`${hwmonBase}/${hwmon}/name`) || hwmon;
        for (let index = 1; index <= 10; index++) {
          const inputPath = `${hwmonBase}/${hwmon}/temp${index}_input`;
          const value = readTextFile(inputPath);
          if (!value) continue;
          const label = readTextFile(`${hwmonBase}/${hwmon}/temp${index}_label`);
          return label ? `${chip} - ${label}` : `${chip} - temp${index}`;
        }
      }

      return null;
    };

    const detectDiskDeviceNow = () => {
      const selectedDevice = settings.get_string('disk-device').trim();
      if (selectedDevice) return selectedDevice;

      const text = readTextFile('/proc/diskstats');
      if (!text) return null;

      const mainDevicePatterns = [
        /^sd[a-z]$/,
        /^nvme\d+n\d+$/,
        /^mmcblk\d+$/,
        /^vd[a-z]$/,
        /^hd[a-z]$/,
      ];

      const lines = text.split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 14) continue;
        const deviceName = parts[2];
        if (mainDevicePatterns.some(pattern => pattern.test(deviceName))) {
          return deviceName;
        }
      }

      return null;
    };

    const diagnosticsHeaderGroup = new Adw.PreferencesGroup({
      title: _('System Diagnostics'),
      description: _('Check if the extension can access required system information'),
    });
    diagnosticsPage.add(diagnosticsHeaderGroup);

    const refreshDiagnosticsRow = new Adw.ActionRow({
      title: _('Refresh Diagnostics'),
      subtitle: _('Re-run checks and update detected devices'),
    });
    refreshDiagnosticsRow.set_activatable(false);

    const refreshDiagnosticsButton = new Gtk.Button({
      label: _('Refresh'),
      valign: Gtk.Align.CENTER,
    });
    refreshDiagnosticsButton.add_css_class('suggested-action');
    refreshDiagnosticsRow.add_suffix(refreshDiagnosticsButton);
    diagnosticsHeaderGroup.add(refreshDiagnosticsRow);

    // Network diagnostics
    const networkRow = new Adw.ActionRow({
      title: _('Network Interface Monitor'),
      subtitle: '',
    });
    networkRow.set_activatable(false);

    const networkStatus = new Gtk.Label({
      label: '',
      halign: Gtk.Align.CENTER,
      css_classes: ['success'],
    });
    networkRow.add_suffix(networkStatus);
    diagnosticsHeaderGroup.add(networkRow);

    // Get active interface
    const activeIfaceRow = new Adw.ActionRow({
      title: _('Active Interface'),
      subtitle: '',
    });
    activeIfaceRow.set_activatable(false);
    diagnosticsHeaderGroup.add(activeIfaceRow);

    // Thermal zone diagnostics
    const thermalRow = new Adw.ActionRow({
      title: _('Temperature Monitoring'),
      subtitle: '',
    });
    thermalRow.set_activatable(false);

    const thermalStatus = new Gtk.Label({
      label: '',
      halign: Gtk.Align.CENTER,
      css_classes: ['success'],
    });
    thermalRow.add_suffix(thermalStatus);
    diagnosticsHeaderGroup.add(thermalRow);

    // Get active thermal zone
    const activeThermalRow = new Adw.ActionRow({
      title: _('Thermal Zone'),
      subtitle: '',
    });
    activeThermalRow.set_activatable(false);
    diagnosticsHeaderGroup.add(activeThermalRow);

    // Disk diagnostics
    const diskRow = new Adw.ActionRow({
      title: _('Disk I/O Monitor'),
      subtitle: '',
    });
    diskRow.set_activatable(false);

    const diskStatus = new Gtk.Label({
      label: '',
      halign: Gtk.Align.CENTER,
      css_classes: ['success'],
    });
    diskRow.add_suffix(diskStatus);
    diagnosticsHeaderGroup.add(diskRow);

    // Get active disk device
    const activeDiskRow = new Adw.ActionRow({
      title: _('Disk Device'),
      subtitle: '',
    });
    activeDiskRow.set_activatable(false);
    diagnosticsHeaderGroup.add(activeDiskRow);

    // Permissions check group
    const permissionsGroup = new Adw.PreferencesGroup({
      title: _('Permission Status'),
      description: _('Files and directories required by the extension'),
    });
    diagnosticsPage.add(permissionsGroup);

    const procNetDevRow = new Adw.ActionRow({
      title: '/proc/net/dev',
      subtitle: '',
    });
    procNetDevRow.set_activatable(false);
    const procNetDevStatus = new Gtk.Label({ label: '' });
    procNetDevRow.add_suffix(procNetDevStatus);
    permissionsGroup.add(procNetDevRow);

    const sysThermalRow = new Adw.ActionRow({
      title: '/sys/class/thermal',
      subtitle: '',
    });
    sysThermalRow.set_activatable(false);
    const sysThermalStatus = new Gtk.Label({ label: '' });
    sysThermalRow.add_suffix(sysThermalStatus);
    permissionsGroup.add(sysThermalRow);

    const procDiskStatsRow = new Adw.ActionRow({
      title: '/proc/diskstats',
      subtitle: '',
    });
    procDiskStatsRow.set_activatable(false);
    const procDiskStatsStatus = new Gtk.Label({ label: '' });
    procDiskStatsRow.add_suffix(procDiskStatsStatus);
    permissionsGroup.add(procDiskStatsRow);

    const setStatusLabel = (labelWidget, ok) => {
      labelWidget.label = ok ? '✓' : '✗';
      labelWidget.css_classes = [ok ? 'success' : 'error'];
    };

    const refreshDiagnostics = () => {
      const systemHealth = diagnoseSystemHealth();

      networkRow.subtitle = systemHealth.networkOk
        ? _('✓ Ready to read network data')
        : _('✗ Cannot access /proc/net/dev');
      setStatusLabel(networkStatus, systemHealth.networkOk);

      activeIfaceRow.subtitle = detectActiveInterfaceNow() || _('Auto-detected (will show on next refresh)');

      thermalRow.subtitle = systemHealth.thermalOk
        ? _('✓ Ready to read thermal zones')
        : _('✗ Cannot access /sys/class/thermal');
      setStatusLabel(thermalStatus, systemHealth.thermalOk);

      activeThermalRow.subtitle = detectThermalZoneNow() || _('Auto-detected (will show on next refresh)');

      diskRow.subtitle = systemHealth.diskOk
        ? _('✓ Ready to read disk statistics')
        : _('✗ Cannot access /proc/diskstats');
      setStatusLabel(diskStatus, systemHealth.diskOk);

      activeDiskRow.subtitle = detectDiskDeviceNow() || _('Auto-detected (will show on next refresh)');

      const procNetDevOk = Gio.File.new_for_path('/proc/net/dev').query_exists(null);
      procNetDevRow.subtitle = procNetDevOk ? _('Readable') : _('Not accessible');
      setStatusLabel(procNetDevStatus, procNetDevOk);

      const sysThermalOk = Gio.File.new_for_path('/sys/class/thermal').query_exists(null);
      sysThermalRow.subtitle = sysThermalOk ? _('Readable') : _('Not accessible');
      setStatusLabel(sysThermalStatus, sysThermalOk);

      const procDiskStatsOk = Gio.File.new_for_path('/proc/diskstats').query_exists(null);
      procDiskStatsRow.subtitle = procDiskStatsOk ? _('Readable') : _('Not accessible');
      setStatusLabel(procDiskStatsStatus, procDiskStatsOk);
    };

    refreshDiagnosticsButton.connect('clicked', () => {
      refreshDiagnostics();
    });

    refreshDiagnostics();

    // ========== About Page ==========
    const aboutPage = new Adw.PreferencesPage({
      title: _('About'),
      icon_name: 'help-about-symbolic',
    });
    window.add(aboutPage);

    const metaName = this.metadata?.name ?? 'Net Speed Animals';
    const metaDesc = this.metadata?.description ?? _('Display internet speed with animated animals');
    const metaVersion = this.metadata?.version ?? '1.0.0';

    // Header card
    const aboutHeaderGroup = new Adw.PreferencesGroup({});
    aboutPage.add(aboutHeaderGroup);

    const headerRow = new Adw.ActionRow({
      title: metaName,
      subtitle: metaDesc,
    });
    headerRow.set_activatable(false);

    const pillsBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 6,
      valign: Gtk.Align.CENTER,
    });
    pillsBox.append(makePill(`${_('Version')} ${metaVersion}`));
    pillsBox.append(makePill(_('License MIT')));
    pillsBox.append(makePill(_('GNOME')));
    aboutHeaderGroup.add(headerRow);

    const pillsRow = new Adw.ActionRow({});
    pillsRow.set_activatable(false);
    pillsRow.add_suffix(pillsBox);
    aboutHeaderGroup.add(pillsRow);

    // Author
    const authorGroup = new Adw.PreferencesGroup({ title: _('Author') });
    aboutPage.add(authorGroup);

    const authorRow = new Adw.ActionRow({
      title: 'Spiderdev',
    });
    authorRow.set_activatable(false);
    authorRow.add_suffix(makeLinkButton(_('spiderdev.fr'), 'https://spiderdev.fr'));

    authorGroup.add(authorRow);

    // Description
    const descGroup = new Adw.PreferencesGroup({ title: _('Description') });
    aboutPage.add(descGroup);

    const longDescRow = new Adw.ActionRow({
      title: _('Net Speed Animals'),
      subtitle: _('Shows network speed (and more) in the top bar using fun animated icons and optional statistics.'),
    });
    longDescRow.set_activatable(false);
    descGroup.add(longDescRow);

    const githubRow = new Adw.ActionRow({
      title: _('Github Project : '),
    });
    githubRow.set_activatable(false);
    githubRow.add_suffix(makeLinkButton(_('https://github.com/spiderdev-github/net-speed-animals'), 'https://github.com/spiderdev-github/net-speed-animals'));

    descGroup.add(githubRow);

    

    // Donations
    const donateGroup = new Adw.PreferencesGroup({
      title: _('Donations'),
      description: _('If this extension helps you, a small donation supports development and future updates.'),
    });
    aboutPage.add(donateGroup);

    const paypalRow = new Adw.ActionRow({
      title: _('PayPal'),
      subtitle: _('Support the project via PayPal'),
    });
    paypalRow.add_suffix(makeLinkButton('PayPal', 'https://www.paypal.com/paypalme/lalsarok1'));
    paypalRow.set_activatable(false);
    donateGroup.add(paypalRow);

    const bmacRow = new Adw.ActionRow({
      title: _('Buy Me a Coffee'),
      subtitle: _('Support the project via Buy Me a Coffee'),
    });
    bmacRow.add_suffix(makeLinkButton('Buy Me a Coffee', 'https://buymeacoffee.com/spiderdev'));
    bmacRow.set_activatable(false);
    donateGroup.add(bmacRow);

    const reorderPreferencesGroups = (preferencesPage, groups) => {
      for (const group of groups) {
        try {
          preferencesPage.remove(group);
        } catch (e) {
          // Ignore remove errors during reordering
        }
      }

      for (const group of groups) {
        preferencesPage.add(group);
      }
    };

    reorderPreferencesGroups(page, [
      quickProfileGroup,
      interfaceGroup,
      positionGroup,
      clickActionsGroup,
      animGroup,
      statisticsGroup,
      languageGroup,
      backupGroup,
      resetGroup,
    ]);

    reorderPreferencesGroups(displayPage, [
      iconThemeGroup,
      iconSizeGroup,
      displayOtherGroup,
      displaySpeedGroup,
      displayCpuGroup,
      displayMemoryGroup,
      displayTempGroup,
      displayDiskGroup,
    ]);

    reorderPreferencesGroups(thresholdsPage, [
      thresholdModeGroup,
      thresholdGroup,
      cpuThresholdGroup,
      memoryThresholdGroup,
      temperatureThresholdGroup,
      diskThresholdGroup,
    ]);

    reorderPreferencesGroups(notificationsPage, [
      notificationsMasterGroup,
      temporarySilenceGroup,
      networkAlertsGroup,
      systemAlertsGroup,
      quotaAlertsGroup,
    ]);

    reorderPreferencesGroups(diagnosticsPage, [
      diagnosticsHeaderGroup,
      permissionsGroup,
    ]);

    reorderPreferencesGroups(aboutPage, [
      aboutHeaderGroup,
      descGroup,
      authorGroup,
      donateGroup,
    ]);

    const reorderPreferencesPages = (pages) => {
      for (const preferencesPage of pages) {
        try {
          window.remove(preferencesPage);
        } catch (e) {
          // Ignore remove errors during reordering
        }
      }

      for (const preferencesPage of pages) {
        window.add(preferencesPage);
      }
    };

    reorderPreferencesPages([
      page,
      displayPage,
      thresholdsPage,
      notificationsPage,
      diagnosticsPage,
      aboutPage,
    ]);
    
    // Jump to requested page (one-shot)
    const startPage = settings.get_string('prefs-start-page');

    if (startPage === 'about') {
      // User requested About page
      window.set_visible_page(aboutPage);
      settings.set_string('prefs-start-page', 'general');
    }
    // Otherwise, stay on General page (default first page added)

  }
}
