# Complete Plugins Reference"

This guide lists plugin-specific **M-codes**, **G-codes**, and **$-settings** provided by grblHAL’s plugin ecosystem.  
Each section includes the original repository URL for reference.  

---

## Plugin: Plasma / Torch Height Control (THC)
Github Repository: https://github.com/grblHAL/Plugin_plasma

#### $-Settings

| Setting | Description | Example |
|---------|-------------|---------|
| `$350` | Mode of operation | `1` → uses external arc voltage input |
| `$351` | Arc OK pin | `2` → input pin number |
| `$352` | Arc Voltage pin | `3` → input pin number |
| `$353` | Up/Down pin | `4` → output pin number |
| `$354` | Voltage scale | `1.0` → scaling factor |
| `$355` | Voltage threshold | `0.5` → threshold value |
| `$356` | Velocity Anti-Dive threshold (%) | `20` |

#### M-Codes

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M62` | `M62 P[port]` | Disable THC, synchronized with motion |
| `M63` | `M63 P[port]` | Enable THC, synchronized with motion |
| `M64` | `M64 P[port]` | Disable THC, immediate |
| `M65` | `M65 P[port]` | Enable THC, immediate |
| `M67` | `M67 E[port] Q[percent]` | Immediate velocity reduction |
| `M68` | `M68 E[port] Q[percent]` | Velocity reduction synchronized |

#### Example
```gcode
; Plasma THC example
$350=2          ; THC mode: arc ok + up/down
$356=20         ; VAD threshold 20%
$361=1.5        ; Voltage scaling factor
$682=80         ; Z feed factor

M190 P3         ; Select material #3
M63 P0          ; Enable THC synced
G1 X100 Y0 F2000
G1 X100 Y100 F2000
M67 E0 Q50      ; Immediate feed reduction to 50%
M64 P0          ; Disable THC after cut
```

---

## Plugin: Fan Control (`Plugin_fans`)
Github Repository: https://github.com/grblHAL/Plugin_fans

#### M-Codes

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M106` | `M106 P[fan] S[speed]` | Turn fan ON, set PWM speed (0–255) |
| `M107` | `M107 P[fan]` | Turn fan OFF |

#### $-Settings

| $-Setting | Description |
|-----------|-------------|
| `$386-$389` | Map aux port → fan 0..3 |
| `$480` | Auto-off delay (minutes) |
| `$483` | Bitmask: link fans to spindle enable |

#### Example
```gcode
; Turn on fan 0 at PWM 200
M106 P0 S200

; Turn off fan 0
M107 P0
```

---

## Plugin: RGB LED Strip (`M150`) - `Plugins_misc`
Github Repository: https://github.com/grblHAL/Plugins_misc

| Command | Syntax | Description |
|---------|--------|-------------|
| `M150` | `M150 [R[intensity]] [U[intensity]] [B[intensity]] [S[strip]]` | Set LED color/brightness for a strip |

#### Example
```gcode
; Set strip 1 to bright red
M150 R255 U0 B0 S1

; Set strip 1 to purple
M150 R128 B128 S1

; Turn LEDs off
M150 R0 U0 B0 S1
```

---

## Plugin: Feed Override (`M220`) - `Plugins_misc`
Github Repository: https://github.com/grblHAL/Plugins_misc

| Command | Syntax | Description |
|---------|--------|-------------|
| `M220` | `M220 [B] [R] [S[percent]]` | Feed override: B=backup, R=restore, S=set % |

#### Example
```gcode
; Set feed override to 80%
M220 S80

; Restore previous backup and set to 50%
M220 RS50
```

---

## Plugin: Servo Control (`M280`) - `Plugins_misc`
Github Repository: https://github.com/grblHAL/Plugins_misc

| Command | Syntax | Description |
|---------|--------|-------------|
| `M280` | `M280 P[servo] S[position]` | Control analog/PWM servo: P=index, S=angle 0–180° |

#### Example
```gcode
; Move servo 0 to 90 degrees
M280 P0 S90

; Query servo 1 current position
M280 P1
```

---

## Plugin: OpenPNP (`Plugin_OpenPNP`)
Github Repository: https://github.com/grblHAL/Plugin_OpenPNP

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M42` | `M42 P[ioport] S[0|1]` | Set digital output |
| `M114` | `M114` | Report current position |
| `M115` | `M115` | Report firmware info |
| `M204` | `M204 P[axes] S[accel]` | Set axis acceleration |
| `M205` | `M205 [axes]` | Set jerk |
| `M400` | `M400` | Wait for motion buffer empty |

#### Example
```gcode
; Turn on digital output 2
M42 P2 S1

; Set acceleration for X/Y
M204 PXY S500
```

---

## Plugin: SD-Card / File System (`Plugin_SD_card`)
Github Repository: https://github.com/grblHAL/Plugin_SD_card

| Command | Syntax | Description |
|---------|--------|-------------|
| **`$F`** | `$F` | List CNC-compatible files (`.nc`, `.gcode`, etc.) in the current working directory. |
| **`$F+`** | `$F+` | List all files in the current working directory regardless of extension. |
| **`$F=[file]`** | `$F=[file]` | Run G-code file. |
| **`$CWD=[path]`** | `$CWD=[path]` | Change Directory. Usage: `$CWD=/` (root), `$CWD=..` (up), `$CWD=subdir` (down). If called without arguments, it reports the current path. |
| **`$PWD`** | `$PWD` | Print Working Directory. Reports the current working directory in the format `[CWD:/path/to/dir]`. |
| **`$FM`** | `$FM` | Mount SD card. |
| **`$FU`** | `$FU` | Unmount SD card. |
| **`$FD=[file]`** | `$FD=[file]` | Delete file. |

#### Example
```gcode
; Mount SD card
$FM

; List files
$F+

; Run a file
$F=myprogram.ngc

; Change directory
$CWD=subdir

; Print working directory
$PWD
```

---

### Storage Systems in grblHAL
grblHAL utilizes a **Virtual File System (VFS)** layer for unified storage access across multiple platforms.

- **SD Card (FatFs):** High-capacity storage for G-code files, typically formatted as **FAT32**. Mounted at `/`.
- **Internal Storage (LittleFS):** Fail-safe internal storage for macros and tool tables. Supported on **ESP32**, **Teensy 4.1**, **RP2040**, **MSP432**, and others. Often mounted at `/flash`, `/littlefs`, or as the root (`/`) if no SD card is present.

**Navigation:** grblHAL tracks a **Current Working Directory (CWD)**. Use `$CWD=foldername` to enter subfolders and `$CWD=..` to go back up. You can verify your location with `$PWD`.

---

## Plugin: Motor / Trinamic (`Plugins_motor`)
Github Repository: https://github.com/grblHAL/Plugins_motor

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M122` | `M122 [axes]` | Driver report/debug |
| `M569` | `M569 [axis] S[0|1]` | Set driver mode: StealthChop / SpreadCycle |
| `M906` | `M906 [axes] S[current]` | Set RMS current |
| `M911` | `M911` | Report prewarn flags |
| `M912` | `M912` | Clear prewarn flags |
| `M913` | `M913 [axes]` | Hybrid threshold |
| `M914` | `M914 [axes]` | Homing sensitivity |

#### Example
```gcode
; Check driver status on X/Y
M122 XY

; Set StealthChop mode for X axis
M569 X S1

; Set RMS current for all axes
M906 X100 Y100 Z100
```

---

## Plugin: Spindle (`Plugins_spindle`)
Github Repository: https://github.com/grblHAL/Plugins_spindle

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M3` | `M3 S[rpm]` | Spindle on clockwise |
| `M4` | `M4 S[rpm]` | Spindle on counterclockwise |
| `M5` | `M5` | Spindle off |
| `M104` | `M104 P[n]` | Select spindle |
| `M51` | `M51 [options]` | Enable spindle features |

#### Example
```gcode
; Turn on spindle clockwise at 1200 RPM
M3 S1200

; Select spindle 1
M104 P1

; Turn off spindle
M5
```

---

## Plugin: Laser (`Plugins_laser`)
Github Repository: https://github.com/grblHAL/Plugins_laser

| Command | Syntax | Description |
|---------|--------|-------------|
| `M3/M4` | `M3/M4 S[power]` | Laser on with PWM power |
| `M5` | `M5` | Laser off |

#### Example
```gcode
; Laser on at 50% power
M3 S128

; Laser off
M5
```

---

## Plugin: Encoder (`Plugin_encoder`)
Github Repository: https://github.com/grblHAL/Plugin_encoder

| $-Setting | Description |
|-----------|-------------|
| `$701-$704` | Encoder pins and scaling per axis |

#### Example
```gcode
; Read spindle encoder position
M114
```

---

## Plugin: EEPROM (`Plugin_EEPROM`)
Github Repository: https://github.com/grblHAL/Plugin_EEPROM

| Feature | Description |
|---------|-------------|
| Storage | Extended EEPROM for custom variables |

#### Example
```gcode
; Read/write custom EEPROM values (plugin-specific)
; Example depends on machine configuration
```

---

## Plugin: WebUI (`Plugin_WebUI`)
Github Repository: https://github.com/grblHAL/Plugin_WebUI

| Feature | Description |
|---------|-------------|
| HTTP / WebSocket API | Exposes existing M/G-codes via web interface |

#### Example
```gcode
; No new M-codes; use M3/M4/M5 via WebUI API
```

---

## Plugin: Sienci ATCi (Automatic Tool Changer Interface)
Github Repository: https://github.com/Sienci-Labs/grblhal-atci-plugin

This plugin provides advanced safety, state management, and sensor integration for the **[Sienci Automatic Tool Changer (ATC)](https://sienci.com/product/automatic_tool_changer/)**.

#### $-Settings

| Setting | Description | Format |
|---------|-------------|---------|
| `$683` | **ATCi Configuration** | Bitmask: Enable(1), Monitor Rack Sensor(2), Monitor TC Macro(4) |
| `$684` | **Keepout X Min** | Minimum X coordinate of the safe zone (mm) |
| `$685` | **Keepout Y Min** | Minimum Y coordinate of the safe zone (mm) |
| `$686` | **Keepout X Max** | Maximum X coordinate of the safe zone (mm) |
| `$687` | **Keepout Y Max** | Maximum Y coordinate of the safe zone (mm) |

#### M-Codes

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M960` | `M960 P[0|1]` | Runtime toggle of Keepout enforcement. `P1`=Enable, `P0`=Disable. |

#### Real-time Report
Appends `|ATCI:[flags]` to the status string.
*   **E**: Enforcement Enabled
*   **Z**: Machine is Inside Zone
*   **R/M/T/S**: Source of state (Rack, M-code, Tool Macro, Startup)
*   **I**: Rack Installed
*   **B**: Drawbar Open
*   **L**: Tool Loaded
*   **P**: Low Air Pressure

#### Example
```gcode
; Configure Keepout Zone
$684=10.0   ; X Min
$686=50.0   ; X Max
$685=10.0   ; Y Min
$687=50.0   ; Y Max
$683=7      ; Enable plugin (1) + Monitor Rack (2) + Monitor Macro (4)

; Manually disable keepout to jog inside for maintenance
M960 P0
```

---

## Plugin: Embroidery (`Plugin_embroidery`)
Github Repository: https://github.com/grblHAL/Plugin_embroidery

Stream embroidery files (.dst, .pes) directly from SD card. This experimental plugin bypasses G-code translation for precise stitch timing.

#### Commands

| Command | Syntax | Description |
|---------|--------|-------------|
| `$F`: Set Pin LOW.
    - `0xC5 `: Set Pin HIGH.
    - `PinID`: `0x80 | PinIndex`.
- **Ack/Nak:** `0xB2` (Ack), `0xB3` (Nak).

---

## Plugin: ESP-AT (`Plugins_misc`)
Github Repository: https://github.com/grblHAL/Plugins_misc

Enables WiFi connectivity using an ESP8266/ESP32 running AT-command firmware connected to a UART.

#### Features
- Telnet access to the grblHAL console.
- WebUI support (limited).

---

## Plugin: Toolsetter / Secondary Probe (`Plugins_misc`)
Github Repository: https://github.com/grblHAL/Plugins_misc

Adds support for a dedicated toolsetter input and a secondary probe input, allowing for advanced probing scenarios.

#### $-Settings

| Setting | Description |
|---------|-------------|
| `$678` | **Toolsetter Input:** Auxiliary input pin number. |
| `$679` | **Secondary Probe Input:** Auxiliary input pin number. |

#### Commands

| Command | Syntax | Description |
|---------|--------|-------------|
| `G65` | `G65 P5 Q[n]` | Select probe input: `Q0`=Standard, `Q1`=Toolsetter, `Q2`=Secondary. |

#### Example
```gcode
; Configure toolsetter input on Aux 2
$678=2

; Select toolsetter to probe tool length
G65 P5 Q1
G38.2 Z-50 F100

; Return to standard probe
G65 P5 Q0
```

---

## Template Plugins
These plugins are available as templates in the **[grblHAL Web Builder](http://svn.io-engineering.com:8080/)** under `3rd party plugins`. They are designed to be starting points for custom functionality but often provide useful features out-of-the-box.
Github Repository: https://github.com/grblHAL/Templates

### FluidNC WebUI Support (`FluidNC_ESP3D_cmd`)
Adds support for extended commands required by the FluidNC WebUI (ESP3D v2 protocol).
*   **Repo:** `my_plugin/FluidNC_ESP3D_cmd`
*   **Function:** Enables `[ESP:...]` command handling, allowing the FluidNC generic WebUI to function with grblHAL.

### MCU Load Estimator (`MCU_load`)
Adds a `MCU:` field to the real-time status report, showing the number of idle loop iterations per 10ms.
*   **Repo:** `my_plugin/MCU_load`
*   **Report:** `|MCU:20000|` (Higher is better, meaning less load. ,,,...`
*   **Example:**
    *   `$MODBUSCMD=1,6,0x0201,1000` (Write 1000 to reg 0x201 on device 1).
    *   `$MODBUSCMD=1,4,0,2` (Read 2 registers starting at 0 from device 1).

### Motor Power Monitor (`Motor_power_monitor`)
Monitors a digital input for high-voltage power loss (common on Trinamic setups).
*   **Repo:** `my_plugin/Motor_power_monitor`
*   **Setting:** `$450` (Input pin number).
*   **Behavior:**
    *   Triggers **Alarm 17** associated with Motor Fault on power loss.
    *   Automatically runs `M122I` (Re-init drivers) when power is restored and alarm is cleared.

### Pause on SD File Run (`Pause_on_SD_file_run`)
Automatically triggers a Feed Hold when an SD card file starts execution.
*   **Repo:** `my_plugin/Pause_on_SD_file_run`
*   **Usage:** Useful for verifying machine state or changing tools before a job automatically begins. Requires user `Cycle Start` to proceed.

### Realtime Report Aux State (`Realtime_report_aux_out_state`)
Adds the state of auxiliary output pins to the status report.
*   **Repo:** `my_plugin/Realtime_report_aux_out_state`
*   **Report:** `|AUX:0010|` (Bitmask of output states). Only reports ports available via M62-M65.

### Realtime Report Timestamp (`Realtime_report_timestamp`)
Adds the system uptime to the status report.
*   **Repo:** `my_plugin/Realtime_report_timestamp`
*   **Report:** `|TS:123456|` (Milliseconds since boot).

### Solenoid Spindle (`Solenoid_spindle`)
Optimizes PWM output for driving solenoids (Kick-and-Hold strategy).
*   **Repo:** `my_plugin/Solenoid_spindle`
*   **Behavior:**
    *   **Kick:** 100% duty cycle for 50ms to energize the solenoid.
    *   **Hold:** Drop to 25% duty cycle to maintain position without overheating.

### Stepper Enable Control (`Stepper_enable_control`)
Adds Marlin-style G-codes for individual stepper control.
*   **Repo:** `my_plugin/Stepper_enable_control`
*   **Commands:**
    *   `M17 [X] [Y] ...` - Enable specified steppers (or all if none specified).
    *   `M18 [X] [Y] ... [S]` - Disable steppers immediately or after `S` seconds.
    *   `M84` - Alias for M18.

### HPGL Plotter (`hpgl`)
Adds an HPGL interpreter mode, allowing the CNC to act as a native pen plotter.
*   **Repo:** `my_plugin/hpgl`
*   **Command:** `$HPGL` (Enter HPGL mode).
*   **Exit:** `CTRL+X` (Return to G-code mode).
*   **Note:** Originally based on Motöri.
