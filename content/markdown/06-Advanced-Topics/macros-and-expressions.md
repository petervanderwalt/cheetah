# Macros, Expressions & Flow Control

grblHAL supports advanced G-code features allowing for **parametric programming**, **conditional logic**, and **math expressions**. This brings capabilities similar to LinuxCNC's O-codes and RS274NGC standards to your microcontroller.

## 1. Expressions & Math

You can use math expressions anywhere a numeric value is expected by enclosing them in `[]`.

### Operators & Precedence
Expressions are evaluated based on standard precedence rules:

| Priority | Operators | Description |
| :--- | :--- | :--- |
| **1 (Highest)** | `**` | Exponentiation (Power) |
| **2** | `*`, `/`, `MOD` | Multiplication, Division, Modulo |
| **3** | `+`, `-` | Addition, Subtraction |
| **4** | `EQ`, `NE`, `GT`, `GE`, `LT`, `LE` | Comparison (Equal, Not Equal, Greater Than, etc.) |
| **5 (Lowest)** | `AND`, `OR`, `XOR` | Bitwise Logic |

**Examples:**
- `[1 + 2 * 3]` evaluates to `7`.
- `[[1 + 2] * 3]` evaluates to `9`.
- `[# GT 100]` returns `1` (true) or `0` (false).

### Functions
| Function | Description | Example |
| :--- | :--- | :--- |
| **`SQRT[n]`** | Square Root | `G1 X[SQRT[100]]` (= X10) |
| **`SIN[n]`, `COS[n]`, `TAN[n]`** | Trigonometry (Degrees) | `G1 Y[SIN[45]*10]` |
| **`ASIN`, `ACOS`, `ATAN`** | Inverse Trig | |
| **`ABS[n]`** | Absolute Value | |
| **`ROUND[n]`, `FIX[n]`, `FUP[n]`** | Rounding functions | `FIX[3.9]` (= 3) |
| **`LN[n]`, `EXP[n]`** | Logarithms | |
| **`PRM[n]`** | Read grblHAL Setting | `# = PRM[110]` |

---

## 2. Parameters (Variables)

Variables in G-code are called **Parameters**. They start with `#`.

### Numbered Parameters
- **`#1 - #30`**: Local subroutine arguments (passed via `G65`).
- **`#31 - #5000`**: Global user variables (non-persistent).
- **`#5000+`**: Read-only system variables.

### Named Parameters
You can create readable variable names. System named parameters are read-only and start with `_`.

**User Variables:**
- **Syntax:** `#`
- **Assignment:** `# = 100.5`
- **Usage:** `G1 X#`

### System Parameters Reference
These are automatically updated by grblHAL.

| Parameter | Description | Equivalent # |
| :--- | :--- | :--- |
| **State & Modes** | | |
| `#` | `1` if Metric (G21), `0` if Imperial | |
| `#` | `1` if Absolute (G90), `0` if Relative | |
| `#` | `1` if Spindle is ON | |
| `#` | `1` if Flood Coolant (M8) ON | |
| `#` | `1` if Tool Offset (G43) Active | |
| `#` | `1` if machine is Homed | |
| `#` | Bitmask of Homed Axes (X=1, Y=2...) | |
| **Tools & Pockets** | | |
| `#` | Current Tool Number (T) | `#5400` |
| `#` | Selected Tool Number (Pre-M6) | |
| `#`| Current Pocket Number | |
| `#`| Selected Pocket Number | |
| `#`| Number of tools in table (0 if disabled) | |
| **Probes** | | |
| `#` | State of Primary Probe Input | |
| `#` | State of Secondary Probe Input | |
| `#`| State of Toolsetter Input | |
| `#` | ID of currently active probe (-1 if none) | |
| **System Info** | | |
| `#` | Free Heap Memory (KBytes) | |
| `#` | Current Subroutine Nesting Level | |
| `#` | Return value from G65/M98 calls | |
| `#`| `1` if last call returned a value | |
| **Coordinates (Current WCS)** | | |
| `#`, `#`, `#` | Current WPos X, Y, Z | `#5420`... |
| `#`, `#`, `#` | Current WPos A, B, C | `#5423`... |
| **Coordinates (Machine)** | | |
| `#`, `#`... | Machine Position (G53) | |
| **Probe Results** | | |
| `#5061` - `#5069` | Probe Contact Position (X, Y, Z...) | |
| `#5070` | Probe Success (`1`=Hit, `0`=Miss) | |
| **Work Offsets** | | |
| `#5221` - `#5229` | G54 Offset Vector | |
| `#5241` - `#5249` | G55 Offset Vector | |

---

## 3. Flow Control (O-Codes)

Logic statements allow your G-code to make decisions. These are essential for **Automatic Tool Changers (ATC)** and complex probing macro scripts.

**Important:** Flow control commands (`if`, `while`, `goto`) are best supported when running **Macro Files** from the SD card. Streaming them line-by-line from a sender can be unreliable depending on the sender's implementation.

### `IF` / `ELSE` / `ENDIF`
Execute code only if a condition is true.

```gcode
o100 if [# EQ 0]
  (print, Error: Please switch to Metric G21)
  M2
o100 else
  (print, Metric mode confirmed)
o100 endif
```

### `WHILE` Loop
Repeat code while a condition is true.

```gcode
# = 0
o101 while [# LT 5]
  G1 X10
  G0 X0
  # = [# + 1]
o101 endwhile
```

### `DO` / `WHILE`
Execute at least once, then check condition.

```gcode
o102 do
  (probe logic...)
o102 while [#5070 EQ 0] (Repeat until probe hits)
```

### `SUB` / `ENDSUB` / `CALL` / `RETURN`
Define reusable subroutines.

**Defining a Sub (e.g., file `probe_z.macro`):**
```gcode
o sub
  G91 G38.2 Z-20 F100
  o103 if [#5070 EQ 0]
     (abort, Probe failed!)
  o103 endif
  G0 Z2
o endsub
```

**Calling a Sub:**
```gcode
O call
```

---

## 4. Automatic Tool Change (ATC) Macros
grblHAL allows remaping the `M6` command to a macro file. This works perfectly for DIY tool changers (Rack/Umbrella) or manual changes with auto-touchoff.

### Enabling M6 Remap
1.  Enable ATC support in `config.h` (or Web Builder).
2.  Set `$341` (Tool Change Mode) to match your logic.
3.  When `M6 T` is issued, grblHAL can call a macro named `tc.macro` (or similar) from the SD card.

### Example `tc.macro` Structure
This macro handles the physical act of changing the tool.

```gcode
o sub
  (Save current state)
  M70

  (Move to Safe Z)
  G53 G0 Z0

  (Check if tool is already loaded)
  o100 if [# EQ #]
    (print, Tool already loaded)
    M72
    M99
  o100 endif

  (Move to Old Tool Slot)
  G53 G0 X# Y#
  (Drop Tool Logic...)
  M64 P1 (Open Drawbar)

  (Move to New Tool Slot)
  G53 G0 X# Y#
  M65 P1 (Close Drawbar)

  (Restore State)
  M72
o endsub
M99
```

**RapidChange ATC / Sienci ATC:**
These systems often use standardized macros (e.g., `M6` calls `P200.macro`) that handle the complex logic of rack management, calibration, and tool offsets.

---

## 5. Advanced G65 Macro Calls

`G65` macro calls allow passing arguments into a subroutine, mapping P/Q/R words to local variables.

**Syntax:** `G65 P [L] A- B- C-...`

| Word | Variable | Word | Variable |
| :--- | :--- | :--- | :--- |
| **A** | #1 | **I** | #4 |
| **B** | #2 | **J** | #5 |
| **C** | #3 | **K** | #6 |
| **D** | #7 | **S** | #19 |
| **E** | #8 | **T** | #20 |
| **F** | #9 | **X/Y/Z** | #24/#25/#26 |

**Inbuilt grblHAL Functions:**
- **`G65 P1 Q`**: Read Setting `` value.
- **`G65 P1 Q S`**: Set Setting `` to `` (Build 20251108+).
- **`G65 P2 Q R`**: Read Tool Offset.
- **`G65 P3 I Q`**: Set Parameter `` to ``.

---

## 6. Modal Macros (G66 / G67)

**Available from Build 20260125.**

Modal macros are called automatically after every motion command.

- **`G66 P [L] `**: Enable modal macro.
- **`G67`**: Cancel modal macro.

**Example:**
```gcode
; Drill a hole pattern
G66 P100 Z-5 R2 (Enable Macro 100, pass arguments)
X10 Y10 (Macro 100 runs here)
X20 Y10 (Macro 100 runs here)
G67 (Cancel)
```
