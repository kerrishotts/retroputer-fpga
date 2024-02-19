# code.regs: A=0xFFFF
# code.flags: Z+ C- N-
.segment code 0x02000 {
    ld a, 0x0000                        {$10 $00 $00 $00}
    ld b, 0xFFFF
_loop:
    inc a
    cmp a, b
    brs nz _loop
    brk                                 {$3F}
}
