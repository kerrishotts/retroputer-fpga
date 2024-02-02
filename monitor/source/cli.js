#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

import { SerialPortContext } from './contexts/SerialPortContext.js';
import {SerialPort} from 'serialport';

const cli = meow(
	`
		Usage
		  $ monitor

		Options
			--path  path to serial device, e.g., /dev/tty.usbserial-FT4ZS6I31
			--baud  baud rate, e.g., 1000000

		Examples
		  $ monitor --path=/dev/tty.usbserial-FT4ZS6I31 --baud=1000000
	`,
	{
		importMeta: import.meta,
	},
);

const path = cli.flags.path || "/dev/tty.usbserial-FT4ZS6I31"; 
const baudRate = cli.flags.baud ? Number(cli.flags.baud) : 1000000;

const port = new SerialPort({ path, baudRate, autoOpen: false });
render(
	<SerialPortContext.Provider value={port}>
		<App />
	</SerialPortContext.Provider>
);
