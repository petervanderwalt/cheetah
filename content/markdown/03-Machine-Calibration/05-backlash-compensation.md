---
title: "Backlash Compensation"
---

# Backlash Compensation

**Backlash** is the lost motion or "slop" in a mechanical system caused by gaps between mating parts (e.g., a lead screw and nut, or loose belt teeth).

When an axis reverses direction, the motor turns for a brief moment to take up this slack before the load actually moves. This results in:
- Circles that are slightly flat at the quadrants (ovals).
- Undersized features.
- Poor surface finish.

## The Golden Rule: Fix Mechanics First!

Software compensation is a **band-aid**, not a cure. Before enabling compensation:
1. **Belts:** Ensure they are tight (like a guitar string).
2. **Couplers:** Check for loose set screws on motor couplers.
3. **Anti-Backlash Nuts:** Adjust or replace worn anti-backlash nuts on lead screws.
4. **Pinions:** Ensure rack-and-pinion gears differ mesh properly.

## Measuring Backlash

To configure compensation, you must first measure the exact amount of backlash on each axis.

### **Method: Dial Indicator (Best)**
1. Mount a dial indicator against a solid block on the axis.
2. Zero the axis and the indicator.
3. Move the axis **away** (e.g., `G0 X10`).
4. Move the axis **back** to zero (`G0 X0`).
5. Read the indicator. The potential difference from zero is your backlash (repeat 5 times and average).

### **Method: Test Cut**
1. Cut a 20mm circle.
2. Measure the diameter across X and Y.
3. Calculate the difference between the expected diameter and the measured diameter.

## Configuring Compensation

**Note:** Backlash compensation must be enabled in your firmware build (`#define BACKLASH_COMPENSATION` in `my_machine.h`). If these settings don't stick, you may need a firmware update.

### **Settings:**
- **`$160`**: X-axis backlash distance (mm)
- **`$161`**: Y-axis backlash distance (mm)
- **`$162`**: Z-axis backlash distance (mm)

### **Procedure:**
1. Enter your measured backlash value (e.g., `$160=0.05` for 0.05mm of slop).
2. Run a test circle.
3. Adjust until the circle is perfectly round.

**Tip:** Be conservative. Compensating too much can cause jerky motion or "clunking" sounds.

---

## Conclusion

You have now completed the core machine calibration! Your machine is:
- **Accurate** (Steps/mm)
- **Fast & Smooth** (Motion Tuning)
- **Oriented** (Homing)
- **Precise** (Backlash Compensation)

**What's Next?** Explore our Advanced Guides, such as [Probing](../05-Guides/probing.md) or [Auto Tool Changers](../05-Guides/automatic-tool-changer.md).
