# test-load-and-store-dw-2.regs: A=0x2345 B=0x2345
.segment test-load-and-store-dw-2 0x02000 {
    b := 0                              {$12 $00 $00 $00}
    [0x01000] := b                      {$22 $40 $10 $00}
    ld b, 0x1234                        {$12 $00 $12 $34}
    st [0x01002], b                     {$22 $40 $10 $02}
    ld b, 0x2345                        {$12 $00 $23 $45}
    st [0x01234], b                     {$22 $40 $12 $34}
    ld a, <0x01000>                     {$10 $60 $10 $00}
    brk                                 {$3F}
}