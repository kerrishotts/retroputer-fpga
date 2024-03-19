module system_rom (
    input clk,              // clock
    input write_en,         // write enable (use 0 to treat like ROM)
    input [15:0] addr,      // address
    output reg [7:0] data   // data out
  );
  
  (* ram_style = "block" *) reg [7:0] mem [65535:0];
  
  reg [7:0] p1;
  
  initial begin
    $readmemh("../../../../../../../asm/roms/kernel.mem", mem);
  end
  
  /* Sequential Logic */
  always @(posedge clk) begin
    if (write_en)
      mem[addr] <= data;
  end

    always @(posedge clk) begin
    p1 <= mem[addr];
    data <= p1;
  end
  
endmodule
