---
title: "Configuring Homing"
---

# Configuring Homing

This guide covers the practical steps to enable and configure the homing cycle on your machine. For a theoretical explanation of how homing works, see [Homing Explained](../02-Core-Concepts/01-homing-explained.md).

## Step 1: Enable Homing

By default, homing is disabled. To enable it:

1. Send `$22=1` in the console.

**Note:** Once enabled, grblHAL will likely lock the machine upon startup (Alarm 1) until you perform a homing cycle (`$H`).

## Step 2: Set Homing Direction (`$23`)

This is the most critical step. You must tell grblHAL which direction to move to find the switches.

**Default Behavior:**
- Z axis moves **UP** (Positive)
- X axis moves **RIGHT** (Positive)
- Y axis moves **BACK** (Positive)

If your switches are in the opposite location (e.g., front-left), you must invert the search direction using `$23`.

**To find the correct value:**
1. Determine where your switches are physically located.
2. Toggle the bits for the axes you need to invert.
3. Use the table below:

| Value (`$23=`) | X Direction | Y Direction | Z Direction | Typical Setup For |
| :--- | :--- | :--- | :--- | :--- |
| **0** (Default) | + (Right) | + (Back) | + (Up) | Standard CNC (Back-Right-Top) |
| **1** | - (Left) | + (Back) | + (Up) | |
| **3** | - (Left) | - (Front) | + (Up) | Front-Left Origin (Common on Lasers) |
| **7** | - (Left) | - (Front) | - (Down) | |

**Test carefully:**
- Be ready to hit E-Stop!
- Send `$H`
- If an axis moves the wrong way, reset, change `$23`, and try again.

## Step 3: Configure Switch Type (`$5`)

Are your limit switches **Normally Open (NO)** or **Normally Closed (NC)**?

- **$5=0** (Default): Normally Open (NO). Signal is HIGH when triggered.
- **$5=...**: Invert specific axes where switches are Normally Closed (NC) or logically inverted.

Unlike 8-bit Grbl, **grblHAL uses a bitmask for `$5`**, meaning you can invert limit pins **per axis**.

| Axis | Bit Value | Description |
|------|-----------|-------------|
| X    | 1         | Invert X limit input |
| Y    | 2         | Invert Y limit input |
| Z    | 4         | Invert Z limit input |
| A    | 8         | Invert A limit input |
| B    | 16        | Invert B limit input |
| C    | 32        | Invert C limit input |

**Example:** To invert X and Y but keep Z normal: Add 1 + 2 = **`$5=3`**.

**Recommendation:** Use **Normally Closed (NC)** switches if possible. They are safer because a broken wire will trigger the alarm immediately, rather than failing silently.

## Step 4: Fine Tuning

### **Homing Search Rate (`$25`)**
- Speed at which the machine "seeks" the switch initially.
- **Default:** 500 mm/min
- **Tune:** Make it fast enough to be convenient, but slow enough to not crash hard into the switch.

### **Homing Locate Rate (`$24`)**
- Speed for the second, precise touch-off.
- **Default:** 25 mm/min
- **Tune:** Keep this slow for maximum repeatability.

### **Homing Pull-off (`$27`)**
- Distance the machine backs away from the switch after triggering it.
- **Default:** 1.0 mm
- **Tune:** If your switch stays triggered (Alarm 8), increase this to `2.0` or `5.0` mm. It must back off enough to clear the internal switch mechanism.

---

## Troubleshooting Homing

### **Machine moves wrong way**
- Adjust `$23` (Homing Direction Invert).

### **Alarm 8: Homing Fail**
- The switch did not clear after pull-off. Increase `$27` (Pull-off distance).
- Or, interference/noise on the switch line.

### **Alarm 9: Homing Fail**
- The switch was not found within the expected distance (`$130`, `$131`, `$132` max travel settings).
- Ensure your Max Travel settings are accurate or slightly larger than physical travel.

---

**Next Step:** With homing set, let's squeeze the last bit of precision out of your mechanics: [Backlash Compensation](./05-backlash-compensation.md)
