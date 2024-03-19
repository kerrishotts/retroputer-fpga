import React, {useState, useEffect, useContext} from "react";
import {Text, Newline,  useInput, useApp} from "ink";
import { SerialPortContext } from "./contexts/SerialPortContext.js";

import { disassemble } from "../../basm/disassemble.js";

const idxs = {
	io: [{h:"hour", b:10, w:4}, {h:"mins", b:10, w:4}, {h:"secs", b:10, w:4}, {h:"hund", b:10, w:4}, 
	     {h:"tm0h", b:16, w:4}, {h:"tm0l", b:16, w:4}, {h:"tm1h", b:16, w:4}, {h:"tm1l", b:16, w:4}, 
		 {h:"tm2h", b:16, w:4}, {h:"tm2l", b:16, w:4}, {h:"tm3h", b:16, w:4}, {h:"tm3l", b:16, w:4},
		 {h:"m3m2m1m0", b:2, w:8}, {h:"rndh", b:16, w:4}, {h:"rndl", b:16, w:4}, {h:"rset", b:16, w:4}],
	reg: [{h:"A al", b:16, w:4}, {h:"B bl", b:16, w:4}, {h:"C cl", b:16, w:4}, {h:"D dl", b:16, w:4},
	    {h:"X", b:16, w:4}, {h:"Y", b:16, w:4}, {h:"BP", b:16, w:4}, {h:"SP", b:16, w:4}, 
		{h:"IRQ     EDISNCVZ", b:2, w:16}, {h:"PC", b:16, w:4}, {h:".page3page2page1", b:2, w:16}, {h:"MPtr", b:16, w:4}, 
		{h:"clkc", b:10, w:4}, {h:"clk*", b:10, w:4}, {h: "InHi", b:16, w:4}, {h:"InLo", b:16, w:4}],
	mem: [{h:"00", b:16, w:2}, {h:"01", b:16, w:2}, {h:"02", b:16, w:2}, {h:"03", b:16, w:2}, 
	     {h:"04", b:16, w:2}, {h:"05", b:16, w:2}, {h:"06", b:16, w:2}, {h:"07", b:16, w:2}, 
		 {h:"08", b:16, w:2}, {h:"09", b:16, w:2}, {h:"0A", b:16, w:2}, {h:"0B", b:16, w:2},
		 {h:"0C", b:16, w:2}, {h:"0D", b:16, w:2}, {h:"0E", b:16, w:2}, {h:"0F", b:16, w:2}],
}

function toAscii(data) {
	return data.map(byte => ((byte >= 32 && byte <= 126) /*|| (byte >= 128)*/) ? String.fromCharCode(byte) : ".").join("");
}

export default function App({firstView} = {}) {
	const {exit} = useApp();
	const port = useContext(SerialPortContext);

	const [ portStatus, setPortStatus ] = useState(false);
	const [ portError, setPortError ] = useState("");
	const [ portData, setPortData ] = useState([]);
	const [ counter, setCounter ] = useState(0);
	const [ which, setWhich] = useState(firstView || "reg");
	const [ hexIn, setHexIn] = useState("");
	const [ sel, setSel] = useState(0);
	const [ memBase, setMemBase] = useState(0xFF00);
	const [ ioBase, setIoBase] = useState(0x00);
	const [ autoRefresh, setAutoRefresh] = useState(true);
	const [ con, setCon ] = useState("");

	useInput((input, key) => {
		if (input === "s") {
			// tell CPU to single step
			if (port.isOpen) port.write([0x80, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x00]);
		}
		if (input === "S") {
			// tell CPU to single step, a lot of times
			if (port.isOpen) port.write([0xBF, 0x00, 0x00, 0x00, 0x40, ...Array.from({length:256}, () => 0x00)]);
		}
		if (input === "i") {
			setWhich("io");
			setPortData([]);
		}
		if (input === "r") {
			setWhich("reg");
			setPortData([]);
		}
		if (input === "m") {
			setWhich("mem");
			setPortData([]);
		}
		if ((input >= "0" && input <="9") || (input >= "a" && input <= "f") || (input >= "A" && input <= "F")) {
			setHexIn(prevHexIn => prevHexIn + input);
		}
		if (key.backspace) {
			setHexIn("");
		}
		if (key.leftArrow) {
			setSel(prevSel => prevSel > 0 ? prevSel - 1 : 15);
		}
		if (key.rightArrow) {
			setSel(prevSel => prevSel < 15 ? prevSel + 1 : 0);
		}
		if (key.upArrow) {
			switch (which) {
				case "mem": setMemBase(prevMemBase => prevMemBase === 0 ? 0x7FFF0 : prevMemBase - 16); break;
				case "io": setIoBase(prevIoBase => prevIoBase === 0 ? 0xF0 : prevIoBase - 16); break;
			}
		}
		if (key.downArrow) {
			switch (which) {
				case "mem": setMemBase(prevMemBase => prevMemBase === 0x7FFf0 ? 0 : prevMemBase + 16); break;
				case "io": setIoBase(prevIoBase => prevIoBase === 0xF0 ? 0 : prevIoBase + 16); break;
			}
		}
		if (input === "g") {
			const num = Number(`0x${hexIn}`) & 0xFFFF0;
			switch (which) {
				case "mem": setMemBase(num); break;
				case "io": setIoBase(num); break;
			}
			setHexIn("");
		}
		if (input === "w") {
			const num = Number(`0x${hexIn}`);
			let addr = 0, bank;
			switch (which) {
				case "mem": bank = 0x00; addr = memBase; break;
				case "io": bank = 0x80; addr = ioBase; break;
				case "reg": bank = 0xC0; break;
			}
			addr += sel;
			/*(port.drain(() =>*/ port.write([0x80, addr & 0x00FF, (addr & 0xFF00) >> 8, (addr & 0x70000) >> 16, bank, num & 0xFF, (num & 0xFF00) >> 8, 0x00, 0x00])//)
			setHexIn("");
		}
		if (input === 'q') {
			exit();
		}
		if (input === "p") {
			setAutoRefresh(prevAutoRefresh => !prevAutoRefresh);
		}
	});

	useEffect(() => {
		if (!port.isOpen) port.open();
		let id;
		const handler = () => {
			setPortStatus(true);
			id = setInterval(() => {
				if (!autoRefresh) return;
				setCounter(previousCounter => previousCounter + 1);
				if (port.isOpen) {
					let length, width;
					if (which === "io") {
						port.isOpen && /*port.drain(() =>*/ port.write([0x4f,ioBase & 0x00FF, 0x00 ,0x00,0x80])//);
						width = 8;
						length = 16;
					}
					if (which === "reg") {
						port.isOpen && /*port.drain(() =>*/ port.write([0x4f,0x00,0x00,0x00,0xC0])//);
						width = 16;
						length = 16;
					}
					if (which === "mem") {
						port.isOpen && /*port.drain(() =>*/ port.write([0x7f,memBase & 0x00FF,(memBase & 0xFF00) >> 8, (memBase & 0x70000) >> 16,0x00])//);
						width = 8;
						length = 64;
					}
					if (port.isOpen) {
						let buf = null;
						let ctr = 1000;
						while (buf === null && ctr > 0) {
							buf = port.read();
							ctr--;
						}
						if (buf !== null) {
							const data = Array.from(buf);
							const arr = Array.from({length}, (_, idx) => {
								return width === 8 ? (data[idx * 4] || 0)
												: ((data[idx * 4 + 1] || 0) << 8) | (data[idx * 4] || 0);
							})
							setPortData(arr);
						} else {
							setPortData([]);
						}
					} else {
						setPortData([]);
					}
/*
					// get the console
					//port.drain(() => {
					if (port.isOpen) {
						port.drain( () => {
							port.write([0x0F,0x01, 0x00 ,0x00,0x40]); // Request read
							port.drain( () => {
								let buf = port.read(64);
								if (buf) {
									let data = Array.from(buf);
									console.log(data.length);
									const bytes = data.reduce((acc, cur, idx) => {
										//if (idx % 4 === 0) 
											acc.push(cur);
										return acc;
									}, []);
									const str = bytes.filter(byte => byte !== 0).map(byte => byte > 32 ? String.fromCharCode(byte) : ".").join("");
									//const str = bytes.join(",");
									if (str.length > 0) setCon(prevCon => prevCon + str);
								}
							});
						});
					}*/
				}
			},  125);
		};
		port.on("open", handler);

		const errorHandler = error => {
			setPortError(error.message);
		}
		port.on("error", errorHandler)

		return () => {
			port.off("open", handler);
			port.off("error", errorHandler);
			if (port.isOpen) port.close();
			clearInterval(id);
		}
	}, [which, memBase, ioBase, autoRefresh]);

	return (
		<Text>
			Status: <Text color={port.isOpen ? "green" : "red"}>{port.isOpen ? "Connected" : "Disconnected"}</Text>
			<Newline />
			Error: <Text color={port.portError === "" ? "green" : "red"}>{portError === "" ? "None" : portError}</Text>
			<Newline />
			Which: {which} Base: {which == "mem" ? memBase.toString(16).padStart(5,"0") : which == "io" ? ioBase.toString(16).padStart(2,"0") : "N/A"} Sel: {sel} Value: {hexIn}
			<Newline />
			Idxs: <Newline />{portData.slice(0,16).map((data, idx) => <Text key={`hdg${idx}`} underline={sel===idx ? true : undefined}>{idxs[which][idx & 0xF].h.padEnd(idxs[which][idx & 0xf].w," ") + " "}</Text>)}
			<Newline />
			Data: <Newline />{portData.map((data, idx) => <Text key={idx} underline={sel===idx ? true : undefined}>{data.toString(idxs[which][idx & 0xF].b).padStart(idxs[which][idx & 0xF].w,"0") + (((idx & 0xF) === 0xF) ? "\n" : " ")}</Text>)}
			<Newline />
			Inst: {
				which === "reg" ? (disassemble([(portData[14] & 0xFF00) >> 8, portData[14] & 0x00FF, (portData[15] & 0xFF00) >> 8, portData[15] & 0x00FF]) || {}).code : 
				which === "mem" ? (disassemble([portData[sel], portData[sel+1], portData[sel+2], portData[sel+3]]) || {}).code : "-"}
			<Newline />
			Ascii: { toAscii(portData) }
			<Newline />
			Reads: {counter}
			<Newline />
			Console: {con}
		</Text>
	);
}