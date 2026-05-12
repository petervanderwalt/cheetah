# VFD Spindle Setup

grblHAL supports controlling VFD (Variable Frequency Drive) spindles directly via Modbus (RS485). This allows for precise RPM control, direction switching, and real-time status feedback (voltage, current, actual RPM) without using a simple 0-10V analog signal.

## Supported VFDs

The following VFDs are supported by the `plugins/spindle/vfd` modules:
- **Huanyang** (SL series and others using the common protocol)
- **H-100** (Common cheap VFDs)
- **GS20**
- **YL-620**
- **Nowforever**
- **ModVFD** (Generic configurable driver)

---

## 1. Wiring (RS485)

To connect a VFD, you nominally need an RS485 module connected to your microcontroller's UART pins.

| RS485 Module | VFD Terminal |
| :--- | :--- |
| **A+** | RS+ / A+ / 485+ |
| **B-** | RS- / B- / 485- |
| **GND** | GND / COM |


> 💡 **Tip**
> *   Use **twisted pair** cable for A and B.
> *   Use **shielded cable**, grounding the shield at the controller side only.
> *   RS485 is sensitive to noise; keep it away from the main spindle power cables.
> *   If communication fails, try swapping A and B lines (labeling varies by manufacturer).


---

## 2. Firmware Compilation

VFD support is enabled by defining the spindle type for a specific spindle slot (0-3). Use the following IDs:

| ID | VFD Type |
| :-- | :--- |
| **1** | Huanyang (SL Series) |
| **3** | GS20 |
| **4** | YL-620A |
| **5** | ModVFD (Generic Configurable) |
| **6** | H-100 |

### **Example Configuration**
In your map file or CMake configuration (e.g., `my_machine.h`), assign the ID to a spindle enable slot:

```c
// Example: Spindle 0 is PWM, Spindle 1 is Huanyang
#define SPINDLE0_ENABLE 11  // PWM Spindle
#define SPINDLE1_ENABLE 1   // Huanyang VFD
#define SPINDLE_OFFSET  1   // Enable Offset Plugin
```

---

## 3. grblHAL Configuration

Once flashed, you must tell grblHAL which spindle is the VFD and how to talk to it.

### **Step A: Configure Modbus Communication**
Before binding a spindle, ensure grblHAL talks the same language as your VFD.

| Setting | Description | Common Value | Notes |
| :--- | :--- | :--- | :--- |
| **`$374`** | **Baud Rate** | `19200` (Index 1) | Most VFDs default to 19200. Check manual (e.g., PD164/F164). |
| **`$375`** | **Timeout (ms)** | `50` - `200` | Increase if you get sporadic communication errors. |
| **`$681`** | **Serial Format** | `0` (8N1) | `1`=8E1, `2`=8O1. (Default: 0/8N1). |

### **Step B: Bind the Spindle**
Use the following settings to map the VFD to a Spindle ID.
*   **`$395`**: Selects the **Primary Spindle** type.
*   **`$511`**: Selects **Spindle 1** (Secondary).
*   **`$512`**: Selects **Spindle 2** (Tertiary).

*Use `$SPINDLES` to verify which ID corresponds to your VFD.*

### **Step C: Set Modbus Address**
The VFD must have a Modbus address set in its own front panel parameters (usually `PD002` or similar). grblHAL needs to match this.

| Setting | Description | Default |
| :--- | :--- | :--- |
| **`$476`** | Address for Spindle 0 | 1 |
| **`$477`** | Address for Spindle 1 | 2 |
| **`$478`** | Address for Spindle 2 | 3 |

### **Step D: Generic ModVFD Configuration**
If you are using the **ModVFD** driver (ID 5) for a VFD that doesn't have a native driver, you must map the grblHAL settings to your VFD's Modbus registers. Consult your VFD manual's "Communication" or "Modbus" section.

| Setting | Description | Default | Notes |
| :--- | :--- | :--- | :--- |
| **`$462`** | **Control Register** | `8192` (0x2000) | The register address to write Run/Stop commands to. |
| **`$463`** | **Set Frequency Register** | `8193` (0x2001) | The register to write the target frequency/RPM to. |
| **`$464`** | **Get Frequency Register** | `8451` (0x2103) | The register to read the actual current frequency/RPM from. |
| **`$465`** | **Command: Run CW** | `18` (0x12) | The value to write to `$462` to start Forward motion. |
| **`$466`** | **Command: Run CCW** | `34` (0x22) | The value to write to `$462` to start Reverse motion. |
| **`$467`** | **Command: Stop** | `1` (0x01) | The value to write to `$462` to Stop. |
| **`$468`** | **RPM Prog Multiplier** | `50` | Used to scale RPM to VFD units. |
| **`$469`** | **RPM Prog Divider** | `60` | `Value = (RPM * Mutliplier) / Divider` |
| **`$470`** | **RPM Read Multiplier** | `60` | Used to scale VFD units back to RPM. |
| **`$471`** | **RPM Read Divider** | `100` | `RPM = (Value * Multiplier) / Divider` |

---

## 4. VFD-Specific Settings (Examples)
Different VFDs require different handling. Identify yours below.

#### **1. Huanyang (SL Series)**
*   **Driver ID:** `1`
*   **VFD Panel Settings:**
    *   `PD001` = `2` (Source of Run Commands: Comm Port)
    *   `PD002` = `2` (Source of Operating Frequency: Comm Port)
    *   `PD163` = `1` (Comm Address, matches `$476`)
    *   `PD164` = `2` (Baud Rate: 19200 - Common Default)
    *   `PD165` = `3` (Data Format: 8N1 RTU)

#### **2. H-100 VFD**
*   **Driver ID:** `6`
*   **VFD Panel Settings:**
    *   `F001` = `2` (Control Mode: Comm)
    *   `F002` = `2` (Frequency Mode: Comm)
    *   `F163` = `1` (Slave Address)
    *   `F164` = `2` (19200 Baud -  Common Default)
    *   `F165` = `3` (Data Format: 8N1)

#### **3. PwnCNC VFD**
*   **Driver ID:** `5` (ModVFD)
*   **grblHAL Manual Register Mapping:**
    *   `$395` = (Select ModVFD ID)
    *   `$462` = `40960`
    *   `$463` = `40961`
    *   `$464` = `36864`
    *   `$465` = `1` (CW)
    *   `$466` = `2` (CCW)
    *   `$467` = `6` (Stop)
    *   `$468` = `25`
*   **VFD Panel Settings (Auto Mode):**
    *   `P0.0.03` = `2`
    *   `P0.0.04` = `9`
    *   `P4.1.00` = `04`
    *   `P4.1.01` = `4`

#### **4. GS20 / YL-620A**
*   **Driver ID:** `3` (GS20) or `4` (YL-620A)
*   **Settings:** `$461`: RPM to Hz ratio. (Default: 60).

---



## 5. Spindle Offsets (Laser/Dual Tool)
If using the VFD as a primary spindle and a laser as secondary, you can configure physical offsets if the `spindle_laser_offset` plugin is enabled.

*   **`$770`**: Laser X Offset (mm).
*   **`$771`**: Laser Y Offset (mm).
*   **`$772`**: Offset Options (Update G92 vs. Keep Position).

---

## Troubleshooting

### **"Error: Spindle not responding"**
1.  **Check Baud Rate:** standard grblHAL VFD plugins usually default to 9600 or 19200. Check the source (`init` function) or your VFD manual.
2.  **Swap lines:** A/B signaling is often mislabeled. Swap them and retry.
3.  **Ground:** Ensure common ground between VFD control board and CNC controller.

### **Spindle Runs Backward**
*   Swap any two of the three uvw phase wires connecting the VFD to the motor. Do **not** swap input power wires.

### **Alarm 14: Spindle at Speed Timeout**
This alarm triggers if the spindle takes too long to reach the target RPM.
*   **Increase Timeout:** Check your **Spindle at Speed Timeout** setting (often `$339`). VFDs ramp up slowly; increase this value.
*   **Increase On Delay:** Increase `$394` (Spindle On Delay) if not using at-speed feedback.
*   **Check Feedback:** If using "at-speed" feedback (e.g., encoder or VFD register), ensure the signal is valid.

### **Error 19: Modbus Exception**
The VFD received a command it rejected, or communication failed entirely.
*   **VFD Not Ready:** The VFD may still be booting up or not powered on.
*   **Modbus Disconnected:** Check for broken wires or loose terminals on the RS485 wiring.
*   **Wiring Noise:** Electrical noise can corrupt packets. Use shielded twisted pair cable.
*   **Check Baud Rate:** Verify `$374` matches the VFD.
*   **Check State:** The VFD might be in a fault state or "Local" mode, rejecting remote commands.
*   **Check IDs:** Ensure the VFD Modbus ID matches `$476` (or `$460`).
