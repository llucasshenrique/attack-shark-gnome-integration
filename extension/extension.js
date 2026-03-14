import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import Main from 'resource:///org/gnome/shell/ui/main.js';
import PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import ExtensionUtils from 'resource:///org/gnome/shell/extensions/extensionUtils.js';

// Attack Shark GNOME Extension (ESM for GNOME 45+)
// Provides: panel button with DPI, Polling controls and Battery indicator
// How CLI is invoked (relative to this extension):
// - The CLI entrypoint in this repo is at: <extension_path>/cli/index.ts
// - The extension attempts to run the CLI using a "runner" binary present in the session PATH.
//   By default it will try (in order): ['bun', 'run', cliPath, ...args]
//   Fallbacks could be added (node+ts-node, compiled JS) but are not forced here.
// - Example command produced: ['bun', 'run', '/home/user/.../attack-shark-gnome-integration/cli/index.ts', 'battery']
// - To test locally you can run the same invocation manually in a terminal where your GNOME session PATH
//   contains 'bun' (or adjust the code to use 'node'+'ts-node'):
//     bun run ./cli/index.ts battery
//     bun run ./cli/index.ts dpi 1600
//     bun run ./cli/index.ts polling 500
// Notes: do not modify CLI files in 'cli/' for this task.

let _indicator = null;
let _timeoutId = null;
let _extension = null;
let _cliRunning = false;
let _batteryLabel = null;
let _dpiMenuItems = [];
let _pollingMenuItems = [];

export function init() {
    _extension = ExtensionUtils.getCurrentExtension();
}

export function enable() {
    // Build a PanelMenu.Button on the right side of the top panel
    _indicator = new PanelMenu.Button(0.0, _extension.metadata.name, false);

    // Icon (theme icon, falls back to emoji text if missing)
    const icon = new St.Icon({
        icon_name: 'input-mouse-symbolic',
        style_class: 'system-status-icon',
    });

    // Battery label (updated by background polling)
    _batteryLabel = new St.Label({ text: '🔋 Battery: N/A', y_align: Clutter.ActorAlign.CENTER });

    const box = new St.BoxLayout({ style_class: 'attack-shark-box' });
    box.add_child(icon);
    box.add_child(_batteryLabel);
    _indicator.add_child(box);

    // DPI Section
    const dpiSection = new PopupMenu.PopupMenuSection();
    _indicator.menu.addMenuItem(new PopupMenu.PopupMenuItem('DPI')); // header-like

    const dpiValues = [800, 1600, 3200];
    dpiValues.forEach((val) => {
        const item = new PopupMenu.PopupMenuItem(`${val} DPI`);
        item.connect('activate', () => {
            // Visual feedback: disable until response
            item.actor.reactive = false;
            const originalLabel = item.label.text;
            item.label.text = `${originalLabel} (applying...)`;

            _runCliCommand(['dpi', val.toString()], (stdout) => {
                // Try to parse stdout JSON but don't block on errors
                try {
                    const d = JSON.parse(stdout);
                    // Expecting success indicator; we simply mark active visually
                    _markActiveDpi(val);
                    // Update battery label if CLI returned any battery info
                    if (d && typeof d.level === 'number') {
                        _updateBatteryLabelFromData(d);
                    }
                } catch (e) {
                    // parsing failed -> show notification and mark error in label
                    logError(e, 'AttackSharkX11: failed to parse DPI command output');
                    _batteryLabel.set_text('Battery: N/A');
                    Main.notify('AttackSharkX11', `Failed to apply DPI ${val} (invalid CLI output)`);
                } finally {
                    item.label.text = originalLabel;
                    item.actor.reactive = true;
                }
            });
        });
        dpiSection.addMenuItem(item);
        _dpiMenuItems.push({ val, item });
    });

    // Polling Rate Section
    _indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    _indicator.menu.addMenuItem(new PopupMenu.PopupMenuItem('Polling Rate'));

    const pollingValues = [125, 500, 1000];
    pollingValues.forEach((rate) => {
        const item = new PopupMenu.PopupMenuItem(`${rate} Hz`);
        item.connect('activate', () => {
            item.actor.reactive = false;
            const originalLabel = item.label.text;
            item.label.text = `${originalLabel} (applying...)`;

            _runCliCommand(['polling', rate.toString()], (stdout) => {
                try {
                    const d = JSON.parse(stdout);
                    // On success, mark active
                    _markActivePolling(rate);
                    if (d && typeof d.level === 'number') {
                        _updateBatteryLabelFromData(d);
                    }
                } catch (e) {
                    logError(e, 'AttackSharkX11: failed to parse polling command output');
                    _batteryLabel.set_text('Battery: N/A');
                    Main.notify('AttackSharkX11', `Failed to set polling ${rate} (invalid CLI output)`);
                } finally {
                    item.label.text = originalLabel;
                    item.actor.reactive = true;
                }
            });
        });
        _indicator.menu.addMenuItem(item);
        _pollingMenuItems.push({ rate, item });
    });

    // Separator + a dedicated battery status menu item
    _indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    const batteryStatusItem = new PopupMenu.PopupMenuItem('Battery: N/A');
    batteryStatusItem.actor.reactive = false;
    _indicator.menu.addMenuItem(batteryStatusItem);

    // Keep reference to batteryStatusItem for updates
    _batteryStatusMenuItem = batteryStatusItem;

    Main.panel.addToStatusArea(_extension.uuid, _indicator);

    // Initial battery check
    _checkBattery();

    // Background battery polling every 5 minutes (300 seconds)
    _timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 300, () => {
        _checkBattery();
        return GLib.SOURCE_CONTINUE;
    });
}

export function disable() {
    if (_timeoutId) {
        try {
            GLib.Source.remove(_timeoutId);
        } catch (e) {
            // ignore
        }
        _timeoutId = null;
    }

    if (_indicator) {
        _indicator.destroy();
        _indicator = null;
    }
}

// Internal helpers
function _checkBattery() {
    _runCliCommand(['battery'], (stdout) => {
        try {
            const data = JSON.parse(stdout);
            _updateBatteryLabelFromData(data);
        } catch (e) {
            logError(e, 'AttackSharkX11: error parsing battery JSON');
            if (_batteryLabel) _batteryLabel.set_text('🔋 Battery: N/A');
            if (_batteryStatusMenuItem) _batteryStatusMenuItem.label.text = 'Battery: N/A';
        }
    });
}

function _updateBatteryLabelFromData(data) {
    if (!data) return;
    if (data.level === -1) {
        _batteryLabel.set_text('🖱️ Wired');
        if (_batteryStatusMenuItem) _batteryStatusMenuItem.label.text = 'Battery: Wired';
    } else if (typeof data.level === 'number') {
        _batteryLabel.set_text(`🔋 Battery: ${data.level}%`);
        if (_batteryStatusMenuItem) _batteryStatusMenuItem.label.text = `Battery: ${data.level}%`;
    } else if (data.error) {
        _batteryLabel.set_text('🔋 Battery: N/A');
        if (_batteryStatusMenuItem) _batteryStatusMenuItem.label.text = 'Battery: N/A';
    }
}

function _markActiveDpi(val) {
    _dpiMenuItems.forEach((i) => {
        const base = `${i.val} DPI`;
        i.item.label.text = i.val === val ? `${base} (active)` : base;
    });
}

function _markActivePolling(rate) {
    _pollingMenuItems.forEach((i) => {
        const base = `${i.rate} Hz`;
        i.item.label.text = i.rate === rate ? `${base} (active)` : base;
    });
}

function _runCliCommand(args, callback = null) {
    // Ensure non-blocking and single-run guard
    if (_cliRunning) {
        // avoid overlapping invocations
        log('AttackSharkX11: CLI already running, skipping this request');
        return;
    }
    _cliRunning = true;

    const sanitize = (s) => String(s).slice(0, 500);

    // Resolve CLI path inside the extension
    const cliPath = `${_extension.path}/cli/index.ts`;

    // Command formation strategy (documented above): try bun first.
    const argv = ['bun', 'run', cliPath, ...args];

    let proc = null;
    try {
        proc = Gio.Subprocess.new(argv, Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
    } catch (spawnErr) {
        // Could not spawn bun-run; show clear UI feedback
        logError(spawnErr, 'AttackSharkX11: Failed to start CLI subprocess');
        Main.notify('AttackSharkX11', 'Failed to start CLI (ensure bun is in PATH or adjust extension code)');
        _cliRunning = false;
        // Do not throw; leave UI responsive
        return;
    }

    proc.communicate_utf8_async(null, null, (procObj, res) => {
        try {
            const [, stdout, stderr] = procObj.communicate_utf8_finish(res);
            if (!procObj.get_successful()) {
                // CLI returned non-zero; report stderr but do not block UI
                const errMsg = stderr ? stderr.trim() : 'Unknown error';
                log(`AttackSharkX11 CLI error: ${sanitize(errMsg)}`);
                Main.notify('AttackSharkX11', `CLI error: ${errMsg}`);
            }

            if (stdout && stdout.trim()) {
                // Only attempt to parse STDOUT as JSON; handle parse errors gracefully
                if (callback) callback(stdout.trim());
            } else {
                // No stdout to parse
                if (callback) callback('{}');
            }
        } catch (e) {
            logError(e, 'AttackSharkX11: Exception during CLI communicate');
            Main.notify('AttackSharkX11', 'Error communicating with CLI');
        } finally {
            _cliRunning = false;
        }
    });
}
