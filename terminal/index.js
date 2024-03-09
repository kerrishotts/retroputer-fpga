// based roughly on SerialPort terminal (Copyright 2010 Christopher Williams. All rights reserved.)
// here https://github.com/serialport/node-serialport/blob/main/packages/terminal/lib/index.ts
// (MIT LICENSE) but modified to use SerialPort (instead of stream), and to work w/ Retroputer FPGA

import meow from 'meow';
import {SerialPort} from 'serialport';

const cli = meow(
	`
		Usage
		  $ retroterm

		Options
			--path  path to serial device, e.g., /dev/tty.usbserial-FT4ZS6I31
			--baud  baud rate, e.g., 1000000

		Examples
		  $ retroterm --path=/dev/tty.usbserial-FT4ZS6I31 --baud=812500
	`,
	{
		importMeta: import.meta,
	},
);

const path = cli.flags.path || "/dev/tty.usbserial-FT4ZS6I31"; 
const baudRate = cli.flags.baud ? Number(cli.flags.baud) : 812500;

function run() {
    return new Promise((resolve, reject) => {
        let inCollectMode = false;
        let collected = 0;
        let breakCount = 0;

        const port = new SerialPort({ path, baudRate });

        port.on("open", () => {
            console.log("(Connected.)");
        });

        const clearBreak = setInterval(() => {
            if (breakCount > 0) breakCount--;
        }, 1000)

        process.stdin.setRawMode(true);
        process.stdin.on("data", data => {
            data.forEach(byte => {
                if (byte === 0x03) {
                    breakCount++;
                    if (breakCount > 1) {
                        // really exit!
                        port.close();
                    }
                }
                if (byte === 0x0A) {
                    byte = 0x0D;
                }
                port.write([byte]);
            })
        })
        process.stdin.resume();

        process.stdin.on("end", () => {
            port.close();
        });
        
        port.on("error", err => {
            clearInterval(clearBreak);
            console.error(`(Error: ${err})`);
            reject();
        });

        port.on("close", err => {
            clearInterval(clearBreak);
            console.log(`(Closed ${err ? err : ""})`);
            err ? reject() : resolve();
        });

        port.on("data", data => {
           data.forEach(byte => {
                if (inCollectMode) {
                    if (byte < 32) {
                        inCollectMode = false;
                    } else {
                        collected = collected * 10 + (byte-48);
                    }
                }
                if (byte === 27) {
                    inCollectMode = true;
                    collected = 0;
                }
                if (!inCollectMode) {
                    switch(byte) {
                        case 9: process.stdout.write("\t"); break;
                        case 13: console.log(); break;
                        default:
                            if (byte >= 32) 
                                process.stdout.write(String.fromCharCode(byte));
                            else
                                process.stdout.write(".");
                    }
                }
            });
        });
    });
}

try {
    await run();
} catch (e) {
    process.exit(1);
}
process.exit(0);

