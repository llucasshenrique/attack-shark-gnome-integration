import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export default class AttackSharkExtension extends Extension {
    enable() {
        this._cliRunning = false;
        this._batteryStatusMenuItem = null;
        this._dpiMenuItems = [];
        this._pollingMenuItems = [];

        this._indicator = new PanelMenu.Button(0, this.metadata.name, false);

        const icon = new St.Icon({
            icon_name: 'input-mouse-symbolic',
            style_class: 'system-status-icon',
        });

        this._batteryLabel = new St.Label({
            text: 'Battery: N/A',
            y_align: Clutter.ActorAlign.CENTER,
        });

        const box = new St.BoxLayout({style_class: 'attack-shark-box'});
        box.add_child(icon);
        box.add_child(this._batteryLabel);
        this._indicator.add_child(box);

        this._buildDpiSection();
        this._buildPollingSection();
        this._buildBatteryStatusSection();

        Main.panel.addToStatusArea(this.uuid, this._indicator);

        this._checkBattery();
        this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 300, () => {
            this._checkBattery();
            return GLib.SOURCE_CONTINUE;
        });
    }

    disable() {
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }

        this._indicator?.destroy();
        this._indicator = null;
        this._batteryLabel = null;
        this._batteryStatusMenuItem = null;
        this._dpiMenuItems = [];
        this._pollingMenuItems = [];
        this._cliRunning = false;
    }

    _buildDpiSection() {
        const dpiSection = new PopupMenu.PopupMenuSection();
        this._indicator.menu.addMenuItem(new PopupMenu.PopupMenuItem('DPI'));

        for (const value of [800, 1600, 2400, 3200, 5000, 22000]) {
            const item = new PopupMenu.PopupMenuItem(`${value} DPI`);
            item.connect('activate', () => {
                item.actor.reactive = false;
                const originalLabel = item.label.text;
                item.label.text = `${originalLabel} (applying...)`;

                this._runCliCommand(['dpi', String(value)], stdout => {
                    try {
                        const data = JSON.parse(stdout);
                        this._markActiveDpi(value);
                        if (typeof data?.level === 'number')
                            this._updateBatteryLabelFromData(data);
                    } catch (error) {
                        logError(error, 'AttackSharkX11: failed to parse DPI command output');
                        this._setBatteryUnavailable();
                        Main.notify('AttackSharkX11', `Failed to apply DPI ${value} (invalid CLI output)`);
                    } finally {
                        item.label.text = originalLabel;
                        item.actor.reactive = true;
                    }
                });
            });

            dpiSection.addMenuItem(item);
            this._dpiMenuItems.push({value, item});
        }

        this._indicator.menu.addMenuItem(dpiSection);
    }

    _buildPollingSection() {
        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._indicator.menu.addMenuItem(new PopupMenu.PopupMenuItem('Polling Rate'));

        for (const rate of [125, 250, 500, 1000]) {
            const item = new PopupMenu.PopupMenuItem(`${rate} Hz`);
            item.connect('activate', () => {
                item.actor.reactive = false;
                const originalLabel = item.label.text;
                item.label.text = `${originalLabel} (applying...)`;

                this._runCliCommand(['polling', String(rate)], stdout => {
                    try {
                        const data = JSON.parse(stdout);
                        this._markActivePolling(rate);
                        if (typeof data?.level === 'number')
                            this._updateBatteryLabelFromData(data);
                    } catch (error) {
                        logError(error, 'AttackSharkX11: failed to parse polling command output');
                        this._setBatteryUnavailable();
                        Main.notify('AttackSharkX11', `Failed to set polling ${rate} (invalid CLI output)`);
                    } finally {
                        item.label.text = originalLabel;
                        item.actor.reactive = true;
                    }
                });
            });

            this._indicator.menu.addMenuItem(item);
            this._pollingMenuItems.push({rate, item});
        }
    }

    _buildBatteryStatusSection() {
        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        const batteryStatusItem = new PopupMenu.PopupMenuItem('Battery: N/A');
        batteryStatusItem.actor.reactive = false;
        this._indicator.menu.addMenuItem(batteryStatusItem);
        this._batteryStatusMenuItem = batteryStatusItem;
    }

    _checkBattery() {
        this._runCliCommand(['battery'], stdout => {
            try {
                const data = JSON.parse(stdout);
                this._updateBatteryLabelFromData(data);
            } catch (error) {
                logError(error, 'AttackSharkX11: error parsing battery JSON');
                this._setBatteryUnavailable();
            }
        });
    }

    _setBatteryUnavailable() {
        if (this._batteryLabel)
            this._batteryLabel.set_text('Battery: N/A');
        if (this._batteryStatusMenuItem)
            this._batteryStatusMenuItem.label.text = 'Battery: N/A';
    }

    _updateBatteryLabelFromData(data) {
        if (!data)
            return;

        if (data.level === -1) {
            this._batteryLabel?.set_text('Wired');
            if (this._batteryStatusMenuItem)
                this._batteryStatusMenuItem.label.text = 'Battery: Wired';
            return;
        }

        if (typeof data.level === 'number') {
            this._batteryLabel?.set_text(`Battery: ${data.level}%`);
            if (this._batteryStatusMenuItem)
                this._batteryStatusMenuItem.label.text = `Battery: ${data.level}%`;
            return;
        }

        if (data.error)
            this._setBatteryUnavailable();
    }

    _markActiveDpi(value) {
        for (const entry of this._dpiMenuItems) {
            const base = `${entry.value} DPI`;
            entry.item.label.text = entry.value === value ? `${base} (active)` : base;
        }
    }

    _markActivePolling(rate) {
        for (const entry of this._pollingMenuItems) {
            const base = `${entry.rate} Hz`;
            entry.item.label.text = entry.rate === rate ? `${base} (active)` : base;
        }
    }

    _runCliCommand(args, callback = null) {
        if (this._cliRunning) {
            log('AttackSharkX11: CLI already running, skipping this request');
            return;
        }

        this._cliRunning = true;
        const argv = this._resolveCliArgv(args);

        if (!argv) {
            this._cliRunning = false;
            Main.notify('AttackSharkX11', 'CLI not found. Reinstall with "bun run package" or ensure bun is available for development mode.');
            return;
        }

        let proc;
        try {
            proc = Gio.Subprocess.new(argv, Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
        } catch (error) {
            logError(error, 'AttackSharkX11: failed to start CLI subprocess');
            Main.notify('AttackSharkX11', 'Failed to start CLI subprocess');
            this._cliRunning = false;
            return;
        }

        proc.communicate_utf8_async(null, null, (procObj, result) => {
            try {
                const [, stdout, stderr] = procObj.communicate_utf8_finish(result);
                if (!procObj.get_successful()) {
                    const errMsg = stderr?.trim() || 'Unknown error';
                    log(`AttackSharkX11 CLI error: ${String(errMsg).slice(0, 500)}`);
                    Main.notify('AttackSharkX11', `CLI error: ${errMsg}`);
                }

                const out = stdout?.trim() || '{}';
                callback?.(out);
            } catch (error) {
                logError(error, 'AttackSharkX11: error while communicating with CLI');
                Main.notify('AttackSharkX11', 'Error communicating with CLI');
            } finally {
                this._cliRunning = false;
            }
        });
    }

    _resolveCliArgv(args) {
        const systemCliPath = '/usr/bin/attack-shark-cli';
        const compiledCliPath = `${this.path}/attack-shark-cli`;
        const devCliPath = `${this.path}/cli/index.ts`;

        if (GLib.file_test(systemCliPath, GLib.FileTest.IS_EXECUTABLE))
            return [systemCliPath, ...args];

        if (GLib.file_test(compiledCliPath, GLib.FileTest.IS_EXECUTABLE))
            return [compiledCliPath, ...args];

        const bunPath = GLib.find_program_in_path('bun');
        if (bunPath && GLib.file_test(devCliPath, GLib.FileTest.EXISTS))
            return [bunPath, 'run', devCliPath, ...args];

        return null;
    }
}
