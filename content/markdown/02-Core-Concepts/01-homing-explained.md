# Homing Explained

**Homing** is one of the most important concepts in CNC operation. It's the process by which your machine establishes a known, repeatable reference point - essentially teaching the machine where it is in physical space. Without homing, your CNC controller has no idea where the axes are positioned, making accurate machining impossible.

## Why Homing Matters

When you power on a CNC machine, the controller has **no inherent knowledge** of where the axes are located. The stepper or servo motors could be at any position. Homing solves this by:

1. **Establishing a Fixed Reference Point** - Creates a known "machine zero" (0,0,0) position
2. **Enabling Soft Limits** - Allows the controller to enforce software boundaries and prevent crashes
3. **Ensuring Repeatability** - Allows the machine to return to the exact same position every time
4. **Accurate Toolpath Execution** - Ensures G-code programs run at the correct location
5. **Reducing Setup Time** - Eliminates manual positioning and reduces human error

> 🔥 **Danger**
> **Always home your machine after powering on** before running any jobs. Running without homing can result in crashes, broken tools, and damaged workpieces.

---

## How Homing Works

The homing process relies on **limit switches** (also called homing switches) installed at specific positions on each axis. Here's the step-by-step sequence:

### The Homing Sequence

1. **Initiation**
   - You send the `$H` command (or press the "Home" button in your sender)
   - grblHAL begins the homing cycle

2. **Z-Axis Moves First** (Safety)
   - The Z-axis moves **upward** first to avoid colliding with the workpiece or fixtures
   - This is a critical safety feature

3. **Rapid Seek Phase**
   - Each axis moves toward its homing switch at a relatively fast speed (seek rate)
   - When the switch is triggered, the axis stops immediately

4. **Pull-Off Phase**
   - The axis backs away from the switch by a small distance (pull-off distance)
   - This ensures the switch is no longer triggered

5. **Slow Approach Phase**
   - The axis slowly approaches the switch again at a much slower speed (feed rate)
   - When the switch triggers this time, the controller records this as the **precise** homing position
   - This two-pass approach ensures high accuracy and repeatability

6. **Set Machine Zero**
   - The controller sets this position as machine coordinates (0,0,0) or a configured offset
   - The machine is now "homed" and knows its position

7. **Repeat for All Axes**
   - The process repeats for X, Y, and any other axes
   - Typical order: Z → X → Y (configurable)

---

## Limit Switches: Types and Installation

Limit switches are the physical sensors that detect when an axis reaches its homing position. There are several types:

### **Types of Limit Switches**

| Type | How It Works | Pros | Cons |
|------|--------------|------|------|
| **Mechanical** | Physical contact switch | Cheap, simple, reliable | Can wear out, requires physical contact |
| **Optical** | Infrared beam interruption | No physical contact, fast | Sensitive to dust/debris |
| **Inductive** | Detects metal proximity | No contact, durable | Only works with metal targets |
| **Magnetic (Hall Effect)** | Detects magnetic field | No contact, reliable | Requires magnets on moving parts |

### **Installation Best Practices**

- **Mount Securely** - Switches must not move or vibrate
- **Protect from Debris** - Shield switches from chips, coolant, and dust
- **Wire Properly** - Use shielded cables to prevent electrical noise
- **Test Regularly** - Verify switches trigger consistently
- **Normally Open (NO) vs Normally Closed (NC)** - NC is safer (detects wire breaks)

---

## Hard Limits vs. Soft Limits

grblHAL supports two types of limits to protect your machine:

### **Hard Limits**

- **Physical protection** using limit switches at the extreme ends of travel
- When triggered, the machine **immediately stops** and enters an alarm state
- Prevents the machine from physically crashing into its mechanical limits
- Enabled with setting `$21=1`

**How they work:**
- Separate switches (or shared with homing switches) at the maximum travel points
- When any limit switch is triggered during normal operation, grblHAL triggers **Alarm 1** (Hard Limit)
- The machine must be reset with `$X` (unlock) after clearing the condition

> ⚠️ **Warning**
> Hard limits will **immediately halt** the machine. Make sure your wiring is correct, or you may get false alarms from electrical noise.

### **Soft Limits**

- **Software-based protection** that prevents moves beyond configured boundaries
- Only works **after the machine has been homed**
- Uses settings `$130`, `$131`, `$132` (max travel) to define boundaries
- Enabled with setting `$20=1`

**How they work:**
- grblHAL checks every commanded move against the soft limit boundaries
- If a move would exceed the limits, it triggers **Alarm 2** (Soft Limit) and rejects the command
- No physical switch is involved - it's purely mathematical

**Example:**
```
$130=800.000  ; X-axis max travel is 800mm
$131=600.000  ; Y-axis max travel is 600mm
$132=100.000  ; Z-axis max travel is 100mm
$20=1         ; Enable soft limits
```

If you command `G0 X850`, grblHAL will reject it because 850mm exceeds the 800mm limit.

---

## Key Homing Settings in grblHAL

Here are the essential settings for configuring homing:

| Setting | Description | Typical Value |
|---------|-------------|---------------|
| **`$22`** | Homing cycle enable | `1` (enabled) |
| **`$23`** | Homing direction invert mask | `0` (depends on switch location) |
| **`$24`** | Homing locate feed rate (mm/min) | `25.0` (slow, precise) |
| **`$25`** | Homing search seek rate (mm/min) | `500.0` (fast initial search) |
| **`$27`** | Homing switch pull-off distance (mm) | `1.0` |
| **`$43`** | Homing passes | `2` (two-pass for accuracy) |
| **`$44`** | Homing cycle 1 axes | `4` (Z-axis, bitmask) |
| **`$45`** | Homing cycle 2 axes | `3` (X and Y, bitmask) |

### **Homing Direction (`$23`)**

This bitmask setting determines which direction each axis moves during homing:

```
$23=0   ; All axes home in positive direction
$23=1   ; X homes negative, Y and Z positive
$23=2   ; Y homes negative, X and Z positive
$23=4   ; Z homes negative, X and Y positive
$23=3   ; X and Y home negative (1+2)
```

**Tip:** The direction should move **toward** the limit switch. If your Z-axis limit switch is at the top, Z should home in the positive direction.

### **Homing Cycle Order (`$44`, `$45`, `$46`)**

These settings define which axes home together in each pass:

**Bitmask values:**
- X = 1
- Y = 2
- Z = 4
- A = 8 (if present)

**Example:**
```
$44=4   ; Cycle 1: Z-axis only (safety - lift Z first)
$45=3   ; Cycle 2: X and Y together (1+2=3)
```

---

## Homing Without Limit Switches

If your machine doesn't have limit switches, you have a few options:

### **Option 1: Disable Homing Requirement**
```
$22=0   ; Disable homing cycle
```
- You can still use the machine, but you lose the benefits of homing
- Soft limits will not work
- You must manually position the machine to a known location each time

### **Option 2: Manual "Soft Homing"**
1. Manually jog the machine to a known position (e.g., front-left corner)
2. Zero the work coordinates: `G10 L20 P1 X0 Y0 Z0`
3. This sets your current position as the origin for G54

### **Option 3: Install Limit Switches**
This is the **recommended** approach for any serious CNC work. Limit switches are inexpensive and dramatically improve safety and repeatability.

---

## Common Homing Issues and Solutions

### **Problem: Homing Fails with "Alarm 8" or "Alarm 9"**

**Cause:** Limit switch not triggered during homing cycle

**Solutions:**
- Check that limit switches are properly wired and functioning
- Verify switch is in the path of the moving axis
- Test switch manually: Send `?` command and check limit switch status
- Increase homing seek distance if needed

### **Problem: Machine Homes in Wrong Direction**

**Cause:** Incorrect `$23` (homing direction) setting

**Solution:**
- Invert the direction for the affected axis using `$23`
- Example: If Z homes down instead of up, add 4 to `$23`

### **Problem: Homing Position Not Repeatable**

**Cause:** Pull-off distance too small, or mechanical slop

**Solutions:**
- Increase `$27` (pull-off distance) to 2-5mm
- Check for mechanical play in the axis (loose belts, worn screws)
- Ensure limit switch is mounted rigidly

### **Problem: False Hard Limit Alarms During Operation**

**Cause:** Electrical noise triggering limit switches

**Solutions:**
- Use shielded cables for limit switch wiring
- Add a small capacitor (0.1µF) across the switch terminals
- Ensure proper grounding of the controller and machine frame
- Move limit switch wires away from motor wires

### **Problem: "Homing Required" Alarm on Startup**

**Cause:** Setting `$22=1` requires homing before operation

**Solutions:**
- Run `$H` to home the machine
- Or temporarily disable: `$22=0` (not recommended for production)

---

## Best Practices

1. **Always Home After Power-On**
   - Make it a habit to home immediately after turning on the machine
   - Many senders can auto-home on connection

2. **Test Homing Regularly**
   - Verify homing position is consistent
   - Check that all limit switches trigger properly

3. **Use Both Hard and Soft Limits**
   - `$20=1` (soft limits) and `$21=1` (hard limits)
   - Provides dual-layer protection

4. **Set Realistic Max Travel**
   - Measure your actual usable travel
   - Set `$130`, `$131`, `$132` slightly less than physical limits
   - Leave a safety margin (5-10mm)

5. **Document Your Homing Setup**
   - Record which direction each axis homes
   - Note the physical location of limit switches
   - Keep a backup of your settings (`$$` command output)

---

## Testing Your Homing Setup

Before running jobs, verify your homing works correctly:

### **Test Procedure**

1. **Power on and connect** to grblHAL
2. **Send `$H`** to initiate homing
3. **Observe the sequence:**
   - Z should move up first
   - Each axis should seek, pull-off, and slowly re-approach
   - No alarms should occur
4. **Check machine position:** Send `?` - you should see `MPos:0.000,0.000,0.000` (or configured offset)
5. **Test soft limits:**
   - Try to jog beyond max travel
   - Should trigger Alarm 2 (Soft Limit)
6. **Repeat homing 5-10 times**
   - Verify position is consistent each time
   - Variation should be  💡 **Tip**
> Many experienced CNC operators create a startup macro that automatically homes the machine, turns on the spindle cooling, and moves to a safe position. This ensures consistency and saves time on every power-up.

