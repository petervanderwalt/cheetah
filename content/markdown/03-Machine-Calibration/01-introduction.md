# Introduction to Machine Calibration

**Calibration is the bridge between a working machine and an accurate machine.**

Just because your motors move doesn't mean your machine is ready to cut parts. Calibration ensures that when you tell the machine to move 100mm, it moves *exactly* 100mm, accelerates smoothly without losing steps, and homes to a reliable repeatable position.

## The Pillars of Calibration

We will guide you through the three critical phases of machine setup:

### **1. Physical Calibration (Accuracy)**
This ensures your machine's physical movement matches the digital commands.
- **Steps per mm:** syncing motor rotation to linear travel
- **Squareness:** ensuring X and Y axes are perfectly perpendicular

### **2. Motion Tuning (Performance)**
This balances speed with reliability.
- **Max Rate:** how fast the machine can travel
- **Acceleration:** how quickly it speeds up and slows down
- **Junction Deviation:** how it handles corners

### **3. Homing & Limits (Safety & Repeatability)**
This gives your machine spatial awareness.
- **Homing Cycle:** establishing a machine zero
- **Soft Limits:** preventing crashes by defining software boundaries
- **Hard Limits:** using physical switches for emergency stops

## Prerequisites

Before starting calibration, ensure:
1. **Mechanical Assembly is Complete:** Belts are tight, screws are secure, and V-wheels/rails are adjusted properly.
2. **Electronics are Functional:** Motors move in the correct direction (as verified in [First Connection](../01-Getting-Started/05-first-connection.md)).
3. **Measuring Tools are Ready:** You will need:
   - A reliable ruler or tape measure (for coarse calibration)
   - A dial indicator or digital calipers (for precision tuning)
   - A scrap piece of material for test cuts

> ⚠️ **Warning**
> **Accuracy** is hitting the target. **Precision** is hitting the same spot every time.
> - You tune **Steps per mm** for Accuracy.
> - You tune mechanical rigidity and backlash for Precision.

## Recommended Workflow

Follow these guides in order for the best results:

1. [Calibrating Steps per Unit](./02-calibrating-steps.md) - **Do this first!**
2. [Tuning Motion Settings](./03-tuning-motion.md) - Optimize for speed
3. [Configuring Homing](./04-configuring-homing.md) - Set up your zero point
4. [Backlash Compensation](./05-backlash-compensation.md) - Advanced fine-tuning

---

**Ready to start?** Let's make your machine accurate: [Calibrate Steps per Unit](./02-calibrating-steps.md)
