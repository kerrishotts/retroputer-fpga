#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import fs from "fs";

import { SerialPortContext } from './contexts/SerialPortContext.js';
import {SerialPort} from 'serialport';
import { terminal } from './terminal.js';

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
			--con   interactive serial console (to Retroputer)

		Examples
		  $ monitor --path=/dev/tty.usbserial-FT4ZS6I31 --baud=812500
	`,
	{
		importMeta: import.meta,
	},
);

const path = cli.flags.path || "/dev/tty.usbserial-FT4ZS6I31"; 
const baudRate = cli.flags.baud ? Number(cli.flags.baud) : 812500;
const port = new SerialPort({ path, baudRate, autoOpen: false });
const load = cli.flags.load;
const fmt = cli.flags.fmt || "bin";
const addr = Number(cli.flags.addr) || 0;
const con = cli.flags.con;
const firstView = cli.flags.first || "reg";

if (con) {
	console.log("calling")
	await terminal(port);
/*	if (!port.isOpen) port.open();
	let state = 0, i = 0;
	const handler = () => {
		setInterval(() => {
			i++;
			switch(state) {
				case 0:
					port.write([0x3F,0x01, 0x00 ,0x00,0x40]); // Request read
					break;
				case 1:
			}
		}, 4)
	}
	port.on("open", handler);
	port.on("error", error => console.error(error.message))
	port.on("data", data => {
		if (data) data.forEach(byte => {
			if (byte === 13) console.log();
			if (byte >= 32) process.stdout.write(String.fromCharCode(byte))
		});
	})*/
} else if (load) {
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
		const bytesToSendAtOnce = 8;
		let timer = setInterval(() => {
			// TODO: write up to 64 bytes at once
			const newAddr = addr + idx;
			const bytes = data.slice(idx, idx + bytesToSendAtOnce);
			if (idx % 256 === 0) process.stdout.write(".");
			const expandedBytes = bytes.reduce((acc, cur) => {acc.push(cur, 0, 0, 0); return acc}, []);
			port.write([0xC0 + (bytes.length - 1),                                                  /*command (write, auto inc, length) */
				        newAddr & 0x00FF, (newAddr & 0xFF00) >> 8, (newAddr & 0x70000) >> 16, 0x00, /* starting address */
				        ...expandedBytes                                                            /* data */]);
			idx += bytesToSendAtOnce; 
			if (idx >= data.length) {
				clearInterval(timer);
				console.log("complete");
				if (port.isOpen) {
					console.log("(draining)");
					port.drain( () => {
						port.off("on", handler);
						if (port.isOpen) port.close();
					});
				}
			}
		}, 0)
	}
	port.on("open", handler);
	port.on("error", error => console.error(error.message))
}
else {
	render(
		<SerialPortContext.Provider value={port}>
			<App firstView={firstView}/>
		</SerialPortContext.Provider>
	);
}
