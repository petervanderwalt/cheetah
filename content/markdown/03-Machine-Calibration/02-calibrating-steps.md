---
title: "Calibrating Steps per Unit"
---

# Calibrating Steps per Unit

**Steps per Unit** (usually Steps per mm) is the setting that tells grblHAL how many motor steps are required to move an axis exactly 1 millimeter (or inch).

If this value is wrong, your parts will come out the wrong size. E.g., a designed 100mm square might cut as 98mm or 102mm.

## The Formula

The calibration process is simple math:

> **New Steps = Current Steps * (Commanded Distance / Measured Distance)**

Where:
- **Current Steps:** The current `$100`, `$101`, or `$102` setting value.
- **Commanded Distance:** How far you told the machine to move (e.g., 100mm).
- **Measured Distance:** How far the machine *actually* moved.

---

## Step-by-Step Calibration

### **Material Needed**
- A reliable ruler, tape measure, or digital caliper.
- A pointed tool (V-bit) or a fine marker attached to the spindle/tool holder.
- A piece of scrap material (MDF, wood, or paper tape on the bed).

### **Procedure (Do for X, Y, and Z axes)**

1. **Check Current Settings:**
   - Send `$$` in the console.
   - Note down the current values for:
     - `$100` (X-axis steps/mm)
     - `$101` (Y-axis steps/mm)
     - `$102` (Z-axis steps/mm)

2. **Set a Starting Point:**
   - Jog the machine to a starting position.
   - Mark this spot preciseley on your material (or zero your caliper).
   - **Zero the axis** in your sender software (e.g., click "Zero X").

3. **Command a Move:**
   - Move the axis a specific distance. **The longer, the better.**
   - Example command: `G0 X100` (Move X axis 100mm).

4. **Measure Actual Movement:**
   - Using your ruler or caliper, measure exactly how far the machine moved from the start point.
   - *Example:* You commanded 100mm, but measured 98.5mm.

5. **Calculate New Steps:**
   - Use the formula:
     ```
     New Steps = Current Steps * (100 / 98.5)
     ```
   - *Example:* If `$100 = 40.000`:
     ```
     New Steps = 40.000 * 1.0152 = 40.609
     ```

6. **Update Firmware:**
   - Send the new value to the controller:
     ```
     $100=40.609
     ```

7. **Verify:**
   - Re-zero the axis.
   - Command the move again (e.g., `G0 X100`).
   - Measure again. It should now be dead-on 100mm.

---

## Tips for Accuracy

### **Use the Longest Distance Possible**
Measuring error is constant (e.g., ±0.5mm with a ruler).
- Over 10mm, a 0.5mm error is **5%**.
- Over 100mm, a 0.5mm error is **0.5%**.
- Over 500mm, a 0.5mm error is **0.1%**.

**Calibrate using the longest travel your machine and measuring tool allow.**

### **Account for Backlash**
If your axis has backlash (loose fitting screws/belts):
- Always approach your start point and end point from the **same direction**.
- Example:
  1. Jog X+ to position.
  2. Mark Start.
  3. Command Move X+ 100mm.
  4. Mark End.

This removes backlash from the measurement equation.

### **Don't Forget Z-Axis**
Calibrating Z is critical for accurate pocket depths.
- Use a dial indicator or touch off the top of a block, move Z up, place a precision 1-2-3 block, and touch off again.

---

## Troubleshooting

### **My dimensions are consistently off by exactly half or double.**
- **Cause:** Incorrect microstepping setting on stepper drivers vs. firmware.
- **Fix:** Check your DIP switches on the stepper driver and double check your expected steps/mm calculation.

### **My circles are ovals.**
- **Cause:** X and Y steps/mm are not calibrated equally, or severe backlash.
- **Fix:** Calibrate X and Y independently. Check for loose belts.

### **I updated the steps, but it got worse.**
- **Cause:** You likely inverted the formula (Measured / Commanded instead of Commanded / Measured).
- **Fix:** Flip the fraction and recalculate.
  - Remember: If it moved **short**, you need **more** steps (ratio > 1).
  - If it moved **long**, you need **fewer** steps (ratio < 1).

---

**Next Step:** Once your machine moves accurately, let's make it move smoothly: [Tuning Motion Settings](./03-tuning-motion.md)
