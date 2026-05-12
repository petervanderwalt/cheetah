# First Connection & Motion

Congratulations on successfully flashing grblHAL! This guide will walk you through connecting to your controller for the first time, configuring essential settings, and testing your first movements safely.

## Prerequisites

Before proceeding, ensure you have:

1. **grblHAL firmware flashed** on your controller (see [Firmware Flashing](./04-firmware-flashing.md))
2. **Controller connected** to your computer via USB
3. **Stepper motors wired** to your controller
4. **Power supply connected** (but can remain OFF for initial connection)
5. **Basic knowledge** of your machine's specifications

> 🔥 **Danger**
> - **Never** touch moving parts while machine is powered
> - Keep **emergency stop** within reach
> - Start with **low speeds** and **small movements**
> - Ensure **workspace is clear** of obstacles
> - **Disconnect power** when wiring or making physical changes

---

## Step 1: Choose and Install a G-code Sender

A **G-code sender** is the software you'll use to communicate with grblHAL. Here are the most popular options:

### **Recommended Senders**

| Sender | Platform | Best For | Download |
|--------|----------|----------|----------|
| **ioSender** | Windows, macOS, Linux | grblHAL (optimized) | [GitHub](https://github.com/terjeio/ioSender/releases) |
| **CNCjs** | Web-based | Remote access, Raspberry Pi | [GitHub](https://github.com/cncjs/cncjs) |
| **Universal Gcode Sender (UGS)** | Windows, macOS, Linux | General purpose | [GitHub](https://github.com/winder/Universal-G-Code-Sender) |
| **bCNC** | Windows, macOS, Linux | Advanced users | [GitHub](https://github.com/vlachoudis/bCNC) |
| **gSender** | Windows, macOS, Linux | Sienci LongMill | [Sienci Labs](https://sienci.com/gsender/) |

> 💡 **Tip**
> **ioSender** is specifically designed for grblHAL and offers the best feature support, including advanced settings management, macro support, and real-time visualization.

### **Installing ioSender (Example)**

1. Download the latest release for your OS
2. Extract the archive
3. Run the executable (no installation required)
4. On first run, it will create configuration files

---

## Step 2: Establish Connection

### **A. Identify Your COM Port**

**Windows:**
1. Open **Device Manager**
2. Expand **Ports (COM & LPT)**
3. Look for your controller (e.g., "USB Serial Device (COM3)")
4. Note the COM port number

**macOS/Linux:**
1. Open Terminal
2. Run: `ls /dev/tty.*` (macOS) or `ls /dev/ttyUSB*` or `ls /dev/ttyACM*` (Linux)
3. Note the device name (e.g., `/dev/ttyUSB0`)

### **B. Connect via Your Sender**

**Using ioSender:**
1. Launch ioSender
2. Select **COM port** from dropdown (top toolbar)
3. Baud rate should auto-detect to **115200**
4. Click **Connect** button
5. You should see connection status change to "Idle"

**Using CNCjs:**
1. Open web interface (usually `http://localhost:8000`)
2. Click **Connection** widget
3. Select **Port** and set **Baud Rate** to 115200
4. Click **Open**

**Using UGS:**
1. Launch UGS Platform
2. Select **Port** and **Baud Rate** (115200)
3. Click **Connect**

### **C. Verify Connection**

Once connected, you should see:
- **Status:** "Idle" or "Alarm" (alarm is normal on first boot)
- **Position:** X, Y, Z coordinates (likely all zeros)
- **Console output** showing grblHAL startup message

**Send the `$I` command** to verify firmware info:
```
$I
```

**Expected response:**
```
[VER:2.1.3-beta.20250101:grblHAL driver for STM32F4xx]
[OPT:VL,15,128]
[NEWOPT:ENUMS,RT+,SED,TC,ETH]
[FIRMWARE:grblHAL]
[BOARD:Flexi-HAL]
ok
```

---

## Step 3: Clear Initial Alarm (If Present)

grblHAL often starts in **Alarm state** for safety. This is normal.

### **Check Alarm Code**

Send:
```
$#
```

Or look at the status display. Common initial alarms:
- **Alarm 1:** Hard limit triggered
- **Alarm 2:** Soft limit triggered  
- **Alarm 11:** Homing required (if `$22=1`)

### **Clear Alarm**

**Method 1: Unlock Command**
```
$X
```
This unlocks the controller if no actual fault exists.

**Method 2: Homing (If Required)**
If `$22=1` (homing required on startup), you must home first:
```
$H
```
**Warning: Only do this if limit switches are properly installed and configured!**

**Method 3: Disable Homing Requirement (Temporary)**
```
$22=0
```
Then unlock with `$X`.

> ⚠️ **Warning**
> Disabling homing requirement (`$22=0`) reduces safety. Re-enable once limit switches are installed.

---

## Step 4: Configure Essential Settings

Before moving your machine, configure these critical settings. Send `$$` to view all current settings.

### **A. Steps per Millimeter ($100, $101, $102)**

These define how many motor steps equal 1mm of movement. Values depend on:
- Motor steps per revolution (typically 200)
- Microstepping (e.g., 1/16 = 16)
- Belt pitch or lead screw pitch

**Example calculation for belt drive:**
```
Steps/mm = (Motor steps × Microstepping) / (Pulley teeth × Belt pitch)
         = (200 × 16) / (20 × 2mm)
         = 80 steps/mm
```

**Set values:**
```
$100=80.000    ; X-axis steps/mm
$101=80.000    ; Y-axis steps/mm
$102=400.000   ; Z-axis steps/mm (lead screw example)
```

> 💡 **Tip**
> Don't know your values? See [Calibrating Steps per mm](../03-Machine-Calibration/02-calibrating-steps.md) for detailed calculation and calibration procedures.

### **B. Maximum Rate ($110, $111, $112)**

Maximum speed in mm/min for each axis. Start conservative:

```
$110=3000.000  ; X-axis max rate (mm/min)
$111=3000.000  ; Y-axis max rate
$112=1000.000  ; Z-axis max rate (slower for safety)
```

### **C. Acceleration ($120, $121, $122)**

How quickly the machine can change speed (mm/sec²). Start low:

```
$120=200.000   ; X-axis acceleration
$121=200.000   ; Y-axis acceleration
$122=100.000   ; Z-axis acceleration (slower for safety)
```

### **D. Maximum Travel ($130, $131, $132)**

Define your machine's working area (mm):

```
$130=800.000   ; X-axis max travel
$131=800.000   ; Y-axis max travel
$132=100.000   ; Z-axis max travel
```

### **E. Direction Inversion ($3)**

If motors move in wrong direction, invert them using bitmask:

```
$3=0    ; No inversion
$3=1    ; Invert X
$3=2    ; Invert Y
$3=4    ; Invert Z
$3=3    ; Invert X and Y (1+2)
```

**Test and adjust after first movement.**

### **F. Save Settings**

Settings are saved automatically after each command. Verify with:
```
$$
```

---

## Step 5: Safety Checks

Before powering motors, perform these checks:

### **Physical Inspection**
- All motor connectors secure
- Power supply voltage correct
- No loose wires or shorts
- Machine can move freely by hand
- Workspace clear of obstacles
- Emergency stop accessible

### **Electrical Check**
- Stepper driver current set correctly (if adjustable)
- Cooling fans operational (if present)
- No unusual smells or heat

---

## Step 6: First Movement Test

Now for the exciting part - making your machine move!

### **A. Power On Motors**

1. **Apply power** to your stepper drivers/motors
2. Motors should **energize** (become harder to turn by hand)
3. If motors get hot immediately, **power off** and check driver current

### **B. Test Individual Axes**

**Using Jog Controls:**

Most senders have jog buttons. Start with:
- **Distance:** 1mm or 0.1mm
- **Speed:** 100-500 mm/min

**Or send manual jog commands:**
```
$J=G91 X1 F100
```
This jogs X-axis +1mm at 100mm/min.

**Command breakdown:**
- `$J=` - Jog command
- `G91` - Incremental mode
- `X1` - Move X-axis 1mm positive
- `F100` - Feed rate 100mm/min

### **C. Test Each Axis**

**X-Axis Test:**
```
$J=G91 X1 F100    ; Move +X by 1mm
$J=G91 X-1 F100   ; Move -X by 1mm
```

**Y-Axis Test:**
```
$J=G91 Y1 F100    ; Move +Y by 1mm
$J=G91 Y-1 F100   ; Move -Y by 1mm
```

**Z-Axis Test:**
```
$J=G91 Z1 F100    ; Move +Z by 1mm
$J=G91 Z-1 F100   ; Move -Z by 1mm
```

### **D. Verify Direction**

Check if axes move in expected directions:
- **+X** should move right (or away from operator)
- **+Y** should move back (or to the left)
- **+Z** should move up

**If direction is wrong**, adjust `$3` setting (see Step 4E above).

### **E. Increase Distance and Speed**

Once comfortable:
1. Increase jog distance to 10mm
2. Increase speed to 1000mm/min
3. Test larger movements
4. Verify smooth motion without stalling

---

## Step 7: Test G-code Program

Run a simple test program to verify coordinated motion:

### **Simple Square Test**

```gcode
G21         ; Metric units
G90         ; Absolute positioning
G0 Z5       ; Lift Z to safe height
G0 X0 Y0    ; Move to origin
G1 F500     ; Set feed rate to 500mm/min
G1 X10 Y0   ; Draw line to (10,0)
G1 X10 Y10  ; Draw line to (10,10)
G1 X0 Y10   ; Draw line to (0,10)
G1 X0 Y0    ; Draw line to (0,0)
G0 Z0       ; Lower Z back down
M2          ; Program end
```

**To run:**
1. Copy the code above
2. Paste into sender's G-code editor or console
3. Click **Send** or **Run**
4. Machine should draw a 10mm square in the XY plane

---

## Step 8: Understanding Machine States

grblHAL has several operating states:

| State | Meaning | Actions Available |
|-------|---------|-------------------|
| **Idle** | Ready for commands | All commands accepted |
| **Run** | Executing G-code | Limited commands (feed hold, stop) |
| **Hold** | Paused during run | Resume or stop |
| **Jog** | Jogging | Cancel jog |
| **Alarm** | Fault condition | Must clear with `$X` or `$H` |
| **Door** | Safety door open | Close door to resume |
| **Check** | G-code check mode | Simulates without motion |
| **Home** | Homing cycle active | Wait for completion |

---

## Troubleshooting

### **Motors Don't Move**

- Check power supply is ON
- Verify stepper driver enable pins
- **Check `$4` (enable invert mask)** - Some drivers need inverted enable signal. Try toggling bits:
  - `$4=0` (default - enable active low)
  - `$4=7` (invert X, Y, Z enable - active high)
- Check `$1` (step idle delay) - try `$1=255`
- Verify wiring connections
- Check for alarm state

### **Motors Move Wrong Direction**

- Adjust `$3` (direction invert mask)
- Or swap motor wiring pairs (A+/A- with B+/B-)

### **Motors Stall or Skip Steps**

- Reduce acceleration (`$120`, `$121`, `$122`)
- Reduce max rate (`$110`, `$111`, `$112`)
- Increase stepper driver current (if adjustable)
- Check for mechanical binding

### **Erratic Movement or Noise**

- Check for loose wiring
- Check stepper driver current settings
- Ensure microstepping configuration matches firmware

### **Connection Drops**

- Use shorter, higher-quality USB cable
- Avoid USB hubs
- Update USB drivers
- Check for electrical interference

---

## Next Steps

Now that your machine is moving:

1. **Calibrate steps/mm** - See [Calibrating Steps per mm](../03-Machine-Calibration/02-calibrating-steps.md)
2. **Tune acceleration and speeds** - See [Tuning Motion](../03-Machine-Calibration/03-tuning-motion.md)
3. **Configure homing** - See [Configuring Homing](../03-Machine-Calibration/04-configuring-homing.md)
4. **Learn core concepts** - See [Homing Explained](../02-Core-Concepts/01-homing-explained.md)
5. **Explore G-code** - See [Complete G-code Reference](../04-Reference/complete-g-m-code-reference.md)

---

## Quick Reference Commands

| Command | Description |
|---------|-------------|
| `$$` | View all settings |
| `$#` | View coordinate offsets and probing |
| `$G` | View parser state |
| `$I` | View firmware info |
| `$N` | View startup blocks |
| `$X` | Unlock (clear alarm) |
| `$H` | Run homing cycle |
| `~` | Resume from feed hold |
| `!` | Feed hold (pause) |
| `Ctrl+X` | Soft reset |

---

Congratulations! Your grblHAL machine is now operational. Take time to familiarize yourself with the controls and always prioritize safety.

