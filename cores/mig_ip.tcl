open_project {C:/fpga/LEDtoButton/cores/managed_ip_project/managed_ip_project.xpr}
create_ip -name mig_7series -vendor xilinx.com -library ip -module_name mig_7series_0 -dir {C:/fpga/LEDtoButton/cores}
set_property -dict [list CONFIG.XML_INPUT_FILE {../managed_ip_project/mig.prj} CONFIG.RESET_BOARD_INTERFACE {Custom} CONFIG.MIG_DONT_TOUCH_PARAM {Custom} CONFIG.BOARD_MIG_PARAM {Custom}] [get_ips mig_7series_0]
generate_target all [get_files {C:/fpga/LEDtoButton/cores/mig_7series_0/mig_7series_0.xci}]
catch { config_ip_cache -export [get_ips -all mig_7series_0] }
export_ip_user_files -of_objects [get_files {C:/fpga/LEDtoButton/cores/mig_7series_0/mig_7series_0.xci}] -no_script -sync -force -quiet
create_ip_run [get_files -of_objects [get_fileset sources_1] {C:/fpga/LEDtoButton/cores/mig_7series_0/mig_7series_0.xci}]
launch_runs -jobs 16 mig_7series_0_synth_1
wait_on_run mig_7series_0_synth_1
export_simulation -of_objects [get_files {C:/fpga/LEDtoButton/cores/mig_7series_0/mig_7series_0.xci}] -directory {C:/fpga/LEDtoButton/cores/ip_user_files/sim_scripts} -ip_user_files_dir {C:/fpga/LEDtoButton/cores/ip_user_files} -ipstatic_source_dir {C:/fpga/LEDtoButton/cores/ip_user_files/ipstatic} -lib_map_path [list {modelsim=C:/fpga/LEDtoButton/cores/managed_ip_project/managed_ip_project.cache/compile_simlib/modelsim} {questa=C:/fpga/LEDtoButton/cores/managed_ip_project/managed_ip_project.cache/compile_simlib/questa} {ies=C:/fpga/LEDtoButton/cores/managed_ip_project/managed_ip_project.cache/compile_simlib/ies} {xcelium=C:/fpga/LEDtoButton/cores/managed_ip_project/managed_ip_project.cache/compile_simlib/xcelium} {vcs=C:/fpga/LEDtoButton/cores/managed_ip_project/managed_ip_project.cache/compile_simlib/vcs} {riviera=C:/fpga/LEDtoButton/cores/managed_ip_project/managed_ip_project.cache/compile_simlib/riviera}] -use_ip_compiled_libs -force -quiet
