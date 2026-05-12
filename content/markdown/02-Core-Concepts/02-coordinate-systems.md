# Coordinate Systems

Understanding coordinate systems is **fundamental** to CNC operation. Coordinate systems define how the machine interprets positions and movements. grblHAL supports multiple coordinate systems that work together to provide flexibility, accuracy, and ease of use.

This guide will explain the different coordinate systems, how they relate to each other, and how to use them effectively.

---

## The Big Picture: Two Main Coordinate Systems

CNC machines use two primary coordinate systems that work together:

1. **Machine Coordinate System (MCS)** - The machine's fixed, absolute reference
2. **Work Coordinate System (WCS)** - Your workpiece's movable reference

Think of it this way:
- **Machine coordinates** = Where the machine thinks it is in its physical space
- **Work coordinates** = Where the tool is relative to your workpiece

---

## Machine Coordinate System (MCS)

The **Machine Coordinate System** is the machine's absolute, fixed reference frame. It never changes.

### Key Characteristics

- **Origin (Machine Zero):** Established by the homing cycle (`$H`)
- **Fixed:** Does not change unless you re-home the machine
- **Absolute:** Always represents the machine's physical position
- **Accessed with `G53`:** Bypasses all work offsets

### Machine Zero Location

Machine zero is typically located at one of the machine's physical limits:
- **X/Y:** Usually at the **back-right** corner. This means the working area is typically in negative coordinates. (Exceptions exist for machines configured with `HOMING_FORCE_SET_ORIGIN`, where zero depends on switch locations).
- **Z:** Usually at the top (maximum Z height).

**Example:**
```
After homing, machine position might be:
MPos: 0.000, 0.000, 0.000
```

### When to Use Machine Coordinates

Use `G53` (machine coordinate system) when you need to move to a **fixed physical location** on the machine:

- **Tool changes** - Move to a fixed tool change position
- **Parking** - Move to a safe parking location
- **Probing** - Move to a fixed probe location
- **Safety** - Retract to a known safe height

**Example:**
```gcode
G53 G0 Z0        ; Rapid to machine Z-zero (top)
G53 G0 X0 Y0     ; Rapid to machine X/Y zero
```

> 🔥 **Danger**
> **Only use `G53` after homing!** Machine coordinates are meaningless if the machine hasn't been homed. Using `G53` without homing can cause crashes.

---

## Work Coordinate Systems (WCS)

The **Work Coordinate System** is a user-defined coordinate system that represents your workpiece's position and orientation. This is where you do all your actual machining.

### Why Work Coordinates Matter

Imagine you're machining a part. Your CAM software generates G-code assuming the part's origin is at a specific location (e.g., the front-left corner). But when you clamp the part on your machine table, it could be anywhere!

**Work offsets** solve this problem by telling the machine: *"The part's origin is at this location relative to machine zero."*

### Available Work Coordinate Systems

grblHAL supports **multiple work coordinate systems**, allowing you to have several parts or setups loaded simultaneously:

| G-Code | Work Offset | Common Use |
|--------|-------------|------------|
| **`G54`** | Work Offset 1 | Primary/default workpiece |
| **`G55`** | Work Offset 2 | Second workpiece or setup |
| **`G56`** | Work Offset 3 | Third workpiece |
| **`G57`** | Work Offset 4 | Fourth workpiece |
| **`G58`** | Work Offset 5 | Fifth workpiece |
| **`G59`** | Work Offset 6 | Sixth workpiece |
| **`G59.1`** | Work Offset 7 | Extended offset 1 |
| **`G59.2`** | Work Offset 8 | Extended offset 2 |
| **`G59.3`** | Work Offset 9 | Extended offset 3 |

> ℹ️ **Info**
> `G54` is the **default** work coordinate system. When you power on grblHAL, G54 is automatically active.

> ⚠️ **Warning**
> **G59.3 (Work Offset 9)** has a special role in grblHAL's **Tool Change** logic.
> - If **Tool Change Mode** (`$341`) is set to **2** or **3**, grblHAL uses `G59.3` as the dedicated location for tool probing/touch-off.
> - In these modes, do not use `G59.3` for regular workpieces, or your setup will be overwritten during tool changes.

---

## How Work Offsets Work

A work offset is simply a **translation** (shift) applied to all programmed coordinates.

### The Math

```
Machine Position = Work Position + Work Offset
```

**Example:**
- Work Offset (G54): X=100, Y=50, Z=10
- Programmed Position: X=20, Y=30, Z=-5
- **Actual Machine Position:** X=120, Y=80, Z=5

When you command `G0 X20 Y30`, the machine actually moves to machine coordinates X=120, Y=80.

---

## Setting Work Offsets

There are several ways to set work offsets in grblHAL:

### Method 1: Using `G10 L20` (Recommended)

The `G10 L20` command sets the work offset so that the **current machine position** becomes the specified work coordinate.

**Syntax:**
```gcode
G10 L20 P X Y Z
```

**Parameters:**
- `P` = Offset number (1=G54, 2=G55, 3=G56, etc.)
- `X`, `Y`, `Z` = The work coordinates you want at the current position

**Example:**
```gcode
; Move to the front-left corner of your workpiece
G0 X100 Y50 Z10  ; (in machine coordinates)

; Set this position as X0 Y0 Z0 in G54
G10 L20 P1 X0 Y0 Z0

; Now the current position is work coordinate 0,0,0
```

### Method 2: Using `G10 L2` (Absolute Offset)

The `G10 L2` command sets the work offset to an **absolute value** in machine coordinates.

**Syntax:**
```gcode
G10 L2 P X Y Z
```

**Example:**
```gcode
; Set G54 origin to machine position X=100, Y=50, Z=10
G10 L2 P1 X100 Y50 Z10
```

### Method 3: Manual Entry (Sender-Specific)

Most G-code senders have a "Set Work Zero" or "Zero XYZ" button that:
1. Reads the current machine position
2. Sets the active work offset so that position = 0,0,0

**Typical workflow:**
1. Jog to your workpiece origin (e.g., front-left corner, top surface)
2. Click "Zero X", "Zero Y", "Zero Z" (or "Zero All")
3. The sender sends `G10 L20 P1 X0 Y0 Z0` for you

---

## Viewing Work Offsets

To see all current work offset values, send:

```
$#
```

**Example output:**
```
[G54:100.000,50.000,10.000]
[G55:200.000,50.000,10.000]
[G56:300.000,50.000,10.000]
[G57:0.000,0.000,0.000]
[G58:0.000,0.000,0.000]
[G59:0.000,0.000,0.000]
[G28:0.000,0.000,0.000]
[G30:0.000,0.000,0.000]
[G92:0.000,0.000,0.000]
[TLO:0.000]
[PRB:0.000,0.000,0.000:0]
```

This shows:
- G54 origin is at machine position X=100, Y=50, Z=10
- G55 origin is at machine position X=200, Y=50, Z=10
- G56 origin is at machine position X=300, Y=50, Z=10
- G57-G59 are not set (0,0,0)

---

## Practical Example: Multiple Parts

Let's say you're machining 3 identical parts on your table:

### Setup

1. **Home the machine:** `$H`
2. **Clamp three parts** at different locations on the table
3. **Set work offsets** for each part:

```gcode
; Part 1 (G54)
G0 X100 Y50 Z10      ; Jog to Part 1 origin
G10 L20 P1 X0 Y0 Z0  ; Set G54

; Part 2 (G55)
G0 X250 Y50 Z10      ; Jog to Part 2 origin
G10 L20 P2 X0 Y0 Z0  ; Set G55

; Part 3 (G56)
G0 X400 Y50 Z10      ; Jog to Part 3 origin
G10 L20 P3 X0 Y0 Z0  ; Set G56
```

### Running the Job

```gcode
; Machine Part 1
G54              ; Select Part 1 coordinate system
M98 P100         ; Call machining program (P100.macro)

; Machine Part 2
G55              ; Select Part 2 coordinate system
M98 P100         ; Call same program, different location

; Machine Part 3
G56              ; Select Part 3 coordinate system
M98 P100         ; Call same program again

M30              ; End program
```

The **same G-code program** runs three times, but at three different physical locations thanks to work offsets!

---

## G92: Temporary Coordinate Offset

`G92` is a **temporary, volatile** coordinate offset that's applied **on top of** the active work coordinate system (G54-G59).

### How G92 Works

```
Final Position = Work Position + Work Offset (G54) + G92 Offset
```

### When to Use G92

- **Rotary axis zeroing** - Reset A/B/C axis to 0° at current position
- **Legacy G-code** - Some old CAM posts use G92
- **Quick adjustments** - Temporary shift without changing work offset

> ⚠️ **Warning**
> `G92` is **easy to forget** and can cause crashes. Modern practice favors using dedicated work coordinate systems (G54-G59) instead of G92.

### G92 Commands

| Command | Action |
|---------|--------|
| `G92 X0 Y0 Z0` | Set current position as 0,0,0 (temporary) |
| `G92.1` | Cancel G92 offset |
| `G92.2` | Suspend G92 offset |
| `G92.3` | Restore suspended G92 offset |

**Example:**
```gcode
G54              ; Using G54 work offset
G0 X10 Y10       ; Move to X=10, Y=10 in G54
G92 X0 Y0        ; Call this position 0,0 (G92 offset applied)
G0 X5 Y5         ; Move to X=5, Y=5 (relative to G92)
G92.1            ; Cancel G92, back to normal G54
```

---

## Position Display: WPos vs MPos

When you query position with `?`, you'll see two types of coordinates:

```

```

- **`WPos`** (Work Position): Position in the active work coordinate system
- **`MPos`** (Machine Position): Absolute machine position

**Relationship:**
```
MPos = WPos + Active Work Offset
```

In this example:
- Work position: X=10, Y=20, Z=5
- Machine position: X=110, Y=70, Z=15
- Therefore, work offset (G54) is: X=100, Y=50, Z=10

---

## Best Practices

### 1. **Always Use Work Coordinates for Machining**

**Bad:**
```gcode
G53 G0 X150 Y200  ; Using machine coordinates for cutting
```

**Good:**
```gcode
G54               ; Select work coordinate system
G0 X50 Y100       ; Use work coordinates
```

### 2. **Set Work Zero at a Consistent Location**

Choose a repeatable reference point on your workpiece:
- **Front-left corner, top surface** (most common)
- **Center of part, top surface**
- **Center of a hole or feature**

### 3. **Document Your Setup**

Keep notes on:
- Which work offset (G54-G59) is used for which part/setup
- Where the work zero is located on the part
- Any special considerations (rotated parts, fixtures, etc.)

### 4. **Use G53 for Safety Moves**

Always use `G53` for moves to fixed machine locations:

```gcode
G53 G0 Z0        ; Retract to machine top (safe)
T2 M6            ; Tool change
G53 G0 X0 Y0     ; Move to tool change position
```

### 5. **Verify Offsets Before Machining**

After setting work offsets:
1. Jog to work zero: `G0 X0 Y0 Z0`
2. Verify the tool is at the expected location
3. Test with air cuts before actual machining

### 6. **Avoid G92 Unless Necessary**

Use G54-G59 work offsets instead of G92 for better clarity and safety.

---

## Common Coordinate System Mistakes

### Mistake 1: Using G53 Without Homing

```gcode
; Machine not homed!
G53 G0 Z0  ; CRASH! Machine doesn't know where Z0 is
```

**Fix:** Always home first: `$H`

### Mistake 2: Forgetting Active Work Offset

```gcode
G55              ; Switch to G55
; ... do some work ...
; Forget that G55 is still active
G0 X0 Y0         ; Oops! Moving to G55 zero, not G54 zero
```

**Fix:** Explicitly set work offset at start of program:
```gcode
G54              ; Always specify which offset to use
G0 X0 Y0
```

### Mistake 3: Setting Work Zero While in G91 (Incremental Mode)

```gcode
G91              ; Incremental mode
G10 L20 P1 X0    ; This won't work as expected!
```

**Fix:** Always use `G90` (absolute mode) when setting work offsets:
```gcode
G90              ; Absolute mode
G10 L20 P1 X0 Y0 Z0
```

---

## Quick Reference Commands

| Command | Description |
|---------|-------------|
| `G54` - `G59` | Select work coordinate system 1-6 |
| `G59.1` - `G59.3` | Select work coordinate system 7-9 |
| `G53` | Use machine coordinate system (one-shot) |
| `G10 L20 P X- Y- Z-` | Set work offset (current position method) |
| `G10 L2 P X- Y- Z-` | Set work offset (absolute method) |
| `$#` | View all coordinate offsets |
| `G92 X- Y- Z-` | Set temporary offset |
| `G92.1` | Cancel G92 offset |

---

## Coordinate System Hierarchy

Understanding the order of coordinate transformations:

```
1. Machine Coordinates (MCS)
   ↓
2. + Work Offset (G54-G59)
   ↓
3. + G92 Temporary Offset
   ↓
4. + Tool Length Offset (G43)
   ↓
5. = Final Tool Position
```

**Example:**
- Machine position: X=100
- G54 offset: X=50
- G92 offset: X=10
- Tool length offset: Z=25
- **Final position:** X=160, Z=25

---

## Next Steps

Now that you understand coordinate systems:

1. **Practice setting work offsets** - Set up a simple part and practice zeroing
2. **Learn about tool offsets** - See [Automatic Tool Changer](../05-Guides/automatic-tool-changer.md)
3. **Explore probing** - Automate work offset setup with [Probing](../05-Guides/probing.md)
4. **Study G-code** - See [Complete G-code Reference](../04-Reference/complete-g-m-code-reference.md)

---

> 💡 **Tip**
> Many CNC operators create a "setup sheet" template that documents:
> - Part name and revision
> - Work offset used (G54, G55, etc.)
> - Work zero location on the part
> - Tool list with lengths
> - Material and stock size
> This makes setups repeatable and reduces errors!
> **[Download our Printable CNC Setup Sheet](pathname:///files/cnc-setup-sheet.html)** (Open link, then standardized Print to PDF)

