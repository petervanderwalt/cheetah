---
title: "Troubleshooting Guide"
---

# Troubleshooting Guide

This page covers common issues encountered when setting up grblHAL.

## 1. Connection Issues

### **"No Port Found"**
*   **Driver Missing:** Ensure you have installed the CH340, CP2102, or STM32 VCP driver for your board.
*   **Cable:** Try a different USB cable. Many are "charge only."
*   **Permissions:** (Linux/Mac) Ensure your user is in the `dialout` or `tty` group.

### **"Garbage Characters"**
*   **Baud Rate:** Ensure your sender is set to match the firmware.
    *   Standard Grbl: `115200`
    *   Native USB (STM32/RP2040): Any baud rate works, but some senders default to `115200`.

---

## 2. Motion Issues

### **Motors Buzz but Don't Move**
*   **Wiring:** Check motor coil pairs. Verify continuity.
*   **Acceleration:** Your `$120-$122` might be too high. Lower it drastically (e.g., `50`) and re-test.
*   **Current:** Adjust the potentiometer on your stepper driver.

### **Axis Moves Wrong Direction**
*   Invert the direction using setting **`$3`**.
    *   (See [Settings Reference](./04-Reference/complete-settings-reference.md#3--direction-invert-mask))

### **Dimensions are Wrong**
*   Calibrate your steps per mm (`$100-$102`).
    *   (See [Calibration Guide](./03-Machine-Calibration/02-calibrating-steps.md))

---

## 3. Homing Failures

### **Alarm 9 (Homing Fail)**
*   **Switch didn't trigger:** The axis moved the max distance (`$130` * 1.5) without hitting a switch.
    *   Check wiring.
    *   Check switch functionality with `?` status report (pins should correspond to `Pn:XYZ`).
*   **Switch triggered immediately:** The switch is wired Normally Closed (NC) but configured as Normally Open (NO) in `$5`, or vice versa.

### **Axis Moves Away from Switch**
*   Invert homing direction using **`$23`**.

---

## 4. Common Alarms

| Alarm | Meaning | Likely Cause | Fix |
| :--- | :--- | :--- | :--- |
| **Alarm 1** | Hard Limit | A limit switch was hit during motion. | Jog away. Check for electrical noise (`$21`). |
| **Alarm 2** | Soft Limit | Command exceeded max travel (`$130-$132`). | Check G-code coordinates. Home the machine. |
| **Alarm 8** | Homing Fail | Homing switch was not cleared. | Switch stuck or noise. |
| **Alarm 9** | Homing Fail | Homing switch was not found. | Switch wiring, or `$23` direction wrong. |

---

## 5. Spindle / Laser Issues

### **Laser Won't Turn Off**
*   Check `$32` (Laser Mode).
*   Ensure you are using `M4` (Dynamic Power) for engraving.
*   Check if `$31` (Min Spindle Speed) is `0`.

---

**Need more help?**
Check the [GitHub Issues](https://github.com/grblHAL/core/issues) or join the community Discord.

---

## 6. Electromagnetic Interference (EMI)

EMI is a common cause of unexplainable random issues, usually triggered by high-power devices like spindles, VFDs, or plasma cutters.

### **Symptoms**
*   **USB Disconnections:** The controller disconnects from the PC when the spindle starts or under load.
*   **False Hard Limits:** "Alarm 1" triggers randomly even when the machine is nowhere near a switch.
*   **Corrupted Data:** Strange characters in the console or the machine making erratic moves.
*   **Frozen Probing:** Probes trigger falsely or fail to trigger.

### **Mitigation Steps**
1.  **Cable Separation:**
    *   **Keep low-voltage signals** (USB, Limit Switches, Probe) **FAR AWAY** from high-voltage power cables (Spindle, Stepper Motors, VFD).
    *   Do **NOT** run limit switch wires inside the same drag chain or conduit as your spindle power cable.
    *   If cables must cross, cross them at 90 degrees.

2.  **Shielding:**
    *   Use **shielded cables** for all signal wiring (limits, probe) and VFD/Spindle power.
    *   **Ground the shield at the controller end ONLY** (to avoid ground loops). The other end should be cut flush and insulated.

3.  **Ferrite Cores:**
    *   Snap-on ferrite beads can suppress high-frequency noise.
    *   Place them on: USB cables (both ends), Limit switch wires (near controller), Spindle power lines (near VFD).

4.  **Usb Cable:**
    *   Use a high-quality, shielded USB cable with built-in ferrite chokes.
    *   Keep it as short as possible.

5.  **Grounding:**
    *   Ensure your machine frame, spindle body, and VFD are properly earthed to a central star-ground point.
    *   **Vacuum Hoses:** Dust collection generates massive static. Run a bare copper wire inside the hose and ground it to dissipate static charge.

