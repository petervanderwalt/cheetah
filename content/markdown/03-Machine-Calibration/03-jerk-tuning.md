# Tuning Jerk & Acceleration

Standard Grbl uses **Trapezoidal** motion planning: the machine ramps up to speed linearly, holds speed, and ramps down. This is efficient but can cause vibrations ("jerk") at the start and end of movements because the *rate of change* of acceleration is instant.

grblHAL introduces **S-Curve Acceleration** (Jerk Limited acceleration), which smooths out these transitions.

## Why use Jerk Limiting?
- **Smoother Motion:** Reduces machine vibration and resonance.
- **Less Wear:** Lower mechanical stress on belts and screws.
- **Higher Quality:** Reduces "ringing" or "ghosting" in prints/cuts.
- **Trade-off:** S-Curve motion is computationally more intensive and complicates "junction deviation" (cornering) calculations.

## Configuring Jerk

In the current version of grblHAL, Jerk is primarily configured via **Compile-Time options** in `config.h`.

### 1. Enable S-Curve Acceleration
You must compile grblHAL with S-Curve enabled. In the Web Builder or `config.h`:
- Ensure the Jerk/S-Curve option is checked or defined.

### 2. Tuning `ACCELERATION_TICKS_PER_SECOND`
This setting in `config.h` controls the resolution of the acceleration curve.
- **Default:** `100` (10ms segments). Good for 8-bit or lower-end 32-bit boards.
- **Higher Quality:** `500` - `1000`. Provides much smoother motion but requires a faster processor (Teensy 4.1, STM32F4/H7).
- **Warning:** Higher values consume more CPU power.

### 3. Tuning `SEGMENT_BUFFER`
If you increase `ACCELERATION_TICKS_PER_SECOND`, you **must** increase the segment buffer size to prevent starvation.
- **Recommendation:** Buffer should hold at least 40-50ms of motion.
- If Ticks = 1000 (1ms), you need a buffer of at least 50-100 segments.

## Tuning Process

Once firmware is flashed:

1.  **Set Max Acceleration ($120-$122):**
    - Start conservative.
    - Find the point where motors stall, then reduce by 20%.

2.  **Set Jerk (Compile Time or Plugin):**
    - **Rule of Thumb:** Start with Jerk = 10x Acceleration.
    - *Example:* If Accel = 500 mm/s², Jerk ≈ 5000 mm/s³.
    - Higher Jerk = More aggressive (closer to Trapezoidal).
    - Lower Jerk = Smoother (rounder corners, slower starts).

### Known Issues
- **Jogging Delays:** There is a known issue where long jogging moves may take time to process or stop due to the complexity of the S-curve planner.
