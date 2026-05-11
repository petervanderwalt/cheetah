---
title: "Probing Guide"
---

# Probing Guide

Probing is the process of using a specialized sensor (a probe) to automatically find the position of your workpiece or tool. It turns your CNC machine into a measuring device, allowing you to set Work Zero offsets with extreme accuracy.

## How it Works

A probe acts like a switch. When the tool touches the probe (or the workpiece), the circuit closes, and grblHAL captures the exact position.

### Common Probe Types

1. **Touch Plate (Z-Probe):** A metal plate of known thickness used to find the top of the material.
2. **XYZ Probe / Corner Finder:** A block that allows finding X, Y, and Z zero simultaneously at a corner.
3. **Tool Setter:** A fixed switch on the table used to measure tool lengths.
4. **3D Touch Probe:** A precision stylus mounted in the spindle for digitizing surfaces or finding edges.

---

## Configuration

### **1. Wiring**
- **Signal Pin:** Connect to the `Probe` input on your controller.
- **Ground:** Connect to the machine ground (often the spindle body or a clip attached to the end mill).
- **Test:** Use a multimeter to ensure continuity when the tool touches the plate.

### **2. Inverting Input (`$6`)**
- Use `$6` to invert the probe input if it reports "Triggered" when not touching.
- Check status with `?` status reports. `Pn:P` indicates the probe is triggered.

---

## The G38 Probing Commands

grblHAL supports standard G-code probing cycles:

| Command | Description | Stop Condition | Error on Fail? |
| :--- | :--- | :--- | :--- |
| **G38.2** | Probe toward target | Contact Made | **Yes (Alarm)** |
| **G38.3** | Probe toward target | Contact Made | No |
| **G38.4** | Probe away from target | Contact Lost | **Yes (Alarm)** |
| **G38.5** | Probe away from target | Contact Lost | No |

**Most common usage:** `G38.2` (Move until touch).

### **Syntax**
`G38.2 [Axis][Target] F[Rate]`

Example:
```gcode
G38.2 Z-25 F100
```
*Meaning: Move Z down toward -25mm at 100mm/min. Stop immediately upon contact.*

---

## Practical Examples

### **1. Simple Z-Zero (Touch Plate)**

Suppose you have a 10mm thick touch plate.

1. **Jog** the tool roughly 5-10mm above the plate.
2. **Attach** the magnet clip to the collet/tool.
3. **Run Command:**
   ```gcode
   G38.2 Z-25 F50    ; Probe down slowly
   G10 L20 P1 Z10    ; Set Z Work Offset to plate thickness (10mm)
   G91 G0 Z5         ; Retract 5mm relative
   ```
   *Result: Z0 is now exactly set to the material surface.*

### **2. Finding a Corner (XYZ)**

For a corner finder plate (let's say 10mm offset for X/Y/Z).

1. **Position** tool inside the corner area.
2. **Probe Z:**
   ```gcode
   G38.2 Z-25 F50
   G10 L20 P1 Z10
   G91 G0 Z5
   ```
3. **Probe X:**
   ```gcode
   G91 G0 X20        ; Move X away
   G0 Z-10           ; Move Z down
   G38.2 X-25 F50    ; Probe X back toward material
   G10 L20 P1 X10    ; Set X offset
   G0 X5             ; Back off
   ```
4. **Probe Y:**
   *(Repeat logic for Y axis)*

---

## Safety & Troubleshooting

### **Always Test Connectivity First!**
Before running a probe cycle, touch the clip to the plate manually and check the status report (`?`). If it doesn't show the probe pin active (`Pn:P`), **DO NOT PROBE**. You will crash the tool.

### **Use Two-Stage Probing**
For best accuracy:
1. Probe fast (`F300`) to find the approximate location.
2. Retract slightly (`1-2mm`).
3. Probe slow (`F25`) for the precise measurement.

### **Probe Protection**
If you have a specialized probe (like a Renishaw), ensure it's wired Normally Closed (NC) if possible, so a disconnect stops the machine.

---

**Next:** Learn how to handle tool changes efficiently: [Automatic Tool Changer](./automatic-tool-changer.md)
