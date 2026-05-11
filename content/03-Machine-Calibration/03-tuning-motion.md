---
title: "Tuning Motion Settings"
---

# Tuning Motion Settings

Once your steps per mm are calibrated for accuracy, the next step is tuning for performance. This involves finding the maximum reliable speed and acceleration your machine can handle without losing steps (stalling).

There are three key settings to tune:
1. **Max Rate (`$110`-`$112`)** - Top speed for G0 rapids.
2. **Acceleration (`$120`-`$122`)** - How quickly the machine speeds up/slows down.
3. **Junction Deviation (`$11`)** - Cornering speed management.

---

## 1. Max Rate (`$110`, `$111`, `$112`)

This setting limits the maximum velocity for each axis in mm/min.

### **Why Tune It?**
- **Too Low:** Jobs take forever.
- **Too High:** Motors stall (make a buzzing/grinding noise) and lose position.

### **Tuning Procedure:**
1. **Start Conservative:** Set a low value (e.g., 1000 mm/min).
2. **Test:** Jog the axis back and forth over a long distance.
3. **Increase:** Raise the value by 500-1000 mm/min.
4. **Repeat:** Keep increasing until the motor stalls (buzzes/stops mid-move).
5. **Back Off:** Reduce the value by **10-20%** from the stall point.
6. **Finalize:** This is your safe Max Rate.

**Typical Values:**
- Lead screw machines: 1000 - 3000 mm/min
- Belt driven machines: 5000 - 15000+ mm/min

---

## 2. Acceleration (`$120`, `$121`, `$122`)

This setting controls how fast the motor ramps up to the Max Rate, in mm/sec².

### **Why Tune It?**
- **Too Low:** Machine feels sluggish; laser raster engraving is slow at edges.
- **Too High:** Motors stall during direction changes; machine shakes violently.

### **Tuning Procedure:**
1. **Reset:** Set to a conservative value (e.g., 50 mm/sec²).
2. **Test:** Command short, rapid back-and-forth moves (e.g., `G0 X100` then `G0 X0`).
3. **Increase:** Raise by 50-100 mm/sec².
4. **Listen:** The motion should sound crisp and punchy, not sluggish.
5. **Limit:** Increase until the machine shudders, stalls, or shakes too much.
6. **Back Off:** Reduce by **20%** for a safety margin.

**Typical Values:**
- Heavy/Screw drive: 50 - 200 mm/sec²
- Light/Belt drive: 500 - 2000+ mm/sec²

---

## 3. Junction Deviation (`$11`)

This setting determines how much the machine slows down for corners. It's grblHAL's way of managing "cornering speed."

- **Higher Value:** Faster corners, but risks losing steps or rounding off sharp corners.
- **Lower Value:** Slower, more precise corners, but increases job time.

### **Recommended Values:**
- **Standard CNC Router:** `0.01` to `0.02` mm
- **3D Printer / Light Laser:** `0.02` to `0.05` mm
- **Heavy Mill:** `0.005` to `0.01` mm

**Tip:** For most users, the default `0.010` is a good balance. Only adjust if you see corner rounding (decrease it) or stuttering in complex curves (increase it).

---

## The Motion Stress Test

After setting your initial values, run a "stress test" program to verify reliability.

**Run this G-code (adjust X/Y distance for your bed size):**

```gcode
G21 G90
G0 X0 Y0
; Fast diagonals test both motors simultaneously
G0 X200 Y200
G0 X0 Y0
G0 X200 Y200
G0 X0 Y0
; Repeat 10x
```

**What to watch for:**
- **Sound:** Should be consistent. No grinding or "clunking".
- **Position:** When it returns to `X0 Y0`, does the physical position match the start?
- **Heat:** Check motor temperature. Warm is fine; too hot to touch means current is too high.

---

**Next Step:** Now that your machine moves accurately and smoothly, let's set up the reference system: [Configuring Homing](./04-configuring-homing.md)
