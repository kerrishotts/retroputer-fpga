#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import fs from "fs";

import { SerialPortContext } from './contexts/SerialPortContext.js';
import {SerialPort} from 'serialport';

const cli = meow(
	`
		Usage
		  $ monitor

		Options
			--path  path to serial device, e.g., /dev/tty.usbserial-FT4ZS6I31
			--baud  baud rate, e.g., 1000000
			--load  path to .bin file
			--fmt   file format (defaults to bin), but can also be txt
			--addr  address to load or dump; prefix w/ 0x for hex

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
const load = cli.flags.load;
const fmt = cli.flags.fmt || "bin";
const addr = Number(cli.flags.addr) || 0;

if (load) {
	console.log (`Loading from ${load}...`);
	if (!port.isOpen) port.open();
	const handler = () => {
		console.log("open");
		let data;
		if (fmt === "bin") data = fs.readFileSync(cli.flags.load);
		if (fmt === "txt") {
			const contents = fs.readFileSync(cli.flags.load, {encoding: "utf8"});
			const lines = contents.split("\n");
			lines.forEach(line => {
				const lineWithoutComments = line.split("#");
				const bytes = lineWithoutComments[0].split(" ");
				bytes.forEach(byte => {
					data.push(Number(`0x${byte}`));
				})
			});
		}
		console.log("writing to memory");
		let idx = 0;
		let timer = setInterval(() => {
			// TODO: write up to 64 bytes at once
			const newAddr = addr + idx;
			const byte = data[idx];
			if (idx % 32 === 0) console.log(`0x${newAddr.toString(16)} = 0x${byte.toString(16)}`);
			port.drain( () => port.write([0x80, newAddr & 0x00FF, (newAddr & 0xFF00) >> 8, (newAddr & 0x70000) >> 16, 0x00, byte, 0x00, 0x00, 0x00]));
			idx++;
			if (idx >= data.length) {
				clearInterval(timer);
				console.log("complete");
				if (port.isOpen) port.drain( () => {
					port.off("on", handler);
					if (port.isOpen) port.close();
				})
			}
		}, 0)
	}
	port.on("open", handler);
	port.on("error", error => console.error(error.message))
}
else {
	render(
		<SerialPortContext.Provider value={port}>
			<App />
		</SerialPortContext.Provider>
	);
}
