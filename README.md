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
- [X] Fetch from ROM when using bank 7
- [X] Add some basic instructions to Execute phase to see if processor can do anything useful
- [X] Build simple ALU (no multiply/divide/mopulo)
- [X] Supply some ROM instructions (figure out how to load 64K ROM using a file reader later)
- [X] Add serial connectivity to allow more debugging / interaction
- [X] Create I/O Bus
- [X] Add I/O Devices
  - [X] Add Hardware timers (device 0x0)
- [X] Memory can be written from serial register interface; allows us to bypass ROM (w/ DIP switch) to avoid re-building design to test out the CPU.
- [X] Memory arbitration! We've got a logic tied up in the top level that doesn't actually work well anyway (CPU will crash if serial reg is reading memory). Need to fix this as we'll need memory arbitration to support video generation in the future.
- [X] Bus design is... not great; improve by having devices listen for their number to be called so that they don't have to be internal to the bus logic
  - [X] In doing this, it seems like devices are asserting their data all the time, even when we should only be asserting when our device is asserted. UPDATE: no -- we should have indicated 0 states for all bytes (since we OR at the end).
- [X] Serial/Io Board compete for memory and I/O -- this causes the CPU to crash. Need to Implement better arbitration (we'll need it anyway later) -- FIXED! (we still have bus artibration problems, but CPU no longer crashes)

## To do next

- [ ] Build IO bus arbitration so that Serial, Io shield, CPU and other devices can interact w/ the bus w/o causing corruption
- [ ] Update monitor to upload a .bin file into memory at a given location (instead of manually typing it in!)
- [ ] Update monitor to dump memory contents
- [ ] Add console input & output now that we have the console on device 8; this means figuring out panes so that we can switch between the console, memory, I/O, and CPU registers.
- [ ] Figure out better ways to poll the device and display memory, I/O, and CPU info at the same time. Maybe a little state machine that cycles between these on a recurring timer?
- [ ] Build out ld, st instructions so we can start working w/ memory
- [ ] Build Complete ALU with multiply, divide, and modulo. This is going to need a clocked design (impacts CPU implementation)
- [ ] Improve hardware timers:
  - [ ] Time keeping sucks; it will quickly get out of sync w/ a real clock
  - [ ] I _think_ it's possible to read very wrong times; may need to hold the rtc results until the hours byte has been read so that there's no chance of reading the wrong time


## To do later

- [ ] Test benches. We're flying by the seat of our pants atm.
- [ ] Connect w/ a real RTC module, like https://www.sparkfun.com/products/16281
- [ ] Complete 6516 processor
- [ ] Add 6516 FPU
- [ ] Add I/O Devices
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
