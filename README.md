# Retroputer FPGA Project

The goal is to implement (and actually finish) the [Retroputer](https://github.com/kerrishotts/retroputer/tree/develop-2.0) in hardware.

This project is built for the [Alchitry Au FPGA board](https://alchitry.com/boards/au). It uses Lucid for a good portion of the hardware description. At some point I may elect to convert all of this to Verilog.

The project also assumes the Alchitry Io board is also present so that you can inspect the contents of the processor and control the machine.

Note: It's SUPER EARLY DAYS... nothing here is terribly useful. I'm also just learning about FPGAs, so I wouldn't take anything you see in this repo as the "right way" to do anything! This is purely for my own personal fun and enjoyment.

## Done

- [X] Show register on Io board
- [X] Allow user to scroll through registers using Up/Down
- [X] Allow user to control if `dbe` (debugger enabled) is set by setting DIP[0] on
- [X] Allow user to single-step the processor using the Io board
- [X] Build instruction size and opcode LUT
- [X] Build fetch portion of processor fetch/decode/execute cycle

## To do next

- [ ] Build ALU
- [ ] Fetch from ROM when using bank 7
- [ ] Supply some ROM instructions (figure out how to load 64K ROM using a file reader later)
- [ ] Add some basic instructions to Execute phase to see if processor can do anything useful

## To do later

- [ ] Add serial connectivity to allow more debugging / interaction
- [ ] Complete 6516 processor
- [ ] Add 6516 FPU
- [ ] Create I/O Bus
- [ ] Add I/O Devices
  - [ ] Add Hardware timers (device 0x0)
  - [ ] Add console device (device 0x8) & COM2-4 (device 0x9-0xB)
  - [ ] Add Keyboard I/O
  - [ ] Add controllers (device 0x4)
  - [ ] Add mouse controller (device 0x5)
  - [ ] Add DMA (device 0xD)
  - [ ] Add Debugger (device 0xE)
  - [ ] Add Power device (device 0xF)
- [ ] Create 6448 Video Generator
  - [ ] Add Screen device (device 0x1, 0x2)
  - [ ] Create video output (HDMI? Direct-wired LCD panel?)
- [ ] Create 1125 Sound Generator
  - [ ] Add Audio device (device 0x7)
- [ ] Figure out how to do persistent storage to something like an SD card
