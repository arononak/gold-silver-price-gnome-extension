/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

'use strict'

import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib'

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

function exec(command) {
    try {
        GLib.spawn_command_line_async(command)
    } catch (e) {
        logError(e)
    }
}

function openUrl(url) {
    exec(`xdg-open ${url}`)
}

function executeCommandAsync(command) {
    return new Promise((resolve, reject) => {
        try {
            const process = Gio.Subprocess.new(
                ['sh', '-c', command],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );

            process.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    const [, stdout, stderr] = proc.communicate_utf8_finish(res);

                    if (proc.get_successful()) {
                        resolve(stdout.trim());
                    } else {
                        reject(`stderr: ${stderr.trim()}`);
                    }
                } catch (error) {
                    logError(error);
                    reject(error.message);
                }
            });
        } catch (error) {
            logError(error);
            reject(error.message);
        }
    });
}

export default class ExampleExtension extends Extension {
    enable() {
        this._silverButton = new St.Button({ label: "" });
        this._silverButton.connect('clicked', () => openUrl('https://www.google.com/finance/quote/SIW00:COMEX'));
        this._silverIndicator = new PanelMenu.Button(0.0, this.metadata.name + '-silver', false);
        this._silverIndicator.add_child(this._silverButton);
        Main.panel.addToStatusArea(this.uuid + '-silver', this._silverIndicator);

        this._goldButton = new St.Button({ label: "" });
        this._goldButton.connect('clicked', () => openUrl('https://www.google.com/finance/quote/GCW00:COMEX'));
        this._goldIndicator = new PanelMenu.Button(0.0, this.metadata.name + '-gold', false);
        this._goldIndicator.add_child(this._goldButton);
        Main.panel.addToStatusArea(this.uuid + '-gold', this._goldIndicator);

        this.downloadData();

        // 5 minutes
        this.refreshInterval = setInterval(() => this.downloadData(), 5 * 60 * 1000)
    }

    disable() {
        clearInterval(this.refreshInterval)
        this.refreshInterval = null

        this._goldIndicator?.destroy();
        this._goldIndicator = null;

        this._silverIndicator?.destroy();
        this._silverIndicator = null;
    }

    downloadData() {
        executeCommandAsync('curl -s https://www.google.com/finance/quote/GCW00:COMEX | grep -oP \'<div [^>]*class="[^"]*YMlKec fxKbKc[^"]*"[^>]*>\\s*\\K[^<]+\' | tr -d \',$\'')
            .then((value) => this._goldButton.label = value + '$')
            .catch((error) => this._goldButton.label = '...');

        executeCommandAsync('curl -s https://www.google.com/finance/quote/SIW00:COMEX | grep -oP \'<div [^>]*class="[^"]*YMlKec fxKbKc[^"]*"[^>]*>\\s*\\K[^<]+\' | tr -d \',$\'')
            .then((value) => this._silverButton.label = value + '$')
            .catch((error) => this._silverButton.label = '...');
    }
}