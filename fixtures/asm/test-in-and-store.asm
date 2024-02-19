# test-load-in-and-store
.segment test-in-and-store 0x02000 {
    c := 0xFFFF                        {$14 $00 $FF $FF}
    d := 0xFFFF                        {$16 $00 $FF $FF}
    inc a                              {$C0}
    inc b                              {$C2}
_loop:
    in a, 0x02                         {$30 $00 $02}
    [0x01000] := a                     {$20 $40 $10 $00}
    b := [0x01000]                     {$12 $40 $10 $00}
    loops _loop, C                     {$84 $01 $F2}
    loops _loop, D                     {$86 $01 $EF}
    brk                                {$3F}
}