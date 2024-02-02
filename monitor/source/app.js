import React, {useState, useEffect, useContext} from "react";
import {Text, Newline,  useInput, useApp} from "ink";
import { SerialPortContext } from "./contexts/SerialPortContext.js";

const idxs = {
	io: ["hh", "mm", "ss", "cc", "t0", "t0", "t1", "t1", "t2", "t2", "t3", "t3", "md", "rh", "rl", "rs"],
	r: ["A al", "B bl", "C cl", "D dl", "X", "Y", "BP", "SP", "IRFL", "PC", "MMap", "MPtr", "", "", "", ""]
}

export default function App() {
	const {exit} = useApp();
	const port = useContext(SerialPortContext);

	const [ portStatus, setPortStatus ] = useState(false);
	const [ portData, setPortData ] = useState([]);
	const [ counter, setCounter ] = useState(0);
	const [ which, setWhich] = useState("io");
	const [ hexIn, setHexIn] = useState("");
	const [ sel, setSel] = useState(0);

	useInput((input, key) => {
		if (input === "i") {
			setWhich("io");
			setPortData([]);
		}
		if (input === "r") {
			setWhich("r");
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
		if (input === "w") {
			const num = Number(`0x${hexIn}`);
			port.write([0xC0, sel, 0x00, 0x00, which === "io" ? 0x80 : 0xC0, num & 0xFF, (num & 0xFF00) >> 8, 0x00, 0x00])
			setHexIn("");
		}
		if (input === 'q') {
			exit();
		}
	});

	useEffect(() => {
		if (!port.isOpen) port.open();
		let id;
		const handler = () => {
			setPortStatus(true);
			id = setInterval(() => {
				setCounter(previousCounter => previousCounter + 1);
				if (port.isOpen) {
					let length, width;
					if (which === "io") {
						port.write([0x4f,0x00,0x00,0x00,0x80]);
						width = 8;
						length = 16;
					}
					if (which === "r") {
						port.write([0x4b,0x00,0x00,0x00,0xC0]);
						width = 16;
						length = 12;
					}
					const buf = port.read();
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
				}
			}, 50);
		};
		port.on("open", handler);

		return () => {
			port.off("open", handler);
			port.close();
			clearInterval(id);
		}
	}, [which]);

	return (
		<Text>
			Status: <Text color={port.isOpen ? "green" : "red"}>{port.isOpen ? "Connected" : "Disconnected"}</Text>
			<Newline />
			Which: {which === "io" ? "I/O" : "Reg"} Sel: {sel} Value: {hexIn}
			<Newline />
			Idxs: {portData.map((data, idx) => <Text key={`hdg${idx}`} underline={sel===idx ? true : undefined}>{idxs[which][idx].padEnd(which === "io" ? 2 : 4," ") + " "}</Text>)}
			<Newline />
			Data: {portData.map((data, idx) => <Text key={idx} underline={sel===idx ? true : undefined}>{data.toString(16).padStart(which === "io" ? 2 : 4,"0") + " "}</Text>)}
			<Newline />
			Reads: {counter}
		</Text>
	);
}