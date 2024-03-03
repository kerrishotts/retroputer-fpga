import {SerialPort} from 'serialport';

const BATCH_SIZE = 8;

const STATES = {
    CLOSED: "closed",
    OPENING: "opening",
    IDLE: "idle",
    GET: "read",
    PUT: "write",
    GET_PUT_RESPONSE: "get-put-response"
};

export class RetroputerInterface {
    #port;
    #ready;
    #opening;
    /**
     * 
     * @param {SerialPort} port 
     */
    constructor(port) {
        this.#port = port;
        this.#ready = false;
    }

    open() {
        return new Promise((resolve, reject) => {
            if (this.#port.isOpen) {
                this.#ready = true;
                resolve();
            }
            let handler, errHandler, timerId;

            const cleanup = () => {
                this.#port.off("open", handler);
                this.#port.off("error", errHandler);
                clearTimeout(timerId);
            }

            timerId = setTimeout(() => {
                this.#ready = false;
                cleanup();
                reject(new Error("Timed out opening port"));
            }, 3000)

            this.#port.on("open", handler = () => {
                this.#ready = true;
                cleanup();
                resolve();
            });

            this.#port.on("error", errHandler = (err) => {
                this.#ready = false;
                cleanup();
                reject(err);
            });

            this.#port.open();
        });
    }

    waitUntilReady({timeout = 30000 /* 3 secs */} = {}) {
        return new Promise((resolve, reject) => {
            if (!this.#port.isOpen) reject(new Error("Port not open"));
            if (this.#ready) {this.#ready = false; resolve();}
            else { 
                let timeoutCtr = 0;
                let id = setInterval(() => {
                    if (this.#ready) {
                        this.#ready = false; // something's coming, keep it low
                        clearInterval(id);
                        resolve();
                    }
                    if (timeout > 0) {
                        timeoutCtr += 10;
                        if (timeoutCtr > timeout) {
                            clearInterval(id);
                            reject(new Error("waitUntilReady timed out"));
                        }
                    }
                }, 10);
            }
        });
    }

    _send({read = false, write = false, autoIncr = false, length = 0, addr = 0, values = []} = {}) {
        //if (!this.#ready) {
        //    throw new Error("Not ready; can't send!");
       // }
        this.#ready = false;
        return new Promise((resolve, reject) => {
            if (length > 64) {
                reject(new Error("Can't send or receive more than 64 values at any given time"));
            }
            if (read === write) {
                reject(new Error("Can't read and write at the same time, or do neither"));
            }
            const sendBytes = [
                // first byte is the command
                ( (write ? 0x80 : 0x00)
                | (autoIncr ? 0x40 : 0x00)
                | (length - 1)
                ),
                // next four bytes represent the starting address
                addr & 0xFF,
                (addr & 0xFF00) >> 8,
                (addr & 0xFF0000) >> 16,
                (addr & 0xFF000000) >> 24
            ];
            if (write) {
                // add the values we need to send
                values.forEach(value => {
                    sendBytes.push(
                        value & 0xFF,
                        (value & 0xFF00) >> 8,
                        (value & 0xFF0000) >> 16,
                        (value & 0xFF000000) >> 24
                    );
                });
            }

            this.#port.write(sendBytes);
            if (read) {
                let recvHandler, errHandler;
                let buf = [];
                let returnValues = [];
                this.#port.on("data", recvHandler = (data) => {
                    buf.push(...Array.from(data));
                    if (buf.length >= length) {
                        this.#port.off("data", recvHandler);
                    this.#port.off("error", errHandler);
                        buf.forEach((byte, idx) => {
                            returnValues[returnValues.length] = (returnValues[returnValues.length] << 8) | byte;
                            if (idx % 4 === 3)
                                returnValues.push(0);
                        });
                        this.#ready = true;
                        resolve(returnValues);
                    }
                });
                this.#port.on("error", errHandler = (err) => {
                    this.#port.off("error", errHandler);
                    this.#port.off("data", recvHandler);
                    this.#ready = true;
                    reject(err);
                })
            } else {
                this.#port.drain(() => {
                    this.#ready = true;
                    resolve();
                })
            }
        });
    }

    async getCPUState({timeout} = {}) {
        await this.waitUntilReady({timeout});
        const data = await this._send({
            read: true,
            autoIncr: true,
            length: 16,
            addr: 0xC000_0000
        });
        return {
            A: data[0] & 0xFFFF, B: data[1] & 0xFFFF, C: data[2] & 0xFFFF, D: data[3] & 0xFFFF,
            X: data[4] & 0xFFFF, Y: data[5] & 0XFFFF, BP: data[6] & 0xFFFF, SP: data[7] & 0xFFFF,
            IRQ: (data[8] & 0xFF00) >> 8, STATUS: (data[8] & 0x00FF), PC: data[9], MP: data[10], MM: data[11],
            flag: {
                EX: data[8] & 0b1000_0000 ? true : false,
                ID: data[8] & 0b0100_0000 ? true : false,
                IS: data[8] & 0b0010_0000 ? true : false,
                SS: data[8] & 0b0001_0000 ? true : false,
                N: data[8]  & 0b0000_1000 ? true : false,
                C: data[8]  & 0b0000_0100 ? true : false,
                V: data[8]  & 0b0000_0010 ? true : false,
                Z: data[8]  & 0b0000_0001 ? true : false
            },
            cpuClocks: data[12], allClocks: data[13],
            inst: data[14] << 16 | data[15]
        }
    }
    async setCPURegister({timeout, which, value}) {
        await this.waitUntilReady({timeout});
        await this._send({
            write: true,
            autoIncr: false,
            length: 1,
            addr: 0xC000_0000 | whichReg,
            values: [ value ]
        });
    }
    async getMemory({timeout, addr, length} = {}) {
        await this.waitUntilReady({timeout});
        let data = [], curAddr = addr;
        while (data.length < length) {
            const lengthToSend = Math.max(BATCH_SIZE, length - data.length);
            const temp = await this._send({
                read: true,
                autoIncr: true,
                length: lengthToSend,
                addr: curAddr
            });
            curAddr + temp.length;
            data.push(...temp);
        }
        return data;
    }
    async setMemory({timeout, addr, length, values} = {}) {
        await this.waitUntilReady({timeout});
        const dataToSend = [...values];
        let curAddr = addr;
        while (dataToSend.length > 0) {
            const data = dataToSend.splice(0, BATCH_SIZE);
            await this._send({
                write: true,
                autoIncr: true,
                length: data.length,
                addr: curAddr,
                data
            });
            curAddr += data.length;
        }
    }
    async getIO({timeout, port, length} = {}) { 
        await this.waitUntilReady({timeout});
        let data = [], curAddr = 0x8000_0000 | port;
        while (data.length < length) {
            const lengthToSend = Math.max(BATCH_SIZE, length - data.length);
            const temp = await this._send({
                read: true,
                autoIncr: true,
                length: lengthToSend,
                addr: curAddr
            });
            curAddr + temp.length;
            data.push(...temp);
        }
        return data;
    }
    async setIO({timeout, port, length, values} = {}) {
        await this.waitUntilReady({timeout});
        const dataToSend = [...values];
        let curAddr = 0x8000_0000 | port;
        while (dataToSend.length > 0) {
            const data = dataToSend.splice(0, BATCH_SIZE);
            await this._send({
                write: true,
                autoIncr: true,
                length: data.length,
                addr: curAddr,
                data
            });
            curAddr += data.length;
        }
    }
    async getConsoleChars({timeout} = {}) {
        await this.waitUntilReady({timeout});
        let data = [], keepReading = true;
        while (keepReading) {
            const temp = await this._send({
                read: true,
                autoIncr: false,
                length: 16,
                addr: 0x4000_0001
            });
            temp.forEach(byte => {
                if (byte > 0) {
                    data.push(byte);
                    keepReading = true;
                } else {
                    keepReading = false;
                }
            });
        }
        return data;
    }
    async putConsoleChar({timeout, char} = {}) {
        //console.log("hi");
        //return this.setIO({timeout, port: 0x81, length: 1, values: [char]});
        
        await this.waitUntilReady({timeout});
        await this._send({
            write: true,
            autoIncr: false,
            length: 1,
            addr: 0x4000_0001,
            values: [char]
        });
        process.stdout.write(String.fromCharCode(char));
        
    }

    async sendNMI({timeout, length = 1}) {
        await this.waitUntilReady({timeout});
        await this._send({
            write: true,
            autoIncr: false,
            length,
            addr: 0x4000_0000,
            values: Array.from({length}, _ => 0)
        });
    }

    get ready() {
        return this.#ready;
    }
}