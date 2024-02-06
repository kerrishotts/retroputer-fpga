import React, {useState, useEffect, useContext} from "react";
import {Text, Newline,  useInput, useApp} from "ink";
import { SerialPortContext } from "./contexts/SerialPortContext.js";

const idxs = {
	io: [{h:"hour", b:10, w:4}, {h:"mins", b:10, w:4}, {h:"secs", b:10, w:4}, {h:"hund", b:10, w:4}, 
	     {h:"tm0h", b:16, w:4}, {h:"tm0l", b:16, w:4}, {h:"tm1h", b:16, w:4}, {h:"tm1l", b:16, w:4}, 
		 {h:"tm2h", b:16, w:4}, {h:"tm2l", b:16, w:4}, {h:"tm3h", b:16, w:4}, {h:"tm3l", b:16, w:4},
		 {h:"m3m2m1m0", b:2, w:8}, {h:"rndh", b:16, w:4}, {h:"rndl", b:16, w:4}, {h:"rset", b:16, w:4}],
	r: [{h:"A al", b:16, w:4}, {h:"B bl", b:16, w:4}, {h:"C cl", b:16, w:4}, {h:"D dl", b:16, w:4},
	    {h:"X", b:16, w:4}, {h:"Y", b:16, w:4}, {h:"BP", b:16, w:4}, {h:"SP", b:16, w:4}, 
		{h:"IRQ     EDISNCVZ", b:2, w:16}, {h:"PC", b:16, w:4}, {h:".page3page2page1", b:2, w:16}, {h:"MPtr", b:16, w:4}, 
		{h:"", b:16, w:2}, {h:"", b:16, w:2}, {h: "", b:16, w:2}, {h:"", b:16, w:2}]
}

export default function App() {
	const {exit} = useApp();
	const port = useContext(SerialPortContext);

	const [ portStatus, setPortStatus ] = useState(false);
	const [ portError, sertPortError ] = useState("");
	const [ portData, setPortData ] = useState([]);
	const [ counter, setCounter ] = useState(0);
	const [ which, setWhich] = useState("r");
	const [ hexIn, setHexIn] = useState("");
	const [ sel, setSel] = useState(0);

	useInput((input, key) => {
		if (input === "s") {
			// tell CPU to single step
			if (port.isOpen) port.write([0xC0, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x00]);
		}
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
			port.drain(() => port.write([0xC0, sel, 0x00, 0x00, which === "io" ? 0x80 : 0xC0, num & 0xFF, (num & 0xFF00) >> 8, 0x00, 0x00]))
			setHexIn("");
		}
		if (input === 'q') {
			exit();
		}
	});

	useEffect(() => {
		console.log("connecting");
		if (!port.isOpen) port.open();
		let id;
		const handler = () => {
			setPortStatus(true);
			id = setInterval(() => {
				setCounter(previousCounter => previousCounter + 1);
				if (port.isOpen) {
					let length, width;
					if (which === "io") {
						port.isOpen && port.drain(() => port.write([0x4f,0x00,0x00,0x00,0x80]));
						width = 8;
						length = 16;
					}
					if (which === "r") {
						port.isOpen && port.drain(() => port.write([0x4b,0x00,0x00,0x00,0xC0]));
						width = 16;
						length = 12;
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
				}
			},  250);
		};
		port.on("open", handler);

		const errorHandler = error => {
			console.log("error", error);
			sertPortError(error.msg);
		}

		port.on("error", errorHandler)

		return () => {
			console.log("closing");
			port.off("open", handler);
			port.off("error", errorHandler);
			if (port.isOpen) port.close();
			clearInterval(id);
		}
	}, [which]);

	return (
		<Text>
			Status: <Text color={port.isOpen ? "green" : "red"}>{port.isOpen ? "Connected" : "Disconnected"}</Text>
			<Newline />
			Error: <Text color={port.portError === "" ? "green" : "red"}>{portError === "" ? "None" : portError}</Text>
			<Newline />
			Which: {which === "io" ? "I/O" : "Reg"} Sel: {sel} Value: {hexIn}
			<Newline />
			Idxs: {portData.map((data, idx) => <Text key={`hdg${idx}`} underline={sel===idx ? true : undefined}>{idxs[which][idx].h.padEnd(idxs[which][idx].w," ") + " "}</Text>)}
			<Newline />
			Data: {portData.map((data, idx) => <Text key={idx} underline={sel===idx ? true : undefined}>{data.toString(idxs[which][idx].b).padStart(idxs[which][idx].w,"0") + " "}</Text>)}
			<Newline />
			Reads: {counter}
		</Text>
	);
}