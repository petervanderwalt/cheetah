# Sender Developer Guide

**grblHAL** extends the original Grbl v1.1 protocol to support advanced hardware, plugins, and networking. While it remains backward compatible with most legacy senders, fully unlocking its potential requires understanding key differences.

## 1. Connection & Startup

Unlike 8-bit Grbl on Arduino Uno, **grblHAL controllers do NOT always auto-reset** upon serial connection.

### The Problem
- **Native USB / Network:** Hard resetting the MCU (DTR/RTS toggle) often drops the USB/Network link entirely.
- **MPG / Pendant:** A secondary sender (MPG) might be in control at startup.

### Recommended Sequence
1.  **Open Port:** Connect to the serial/network port.
2.  **Wait & Listen (500ms):** Do NOT immediately send `\r\n` or `$`. Listen for incoming data.
    - If you see `|MPG:0`, a pendant is yielding control.
    - If you see `Grbl ... [` (Welcome Message), proceed.
    - If silence/junk, send `0x18` (Ctrl-X / Soft Reset) or `\r\n`.
3.  **Request Extended Info:** Send `$I+` (or `0x87` for full report).
    - Parse the response to detect `[NEWOPT:...]` flags like `ATC`, `ETH`, `SD`, `RT+`.

## 2. Real-Time Status Reports

The status report format is extended. Senders **must** parse these robustly by:
1.  Checking for new fields (e.g., `|Pn:`, `|A:`).
2.  Handling variable field order.
3.  Ignoring unknown fields.

**Example Extended Report:**
``

### New Fields detailed
- **`|Pn:`**: Input pin states. Now supports many more letters:
  - `P` (Probe), `D` (Door), `H` (Hold), `S` (Start), `R` (Reset).
  - `E` (E-Stop), `O` (Probe Disconnected), `M`/`F` (Motor Fault).
  - Limit Switches: `X`, `Y`, `Z`, `A`, `B`, `C`, `U`, `V`, `W`.
- **`|A:`**: Accessory states (`S`=CW, `C`=CCW, `F`=Flood, `M`=Mist, `T`=Tool Change Pending).
- **`|WCS:`**: Reports active coordinate system (e.g., `G54`).
- **`|MPG:`**: `1` = Pendant has control (Sender should verify UI lock). `0` = Pendant released.
- **`|SD:`**: SD Card status (`Mounted`, `PCT`, `Filename`).
- **`|H:,`**: Homing status. `1`=Homed. Mask=Axes homed.
- **`|TLR:`**: Tool Length Reference set.

## 3. Real-Time Commands

Legacy Grbl commands (`?`, `!`, `~`, `0x18`) act as expected. grblHAL adds "Top-Bit-Set" alternates to avoid conflicts with string settings (e.g., WiFi passwords containing `?`).

| Standard | Top-Bit-Set | Description |
| :--- | :--- | :--- |
| **`?`** | **`0x80`** | Status Report Request |
| **`~`** | **`0x81`** | Cycle Start |
| **`!`** | **`0x82`** | Feed Hold |
| **`^x`** | **`0x18`** | Soft Reset |

**New Real-Time Commands:**
- **`0x87`**: **Full Status Report.** Returns all fields (even unchanged ones), useful for initial sync.
- **`0x83`**: **Parser State (`$G`) Report.**
- **`0x89`**: Toggle Single Step.
- **`0x8A`**: Toggle Fan (if plugin installed).
- **`0x8B`**: Toggle MPG Mode.

## 4. Enumerations (No More Hardcoded Lists)

Senders should **dynamically query** the controller for supported capabilities instead of hardcoding lists (which go out of date with plugins).

- **`$EA` (Enumerate Alarms):** Returns `[ALARM:||]`.
- **`$EE` (Enumerate Errors):** Returns `[ERROR:||]`.
- **`$ES` (Enumerate Settings):** Returns full metadata for every configuration option.
  - Format: `[SETTING:||||||...]`
  - Allows building a Settings UI dynamically from the firmware reporting itself.

## 5. Line Termination
grblHAL accepts **`CR`, `LF`, or `CRLF`** as valid line terminators. It treats `\r\n` as a single terminator, unlike legacy Grbl which might double-execute.

## 6. Push Messages

Enable **Push Messages** via `$10` settings to receive automatic updates for:
- **Parser State (`$G`):** Pushed on change.
- **Probe Results:** Pushed on completion.
- **G-code Comments:** `(print, ...)` comments in G-code are pushed as `[MSG:...]`.
