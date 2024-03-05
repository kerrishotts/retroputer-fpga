
import {SerialPort} from "serialport";
import readline from "readline";

import { RetroputerInterface } from "./serial.js";

export async function terminal(port) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    const retroputer = new RetroputerInterface(port);
    await retroputer.open();

    let breakPressed = false;

    let pendingKeyStrokes = [];

    process.stdin.on("keypress", async (str, key) => {
        if (key.sequence === "\u0003") {
            process.exit();
        }
        else {
            pendingKeyStrokes.push(key.sequence.charCodeAt(0));
        }
    });

    setInterval(async () => {
        const terminalData = await retroputer.getConsoleChars(); // keeps reading until we get a NULL terminated string

		terminalData.forEach(byte => {
			if (byte === 13) console.log();
			if (byte >= 32) process.stdout.write(String.fromCharCode(byte))
		});

        if (pendingKeyStrokes.length > 0) {
            const char = pendingKeyStrokes.shift();
            await retroputer.putConsoleChar({char});
        }
    }, 16);
}