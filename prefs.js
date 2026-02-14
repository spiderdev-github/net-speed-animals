import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class NetSpeedAnimalsPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    // Initialize gettext
    const _ = this.gettext.bind(this);
    
    const settings = this.getSettings();

    // Main page
    const page = new Adw.PreferencesPage({
      title: _('General'),
      icon_name: 'preferences-system-symbolic',
    });

    window.add(page);

    // Animal thresholds group
    const thresholdGroup = new Adw.PreferencesGroup({
      title: _('Animal Speed Thresholds'),
      description: _('Change the network speed thresholds for switching animals'),
    });
    page.add(thresholdGroup);

    // Turtle threshold
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
    
    settings.bind(
      'turtle-threshold',
      turtleRow.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    thresholdGroup.add(turtleRow);

    // Rabbit threshold
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
    
    settings.bind(
      'rabbit-threshold',
      rabbitRow.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    thresholdGroup.add(rabbitRow);

    // Memory thresholds group
    const memoryThresholdGroup = new Adw.PreferencesGroup({
      title: _('Memory Level Thresholds'),
      description: _('Change the memory usage thresholds for switching blob levels'),
    });
    page.add(memoryThresholdGroup);

    // Memory level 1 threshold
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
    
    settings.bind(
      'memory-level-1',
      memLevel1Row.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    memoryThresholdGroup.add(memLevel1Row);

    // Memory level 2 threshold
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
    
    settings.bind(
      'memory-level-2',
      memLevel2Row.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    memoryThresholdGroup.add(memLevel2Row);

    // Memory level 3 threshold
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
    
    settings.bind(
      'memory-level-3',
      memLevel3Row.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    memoryThresholdGroup.add(memLevel3Row);

    // CPU thresholds group
    const cpuThresholdGroup = new Adw.PreferencesGroup({
      title: _('CPU Level Thresholds'),
      description: _('Change the CPU usage thresholds for switching CPU icon levels'),
    });
    page.add(cpuThresholdGroup);

    // CPU level 1 threshold
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

    settings.bind(
      'cpu-level-1',
      cpuLevel1Row.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    cpuThresholdGroup.add(cpuLevel1Row);

    // CPU level 2 threshold
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

    settings.bind(
      'cpu-level-2',
      cpuLevel2Row.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    cpuThresholdGroup.add(cpuLevel2Row);

    // CPU level 3 threshold
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

    settings.bind(
      'cpu-level-3',
      cpuLevel3Row.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    cpuThresholdGroup.add(cpuLevel3Row);

    // Temperature thresholds group
    const temperatureThresholdGroup = new Adw.PreferencesGroup({
      title: _('Temperature Thresholds'),
      description: _('Change the temperature thresholds for switching thermometer levels'),
    });
    page.add(temperatureThresholdGroup);

    // Warm temperature threshold
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

    settings.bind(
      'temperature-threshold-warm',
      tempWarmRow.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    temperatureThresholdGroup.add(tempWarmRow);

    // Hot temperature threshold
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

    settings.bind(
      'temperature-threshold-hot',
      tempHotRow.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    temperatureThresholdGroup.add(tempHotRow);

    // Critical temperature threshold
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

    settings.bind(
      'temperature-threshold-critical',
      tempCriticalRow.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    temperatureThresholdGroup.add(tempCriticalRow);

    // Network Interface group
    const interfaceGroup = new Adw.PreferencesGroup({
      title: _('Network Interface'),
      description: _('Select which network interface to monitor'),
    });
    page.add(interfaceGroup);

    // Interface mode dropdown
    const interfaceModeCombo = new Gtk.StringList();
    interfaceModeCombo.append(_('Automatic (highest traffic)'));
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

    // Interface entry (for manual mode)
    const interfaceEntry = new Adw.EntryRow({
      title: _('Interface Name'),
      text: settings.get_string('pinned-interface'),
    });

    interfaceEntry.connect('changed', () => {
      settings.set_string('pinned-interface', interfaceEntry.text);
    });

    interfaceGroup.add(interfaceEntry);
    
    // Animation group
    const animGroup = new Adw.PreferencesGroup({
      title: _('Animation'),
      description: _('Adjust animation speed'),
    });
    page.add(animGroup);

    // Min animation speed
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
    
    settings.bind(
      'min-anim-speed',
      minAnimRow.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    animGroup.add(minAnimRow);

    // Max animation speed
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
    
    settings.bind(
      'max-anim-speed',
      maxAnimRow.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    animGroup.add(maxAnimRow);

    // Display group
    // const displayGroup = new Adw.PreferencesGroup({
    //   title: _('Display Options'),
    //   description: _('Choose which elements to show in the panel'),
    // });
    // page.add(displayGroup);

    // const displaySpeedGroup = new Adw.PreferencesGroup({});
    // page.add(displaySpeedGroup);

    // // Show animal icon switch
    // const showAnimalIconSwitch = new Gtk.Switch({
    //   active: settings.get_boolean('show-animal-icon'),
    //   valign: Gtk.Align.CENTER,
    // });

    // const showAnimalIconRow = new Adw.ActionRow({
    //   title: _('Show Animal Icon'),
    //   subtitle: _('Display the animated animal icon (snail/turtle/rabbit)'),
    //   activatable_widget: showAnimalIconSwitch,
    // });
    // showAnimalIconRow.add_suffix(showAnimalIconSwitch);

    // settings.bind(
    //   'show-animal-icon',
    //   showAnimalIconSwitch,
    //   'active',
    //   Gio.SettingsBindFlags.DEFAULT
    // );
    // displaySpeedGroup.add(showAnimalIconRow);

    // Show speed label switch
    // const showSpeedLabelSwitch = new Gtk.Switch({
    //   active: settings.get_boolean('show-speed-label'),
    //   valign: Gtk.Align.CENTER,
    // });

    // const showSpeedLabelRow = new Adw.ActionRow({
    //   title: _('Show Speed Label'),
    //   subtitle: _('Display network speed text value'),
    //   activatable_widget: showSpeedLabelSwitch,
    // });
    // showSpeedLabelRow.add_suffix(showSpeedLabelSwitch);

    // settings.bind(
    //   'show-speed-label',
    //   showSpeedLabelSwitch,
    //   'active',
    //   Gio.SettingsBindFlags.DEFAULT
    // );
    // displaySpeedGroup.add(showSpeedLabelRow);

    // const displayMemoryGroup = new Adw.PreferencesGroup({});
    // page.add(displayMemoryGroup);

    // // Show memory icon switch
    // const showMemoryIconSwitch = new Gtk.Switch({
    //   active: settings.get_boolean('show-memory-icon'),
    //   valign: Gtk.Align.CENTER,
    // });

    // const showMemoryIconRow = new Adw.ActionRow({
    //   title: _('Show Memory Icon'),
    //   subtitle: _('Display the memory blob icon'),
    //   activatable_widget: showMemoryIconSwitch,
    // });
    // showMemoryIconRow.add_suffix(showMemoryIconSwitch);

    // settings.bind(
    //   'show-memory-icon',
    //   showMemoryIconSwitch,
    //   'active',
    //   Gio.SettingsBindFlags.DEFAULT
    // );
    // displayMemoryGroup.add(showMemoryIconRow);

    // // Show memory label switch
    // const showMemoryLabelSwitch = new Gtk.Switch({
    //   active: settings.get_boolean('show-memory-label'),
    //   valign: Gtk.Align.CENTER,
    // });

    // const showMemoryLabelRow = new Adw.ActionRow({
    //   title: _('Show Memory Label'),
    //   subtitle: _('Display memory usage percentage text'),
    //   activatable_widget: showMemoryLabelSwitch,
    // });
    // showMemoryLabelRow.add_suffix(showMemoryLabelSwitch);

    // settings.bind(
    //   'show-memory-label',
    //   showMemoryLabelSwitch,
    //   'active',
    //   Gio.SettingsBindFlags.DEFAULT
    // );
    // displayMemoryGroup.add(showMemoryLabelRow);

    // const displayCpuGroup = new Adw.PreferencesGroup({});
    // page.add(displayCpuGroup);

    // // Show CPU icon switch
    // const showCpuIconSwitch = new Gtk.Switch({
    //   active: settings.get_boolean('show-cpu-icon'),
    //   valign: Gtk.Align.CENTER,
    // });

    // const showCpuIconRow = new Adw.ActionRow({
    //   title: _('Show CPU Icon'),
    //   subtitle: _('Display the CPU icon'),
    //   activatable_widget: showCpuIconSwitch,
    // });
    // showCpuIconRow.add_suffix(showCpuIconSwitch);

    // settings.bind(
    //   'show-cpu-icon',
    //   showCpuIconSwitch,
    //   'active',
    //   Gio.SettingsBindFlags.DEFAULT
    // );
    // displayCpuGroup.add(showCpuIconRow);

    // // Show CPU label switch
    // const showCpuLabelSwitch = new Gtk.Switch({
    //   active: settings.get_boolean('show-cpu-label'),
    //   valign: Gtk.Align.CENTER,
    // });

    // const showCpuLabelRow = new Adw.ActionRow({
    //   title: _('Show CPU Label'),
    //   subtitle: _('Display CPU usage percentage text'),
    //   activatable_widget: showCpuLabelSwitch,
    // });
    // showCpuLabelRow.add_suffix(showCpuLabelSwitch);

    // settings.bind(
    //   'show-cpu-label',
    //   showCpuLabelSwitch,
    //   'active',
    //   Gio.SettingsBindFlags.DEFAULT
    // );
    // displayCpuGroup.add(showCpuLabelRow);

    // const displayTempGroup = new Adw.PreferencesGroup({});
    // page.add(displayTempGroup);

    // // Show temperature icon switch
    // const showTemperatureIconSwitch = new Gtk.Switch({
    //   active: settings.get_boolean('show-temperature-icon'),
    //   valign: Gtk.Align.CENTER,
    // });

    // const showTemperatureIconRow = new Adw.ActionRow({
    //   title: _('Show Temperature Icon'),
    //   subtitle: _('Display the temperature thermometer icon'),
    //   activatable_widget: showTemperatureIconSwitch,
    // });
    // showTemperatureIconRow.add_suffix(showTemperatureIconSwitch);

    // settings.bind(
    //   'show-temperature-icon',
    //   showTemperatureIconSwitch,
    //   'active',
    //   Gio.SettingsBindFlags.DEFAULT
    // );
    // displayTempGroup.add(showTemperatureIconRow);

    // // Show temperature label switch
    // const showTemperatureLabelSwitch = new Gtk.Switch({
    //   active: settings.get_boolean('show-temperature-label'),
    //   valign: Gtk.Align.CENTER,
    // });

    // const showTemperatureLabelRow = new Adw.ActionRow({
    //   title: _('Show Temperature Label'),
    //   subtitle: _('Display temperature value text'),
    //   activatable_widget: showTemperatureLabelSwitch,
    // });
    // showTemperatureLabelRow.add_suffix(showTemperatureLabelSwitch);

    // settings.bind(
    //   'show-temperature-label',
    //   showTemperatureLabelSwitch,
    //   'active',
    //   Gio.SettingsBindFlags.DEFAULT
    // );
    // displayTempGroup.add(showTemperatureLabelRow);

    

    // Speed display mode dropdown
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

    const displayOtherGroup = new Adw.PreferencesGroup({});
    page.add(displayOtherGroup);

    // Map settings value to combo box index
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

    displayOtherGroup.add(speedModeRow);

    

    

    // Enable color themes switch
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

    settings.bind(
      'enable-color-themes',
      enableColorThemesSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displayOtherGroup.add(enableColorThemesRow);

    // Statistics group
    const statisticsGroup = new Adw.PreferencesGroup({
      title: _('Network Statistics'),
      description: _('Track and display network traffic statistics'),
    });
    page.add(statisticsGroup);

    // Track statistics switch
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

    settings.bind(
      'track-statistics',
      trackStatsSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    statisticsGroup.add(trackStatsRow);

    // Show statistics switch
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

    settings.bind(
      'show-statistics',
      showStatsSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    statisticsGroup.add(showStatsRow);

    

    

    // Click actions group
    const clickActionsGroup = new Adw.PreferencesGroup({
      title: _('Click Actions'),
      description: _('Configure mouse click and scroll interactions'),
    });
    page.add(clickActionsGroup);

    // Enable left-click cycle
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

    settings.bind(
      'enable-left-click-cycle',
      enableLeftClickSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    clickActionsGroup.add(enableLeftClickRow);

    // Enable scroll interface switch
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

    settings.bind(
      'enable-scroll-interface-switch',
      enableScrollSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    clickActionsGroup.add(enableScrollRow);

    // ========== Display Page ==========
    const displayPage = new Adw.PreferencesPage({
      title: _('Display'),
      icon_name: 'preferences-desktop-wallpaper-symbolic',
    });
    window.add(displayPage);

    // Display group
    // const displayGroup = new Adw.PreferencesGroup({
    //   title: _('Display Options'),
    //   description: _('Choose which elements to show in the panel'),
    // });
    // displayPage.add(displayGroup);


    const displaySpeedGroup = new Adw.PreferencesGroup({
      title: _('Network speed options'),
      description: _('Choose which elements to show')
    });
    displayPage.add(displaySpeedGroup);
    
    // Show animal icon switch
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

    settings.bind(
      'show-animal-icon',
      showAnimalIconSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displaySpeedGroup.add(showAnimalIconRow);

    // Show speed label switch
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

    settings.bind(
      'show-speed-label',
      showSpeedLabelSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displaySpeedGroup.add(showSpeedLabelRow);
    
    // Show speed graph switch
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

    settings.bind(
      'show-speed-graph',
      showGraphSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displaySpeedGroup.add(showGraphRow);



    const displayMemoryGroup = new Adw.PreferencesGroup({
       title: _('Memory options'),
       description: _('Choose which elements to show')
    });
    displayPage.add(displayMemoryGroup);

    // Show memory icon switch
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

    settings.bind(
      'show-memory-icon',
      showMemoryIconSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displayMemoryGroup.add(showMemoryIconRow);

    // Show memory label switch
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

    settings.bind(
      'show-memory-label',
      showMemoryLabelSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displayMemoryGroup.add(showMemoryLabelRow);

    // Memory graph toggle
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

    settings.bind(
      'show-memory-graph',
      showMemoryGraphSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displayMemoryGroup.add(showMemoryGraphRow);

    

    const displayCpuGroup = new Adw.PreferencesGroup({
      title: _('CPU options'),
      description: _('Choose which elements to show')
    });
    displayPage.add(displayCpuGroup);

    // Show CPU icon switch
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

    settings.bind(
      'show-cpu-icon',
      showCpuIconSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displayCpuGroup.add(showCpuIconRow);

    // Show CPU label switch
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

    settings.bind(
      'show-cpu-label',
      showCpuLabelSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displayCpuGroup.add(showCpuLabelRow);

    // CPU graph toggle
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

    settings.bind(
      'show-cpu-graph',
      showCpuGraphSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displayCpuGroup.add(showCpuGraphRow);

    
    const displayTempGroup = new Adw.PreferencesGroup({
      title: _('Temperture options'),
      description: _('Choose which elements to show')
    });
    displayPage.add(displayTempGroup);

    // Show temperature icon switch
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

    settings.bind(
      'show-temperature-icon',
      showTemperatureIconSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displayTempGroup.add(showTemperatureIconRow);

    // Show temperature label switch
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

    settings.bind(
      'show-temperature-label',
      showTemperatureLabelSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displayTempGroup.add(showTemperatureLabelRow);

    // Temperature graph toggle
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

    settings.bind(
      'show-temperature-graph',
      showTemperatureGraphSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displayTempGroup.add(showTemperatureGraphRow);
    
    // Disk display options
    const displayDiskGroup = new Adw.PreferencesGroup({
      title: _('Disk I/O Display'),
    });
    displayPage.add(displayDiskGroup);

    // Show disk icon
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

    settings.bind(
      'show-disk-icon',
      showDiskIconSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displayDiskGroup.add(showDiskIconRow);

    // Show disk label
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

    settings.bind(
      'show-disk-label',
      showDiskLabelSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displayDiskGroup.add(showDiskLabelRow);

    // Disk display mode dropdown
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

    // Show disk graph
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

    settings.bind(
      'show-disk-graph',
      showDiskGraphSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    displayDiskGroup.add(showDiskGraphRow);

    // ========== Notifications Page ==========
    const notificationsPage = new Adw.PreferencesPage({
      title: _('Notifications'),
      icon_name: 'preferences-system-notifications-symbolic',
    });
    window.add(notificationsPage);

    // Master toggle group
    const notificationsMasterGroup = new Adw.PreferencesGroup({
      title: _('Notifications'),
      description: _('Configure desktop notifications for system alerts'),
    });
    notificationsPage.add(notificationsMasterGroup);

    // Enable notifications master switch
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

    settings.bind(
      'enable-notifications',
      enableNotificationsSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    notificationsMasterGroup.add(enableNotificationsRow);

    // Network alerts group
    const networkAlertsGroup = new Adw.PreferencesGroup({
      title: _('Network Alerts'),
    });
    notificationsPage.add(networkAlertsGroup);

    // Network dropout notification
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

    settings.bind(
      'notify-network-dropout',
      notifyNetworkDropoutSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    networkAlertsGroup.add(notifyNetworkDropoutRow);

    // Network dropout threshold
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

    settings.bind(
      'network-dropout-threshold',
      networkDropoutThresholdRow.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    networkAlertsGroup.add(networkDropoutThresholdRow);

    // System alerts group
    const systemAlertsGroup = new Adw.PreferencesGroup({
      title: _('System Alerts'),
    });
    notificationsPage.add(systemAlertsGroup);

    // CPU high notification
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

    settings.bind(
      'notify-cpu-high',
      notifyCpuHighSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    systemAlertsGroup.add(notifyCpuHighRow);

    // CPU alert threshold
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

    settings.bind(
      'cpu-alert-threshold',
      cpuAlertThresholdRow.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    systemAlertsGroup.add(cpuAlertThresholdRow);

    // Memory high notification
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

    settings.bind(
      'notify-memory-high',
      notifyMemoryHighSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    systemAlertsGroup.add(notifyMemoryHighRow);

    // Memory alert threshold
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

    settings.bind(
      'memory-alert-threshold',
      memoryAlertThresholdRow.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    systemAlertsGroup.add(memoryAlertThresholdRow);

    // Temperature high notification
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

    settings.bind(
      'notify-temperature-high',
      notifyTemperatureHighSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    systemAlertsGroup.add(notifyTemperatureHighRow);

    // Temperature alert threshold
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

    settings.bind(
      'temperature-alert-threshold',
      temperatureAlertThresholdRow.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    systemAlertsGroup.add(temperatureAlertThresholdRow);

    // Bandwidth quota alerts group
    const quotaAlertsGroup = new Adw.PreferencesGroup({
      title: _('Bandwidth Quota Alerts'),
    });
    notificationsPage.add(quotaAlertsGroup);

    // Monthly bandwidth quota
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

    settings.bind(
      'bandwidth-quota-gb',
      bandwidthQuotaRow.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    quotaAlertsGroup.add(bandwidthQuotaRow);

    // Quota warning notification
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

    settings.bind(
      'notify-quota-warning',
      notifyQuotaWarningSwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
    quotaAlertsGroup.add(notifyQuotaWarningRow);

    // Quota warning threshold
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

    settings.bind(
      'quota-warning-threshold',
      quotaWarningThresholdRow.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    quotaAlertsGroup.add(quotaWarningThresholdRow);

    // Quota critical threshold
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

    settings.bind(
      'quota-critical-threshold',
      quotaCriticalThresholdRow.adjustment,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    );
    quotaAlertsGroup.add(quotaCriticalThresholdRow);

    // About group
    const aboutGroup = new Adw.PreferencesGroup({
      title: _('About'),
    });
    page.add(aboutGroup);

    const aboutRow = new Adw.ActionRow({
      title: _('Net Speed Animals'),
      subtitle: _('Display internet speed with animated animals'),
    });
    aboutGroup.add(aboutRow);
  }
}
