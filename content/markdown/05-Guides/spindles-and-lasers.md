# Spindles & Lasers Setup

grblHAL is unique in its ability to support **multiple active tools** on the same machine. You can have a high-speed spindle for milling, a laser for engraving, and a drag knife for cutting vinyl—all controlled by the same board, switching between them with a simple command.

This guide covers how to configure spindles, lasers, and dual-tool setups.

---

## 1. Multiple Spindles: The Basics

In grblHAL, a "Spindle" is any device that spins, cuts, or emits light. The system can manage multiple such devices, referring to them by an index (`0`, `1`, `2`...).

### **Identifying Your Spindles**
By sending `$SPINDLES`, grblHAL lists available spindles:
```text
2 - H-100, enabled as spindle 0, active
0 - PWM
1 - PWM2
```
*   **Note:** In this example, Spindle `2` (H-100) is the currently active "Spindle 0". The others (PWM, PWM2) are available but not currently selected or enabled.

### **Enabling Spindles**
Just because a spindle is listed doesn't mean it's ready to use. You often need to:
1.  **Set the Default Spindle:** Use **`$395`** to select which physical tool index is the "Primary" spindle on startup.
2.  **Enable Additional Spindles:**
    *   **`$511`**: Enables Spindle 2.
    *   **`$512`**: Enables Spindle 3.
    *   *(Note: These are driver-specific and may vary, but are common for multi-spindle boards).*
3.  **Configure it:** Set options in `$9` (Primary), `$709` (Secondary), etc.
4.  **Select it:** Use `M104 Q...` to make it the active tool.

### **Switching Tools (`M104`)**
To switch the active device, use the `M104` command with the `Q` parameter:
*   **`M104 Q0`**: Selects Spindle 0.
*   **`M104 Q1`**: Selects Spindle 1.

### **Automatic Spindle Switching (Tool Mapping)**
Instead of manually inserting `M104` commands, you can configure grblHAL to automatically switch spindles based on the Tool Number (`T`) used in `M6`.

| Setting | Description | Example |
| :--- | :--- | :--- |
| **`$520`** | Min. Tool for Spindle 0 | `0` (Default) |
| **`$521`** | Min. Tool for Spindle 1 | `100` (Tools 100+ use Spindle 1) |
| **`$522`** | Min. Tool for Spindle 2 | `200` (Tools 200+ use Spindle 2) |

**Example Workflow:**
*   `M6 T1`: grblHAL stays on **Spindle 0** (Primary).
*   `M6 T101`: grblHAL automatically switches to **Spindle 1** (Secondary/Laser).
*   `M6 T1`: Switches back to **Spindle 0**.

*Note: Requires a hard reset after changing these settings.*

**Example G-Code:**
```gcode
M104 Q0     ; Select Spindle
M3 S10000   ; Turn on Spindle at 10k RPM
... mill path ...
M5          ; Stop Spindle
M104 Q1     ; Switch to Laser
M3 S100     ; Turn on Laser at 10% power (focus)
... laser path ...
```

---

## 2. Configuring Spindles (`$9`, `$709`, etc.)

Each spindle has its own configuration setting (bitmask) that defines its behavior.

*   **Primary Spindle (`$9`)**: Controls the main output.
*   **Secondary Spindle (`$709`)**: Controls the second output (if supported by board/firmware).

These settings allow you to:
- **Invert PWM:** If your laser is on at S0.
- **Enable/Disable Laser Mode:** Crucial for dual setups (see Advanced section below).
- **Control Enable Pin Logic.**

*(See [Settings Reference](../04-Reference/complete-settings-reference.md#9--pwm-spindle-options-primary) for bitmask details.)*

---

## 3. Laser Mode Guide (`$32`)

When using a laser, enabling **Laser Mode** (`$32=1`) changes grblHAL's physics to produce cleaner engravings.

### **What Laser Mode Does**
1.  **Eliminates Pauses:** No dwell for spindle spin-up/down.
2.  **Enables Dynamic Power (`M4`):** Scales power with speed to prevent burning corners.
    *   *Accelerating?* Power drops.
    *   *Cruising?* Target power.
    *   *Stopped?* Laser is **OFF** instantly.

### **M3 vs M4: Critical Difference**

| Command | Name | Behavior | Best Use |
| :--- | :--- | :--- | :--- |
| **M3** | Constant Power | Laser output is constant regardless of speed. Turns on immediately. | **Cutting** (where depth must be consistent). |
| **M4** | Dynamic Power | Power scales with speed. Turns OFF when stationary. | **Engraving** (images, photos, vectors). |
| **M5** | Laser OFF | Turns off the beam. | Safety / End of job. |

**Warning:** Using **M3** for engraving will burn deep holes at every corner where the machine slows down. Always use **M4** for engraving.

---

## 4. Advanced: Dual Mill + Laser Setup

If your machine has both a spindle and a laser, you don't want to manually toggle `$32` every time you swap tools. 
Instead, configure the **Spindle** to "ignore" Laser Mode.

### **Step-by-Step Configuration:**

1.  **Enable Laser Mode Globally:**
    *   Send `$32=1`. This makes the *system* ready for laser moves.

2.  **Configure the Spindle (`$9`):**
    *   We need to set **Bit 2 (Value 4)** on the Primary Spindle settings (`$9`).
    *   This bit means: *"Disable Laser Capability for this tool."*
    *   *Calculation:* 
        - Default PWM Spindle is usually Bit 0 (Enable) + Bit 1 (RPM controls Enable) = `3`.
        - Add Bit 2 (Disable Laser) -> `3 + 4 = 7`.
    *   **Send `$9=7`** (Check your specific driver defaults, but 7 is common).

3.  **Result:**
    *   **When `M104 Q0` (Spindle) is active:** grblHAL ignores `$32`. It pauses for spin-up and uses Constant Power (M3 behavior), even if you send M4.
    *   **When `M104 Q1` (Laser) is active:** grblHAL uses full Laser Mode (Dynamic Power, no pauses).

### **Workflow Example**
1.  **Job 1 (Milling):**
    - `M104 Q0` (Select Spindle)
    - `M3 S12000` (Spindle starts, machine waits for spin-up)
    - Cut part.
2.  **Job 2 (Laser Engraving):**
    - `M104 Q1` (Select Laser)
    - `M4 S500` (Laser enables in Dynamic Mode)
    - Engrave logo.

---

## 5. Handling Physical Offsets

When you switch from your Spindle to your Laser, the "cutting point" physically moves because they are mounted in different spots. If you don't account for this, your laser engraving will be offset from your milled pocket.

### **Method A: Work Coordinate Systems (Standard)**
The most robust way to handle this is using G-code Work Coordinate Systems (WCS).
1.  **Assign G54 to Spindle:** Zero your Spindle on the workpiece.
2.  **Assign G55 to Laser:**
    - Mark a point on scrap material with the Spindle (small drill peck).
    - Jog the **Laser** until the crosshair/dot aligns perfectly with that mark.
    - Zero the laser position in the **G55** coordinate system (`G10 L20 P2 X0 Y0`).
3.  **Use in G-Code:**
    - When milling: `G54`
    - When lasering: `G55`

### **Method B: Firmware Offsets (`$770`/`$771`)**
Some builds of grblHAL include a **Spindle Offset Plugin** that handles this automatically in firmware.
*   **`$770`**: X Offset for Secondary Spindle.
*   **`$771`**: Y Offset for Secondary Spindle.

**⚠️ Note:** If you do not see these settings, the plugin is **not compiled into your firmware**.
To enable it, you must compile with **`SPINDLE_OFFSET=1`** defined in your configuration (e.g., `my_machine.h` map). Otherwise, use **Method A** (which works on all controllers).

---

## Troubleshooting

### **Laser Won't Turn On**
- Check `$32=1`.
- Check `$30` matches your sender's Max S-Value (usually 1000).
- Wiring: Ensure PWM and Ground are connected correctly.
- Safety: Some lasers require a separate "Enable" pin triggered.

### **Weak Output**
- Check `$30` (Max RPM). If grblHAL expects 10000 RPM (`$30=10000`) but you send `S1000`, your laser is only at 10% power. Set `$30=1000` for 0-100% control logic.

### **Spindle Replaces Laser in Status Report**
- This is normal. The status report (`?`) shows the current *active* tool state. Sending `M104 Qx` changes which one is reported.

> 🔥 **Danger**
> **ALWAYS WEAR LASER SAFETY GLASSES.**
> Reflected 450nm (Blue) or 10600nm (CO2) light can instantly cause permanent blindness. Never run a laser unattended.

