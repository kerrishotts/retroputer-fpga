##################################################################################################
## 
##  Xilinx, Inc. 2010            www.xilinx.com 
##  Sat Jan 20 17:14:35 2024

##  Generated by MIG Version 4.2
##  
##################################################################################################
##  File name :       example_top.xdc
##  Details :     Constraints file
##                    FPGA Family:       ARTIX7
##                    FPGA Part:         XC7A35T-FTG256
##                    Speedgrade:        -1
##                    Design Entry:      VERILOG
##                    Frequency:         324.99000000000001 MHz
##                    Time Period:       3077 ps
##################################################################################################

##################################################################################################
## Controller 0
## Memory Device: DDR3_SDRAM->Components->AS4C128M16DLB-12BCN
## Data Width: 16
## Time Period: 3077
## Data Mask: 1
##################################################################################################
############## NET - IOSTANDARD ##################



set_property INTERNAL_VREF  0.675 [get_iobanks 15]