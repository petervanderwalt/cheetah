# Complete Settings Reference

This page is a comprehensive reference for all known grblHAL settings. It is designed to be a single source of truth for configuration. Use the table of contents on the right to navigate to a specific section, or use your browser's search function (`Ctrl+F`) to find a specific setting.

---

## `$0` – Step Pulse Time

Controls the length of the step signal pulse (in microseconds) sent to all stepper drivers.  
If too short, drivers may **miss steps**. If too long, it can **limit maximum step rate**.


> ℹ️ **Info**
> - Applies to **all axes**.
> - Works together with `$2` (Step Pulse Invert) and `$29` (Pulse Delay).
> - Adjust only if your drivers require longer pulses.


| Value (µs) | Effect |
|------------|--------|
| **1–2**    | Typical for modern drivers (Trinamic, TB6600, Leadshine, etc.). |
| **3–5**    | Safer setting for slower opto-isolated inputs. |
| **10+**    | Rare, but sometimes required by old/slow external drivers. |

#### Common Examples
* **Modern Digital Drivers (default):**  
  `$0=2`

* **Opto-Isolated Drivers (slow input stage):**  
  `$0=5`

* **Debugging Missed Steps:**  
  `$0=10`

#### Tips & Tricks
- Always start **low** (e.g. 2 µs) and only increase if you see reliability issues.  
- A higher value reduces maximum achievable step frequency.  
- If `$29` (Pulse Delay) is used, the **effective pulse width** is `$29 (Pulse Delay) + $0 (Pulse on time) + $0 (Pulse off time)`.  
- Pulse off time is variable, it is the time between the pulses. This is capped to a minimum of 2 µs. So 1 / ($29+ $0 + 2) is the max theoretical step frequency - which may be higher than what the controller is capable of.
- Pulse Off Time is hard-coded to 2 µs minimum. It is only relevant when approaching the maximum possible step rate. Later versions of most drivers will limit the max rate instead of lowering the the off-time, where earlier drivers would break down.

---

## `$1` – Step Idle Delay

Controls how long (in milliseconds) the stepper motors remain energized after motion stops.  
This affects whether motors **hold position** when idle or are allowed to release torque.


> ℹ️ **Info**
> - Applies to **all axes**.
> - The delay starts counting **after the last motion command finishes**.
> - A value of `255` keeps steppers always enabled.  (Maintains compatibility with legacy Grbl)



> ⚠️ **Warning**
> If you do require motors to be disabled - it may be better to use `$37` - as it allows per-axis control over which motors are enabled/disabled during Idle state. This allows you to keep Z enabled for example, which may drop under the mass of a heavy spindle, but still allows disabling of X and Y for example.


| Value (ms) | Effect |
|------------|--------|
| **0**      | Disable motors immediately when motion stops. |
| **1–65535**  | Keep motors energized for the given time, then disable. |
| **255**    | Keep motors **always enabled** (no timeout). |

#### Common Examples
* **Power Saving, Light Machine:**  
  Release motors quickly to reduce heat.  
  `$1=25`

* **Medium Hold Needed:**  
  Keep motors on briefly to prevent drift, but still allow cooldown.  
  `$1=100`

* **Heavy Machines / Critical Position Hold:**  
  Always keep motors enabled to maintain position.  
  `$1=255`

#### Tips & Tricks
- For small hobby machines, a short delay can reduce **motor heat and power use**.  
- For heavy gantries or machines with **gravity-loaded axes (like Z)**, keeping motors **always on** (`255`) is safest.  
- If you notice motors “dropping” or losing zero when idle, increase this value.  

---

## `$2` – Step Pulse Invert (mask)

Controls the polarity of the **step pulses** for each axis.  
Some stepper drivers require the step signal to be inverted (active-low instead of active-high).  
This setting allows you to configure that per axis.


> ℹ️ **Info**
> - Applies **individually per axis** (X, Y, Z, A, B, C).
> - Expressed as a **bitmask**: add together the axis values you want inverted.
> - Related settings:
> - `$3` – Direction Invert (mask)
> - `$4` – Invert Stepper Enable


| Axis | Bit Value | Description |
|------|-----------|-------------|
| X    | 1         | Invert X step pulse |
| Y    | 2         | Invert Y step pulse |
| Z    | 4         | Invert Z step pulse |
| A    | 8         | Invert A step pulse |
| B    | 16        | Invert B step pulse |
| C    | 32        | Invert C step pulse |

#### Common Examples
* **All normal (default):**  
  `$2=0`

* **Invert X only:**  
  `1` → `$2=1`

* **Invert X and Y:**  
  `1 + 2 = 3` → `$2=3`

* **Invert all six axes:**  
  `1+2+4+8+16+32 = 63` → `$2=63`

#### Tips & Tricks
- Only change this if your **drivers require inverted pulses**.  
- If motors don’t move even though steps are being sent, check this setting.  
- Do **not confuse** with `$3` (Direction Invert) — `$2` affects the **pulse signal polarity**, not movement direction.  

---

## `$3` – Direction Invert (mask)

Controls the polarity of the **direction signal** for each axis.  
If an axis moves in the opposite direction than expected, invert it here instead of rewiring the motor.


> ℹ️ **Info**
> - Applies **individually per axis** (X, Y, Z, A, B, C).
> - Expressed as a **bitmask**: add together the axis values you want inverted.
> - Related settings:
> - `$2` – Step Pulse Invert (mask)
> - `$23` – Homing Direction Invert (mask)


| Axis | Bit Value | Description |
|------|-----------|-------------|
| X    | 1         | Invert X direction |
| Y    | 2         | Invert Y direction |
| Z    | 4         | Invert Z direction |
| A    | 8         | Invert A direction |
| B    | 16        | Invert B direction |
| C    | 32        | Invert C direction |

#### Common Examples
* **Default (no inversion):**  
  `$3=0`

* **Invert Y only:**  
  `2` → `$3=2`

* **Invert X and Z:**  
  `1 + 4 = 5` → `$3=5`

* **Invert all six axes:**  
  `1+2+4+8+16+32 = 63` → `$3=63`

#### Tips & Tricks
- If an axis jogs in the **wrong direction**, flip it here.  
- `$23` (Homing Direction Invert) is **separate** — `$3` affects **normal motion**, `$23` affects **homing only**.  
- Prefer changing this setting instead of swapping motor wires, so configs are **self-documented** and repeatable.  


---

## `$4` – Invert Stepper Enable (mask)

Controls the polarity of the **enable signal** for stepper drivers.  
Some drivers expect an **active-low** enable, while others expect **active-high**.  
This setting lets you match the signal to what your driver requires.


> ℹ️ **Info**
> - Applied as a **mask per axis** (X, Y, Z, A, B, C).
> - Related settings:
> - `$2` – Step Pulse Invert (mask)
> - `$3` – Direction Invert (mask)


| Axis | Bit Value | Description |
|------|-----------|-------------|
| X    | 1         | Invert X enable signal |
| Y    | 2         | Invert Y enable signal |
| Z    | 4         | Invert Z enable signal |
| A    | 8         | Invert A enable signal |
| B    | 16        | Invert B enable signal |
| C    | 32        | Invert C enable signal |

#### Common Examples
* **Default (active-high, all axes same):**  
  `$4=0`

* **Invert all axes (active-low enable):**  
  `$4=255` (or `$4=63` if only 6 axes are defined)

* **Invert Z only:**  
  `4` → `$4=4`

#### Tips & Tricks
- If your motors **never engage** (drivers always disabled), try toggling this.  
- Some driver boards **share a single enable line** — use `$4=0` or `$4=1`
- On multi-axis boards with **independent enables**, masking per axis can help if different driver types are used together.  
- If `$4` is set incorrectly, and `$1` is not set to 255 you may notice a thumping noise coming from the motors when you try to jog, but no movement. That is a good troubleshooting indicator that `$4` is set incorrectly.

---

## `$5` – Invert Limit Inputs (mask)

Controls the polarity of the **limit switch inputs**.  
If your limit switches trigger in reverse (always “on” when idle, “off” when pressed), invert them here.


> ℹ️ **Info**
> - Expressed as a **bitmask** (X, Y, Z, A, B, C).
> - Related to `$18` (Pull-up Disable Limit Inputs).


| Axis | Bit Value | Description |
|------|-----------|-------------|
| X    | 1         | Invert X limit input |
| Y    | 2         | Invert Y limit input |
| Z    | 4         | Invert Z limit input |
| A    | 8         | Invert A limit input |
| B    | 16        | Invert B limit input |
| C    | 32        | Invert C limit input |

#### Common Examples
* **Default (normally-closed switches):**  
  `$5=0`

* **Normally-open switches on all X, Y and Z:**  
  `$5=7`

* **Normally-open switches on all axes:**  
  `$5=63`

* **Invert Z only:**  
  `$5=4`

#### Tips & Tricks
- Normally-closed (NC) switches are safer (detect wire breaks) and more EMI resistant, so ideally try to use Normally Closed switches.  
---

## `$6` – Invert Probe Input (boolean/mask)

Controls the polarity of the **probe input pin(s)**.  
If your probe shows **triggered when it's not making contact**, invert it here.


> ℹ️ **Info**
> - In most builds: `$6` is a simple **boolean** (0=normal, 1=invert).
> - In grblHAL builds with **multiple probes enabled**, `$6` becomes a **bitmask**: each probe input can be inverted independently.
> - Related settings:
> - `$65` – Probing Options (mask)


### Single-Probe Mode (default)
| Value | Description |
|-------|-------------|
| **0** | Normal (active-high probe trigger) |
| **1** | Inverted (active-low probe trigger) |

### Multi-Probe Mode (bitmask)
| Probe           | Bit Value | Description |
|-----------------|-----------|-------------|
| Primary Probe   | 1   | Invert Primary Probe input |
| Toolsetter      | 2   | Invert Toolsetter input |
| Secondary Probe | 4   | Invert Secondary Probe input |

#### Common Examples
* **Default wiring (NO probe):**  
  `$6=0`

* **NC probe, triggers “off” when idle:**  
  `$6=1`

* **Multiple probes, invert Probe 2 only:**  
  `2` → `$6=2`

* **Invert Probes 1 and 3:**  
  `1 + 4 = 5` → `$6=5`

#### Tips & Tricks
- If `$6` is wrong, probing will either **alarm immediately** or **never trigger**.  
- Multi-probe configs are common in **toolsetter + touch plate** setups.  
- With Multi Probe configs, checkout `G65P5` in [https://github.com/grblHAL/core/wiki/Expressions-and-flow-control#inbuilt-g65-macros](https://github.com/grblHAL/core/wiki/Expressions-and-flow-control#inbuilt-g65-macros)


---

## `$8` – Ganged Axes Direction Invert (mask)

Controls the direction of the **secondary motor** in a ganged (dual-motor) axis.  
For example, on a dual-Y gantry machine, you may need one motor to spin in the opposite direction in a belted configuration.


> ℹ️ **Info**
> - Only applies if you have **ganged axes** (e.g., dual-Y or dual-Z).
> - This inversion is applied after any configured inversions in `$3 - Direction Invert (mask)`
> - Expressed as a bitmask **per axis**
> - Only **X**, **Y** and **Z** can be ganged


| Axis | Bit Value | Description |
|------|-----------|-------------|
| X    | 1         | Invert secondary X motor direction |
| Y    | 2         | Invert secondary Y motor direction |
| Z    | 4         | Invert secondary Z motor direction |

#### Common Examples
* **Dual-Y axis, invert second Y motor:**  
  `$8=2`

* **Dual-Z gantry, invert second Z motor:**  
  `$8=4`

#### Tips & Tricks
- Use this setting if the machine tries running the ganged motors in opposite directions to each other.
- Always check squaring after changing this.  


---

## `$9` – PWM Spindle Options (Primary)

Controls behavior for the **primary PWM spindle** if available (spindle type 11 or 12).  


> ℹ️ **Info**
> - Only applies if you have a **PWM spindle**.
> - Expressed as a **bitmask**.
> - Bit values can be combined to enable multiple behaviors.
> - Related settings:
> - `$709` – PWM Spindle Options (Secondary)


| Bit | Value | Description |
|-----|-------|-------------|
| 0   | 1     | Disable PWM output entirely |
| 1   | 2     | Let RPM control spindle **on/off** signal (S0 disables spindle, S>0 enables) |
| 2   | 4     | Disable laser capability. In multi-spindle setups, this allows $32 (laser mode) to remain permanently on while selecting a non-laser spindle. |
| 3   | 8     | Enable ramping PWM output on RPM changes: ($394 > 0, enables ramp up for spindle on and on RPM changes while spindle is enabled. $339 > 0, enables ramp down for spindle off. $392 > 0, enables ramp up on door close and/or restore from parked.) |

#### Common Examples
* **Enable PWM output with RPM controlling spindle enable:**  
  `$9=3` (bit 0 + bit 1)

* **Enable PWM, RPM control, and disable laser mode:**  
  `$9=7` (bits 0, 1, 2)

#### Tips & Tricks
- If you use **M3 or M4 with S0**, the spindle enable output will follow `$9` bit 1 if set.  
- Useful for CO2 laser engraving: `$9` bit 1 can allow "overdriving" the PWM signal for short pulses or pixels.  (See https://github.com/grblHAL/core/issues/721#issuecomment-2776210888)
- **Laser mode management:** `$9` bit 2 prevents Laser Mode from being active while using this spindle. This allows $32 (laser mode) to stay permanently on for dual-spindle/laser machines, Laser Mode activates dynamically based on whether the PWM spindle or the PWM Laser is the current tool.
- Switching between spindles/toolheads can be done using `M104 Qx` where `x` is the index of the spindle in a `$spindles` output

---

## `$10` – Status Report Options (bitmask)

Configures what information is included in the **real-time status reports** (`?` command).  
This allows you to customize what grblHAL streams back to the host.


> ℹ️ **Info**
> - Expressed as a **bitmask** (sum of values).
> - grblHAL extends this beyond classic Grbl.
> - Common usage: enable only the fields your GUI needs.


| Bit | Value | Option |
|-----|-------|--------|
| 0   | 1     | Position in **machine coordinates** (MPos) |
| 1   | 2     | **Buffer state** (planner / RX) |
| 2   | 4     | **Line numbers** |
| 3   | 8     | **Feed & speed** |
| 4   | 16    | **Pin state** (limit, probe, etc.) |
| 5   | 32    | **Work coordinate offset** (WCO) |
| 6   | 64    | **Overrides** (feed, spindle, rapid) |
| 7   | 128   | **Probe coordinates** |
| 8   | 256   | **Buffer sync on WCO change** |
| 9   | 512   | **Parser state** (sent separately, only on changes) |
| 10  | 1024  | **Alarm substatus** |
| 11  | 2048  | **Run substatus** (can help with simple probe protection) |
| 12  | 4096  | **Enable during homing** (report also sent while homing) |
| 13  | 8192  | **Distance to Go**

#### Common Examples

* **Default:**  
  `$10=511`

* **Classic Grbl behavior:**  
  `$10=255` (first 8 flags)

* **Full report (all flags):**  
  `$10=8191`

#### Tips and Trick
- Enabling more fields = more **serial traffic**.  
- Some GUIs may rely on specific fields (e.g. offsets, parser state).  
- `Parser state` is not included inline, but sent separately on changes.  
- `Run substatus` can be used as a simple **probe protection** indicator.  


> 🔥 **Danger**
> - Do not enable the `Run Substatus` option unless the sender can handle it.



> 💡 **Tip**
> - The `Run Substatus` option adds `:` to the status where `` can be `1` for feed hold pending and `2` for probing. E.g. `Run:2` indicates that the current motion is for probing.
> - Feed hold pending (`Run:1`) is output when a feed hold is asked for during spindle synchronized motion, the hold will be executed after the synced motion is complete.
> - If used for probe protection the sender will have to cancel the current motion if the probe is triggered when the substate is not `Run:2`.


---

## `$11` – Junction Deviation

Controls the path blending tolerance when the toolpath changes direction.  
It affects **cornering speed** and **smoothness**.


> ℹ️ **Info**
> - Units: millimeters.


#### Common Examples
* **Default:**  
  `$11=0.010`


#### Tips & Tricks
- This is an advanced tuning parameter — defaults are perfectly fine.  Please do not change these values unless specifically requested to do so

---

## `$12` – Arc Tolerance

Defines the maximum error allowed when interpolating arcs (G2/G3).  
Smaller values = more precise arcs, but more segments.


> ℹ️ **Info**
> - Units: millimeters.
> - Controls how finely arcs are broken into small line segments.


#### Common Examples
* **Default:**  
  `$12=0.002`


#### Tips & Tricks
- This is an advanced tuning parameter — defaults are perfectly fine.  Please do not change these values unless specifically requested to do so

---

## `$13` – Report in Inches (boolean)

Switches between metric and imperial units in **status reports only**.  
Does **not** affect G-code commands.


> ℹ️ **Info**
> - G-code units are set with `G20` (inches) and `G21` (mm).
> - `$13` affects only the report format to the host.


| Value | Effect |
|-------|--------|
| 0     | Reports in millimeters |
| 1     | Reports in inches |

#### Common Examples
* **Default (metric):**  
  `$13=0`

* **For imperial-based senders:**  
  `$13=1`

#### Tips & Tricks
- Leave at `0` unless your sender specifically requires inches.  Most G-code senders prefer the reports to be in metric, and handle imperial conversions locally, as most of grblHAL is metric in nature
---

---

## `$14` – Invert Control Inputs (mask)
Controls the polarity of the various control input signals. Use this to match the controller to your button or sensor wiring, such as Normally Open (NO) vs. Normally Closed (NC).


> ℹ️ **Info**
> - This is a **bitmask**: add together the values of the inputs you want to invert.
> - This setting is crucial for correctly wiring physical control buttons and safety signals like E-Stop and Safety Door.
> - It is related to `$17` (Pull-up Disable Control Inputs), which controls the electrical state of the pins.


| Bit | Value | Input to Invert | Common Use |
|:---:|:-----:|:----------------|:-----------|
| 0   | 1     | Reset | A button that triggers a soft-reset. |
| 1   | 2     | Feed Hold | A button or switch to pause the current job. |
| 2   | 4     | Cycle Start | A button to start or resume a G-code program. |
| 3   | 8     | Safety Door | A switch on the enclosure door that pauses the job when opened. |
| 4   | 16    | Block Delete | A switch to enable the block delete (`/`) G-code function. |
| 5   | 32    | Optional Stop | A switch to enable the optional stop (`M1`) G-code command. |
| 6   | 64    | E-Stop | A dedicated emergency stop button. **Must be wired NC.** |
| 7   | 128   | Probe Connected | A signal indicating that a detachable probe is connected. |
| 8   | 256   | Motor Fault | An input from external drivers indicating a motor or driver fault. |
| 9   | 512   | Motor Warning | An input from external drivers indicating a non-critical warning. |
| 10  | 1024  | Limits Override | A switch to temporarily disable hard limits for jogging off a switch. |
| 11  | 2048  | Single Step Blocks | A switch to enable single-block execution mode. |

#### Common Examples
*   **Default (All inputs wired NO - Normally Open):**
    *   This is the default electrical configuration.
    *   `$14=0`
*   **Safety Switches Wired NC (Recommended):**
    *   Inverting Feed Hold, Safety Door, and E-Stop buttons which are wired Normally Closed for safety.
    *   `2` (Feed Hold) + `8` (Safety Door) + `64` (E-Stop) → `$14=74`
*   **All Common Buttons Wired NC:**
    *   Inverting Reset, Feed Hold, Cycle Start, and Safety Door.
    *   `1` (Reset) + `2` (Feed Hold) + `4` (Start) + `8` (Door) → `$14=15`

#### Tips & Tricks
- It is highly recommended to use **Normally Closed (NC) switches** for all safety-critical inputs like E-Stop, Safety Door, and Feed Hold. This is a failsafe design, as a broken or disconnected wire will immediately trigger the alarm, just like pressing the button would.
- If a button seems to be "stuck on," it almost certainly needs to have its logic inverted with this setting.
- Use the real-time status report (`?`) to check the state of some of these inputs for easier debugging.
- E-Stop instead of Reset is default for many boards. Currently no boards can have both enabled at the same time

---

## `$15` – Invert Coolant Outputs (mask)

Inverts the logic of the **coolant outputs** (Flood, Mist).  
Some relays expect an active-low signal.


> ℹ️ **Info**
> - Expressed as a **mask**:
> - Bit 0 = Flood
> - Bit 1 = Mist


#### Common Examples
* **Default (active-high relays):**  
  `$15=0`

* **Invert Flood only:**  
  `$15=1`

* **Invert Flood + Mist:**  
  `$15=3`

#### Tips & Tricks
- If coolant relays **toggle backwards**, change this instead of rewiring.  
---

## `$16` – Invert Primary Spindle Outputs (mask)

Controls polarity of the **spindle control outputs** (PWM, enable, direction).  
Some spindle drivers expect inverted logic.


> ℹ️ **Info**
> - For spindle types 11, 12 and 13
> - Expressed as a **mask**:
> - Bit 0 = Spindle Enable
> - Bit 1 = Spindle Direction
> - Bit 2 = Spindle PWM
> - Related settings:
> - `$716` – Invert Secondary Spindle Outputs (mask)


#### Common Examples
* **Default:**  
  `$16=0`

* **Invert Spindle Enable only:**  
  `$16=1`

* **Invert all signals:**  
  `$16=7`

#### Tips & Tricks
- If the spindle **runs when it should stop**, check `$16`.  
- Combine with `$33–$36` for full PWM control tuning.  

---

## `$17` – Pull-up Disable Control Inputs (mask)
Disables the internal pull-up resistors on the control input pins (Cycle Start, Feed Hold, Reset).


> ℹ️ **Info**
> - Most control buttons are simple switches that connect an input pin to Ground. For this to work, the pin needs a "pull-up" resistor to keep it at a high voltage when the button isn't pressed.
> - Disabling this is only necessary if you have **external pull-up resistors** or are using **active drivers** for these inputs.


| Bit | Value | Input to Invert | Common Use |
|:---:|:-----:|:----------------|:-----------|
| 0   | 1     | Reset | A button that triggers a soft-reset. |
| 1   | 2     | Feed Hold | A button or switch to pause the current job. |
| 2   | 4     | Cycle Start | A button to start or resume a G-code program. |
| 3   | 8     | Safety Door | A switch on the enclosure door that pauses the job when opened. |
| 4   | 16    | Block Delete | A switch to enable the block delete (`/`) G-code function. |
| 5   | 32    | Optional Stop | A switch to enable the optional stop (`M1`) G-code command. |
| 6   | 64    | E-Stop | A dedicated emergency stop button. **Must be wired NC.** |
| 7   | 128   | Probe Connected | A signal indicating that a detachable probe is connected. |
| 8   | 256   | Motor Fault | An input from external drivers indicating a motor or driver fault. |
| 9   | 512   | Motor Warning | An input from external drivers indicating a non-critical warning. |
| 10  | 1024  | Limits Override | A switch to temporarily disable hard limits for jogging off a switch. |
| 11  | 2048  | Single Step Blocks | A switch to enable single-block execution mode. |

#### Common Examples
*   **Default (Internal Pull-ups Enabled):**
    *   This is correct for 99% of setups.
    *   `$17=0`
*   **Disable Pull-up for Feed Hold Only:**
    *   You have an external circuit providing the signal for the Feed Hold pin.
    *   `$17=2`

##### Tips & Tricks
- If a control input seems "stuck" or doesn't respond, do **not** change this setting first. Check your wiring and the `$14` (Invert Control Inputs) setting.
- For most hobbyist setups, you should never need to change this from `0`.
- Note: For boards with proper signal conditioning and onboard physical pullups, this feature is slated for removal
---

## `$18` – Pull-up Disable Limit Inputs (mask)
Disables the internal pull-up resistors on the limit switch input pins.


> ℹ️ **Info**
> - This works exactly like `$17`, but applies to the limit switch pins.
> - It is extremely rare to disable this, as nearly all limit switches (NO or NC) rely on these internal pull-ups.


| Bit | Value | Input |
|:---:|:-----:|:------|
| 0   | 1     | X-Limit |
| 1   | 2     | Y-Limit |
| 2   | 4     | Z-Limit |
| 3   | 8     | A-Limit |
| 4   | 16    | B-Limit |
| 5   | 32    | C-Limit |

#### Common Examples
*   **Default (Internal Pull-ups Enabled):**
    *   This is the correct setting for standard mechanical or optical limit switches.
    *   `$18=0`

##### Tips & Tricks
- Only disable this if your limit switches are part of an active circuit (e.g., a buffer board) that provides its own pull-ups.
- Disabling this with standard switches will cause the inputs to "float," leading to random limit triggers.
- Note: For boards with proper signal conditioning and onboard physical pullups, this feature is slated for removal
---

## `$19` – Pull-up Disable Probe Inputs (mask)
Disables the internal pull-up resistors on the probe input pins.


> ℹ️ **Info**
> - This works exactly like `$17`, but applies to the probe inputs.
> - You might disable this if you are using an optically-isolated probe or a powered probe interface that provides its own clean signal, or you are using a board that has proper signal conditioning and does not rely on MCU pullups


| Bit | Value | Input |
|:---:|:-----:|:------|
| 0   | 1     | Primary Probe (PRB) |
| 1   | 2     | Secondary Probe / Toolsetter (TLS) |
| 1   | 2     | Third Probe |

#### Common Examples
*   **Default (Internal Pull-ups Enabled):**
    *   Correct for simple touch plates and most common probes.
    *   `$19=0`
*   **Disable Pull-up for Primary Probe:**
    *   Your main probe has a powered interface board.
    *   `$19=1`

##### Tips & Tricks
- If your probe input seems noisy or unreliable, ensuring the pull-up is **enabled** (`$19=0`) is the first step.
- Disabling the pull-up for a passive switch/touch plate will make probing completely non-functional.
- Note: For boards with proper signal conditioning and onboard physical pullups, this feature is slated for removal
---

## `$20` – Soft Limits Enable (boolean)
Enables a safety feature that prevents the machine from moving beyond its configured travel limits.


> ℹ️ **Info**
> - This is a **software** check. It monitors G-code commands and jogging to see if a move would exceed the axis travel defined in `$130` - `$135`.
> - It is a critical feature for preventing crashes.
> - It **requires a successful homing cycle** to know where the machine's boundaries are.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| No software travel limits are enforced. |
| 1     | Enabled | grblHAL will throw an error if a move exceeds the max travel for a homed axis. |

#### Common Examples
*   **Machine Unable to Home / New Uncalibrated setup:**
    *   Keep soft limits off until homing is working perfectly.
    *   `$20=0`
*   **Production Use (Highly Recommended):**
    *   Enable soft limits for safe operation.
    *   `$20=1`

##### Tips & Tricks
- Always enable soft limits once your machine is properly configured. It's free insurance against typos in G-code or jogging mistakes.
- Avoid jogging mistakes by also setting `$40=1` - this will limit jogging commands to remain within the working area
- If you get a `Alarm 2`, it means your G-code is trying to move outside the machine's work area defined by `$130-$135`.  It usually means you either forgot to home, Homing isn't working correctly, or your job/jog move really does exceed the machine's working envelope

---

## `$21` – Hard Limits Enable (mask)
Enables a safety feature that uses the physical limit switches to stop the machine instantly in an emergency.


> ℹ️ **Info**
> - This is a **hardware** check. If any limit switch is triggered *during* a move, grblHAL will immediately halt all axes and enter an alarm state.
> - This is your last line of defense against a crash if soft limits fail or are not active.
> - It is a **bitmask**: add together the values of the options you want to enable. The "Enable" bit (value 1) must be set for any of the other options to work.


| Bit | Value | Meaning | Description |
|:---:|:-----:|:--------|:------------|
| 0   | 1     | Enable  | The master switch to turn on hard limit detection. |
| 1   | 2     | Strict Mode | When a switch is engaged, only a homing cycle is allowed to clear the state. Jogging away is disabled. |
| 2   | 4     | Disable for Rotary | Hard limits will be ignored for rotary axes (A, B, C), but remain active for linear axes (X, Y, Z). |

#### Common Examples
*   **No Limit Switches Installed (or Disabled):**
    *   You must keep this disabled.
    *   `$21=0`
*   **Standard Hard Limits (Recommended):**
    *   Enables hard limits for all axes.
    *   `1` → `$21=1`
*   **Strict Mode Enabled:**
    *   For maximum safety, forcing a re-home after a limit trigger.
    *   `1` (Enable) + `2` (Strict) → `$21=3`
*   **Hard Limits for Linear Axes Only:**
    *   Useful if your rotary axis has no limit switches or is designed to rotate continuously.
    *   `1` (Enable) + `4` (Disable Rotary) → `$21=5`

#### Tips & Tricks
- Hard limits can sometimes be triggered by electrical noise. If you get false alarms, check the shielding on your limit switch wires and consider adding a small capacitor (e.g., 0.1uF) across the switch input pins.
- In "Strict Mode," you cannot simply jog off a triggered switch. You must reset and perform a homing cycle, which is safer as it re-establishes the machine's true position.
- Normally-closed (NC) switches are safer (detect wire breaks) and more EMI resistant, so ideally try to use Normally Closed switches.  

---

## `$22` – Homing Options (mask)
Configures the behavior of the homing cycle.


> ℹ️ **Info**
> - This setting **enables and configures homing options only**.
> - It does **not** control which axes are homed. That is managed by the Homing Phase settings, starting with `$44`.
> - This is a **bitmask**: add together the values of the options you want to enable.


| Value | Bit | Option Description |
| :--- | :--- | :--- |
| **1** | 0 | **Enable Homing Cycle:** This is the master switch. It must be enabled to allow the `$H` command to run. |
| **2** | 1 | **Enable Single Axis Homing Commands:** Allows use of single-axis homing commands like ``$HX``, ``$HY`` or ``$HA`` etc |
| **4** | 2 | **Homing on Startup Required:** Forces the user to run a homing cycle before any G-code motion is allowed. A key safety feature. |
| **8** | 3 | **Set Machine Origin to 0:** After homing, sets the machine position at the switch trigger point to `0`. If disabled, it's set to the axis maximas - also known as  HOMING_FORCE_SET_ORIGIN|
| **16**| 4 | **Two Switches Share One Input:** Informs grblHAL that two homing switches are wired in parallel to a single input pin. |
| **32**| 5 | **Allow Manual Homing:** Allows homing (via single axis commands like ``$HX``, ``$HY`` or ``$HA``) for axes not part of homing sequences (`$44-$47`) |
| **64**| 6 | **Override Locks:** Allows jogging motion even when the machine is in an alarm state that normally requires homing. |
| **256**| 8 | **Use Limit Switches:** Allows homing switches to also function as hard limit switches when the homing cycle is not active. |
| **512**| 9 | **Per-Axis Feedrates:** Allows using separate feed rates for each axis during homing. |
| **1024**| 10 | **Run Startup Scripts on Homing Complete:** If enabled, startup scripts will only execute after a successful homing cycle. |

#### Common Examples
*   **Simple Homing Enabled:**
    *   Enables the `$H` command only, standard homing setup
    *   `1` → `$22=1`

##### Tips & Tricks
- Homing is one of the most important features to configure for a reliable machine.  All offsets and coordinate systems depends on a reliably established Machine coordinate system.  Without homing several features will feel like they don't work quite correctly.
- For a new machine, start with just `$22=1` and then add more options once you have confirmed the basic cycle works.
- The machine can be homed **without homing switches** by setting bit 0, 1 and 5 and setting all homing sequences to 0. Jog to the home position and send $H. Operations relying on axes homed (soft limits, …) will now work as if the machine has been homed


> 💡 **Tip**
> - Per-Axis Feedrates enables axis settings `$18x` and `$19x`, `$24` and `$25` will be disabled (not reported).
> - You may have to restart the sender to make the change visible.


---

## `$23` – Homing Direction Invert (mask)
Defines the location of the homing switch for each axis, which in turn determines the direction of travel during a homing cycle.


> ℹ️ **Info**
> - By default, grblHAL assumes all homing switches are located at the **maximum** (`+`) end of each axis's travel. The default homing cycle therefore moves in the positive direction.
> - This setting is a **bitmask** used to override that default assumption. Setting a bit for an axis tells grblHAL its switch is at the **minimum** (`-`) end of travel instead.
> - This setting is **only** for the homing cycle (`$H`). It does not affect normal jogging or G-code motion.


| Value | Axis | Switch Location Assumed |
|:-----:|:-----|:------------------------|
| 1     | X    | Invert to assume switch is at X-minimum (left). |
| 2     | Y    | Invert to assume switch is at Y-minimum (front). |
| 4     | Z    | Invert to assume switch is at Z-minimum (bottom, rare, bad-practice). |
| 8     | A    | Invert to assume switch is at A-minimum. |
| 16    | B    | Invert to assume switch is at B-minimum. |
| 32    | C    | Invert to assume switch is at C-minimum. |

#### Common Examples
*   **Default (Switches at X, Y, Z maxima):**
    *   The machine will home to the back-right-top corner.
    *   `$23=0`
*   **Switches at X-min and Y-min (front-left homing location):**
    *   A very common setup for machines that home to the front-left.
    *   `1` (X-min) + `2` (Y-min) → `$23=3`

#### Tips & Tricks
- The primary symptom of an incorrect `$23` setting is an axis moving **away** from its switch during the `$H` command.
- Do not confuse this with `$3` (Direction Invert). `$3` flips the direction for **all** motion to match your motor wiring. `$23` flips the homing direction to match your **switch location**.
- Set this mask to match the **physical location** of your switches relative to the desired machine origin.
- Note: Unless HOMING_FORCE_ORIGIN is used, the position of the switch does change the machine origin (Not recommended)

---

## `$24` – Homing Locate Rate (mm/min)
Sets the slower feed rate used to precisely locate the switch trigger point on the 2nd approach


> ℹ️ **Info**
> - After the initial fast search (`$25`) finds the switch, the machine backs off (`$27`) and then re-approaches slowly at this rate.
> - A slower rate here results in a more accurate and repeatable machine zero position.


| Value (mm/min) | Meaning | Description |
|:--------------:|:--------|:------------|
| 10-50          | Precise | Good for most machines, ensures a very accurate zero. |
| 50-100         | Faster  | A good compromise if homing cycles are too slow. |

#### Common Examples
*   **High-Precision Machine:**
    *   `$24=25`
*   **Standard Hobby CNC:**
    *   `$24=100`

##### Tips & Tricks
- This value should always be significantly slower than your `$25` search rate.
- If your homing position is inconsistent between cycles, try lowering this value, or add homing passes with `$43`

---

## `$25` – Homing Search Rate (mm/min)
Sets the faster feed rate used to initially find the homing switches during the 1st approach


> ℹ️ **Info**
> - This is the speed the machine moves at the start of the homing cycle (`$H`).
> - Setting it too high can cause a crash if the switch fails, but setting it too low makes the homing cycle take a long time.


| Value (mm/min) | Meaning | Description |
|:--------------:|:--------|:------------|
| 200-500        | Safe    | A conservative speed for initial setup. |
| 500-1500+      | Fast    | A typical speed for a well-tuned machine. |

#### Common Examples
*   **Initial Machine Setup:**
    *   `$25=400`
*   **Tuned Production Machine:**
    *   `$25=1000`

##### Tips & Tricks
- This rate should never be higher than the axis maximum rate (`$110` - `$115`). A value of 50-70% of the maximum rate is a good starting point.
- If the motor slams violently into the limit switches during the homing search, this value is too high.

---

---

## `$26` – Homing Switch Debounce Delay (ms)
Sets a delay *after* a homing switch is triggered and released to prevent mechanical switch bounce from causing a false re-trigger.


> ℹ️ **Info**
> - Most grblHAL boards use hardware interrupts to detect the switch press instantly. After the initial trigger is processed and the machine backs off the switch (`$27`), the controller will wait for this delay time (`$26`) before it is allowed to sense the switch again.
> - This prevents the mechanical "bounce" that occurs when the switch physically settles from immediately causing a false second trigger.


| Value (ms) | Meaning | Description |
|:----------:|:--------|:------------|
| 1-5       | Low Bounce | For high-quality microswitches or electronic switches with clean signals. |
| 10-50     | Standard Bounce | A safe value for typical mechanical limit switches. |

#### Common Examples
*   **Typical Mechanical Switches (Default):**
    *   A good starting point that provides enough settling time for most switches.
    *   `$26=25`
*   **High-Quality Optical/Inductive Switches:**
    *   Optical switches have no mechanical bounce, so a minimal delay can be used.
    *   `$26=1`

#### Tips & Tricks
- If your homing cycle fails intermittently, or an axis immediately alarms after backing off the switch, it is likely due to switch bounce. Increasing this value is the correct fix.
- Unlike a traditional debounce filter, this setting does **not** cause an inaccuracy in the homed position, because the delay happens *after* the initial position has already been latched by the interrupt.
- Setting this value too high will simply make the homing cycle take slightly longer, but it is otherwise safe.

## `$27` – Homing Pull-off Distance (mm)
Sets the distance each axis moves *away* from the limit switches after they have been triggered.


> ℹ️ **Info**
> - This ensures that the switches are not left in a pressed state after the homing cycle completes.
> - It defines the small gap between your machine's physical limit and the established Machine Zero (`Mpos:0`).


| Value (mm) | Meaning | Description |
|:----------:|:--------|:------------|
| 1-3        | Typical | A small, safe distance that works for most machines. |
| 3-5+       | Large   | Useful for machines with less accurate switches to ensure they are fully released. |

#### Common Examples
*   **Standard CNC:**
    *   `$27=2.0`
*   **Machine with Roller Switches:**
    *   `$27=5.0`

##### Tips & Tricks
- This value must be large enough to fully release your mechanical switches.
- Pulloff is not taken into account for manually homed axes, only axes homed using homing switches

---

## `$28` – G73 Retract Distance (mm)
Sets the retract distance for the `G73` high-speed peck drilling cycle.


> ℹ️ **Info**
> - `G73` is a specific canned cycle for drilling where the drill bit makes small "pecks" to break chips, but only retracts a very small amount between each peck.
> - This setting defines that small retract distance.


| Value (mm) | Meaning | Description |
|:----------:|:--------|:------------|
| 0.5 - 2.0  | Typical | A small value to quickly break the chip without fully retracting from the hole. |

#### Common Examples
*   **Default for General Use:**
    *   `$28=1.0`

##### Tips & Tricks
- This is a specialized setting only used for `G73`. It does not affect standard `G81` or `G82` cycles.
- The full retract for other cycles is controlled by the `G98`/`G99` command in your G-code.

---

## `$29` – Pulse Delay (microseconds)
Adds an extra delay between the direction pin being set and the step pulse being sent.


> ℹ️ **Info**
> - Some older or slower stepper drivers require a "setup time" — a brief pause after the direction is commanded before they can accept a step pulse.
> - This setting provides that pause. For most modern drivers, it is not needed.


| Value (µs) | Meaning | Description |
|:----------:|:--------|:------------|
| 0          | None    | Correct for nearly all modern drivers (Trinamic, TB6600, etc.). |
| 1-10       | Short Delay | May be required for some drivers with opto-isolators (DMA420A, DQ542MA, DM556T) |


> ⚠️ **Warning**
> When set > 0 and less than 2 the value is rounded up to 2 microseconds.


#### Common Examples
*   **Modern Digital Drivers (Default):**
    *   `$29=0`

##### Tips & Tricks
- Only add a delay here if you are experiencing randomly missed steps on fast direction changes and have already ruled out mechanical issues and acceleration (`$12x`) being too high.
- This delay can slightly limit the maximum achievable step rate.


> ℹ️ **Info**
> - From the `DM556T` documentation (Stepperonline version): DIR signal: This signal has low/high voltage levels to represent two directions of motor rotation. Minimal direction setup time of `5μs`.
> - Chinese knock-offs like `DMA420A` and `DQ542MA` may require even longer setup times
> - Complicating this is that the AMASS algorithm will often output the direction change before the next step - possibly masking that this delay is required - but it is good practice to configure required delay correctly


---


## `$30` – Maximum Spindle Speed (RPM)
Sets the spindle speed that corresponds to the maximum PWM output signal (100% duty cycle).


> ℹ️ **Info**
> - This setting is for the **primary PWM spindle** (or devices controlled by a PWM signal, such as a 0-10V converter for a VFD).
> - It is the key to scaling your spindle speed. It links a G-code `S` value to the PWM output.
> - For example, if `$30=24000`, then an `S24000` command will result in 100% PWM, and an `S12000` command will result in 50% PWM.
> - **Note:** For most **Modbus-controlled VFDs**, this setting is ignored, as the min/max RPM is read directly from the VFD's parameters.
> - Related settings:
> - `$730`


| Value (RPM) | Meaning | Description |
|:-----------:|:--------|:------------|
| 1 - 100000+ | Max RPM | The maximum rated speed of your spindle. |

#### Common Examples
*   **24,000 RPM Spindle with 0-10V Control:**
    *   `$30=24000`
*   **Laser Engraver (0-1000 Power Scale):**
    *   A common convention is to treat power as a percentage from 0-1000.
    *   `$30=1000` (Now `S500` means 50% power).

#### Tips & Tricks
- For a VFD using a 0-10V converter, this value should match the max frequency/RPM setting in your VFD for accurate speed control.
- If you command `S` values higher than `$30`, the PWM output will simply be clamped to 100%.

---

## `$31` – Minimum Spindle Speed (RPM)
Sets the minimum spindle speed that can be commanded for a PWM-controlled spindle.


> ℹ️ **Info**
> - For VFDs controlled by a 0-10V signal, this setting prevents `S` commands from going below a safe limit where the spindle might stall or overheat.
> - If a G-code command requests a speed lower than this value (but not zero), the PWM output will be set to the minimum value defined by `$35`. A value of `0` disables this feature.
> - **Note:** For most **Modbus-controlled VFDs**, this setting is ignored, as the min RPM is read directly from the VFD.
> - Related settings:
> - `$731`


| Value (RPM) | Meaning | Description |
|:-----------:|:--------|:------------|
| 0           | Disabled| Allows any `S` command, including very low speeds. |
| 100 - 8000+ | Min RPM | The minimum safe operating speed of your spindle. |

#### Common Examples
*   **Laser Engraver (where S0 is valid):**
    *   `$31=0`
*   **VFD-controlled Spindle (0-10V) with 6000 RPM Min Speed:**
    *   `$31=6000`

#### Tips & Tricks
- This setting is crucial for preventing VFD faults at low RPMs when using 0-10V control.
- If `$31` is set to a value greater than `0`, it is important to also set `$35` (PWM Min Value) correctly to ensure the RPM-to-PWM scale is accurate.

---

## `$32` – Laser Mode (boolean)
Enables or disables Laser Mode, which fundamentally changes motion control to suit laser cutting and engraving.


> ℹ️ **Info**
> - This is a **global setting**. When enabled, it affects the currently active tool unless overridden by the tool-specific settings (`$9` and `$709`).
> - When enabled (`1`), it eliminates spindle "spin-up" delays and automatically scales laser power with feed rate overrides to ensure consistent burn intensity.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Standard CNC operation for spindles. Motion pauses for `M3`/`M5`. |
| 1     | Enabled | Optimized for lasers. Motion is continuous, and power scales with speed. |

#### Common Examples
*   **Spindle-Only Machine:**
    *   `$32=0`
*   **Laser-Only Machine:**
    *   `$32=1`
*   **Dual Spindle/Laser Machine:**
    *   `$32=1` (and use `$9=4` on the spindle to disable laser capability for that tool).

#### Tips & Tricks
- **Never** use a physical spindle when laser mode is active for that tool. The machine will not pause for the spindle to get up to speed, which is dangerous. Use the `$9` and `$709` settings to manage this safely on dual-purpose machines.

---

## `$33` – Spindle PWM Frequency (Hz)
Sets the frequency of the **primary** PWM signal, used for spindle, laser, or servo control.


> ℹ️ **Info**
> - The correct frequency depends entirely on the receiving device (VFD converter, laser driver, or servo). An incorrect value can lead to poor control or no response.
> - Related settings:
> - `$733`


| Value (Hz) | Common Use Case |
|:----------:|:----------------|
| **50**     | **Standard R/C Servos** |
| ~1000      | Many laser diode drivers. |
| 5000       | Often recommended for VFD 0-10V PWM-to-analog converters. |

#### Tips & Tricks
- **Always** check the documentation for your specific hardware. There is no "universal" correct value.
- If your spindle speed is erratic or a servo jitters, this is one of the first settings to verify.
- The response time increases with lower frequencies, e.g. for high speed grayscale laser engravings a higher frequency may be beneficial.

---

## `$34` – Spindle PWM Off Value
The raw PWM value to be output from the **primary** channel when the spindle is off (`M5`).


> ℹ️ **Info**
> - This setting is part of a group (`$34`, `$35`, `$36`) that maps the `S` command range to a raw PWM output range. The size of this range is driver-dependent (e.g., 0-255 or 0-1000).
> - This value corresponds to 0% duty cycle, which should be `0` for most applications.
> - Related settings:
> - `$734 PWM2 Spindle PWM Off Values`


#### Common Examples
*   **VFD/Laser (Universal Default):**
    *   `$34=0`

---

## `$35` – Spindle PWM Min Value
The raw PWM value for the **primary** channel corresponding to the minimum spindle speed (`$31`).


> ℹ️ **Info**
> - This sets the lower limit of the PWM duty cycle range.
> - **For VFDs/Lasers:** It linearizes the output for controllers that have a "dead zone" at the low end.
> - **For R/C Servos:** This value creates the minimum pulse width (e.g., 1.0ms).
> - Related settings:
> - `$735 PWM2 Spindle PWM Min Values`


#### Common Examples
*   **VFD Ignores Low Voltages:**
    *   Your spindle doesn't start until 15% power. On a 0-1000 scale, this is `150`.
    *   `$35=150`

---

## `$36` – Spindle PWM Max Value
The raw PWM value for the **primary** channel corresponding to the maximum spindle speed (`$30`).


> ℹ️ **Info**
> - This sets the upper limit of the PWM duty cycle range.
> - For VFDs/Lasers, this should almost always be the maximum value of the PWM range (e.g., 255 or 1000) to allow for 100% power.
> - For R/C Servos, this value creates the maximum pulse width (e.g., 2.0ms).
> - Related settings:
> - `$736 PWM2 Spindle PWM Max Values`


#### Common Examples
*   **VFD/Laser (Universal Default):**
    *   Assuming a 0-1000 PWM range.
    *   `$36=1000`
*   **R/C Servo Control (0-180°):**
    *   **Goal:** Map `S0`-`S180` to a 1-2ms pulse within a 20ms window (50Hz).
    *   `$30=180` (S-range)
    *   `$33=50` (50Hz)
    *   `$35=50` (1ms pulse = 5% of 20ms. 5% of 1000 = 50)
    *   `$36=100` (2ms pulse = 10% of 20ms. 10% of 1000 = 100)


---

## `$37` – Steppers to Keep Enabled (mask)
Specifies which axes should ignore the `$1` idle delay and remain energized at all times.


> ℹ️ **Info**
> - This is a grblHAL-specific feature that provides per-axis control over the motor idle state.
> - It is useful for axes that must resist external forces even when idle (e.g., a Z-axis subject to gravity, or a heavy gantry).
> - This is a **bitmask**: add together the values of the axes you want to keep permanently enabled.


| Bit | Value | Axis to Keep Enabled |
|:---:|:-----:|:---------------------|
| 0   | 1     | X-Axis |
| 1   | 2     | Y-Axis |
| 2   | 4     | Z-Axis |
| 3   | 8     | A-Axis |
| 4   | 16    | B-Axis |
| 5   | 32    | C-Axis |

#### Common Examples
*   **Default (All axes use `$1` delay):**
    *   No axes are forced to stay on.
    *   `$37=0`
*   **Keep Z-Axis Enabled:**
    *   Prevents the Z-axis from dropping under gravity when idle. X and Y will disable as normal.
    *   `4` → `$37=4`

##### Tips & Tricks
- This setting is an **override**. If `$1=255` (always enabled), this setting has no effect.
- Use this to save power and reduce motor heat on axes that don't need holding torque, while keeping critical axes locked.

---

## `$38` – Spindle Pulses Per Revolution (PPR)
Informs grblHAL how many pulses it will receive from a spindle encoder for one full revolution.


> ℹ️ **Info**
> - This is an advanced feature required for **spindle-synchronized motion**, such as G33 spindle synchronized motion and lathe threading.
> - It does **not** control spindle speed; it provides high-resolution positional feedback of the spindle's rotation.
> - It requires a physical encoder mounted to the spindle.
> - It can also be used for **Spindle at Speed** automatic spin up/spin down delay if `$340` is set `> 0`.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Spindle synchronization features are turned off. |
| 1-N   | PPR/CPR | The number of Pulses (or Counts) Per Revolution of your encoder. |

#### Common Examples
*   **Feature Disabled (Default):**
    *   `$38=0`
*   **Using a 1024-PPR Encoder:**
    *   `$38=1024`

##### Tips & Tricks
- This setting is mainly relevant to lathe threading in grblHAL.
- Do not enable this unless you have a properly configured spindle encoder connected to the correct input pins on your controller.

---

## `$39` – Enable Legacy Realtime Commands (boolean)
Enables compatibility for older G-code senders that use legacy printable, single-byte real-time commands.


> ℹ️ **Info**
> - Legacy real-time commands were ASCII characters like `?`, `!`, `~`. Some older control programs may still send these.
> - Modern commands are non-printable characters (e.g., `0x80` to `0x87`).
> - This setting is purely for backward compatibility.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Only legacy non-printable real-time commands are accepted. |
| 1     | Enabled | Both modern and legacy single-byte commands are accepted. |

#### Common Examples
*   **Default:**
    *   Maintain compatibility with older senders.
    *   `$39=1`

##### Tips & Tricks
- For most users with up-to-date software, this setting can be set to disabled (`0`).

---

## `$40` – Limit Jog Commands (boolean)
Prevents jogging moves from exceeding the machine's software travel limits (`$13x`).


> ℹ️ **Info**
> - This is a safety feature
> - It checks the target position of any manual jog command and will clamp/trim it to stay within the boundaries. This elegantly clamps the jog instead of raising soft/hard limit errors
> - It **requires a successful homing cycle** to be effective.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Jogging commands can be sent regardless of software limits. |
| 1     | Enabled | Jogging commands that would exceed the machine's workspace are clamped/trimmed. |

#### Common Examples
*   **During Initial Setup (before homing works):**
    *   `$40=0`
*   **For Safe Operation (Recommended):**
    *   `$40=1`

##### Tips & Tricks
- It is highly recommended to enable this (`$40=1`) along with Soft Limits (`$20=1`) to prevent accidental crashes while jogging.

---

## `$41` – Parking Cycle (mask)
Configures and enables the single-axis parking motion.


> ℹ️ **Info**
> - **Important:** The parking feature in grblHAL is a **single-axis motion** that retracts one axis to a predefined safe location.
> - The axis to move is selected with **`$42`**.
> - **How it’s triggered:** Parking motion is executed automatically when certain events occur:
> - `0x84` Realtime command
> - Safety door open (if configured)
> - When the Event Plugin calls a Park Event
> - If bit 2 is set, you can use **M56** to enable/disable parking override control at runtime.
> - This is a **bitmask**: add together the values of the options you want to enable.
> - Related settings:
> - `$61 Safety Door Options (mask)`


| Bit | Value | Option |
|:---:|:-----:|:-------|
| 0   | 1     | Enable parking motion |
| 1   | 2     | Deactivate upon init |
| 2   | 4     | Enable parking override control (via M56) |

#### Common Examples
* **Enable parking (simple):**  
  `$41=1`

* **Enable parking with M56 override control:**  
  `$41=5` (1 + 4)

#### Tips & Tricks
- For most users, `$41=1` is sufficient: parking will automatically retract the tool on `0x84`  or door open.  
- Use `$41=5` if you want to toggle parking on/off dynamically with M56.  

---

## `$42` – Parking Axis
Selects which single axis will be moved during a parking cycle.


> ℹ️ **Info**
> - This setting determines which axis executes the pull-out/plunge and fast move when parking is triggered.
> - For most machines, Z-axis (`2`) is used to retract the spindle/tool safely upward.


| Value | Axis to Park |
|:-----:|:-------------|
| 0     | X-axis |
| 1     | Y-axis |
| 2     | Z-axis |
| 3     | A-axis |
| 4     | B-axis |
| 5     | C-axis |
| 6     | U-axis |
| 7     | V-axis |

#### Common Examples
* **Standard CNC (Retract Z-axis up):**  
  `$42=2`

#### Tips & Tricks
- The entire parking config (`$56` through `$59`) applies **only** to the axis selected here.  


## `$43` – Homing Passes
Configures the number of homing passes to perform during the homing cycle.


> ℹ️ **Info**
> - **Purpose:** The `$43` setting determines how many times each axis will move during the homing cycle. This is particularly useful for ensuring precise homing.
> - **Default Value:** The default value is typically `1`, meaning each axis will only home one cycle during the homing cycle.


| Value | Description |
|:-----:|:-----------|
| 0     | Disable homing |
| 1     | Perform one homing pass |
| 2     | Perform two homing passes |
| 3     | Perform three homing passes |
| 4     | Up to a maximum of 4 passes |

#### Common Examples
* **Standard Homing:**
  * `$43=1` → Each axis homes once during the homing cycle.
* **Enhanced Precision:**
  * `$43=2` → Each axis homes twice during the homing cycle
* **Maximum Precision:**
  * `$43=3` → Each axis homes three times during the homing cycle, for machines requiring the highest precision.

#### Tips & Tricks
- **Machine Type Considerations:** Machines with high precision requirements or those that experience mechanical flexing may benefit from additional homing passes.
- **Performance Impact:** More homing passes will increase the time it takes to complete the homing cycle; balance the need for precision with the desired homing speed.

---

## `$44, $45, $46, $47, $48, $49` – Axes Homing Phases (mask)
Defines which axes move during each pass of the homing cycle. You can have up to 4 separate phases in your homing cycle.


> ℹ️ **Info**
> - Each setting is a **bitmask**: add together the values of the axes you want to move **simultaneously** in that pass.


| Bit | Value | Axis |
|:---:|:-----:|:----|
| 0   | 1     | X-Axis |
| 1   | 2     | Y-Axis |
| 2   | 4     | Z-Axis |
| 3   | 8     | A-Axis |
| 4   | 16    | B-Axis |
| 5   | 32    | C-Axis |
| 4   | 64    | U-Axis |
| 5   | 128   | V-Axis |

#### Common Examples
* **Standard 3-Axis CNC (Z first, then XY):**  
  - `$44=4` → Pass 1: Home Z only.  
  - `$45=3` → Pass 2: Home X and Y together.  

* **XY-only machines (lasers, plotters):**  
  - `$44=3` → Home X and Y together.

* **Optional third axis (A-axis) as a separate pass:**  
  - `$44=4` → Pass 1: Home Z.  
  - `$45=3` → Pass 2: Home X and Y.  
  - `$46=8` → Pass 3: Home A-axis.  

#### Tips & Tricks
- Homing Z first is recommended for most machines to prevent the tool from dragging across clamps or the workpiece.
- Plan your homing sequence carefully, especially on multi-axis machines, to avoid collisions or mechanical stress.
- Set all to zero to allow enabling manual "homing" on machines without limit switches.

---

## `$50` – Jog Step Speed
Sets the feed rate (in mm/min) to be used for step-style jogging moves.


> ℹ️ **Info**
> - This is an optional, driver-specific setting, primarily used by pendants and jog wheels. It may not be available on all boards.
> - It defines the speed for precise, incremental jogs (e.g., moving exactly 0.1mm).
> - Works in conjunction with `$53` (Jog Step Distance).


| Value (mm/min) | Meaning |
|:--------------:|:--------|
| 1 - N          | The feed rate for short, precise jogging moves. |

#### Common Examples
*   **Precise Positioning Speed:**
    *   `$50=100`

#### Tips & Tricks
- This allows you to have a different, often slower, speed for fine-tuning your position compared to your general-purpose slow jog speed (`$51`).

---

## `$51` – Jog Slow Speed
Sets the feed rate (in mm/min) to be used for continuous slow jogging.


> ℹ️ **Info**
> - An optional, driver-specific setting for pendants and jog wheels.
> - This is the speed used when you are continuously holding down a jog button for slow, controlled movement.
> - Works in conjunction with `$54` (Jog Slow Distance).


| Value (mm/min) | Meaning |
|:--------------:|:--------|
| 1 - N          | The feed rate for continuous slow jogging. |

#### Common Examples
*   **Controlled Slow Jog:**
    *   A speed that is fast enough to cover distance but slow enough for precise stopping.
    *   `$51=500`

---

## `$52` – Jog Fast Speed
Sets the feed rate (in mm/min) to be used for continuous fast jogging.


> ℹ️ **Info**
> - An optional, driver-specific setting for pendants and jog wheels.
> - This is the speed used when you are continuously holding down a jog button for rapid positioning.


| Value (mm/min) | Meaning |
|:--------------:|:--------|
| 1 - N          | The feed rate for continuous fast jogging. |

#### Common Examples
*   **Rapid Manual Positioning:**
    *   Typically set to a high percentage of the axis max rate.
    *   `$52=2500`

---

---

## `$53` – Jog Step Distance
Sets the smallest incremental distance for step-style jogging.


> ℹ️ **Info**
> - This optional, driver-specific setting defines the distance for each "click" or "step" of a jog command when the "step" (or "x1") increment is selected.
> - It's typically used for very fine adjustments, like 0.01mm or 0.001mm.


| Value (mm) | Description |
|:----------:|:------------|
| 0.001 - N  | The incremental distance for the smallest jog step. |

#### Common Examples
*   **Default for fine adjustments:**
    *   `$53=0.01`
*   **For ultra-fine positioning:**
    *   `$53=0.001`

#### Tips & Tricks
- This setting is crucial for precise zeroing and manual probing.

---

## `$54` – Jog Slow Distance
Sets the medium incremental distance for step-style jogging.


> ℹ️ **Info**
> - This optional, driver-specific setting defines the distance for each "click" or "step" of a jog command when the "slow" (or "x10") increment is selected.
> - It provides a balance between fine adjustment and covering distance quickly.


| Value (mm) | Description |
|:----------:|:------------|
| 0.01 - N   | The incremental distance for medium jog steps. |

#### Common Examples
*   **Default for general positioning:**
    *   `$54=0.1`
*   **For slightly coarser adjustments:**
    *   `$54=0.5`

#### Tips & Tricks
- This setting is often used for moving the tool into a general area before switching to finer jog increments.
- If `$40` (Limit Jog Commands) is enabled, you can safely set this value to be quite large if needed, as jogging commands will be clamped to stay within the machine's configured workspace, preventing accidental overtravel.

---

## `$55` – Jog Fast Distance
Sets the largest incremental distance for step-style jogging.


> ℹ️ **Info**
> - This optional, driver-specific setting defines the distance for each "click" or "step" of a jog command when the "fast" (or "x100") increment is selected.
> - It's used for quickly traversing significant distances across the machine's work area.


| Value (mm) | Description |
|:----------:|:------------|
| 0.1 - N    | The incremental distance for the largest jog step. |

#### Common Examples
*   **Default for rapid positioning:**
    *   `$55=1.0`
*   **For very large machines or long rapid moves:**
    *   `$55=10.0`

#### Tips & Tricks
- This setting helps quickly move the tool to the vicinity of the workpiece.
- If `$40` (Limit Jog Commands) is enabled, you can safely set this value to be quite large if needed, as jogging commands will be clamped to stay within the machine's configured workspace, preventing accidental overtravel.

---

## `$56` – Parking Pull-out / Plunge Distance
Sets an incremental distance for a pull-out move when parking, and a corresponding plunge move when resuming.


> ℹ️ **Info**
> - This setting defines a two-part motion used with the parking cycle.
> - **When Parking is triggered:**
> 1. The selected parking axis (`$42`) first **retracts slowly** by this incremental distance, at the feed rate defined by `$57`.
> 2. Then it **moves quickly** at the parking rate (`$59`) to the machine coordinate defined in `$58`.
> - **When Resuming (Cycle Start):**
> 1. The axis **rapids quickly** back from the parked coordinate to the plunge height (the retracted offset defined by `$56`).
> 2. It then **plunges slowly** by this same distance at the pull-out/plunge rate (`$57`) to return to the original depth before resuming motion.


| Value (mm) | Meaning |
|:----------:|:--------|
| -N to +N   | The incremental distance for the pull-out and plunge moves. |

#### Common Examples
* **No Pull-out/Plunge (Default):**  
  `$56=0.0` → parking goes directly to the target (`$58`), resuming goes directly back without any slow retract/plunge.

* **Gentle 5mm Lift:**  
  `$56=5.0` When parking is triggered, Z lifts 5mm slowly, then rapids to the parking coordinate. On resume it rapids back near the work, then slowly plunges down 5mm to resume cutting.

#### Tips & Tricks
- This is ideal for safely disengaging and re-engaging the tool without gouging.  
- The pull-out happens *before* the main parking rapid, the plunge happens *after* the return rapid.  

---

## `$57` – Parking Pull-out / Plunge Rate
Sets the feed rate for both the initial pull-out move and the final plunge move.


> ℹ️ **Info**
> - This rate applies only to the **incremental retract and plunge distance** set in `$56`.
> - It ensures the tool leaves and re-enters the work zone under controlled, slow conditions.


| Value (mm/min) | Meaning |
|:--------------:|:--------|
| 1 - N          | Feed rate for the pull-out and plunge moves. |

#### Common Examples
* **Slow, Careful Move:**  
  `$57=100`

#### Tips & Tricks
- Should be safe for moving out of (or back into) material contact.  

---

## `$58` – Parking Axis Target
Sets the absolute machine coordinate for the final parking position.


> ℹ️ **Info**
> - This is the **final machine coordinate** the parking axis will rapid to after the slow pull-out.
> - Defined in machine coordinates (`MPos` / G53 system).
> - Typically set to a clear, safe height (for Z) or retracted position (for another axis).


| Value | Meaning |
|:------|:--------|
| -N to 0 | Target machine coordinate for the selected axis. |

#### Common Examples
* **Park Z-Axis at Safe Height:**  
  `$58=-5.0` → Z goes to 5mm below home.

* **Fully Retract Z-Axis:**  
  `$58=-2.0` (with `$27=2.0` pull-off) → Z goes all the way up, just off the switch.  

#### Tips & Tricks
- Jog to the desired machine position, check `MPos`, and copy it into `$58`.  

---

## `$59` – Parking Fast Rate
Sets the feed rate for the main fast move to and from the parking coordinate.


> ℹ️ **Info**
> - **Parking:** After the slow pull-out (`$56/$57`), the axis moves at this speed to the parking target (`$58`).
> - **Resuming:** The axis rapids back at this speed from the parked coordinate to the plunge height.
> - This is the "fast" portion of the parking cycle.


| Value (mm/min) | Meaning |
|:--------------:|:--------|
| 1 - N          | Feed rate for the main rapid to/from the park position. |

#### Common Examples
* **Moderate Speed:**  
  `$59=800.0`

* **High Speed (tuned Z):**  
  `$59=1500.0`

#### Tips & Tricks
- This setting affects only the long travel, not the careful pull-out or plunge.  

---

## `$60` – Restore Overrides (boolean)
Controls whether feed, rapid, and spindle overrides are restored to their previous values when a G-code program ends.


> ℹ️ **Info**
> - Overrides allow you to adjust speeds and feeds in real-time (e.g., with a pendant or GUI slider).
> - If this setting is enabled, the override values you set during a job will be remembered for the next job.
> - If disabled, all overrides are reset to 100% after a program (`M2`/`M30`) finishes.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Overrides are reset to 100% after each job. (Safer) |
| 1     | Enabled | Override values persist between jobs. (Convenient) |

#### Common Examples
*   **Safety First (Default):**
    *   Ensures every new job starts at the programmed feed and speed.
    *   `$60=1`
*   **Production Use with Consistent Setups:**
    *   Useful if you always run a certain material at 80% feed, for example.
    *   `$60=0`

##### Tips & Tricks
- For beginners, it is highly recommended to leave this enabled (`$60=1`) to avoid surprise-fast or surprise-slow movements at the start of a new job.
- If you find your jobs are always starting slower or faster than programmed, check if this setting has been enabled.

---

## `$61` – Safety Door Options (mask)
Configures runtime behaviour for the safety-door input.


> ℹ️ **Info**
> - This is a small **bitmask** that controls how grblHAL treats the safety-door input.
> - **Note:** the safety-door *input itself* is a compile-time / board-map feature (it must be enabled and wired in the driver/board map). `$61` only controls run-time behaviour *once* the door input exists.
> - Typical behaviour when the door opens: grblHAL enters a DOOR/hold state (pauses the job and optionally runs the parking sequence). `$61` does **not** enable/disable the door input — it only modifies how door events are handled. Use `$41` (parking) and `$63` (hold actions) to control parking/hold behaviour.


| Bit | Value |  Description |
|:---:|:-----:|:------------|
| 0   | 1     | When set, **ignore** door-open events while the controller is in **IDLE**. Useful so you can open the enclosure for jogging/setup when the controller isn't running. |
| 1   | 2     | When set, do **not** turn off coolant outputs when the door opens — preserve the current coolant/spindle state across the door event. |

#### Common Examples
* **Default (door active):**  
  `$61=0` → Door-open events are handled normally (door will trigger DOOR/hold actions).

* **Allow opening the door while IDLE (for jogging/setup):**  
  `$61=1` → Door-open is ignored when the controller is IDLE (but still acts when running).

* **Keep coolant/spindle state across door events:**  
  `$61=2` → Do not turn off coolant when the door opens.

* **Both behaviours:**  
  `$61=3` → Ignore door when IDLE *and* keep coolant state on open.

#### Tips & Tricks
- **Retract / park / abort behaviour is not set by `$61`.** Use the parking settings (`$41` … `$60`) and feed-hold actions (`$63`) to control whether the machine performs a pull-out/park, power-down, or abort when the door opens.
- **Delays for restarting spindle/coolant after a door event** are controlled by the door delay settings (e.g. `$392` / `$393`).


---

## `$62` – Sleep Enable (boolean)
Enables the `$SLP` command, which allows the controller to enter a low-power sleep state.


> ℹ️ **Info**
> - This is an advanced power-saving feature.
> - When the `$SLP` command is received, grblHAL will shut down most peripherals and disable stepper motors.
> - A reset is required to bring the controller back online.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| The `$SLP` command is ignored. |
| 1     | Enabled | The `$SLP` command will put the controller to sleep. |

#### Common Examples
*   **Default for most machines:**
    *   `$62=0`

##### Tips & Tricks
- This setting is rarely used in typical CNC applications.
- It is more relevant for custom machines or battery-powered applications where minimizing power consumption is critical.

---

## `$63` – Feed Hold Actions (mask)
Configures additional actions that occur during a Feed Hold and on resume.


> ℹ️ **Info**
> - Applies to Feed Hold commands, or input signal on the Feed Hold input pin (button, etc)
> - A standard Feed Hold smoothly decelerates the machine and pauses the G-code program.
> - `$63` allows you to modify how the **laser or spindle/coolant** behaves during the hold and when resuming.
> - This is a **bitmask**: add together the values of the options you want to enable.


| Bit | Value | Action |
|:---:|:-----:|:------|
| 0   | 1     | Disable laser (or spindle) during feed hold |
| 1   | 2     | Restore spindle and coolant state on resume |

#### Common Examples
* **Default: Disable laser during hold, restore on resume**  
  `$63=3` → Laser/spindle is disabled during feed hold, and restored automatically when resuming.  

* **Disable laser only, do not restore automatically**  
  `$63=1` → Laser/spindle stops during feed hold, but the previous state is not restored on resume.

* **Restore spindle/coolant on resume without disabling during hold**  
  `$63=2` → Laser/spindle continues running during hold, and previous states are restored when resuming.  

#### Tips & Tricks
- `$63` is primarily used for **laser or spindle setups** where you want controlled behavior during pauses.  
- For CNC mills, the Z-axis, parking, or coolant behavior is controlled separately (e.g., `$41–$60` for parking, `$7X` for coolant control).  
- Always test the behavior on your machine to avoid unexpected motion or spindle/laser state changes during feed hold.

---

## `$64` – Force Init Alarm (boolean)
Forces the controller to start up in an ALARM state.


> ℹ️ **Info**
> - This is a safety feature that ensures the machine cannot be moved until the user explicitly clears the alarm.
> - It is useful for machines where an immediate, uncommanded motion on startup could be dangerous.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Controller starts in an IDLE state, ready for commands. |
| 1     | Enabled | Controller starts in an ALARM state. An unlock command (`$X`) is required before any motion. |

#### Common Examples
*   **Default:**
    *   `$64=0`
*   **Safety-Critical Machine:**
    *   `$64=1`

##### Tips & Tricks
- This adds an extra layer of safety, requiring deliberate action from the operator before the machine can be moved.
- It is often used in combination with `$22` (Homing on Startup Required) to enforce a strict "unlock then home" workflow.

---

## `$65` – Probing Options (mask)
Configures advanced options for probing cycles (`G38.x`).


> ℹ️ **Info**
> - This setting fine-tunes the behavior of probing operations.
> - This is a **bitmask**: add together the values of the options you want to enable.
> - Options mainly control **feed override during probing**, **soft-limit enforcement**, and **automatic toolsetter selection**.


| Bit | Value | Option | Description |
|:---:|:-----:|:-------|:------------|
| 0   | 1     | Allow Feed Override | Permits feed override (`F` adjustment) during probing commands. |
| 1   | 2     | Apply Soft Limits | Enforces soft-limit boundaries during probing to prevent leaving the machine workspace. |
| 3   | 8     | Auto Select Toolsetter | Automatically selects a toolsetter if one is configured for the probe operation. |
| 4   | 16     | Auto Select Probe 2 | Automatically selects the Secondary Probe |

#### Common Examples
* **Default:**  
  `$65=0` → No feed override, soft limits not applied, auto toolsetter disabled.

* **Allow feed override and soft-limit enforcement:**  
  `$65=3` → Bits 0 + 1 set; feed can be overridden, and probe stays within workspace.

* **Enable all options:**  
  `$65=11` → Bits 0 + 1 + 3; feed override allowed, soft limits applied, auto toolsetter selected.

#### Tips & Tricks
- Most users can leave `$65=0` for simple probing cycles.  
- Disable soft limits during probing can be helpful where you are probing unknown distances which may require a command that exceeds the max travel in Z for example, but you do know the probe will make contact before it actually reaches end of travel
- Use Auto Select Toolsetter only if your machine has a compatible toolsetter configured.
- Auto Select Toolsetter requires the machine to be homed and will probe at the G59.3 position. To facilitate the switch the G-Code program has to move to the G59.3 position (Preferable via Z-home for safety) before sending G38.
- Auto select probe 2 is implemented by the BLTouch plugin and is activated when it is configured to auto-deploy on G38 with M401D1. See https://github.com/grblHAL/Plugins_misc/tree/main#bltouch-probe

---

## `$66` - `$69` – Piecewise Linear Spindle Compensation
Configures a multi-point calibration curve to correct a non-linear speed response from a PWM-controlled spindle or VFD.


> ℹ️ **Info**
> - This is an advanced feature for fine-tuning spindle speed accuracy, especially when using PWM-to-analog (0-10V) converters or direct PWM drivers that exhibit non-linear behavior.
> - It allows you to create a "correction map" by defining multiple calibration points. Each point corrects a specific input `S` value (RPM) to its corresponding desired raw PWM output.
> - The settings (`$66`, `$67`, `$68`, `$69`) are **strings, where each string contains a comma-separated list of values** representing the calibration points.
> - The format for each point within the string is `RPM,PWM_VALUE`, allowing for a piecewise linear interpolation.


#### Example of String Format (Conceptual)
*   `$66=5000,100,10000,200`
    *   This sets two calibration points:
        *   At `S=5000 RPM`, output raw PWM `100`.
        *   At `S=10000 RPM`, output raw PWM `200`.

#### Tips & Tricks
- This is a highly advanced feature. For most users, ensuring `$30` (Max Spindle Speed), `$31` (Min Spindle Speed), `$35` (PWM Min Value), and `$36` (PWM Max Value) are set correctly is sufficient.
- To generate the precise values for these settings, you would typically:
    1.  Measure your spindle's actual RPM at various PWM outputs.
    2.  Use a calibration script, such as the [fit_nonlinear_spindle.py script from grbl's documentation](https://github.com/gnea/grbl/blob/master/doc/script/fit_nonlinear_spindle.py), to calculate the optimal correction points based on your measurements.
- The `fit_nonlinear_spindle.py` script calculates the string values for these settings.

---

## `$70` – Enable Services (mask)
The master switch for enabling or disabling network-related services (daemons).


> ℹ️ **Info**
> - This is a **critical** setting for any network-enabled board. Even if you configure all the IP address and WiFi settings (`$300+`), the services **will not run** unless they are enabled here.
> - This is a **bitmask**: add together the values of the services you want to enable.


| Bit | Value | Service to Enable | Description |
|:---:|:-----:|:------------------|:------------|
| 0   | 1     | Telnet | A raw data stream used by some G-code senders. |
| 1   | 2     | FTP | Allows network file transfer to/from the SD card. |
| 2   | 4     | HTTP | The standard web server (often used with WebSockets). |
| 3   | 8     | WebSocket | A modern, efficient protocol for web-based GUIs. |
| 4   | 16    | mDNS (Bonjour) | Broadcasts the controller's name on the network (e.g., `grblHAL.local`). |
| 5   | 32    | WebDAV | An alternative to FTP for network file access. |

#### Common Examples
*   **All Services Disabled (Default):**
    *   `$70=0`
*   **Enable Common Services for a GUI:**
    *   Most modern senders use Telnet or WebSockets, and FTP is needed for file transfers. mDNS is for easy discovery.
    *   `1` (Telnet) + `2` (FTP) + `8` (WebSocket) + `16` (mDNS) → `$70=27`
*   **Enable All Services:**
    *   `1+2+4+8+16+32` → `$70=63`

#### Tips & Tricks
- If you have configured your network settings but still cannot connect to the controller, this is the **first setting you should check**.
- For security and to save memory on the controller, only enable the services you actually plan to use.
- Use `$NETIF` to see which services are running (listening) as well as the Network interface's MAC address and IP address.


---

## `$71` – Bluetooth Device Name
Sets the broadcast name for the controller's Bluetooth interface.


> ℹ️ **Info**
> - This is the name that will appear in the list of available Bluetooth devices on your computer or phone.
> - This setting is only available on boards with a Bluetooth module.


| Value | Meaning |
|:------|:--------|
| String| The name for the Bluetooth device, e.g., "grblHAL-BT". |

---

## `$72` – Bluetooth Service Name
Sets the name of the Bluetooth serial port profile (SPP) service.


> ℹ️ **Info**
> - A technical setting for the Bluetooth service. In almost all cases, the default value should not be changed.


---

## `$73` – WiFi Mode
The master switch to select the operating mode for the WiFi module.


> ℹ️ **Info**
> - This setting determines how the WiFi on your controller will function.
> - It is only available on boards with a WiFi module.
> - For some platforms (e.g., ESP32), an additional "Access Point/Station" mode is available.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Off     | The WiFi module is completely disabled. |
| 1     | Access Point (AP) Mode | The controller creates its own WiFi network. Use settings `$310`-`$312`. |
| 2     | Station (STA) Mode | The controller connects to an existing WiFi network. Use settings `$320`-`$325`. (Most common) |
| 3     | Access Point/Station (AP/STA) Mode** | The controller simultaneously creates its own WiFi network and connects to an existing one. (Platform-specific, ESP32 only) |

#### Common Examples
*   **Connect to your workshop WiFi:**
    *   `$73=2`
*   **Create a direct-connect network for the machine:**
    *   `$73=1`

#### Tips & Tricks
- After changing the WiFi mode, a controller reset is required.
- Station mode (`2`) is the most common and convenient way to put your machine on your local network.

---

## `$74` – WiFi Station SSID
The name (SSID) of the existing WiFi network that you want the controller to connect to.


> ℹ️ **Info**
> - This setting is only used when `$73=2` (Station Mode).
> - This is the **primary setting** for connecting to your network. It must be exact.


| Value | Meaning |
|:------|:--------|
| String| The SSID of your existing WiFi network, e.g., "MyShopWiFi". |

#### Tips & Tricks
- WiFi network names are case-sensitive. "MyWifi" is different from "mywifi".
- If the controller fails to connect, an incorrect SSID is the most common cause.

---

## `$75` – WiFi Station Password
The password for the existing WiFi network.


> ℹ️ **Info**
> - This setting is only used when `$73=2` (Station Mode).
> - This must be the correct password for the WiFi network specified in `$74`.


| Value | Meaning |
|:------|:--------|
| String| The WiFi password. |

---

## `$76` – WiFi Access Point SSID
Sets the name of the WiFi network (the SSID) that the controller will broadcast in AP mode.


> ℹ️ **Info**
> - This setting is only used when `$73=1` (Access Point Mode).
> - This is the network name you will look for on your computer or phone.


| Value | Meaning |
|:------|:--------|
| String| The name of your machine's WiFi network, e.g., "grblHAL-CNC". |

---

## `$77` – WiFi Access Point Password
Sets the password for the WiFi network created by the controller in AP mode.


> ℹ️ **Info**
> - This setting is only used when `$73=1` (Access Point Mode).
> - A password of at least 8 characters is required for a secure WPA2 connection.


| Value | Meaning |
|:------|:--------|
| String| The WiFi password. Must be at least 8 characters. |

---

## `$78` – WiFi AP Country
Sets the regulatory country code for the WiFi Access Point.


> ℹ️ **Info**
> - This setting is only used when `$73=1` (Access Point Mode).
> - It configures the WiFi module to use the correct channels and power levels that are legally permitted in your country.


| Value | Meaning |
|:------|:--------|
| String| The two-letter ISO country code, e.g., "US", "GB", "DE". |

#### Tips & Tricks
- While it may work if left blank, setting this to your country code is recommended for proper and legal WiFi operation.

---

## `$79` – WiFi AP Channel
Sets the WiFi channel that the controller will use when operating in Access Point (AP) mode.


> ℹ️ **Info**
> - This setting is only used when `$73=1` (Access Point Mode).
> - Choosing a less congested channel can improve connection stability and speed.


| Value | Meaning |
|:-----:|:--------|
| 1-13  | A standard WiFi channel number. |

#### Tips & Tricks
- Use a WiFi analyzer app on your phone to find the least congested channels in your area.

---


## `$80` – Spindle P-Gain
Sets the Proportional gain for the closed-loop spindle speed controller.


> ℹ️ **Info**
> - An advanced feature that requires a spindle with an encoder (`$38`) for RPM feedback.
> - The P-Gain is the primary driver of the correction. It applies a correction proportional to the current RPM error.
> - A higher P-Gain results in a faster response but can lead to instability and oscillation if too high.
> - Part of the PID control loop (`$80`, `$81`, `$82`).


#### Tips & Tricks
- Tuning a PID controller is an advanced topic. Start with the default values provided by your driver and adjust in small increments.

---

## `$81` – Spindle I-Gain
Sets the Integral gain for the closed-loop spindle speed controller.


> ℹ️ **Info**
> - An advanced PID tuning parameter for closed-loop spindle control.
> - The I-Gain works to eliminate small, steady-state errors over time by "integrating" the error. It pushes the system towards the exact target RPM.
> - A higher I-Gain can reduce steady-state error but can also cause overshoot.


---

## `$82` – Spindle D-Gain
Sets the Derivative gain for the closed-loop spindle speed controller.


> ℹ️ **Info**
> - An advanced PID tuning parameter for closed-loop spindle control.
> - The D-Gain works to dampen the system's response, reducing the overshoot and oscillation caused by the P and I terms.
> - It acts based on the rate of change of the error.


---

## `$83` – Spindle Deadband
Sets an RPM range around the target where no PID correction is applied.


> ℹ️ **Info**
> - A tuning parameter for the closed-loop spindle controller.
> - This prevents the PID loop from constantly making tiny, unnecessary adjustments ("hunting") when the RPM is very close to the target.


| Value (RPM) | Description |
|:-----------:|:------------|
| 0 - N       | The +/- RPM value from the target to consider "in position". |

#### Common Examples
*   **A small deadband of 10 RPM:**
    *   If the target is 10000 RPM, the controller will not make any corrections as long as the actual speed is between 9990 and 10010 RPM.
    *   `$83=10`

---

## `$84` - `$86` – Spindle Speed Max Error
Defines the maximum allowable error for each component of the speed PID controller before a fault may be triggered.


> ℹ️ **Info**
> - An advanced safety feature for the closed-loop spindle speed PID loop (`$80`-`$83`).
> - If the difference between commanded and actual RPM exceeds these limits, the system can trigger an alarm to prevent issues.
> - `$84`: Max Proportional Error
> - `$85`: Max Integral Error
> - `$86`: Max Derivative Error


---

## `$90` – Position P-Gain
Sets the Proportional gain for the spindle-synchronized motion controller.


> ℹ️ **Info**
> - This tunes the PID loop that controls the motion axes (e.g., Z and X on a lathe) to keep them perfectly in sync with the spindle's rotational **position**.
> - This is essential for lathe threading (`G33`) and rigid tapping.
> - The P-Gain is the primary driver for keeping the tool's position locked to the thread pitch.


---

## `$91` – Position I-Gain
Sets the Integral gain for the synchronized motion controller.


> ℹ️ **Info**
> - The I-Gain helps eliminate any "following error," ensuring the tool does not lag behind the spindle's rotation over the length of the thread.
> - Part of the Position PID loop (`$90`-`$96`).


---

## `$92` – Position D-Gain
Sets the Derivative gain for the synchronized motion controller.


> ℹ️ **Info**
> - The D-Gain helps to dampen oscillations and improve the stability of the synchronized motion, especially during acceleration.
> - Part of the Position PID loop (`$90`-`$96`).


---

## `$93` – Position Deadband
Sets a position error range (in encoder counts) where no PID correction is applied.


> ℹ️ **Info**
> - This defines the tolerance window for the synchronized motion.
> - It prevents the motion axes from constantly "hunting" or jittering in response to tiny fluctuations in the encoder signal.


---

## `$94` - `$96` – Position Max Error
Defines the maximum allowable following error for each component of the position PID controller.


> ℹ️ **Info**
> - An advanced safety feature for the synchronized motion loop.
> - If the tool's position deviates from the target by more than these values, a fault can be triggered.
> - `$94`: Max Proportional Error
> - `$95`: Max Integral Error
> - `$96`: Max Derivative Error


---

## `$100` – `$107` – Axis Travel Resolution

Defines the number of motor steps required to move an axis by **1 mm** (for linear axes) or **1 degree** (for rotary axes).  

- `$100` → X-axis  
- `$101` → Y-axis  
- `$102` → Z-axis  
- `$103` → A-axis  
- `$104` → B-axis  
- `$105` → C-axis  
- `$106` → U-axis  
- `$107` → V-axis  


> ℹ️ **Info**
> - This is the most important setting for dimensional accuracy.
> - The value depends on your motor, driver microstepping, and mechanical transmission (belt, leadscrew, ballscrew, or rotary gear reduction).
> - A/B/C axes can be configured as **linear** or **rotary** with `$376`.
> - Related settings:
> - `$110`–`$117` (Max Rate)
> - `$120`–`$127` (Acceleration)


---

#### Formulae

- **Linear axes (steps/mm):**  
  - steps_per_mm = (Motor Steps/Rev × Microsteps) / Lead
  - *Lead = distance moved per motor revolution*  
  - For belts: `Lead = Pulley Teeth × Belt Pitch`  
  - For screws: `Lead = screw lead (mm/rev)`  

- **Rotary axes (steps/deg):**  
  - steps_per_deg = (Motor Steps/Rev × Microsteps × Gear Ratio) / 360

#### Common Linear Motion Values

| Transmission | Lead (mm/rev) | 8 µsteps | 16 µsteps | 32 µsteps |
|--------------|---------------|----------|-----------|-----------|
| **Belts (GT2) 16T Pulley** | 32 | 50 | 100 | 200 |
| **Belts (GT2) 20T Pulley** | 40 | 40 | 80 | 160 |
| **Belts (GT2) 32T Pulley** | 64 | 25 | 50 | 100 |
| **Belts (GT3) 20T Pulley** | 60 | 26.67 | 53.33 | 106.67 |
| **Belts (HTD5) 20T Pulley** | 100 | 16 | 32 | 64 |
| **Lead screw TR8x2** | 2 | 800 | 1600 | 3200 |
| **Lead screw TR8x4** | 4 | 400 | 800 | 1600 |
| **Lead screw TR8x8** | 8 | 200 | 400 | 800 |
| **Lead screw TR10x10** | 10 | 160 | 320 | 640 |
| **Ballscrew 1204** | 4 | 400 | 800 | 1600 |
| **Ballscrew 1605** | 5 | 320 | 640 | 1280 |
| **Ballscrew 1610** | 10 | 160 | 320 | 640 |

---

#### Common Rotary Motion Values

| Motor | Gear Ratio | 8 µsteps | 16 µsteps | 32 µsteps |
|-------|------------|----------|-----------|-----------|
| 1.8° (200 steps) | 1:1 (direct) | 4.44 | 8.89 | 17.78 |
| 1.8° (200 steps) | 6:1 | 26.67 | 53.33 | 106.67 |
| 1.8° (200 steps) | 10:1 | 44.44 | 88.89 | 177.78 |
| 1.8° (200 steps) | 18:1 | 80 | 160 | 320 |
| 1.8° (200 steps) | 72:1 | 320 | 640 | 1280 |
| 0.9° (400 steps) | 1:1 (direct) | 8.89 | 17.78 | 35.56 |
| 0.9° (400 steps) | 50:1 | 444.44 | 888.89 | 1777.78 |

---

#### Tips & Tricks
- Always verify by commanding a long move (`G91 G1 X100 F500` or similar) and measuring actual distance or angle.  
- Adjust `$100`–`$105` proportionally based on the error. See [**Calibrating Steps per mm**](../Machine-Calibration/calibrating-steps).
- For rotary axes, ensure `$376` is set correctly to mark the axis as **rotary** (steps/deg) or **linear** (steps/mm).  

---

## `$110` – `$117` – Axis Maximum Rate

Sets the maximum speed for each axis in **mm/min** (linear) or **degrees/min** (rotary).

- `$110` → X-axis
- `$111` → Y-axis
- `$112` → Z-axis
- `$113` → A-axis
- `$114` → B-axis
- `$115` → C-axis
- `$116` → U-axis  
- `$117` → V-axis  



> ℹ️ **Info**
> - This acts as a hard speed limit for each motor to prevent it from stalling due to lost torque at high speeds.
> - The value should be determined through testing to find the highest *reliable* speed.
> - This is related to `$120`–`$127` (Acceleration). An axis can often reach a higher max rate if the acceleration is not too aggressive.


#### Typical Value Ranges

| Axis Type | Machine Type | Typical Max Rate (mm/min or deg/min) |
|:----------|:-------------|:-------------------------------------|
| **Linear**| Hobby Screw-Drive | 500 - 3000 |
| **Linear**| Hobby Belt-Drive | 2000 - 10000+ |
| **Linear (Z)**| Screw-Drive | 500 - 2000 (Usually much lower than X/Y) |
| **Rotary**| Hobby 4th-Axis | 1000 - 10000 (3600 = 10 RPM) |

#### Common Examples
*   **Hobby CNC Router (X, Y, Z):**
    *   `$110=5000`
    *   `$111=5000`
    *   `$112=1500`
*   **Small Rotary Table (A-axis):**
    *   `$113=3600` (10 RPM)

#### Tips & Tricks
- To find the true maximum, start low and incrementally increase the value, commanding long rapid moves (e.g., `G0 X200`). Listen for the motor stalling (a loud buzzing/grinding sound), then back the value off by 20-30% for a safety margin.
- The effective speed of a diagonal (`XY`) move is limited by the lower of the two axes' max rate settings.
- See our detailed guide: [**Tuning Motion**](../Machine-Calibration/tuning-motion).

---

## `$120` – `$127` – Axis Acceleration

Sets how quickly each axis can change its speed, in **mm/s²** (linear) or **degrees/s²** (rotary).

- `$120` → X-axis
- `$121` → Y-axis
- `$122` → Z-axis
- `$123` → A-axis
- `$124` → B-axis
- `$125` → C-axis
- `$126` → U-axis  
- `$127` → V-axis  



> ℹ️ **Info**
> - This is one of the most important settings for balancing performance and reliability.
> - Low acceleration is "soft" and reliable. High acceleration is "snappy" but requires significantly more motor torque.
> - If set too high, motors will lose steps on direction changes or short, fast moves, causing positional errors.


#### Typical Value Ranges

| Axis Type | Machine Type | Typical Acceleration (mm/s² or deg/s²) |
|:----------|:-------------|:---------------------------------------|
| **Linear (X/Y)**| Light, Rigid Machine | 250 - 1000+ |
| **Linear (X/Y)**| Heavy Gantry | 50 - 200 |
| **Linear (Z)**| Standard Spindle | 50 - 150 (Usually much lower than X/Y) |
| **Rotary**| Hobby 4th-Axis | 100 - 500 |

#### Common Examples
*   **Hobby CNC Router (X, Y, Z):**
    *   `$120=500`
    *   `$121=400` (Y-gantry is heavier)
    *   `$122=100`
*   **Standard 4th-Axis Add-on:**
    *   `$123=300`

#### Tips & Tricks
- A "jerk test" is the best way to tune this. Command many short, rapid, back-and-forth moves (e.g., `G0 X1`, `G0 X0` in a loop). Increase acceleration until the motor stalls, then back the value off by 20-30%.
- Setting Z-acceleration too high is a primary cause of lost steps, leading to incorrect cutting depths. Be conservative.

---

## `$130` – `$137` – Axis Maximum Travel

Defines the total travel distance for each axis in **mm** (linear) or **degrees** (rotary).

- `$130` → X-axis
- `$131` → Y-axis
- `$132` → Z-axis
- `$133` → A-axis
- `$134` → B-axis
- `$135` → C-axis
- `$136` → U-axis  
- `$137` → V-axis  



> ℹ️ **Info**
> - This value defines the size of your machine's work envelope.
> - It is measured from the point where the homing switch triggers (`MPos:0`) to the opposite end of physical travel.
> - This setting is **essential** for the **Soft Limits (`$20`)** feature to work correctly.


#### Common Examples
*   **300x400x80mm CNC:**
    *   `$130=300`
    *   `$131=400`
    *   `$132=80` (or `-80` if Z homes at the top)
*   **Continuously Rotating 4th Axis:**
    *   Set to a 0 to allow unlimited rotations.
    *   `$133=0`
*   **Limited Trunnion (B-axis, 0-110°):**
    *   `$134=110.0`

#### Tips & Tricks
- To set this accurately, home the machine (`$H`). Then, jog an axis to its furthest physical limit. The machine position (`MPos`) displayed is the value to enter for that axis.
- Always set the value slightly less than the absolute maximum physical travel to provide a safety margin.


---
## `$140` - `$147` – Motor Current
A placeholder setting for motor current on some drivers.


> ℹ️ **Info**
> - In many modern grblHAL drivers (especially Trinamic), motor current is set via other, more specific settings (e.g., in the `$2xx` range).
> - This setting is often a legacy placeholder or used by simpler driver implementations.
> - The units are driver-dependent and may not be amps.


#### Tips & Tricks
- For most users, this setting will have no effect. Check your board's documentation to see how motor current is configured.

---

## `$150` - `$157` – Axis Microsteps
A placeholder setting for microstepping on some drivers.


> ℹ️ **Info**
> - On most controller boards, microstepping is set via physical jumpers or DIP switches on the stepper driver itself.
> - This software setting is only used by drivers that support programmable microstepping (like Trinamic drivers).
> - Even with Trinamic drivers, this setting may be superseded by other, more advanced configuration methods.


#### Tips & Tricks
- Always set the physical jumpers on your drivers first. Only change this setting if your board's documentation explicitly states it is used.
- Your Travel Resolution (`$100`-`$107`) must be updated if you change your microstepping.

---

## `$160` - `$167` – Backlash Compensation
Applies a small, extra move when an axis changes direction to compensate for mechanical backlash.


> ℹ️ **Info**
> - Backlash causes dimensional inaccuracy, making circles oval and squares have misaligned corners.
> - This is a **software fix** for a **mechanical problem**. The best solution is always to reduce mechanical backlash first with anti-backlash nuts or tight belts.


| Value (mm) | Description |
|:----------:|:------------|
| 0.0 - N    | The measured amount of backlash in the axis. |

#### Common Examples
*   **Well-tuned machine:**
    *   `$160=0.0`
*   **Hobby machine with some lead screw wear:**
    *   `$160=0.05`

#### Tips & Tricks
- To measure backlash, use a dial indicator. Command a small move in one direction (`G91 G1 X1 F100`), zero the indicator, then command a move in the opposite direction (`X-1`). The amount the indicator *doesn't* move is your backlash value.

---

## `$170` - `$172` – X, Y, Z-axis Dual-axis Offset
An advanced setting for adjusting the offset in a dual-motor (ganged) setup after homing.


> ℹ️ **Info**
> - Used with auto-squaring gantries that use two homing switches.
> - After the initial homing finds both switches, this value applies a tiny electronic offset to correct for minor physical misalignment of the switches, ensuring perfect squareness.


| Value (mm) | Description |
|:----------:|:------------|
| -N to +N   | The small offset to apply to the slave motor after homing. |

#### Tips & Tricks
- This is an advanced setting. For most users, ensuring the homing switches are physically aligned is the primary method of squaring the gantry.

---


---

## `$200` – X StallGuard2 Fast Threshold (TMC)
Sets the sensitivity of StallGuard for the **X-axis** during the initial, fast-moving phase of a sensorless homing cycle.


> ℹ️ **Info**
> - This is a core setting for **X-axis sensorless homing**, allowing the driver to detect a motor stall against a physical end-stop.
> - This sensitivity value is used during the `$25` (Homing Search Rate) move.
> - A **lower value is more sensitive**. A value of `0` disables stall detection.
> - Works in conjunction with `$220` (slow threshold) and `$339` (enable mask).



> 🔥 **Danger**
> StallGuard should not be used unless the machine manufacturer has tuned the associated Trinamic parameters beforehand - the procedure for that is not simple. If enabled it is for advanced users that has a good understanding of how to tune the parameters.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Stall detection is off for the fast move. |
| 1-127 | Sensitivity | A lower value makes the driver more sensitive to stalls. A higher value requires a harder stall to trigger. |

#### Common Examples
*   **Default Starting Point:**
    *   A moderately high value to prevent false triggers from normal acceleration.
    *   `$200=100`
*   **Lighter Machine / More Sensitive:**
    *   For a machine where the stall force is very light.
    *   `$200=40`

#### Tips & Tricks
- To tune this, start with a high value (e.g., 100) and lower it in steps of 10 until the axis reliably triggers on a stall but does not trigger during the initial acceleration phase of the homing move.
- This setting is highly dependent on the motor, voltage, and mechanics of your X-axis.

---

## `$201` – Y StallGuard2 Fast Threshold (TMC)
Sets the sensitivity of StallGuard for the **Y-axis** during the initial, fast-moving phase of a sensorless homing cycle.


> ℹ️ **Info**
> - This is a core setting for **Y-axis sensorless homing**, allowing the driver to detect a motor stall against a physical end-stop.
> - This sensitivity value is used during the `$25` (Homing Search Rate) move.
> - A **lower value is more sensitive**. A value of `0` disables stall detection.
> - Works in conjunction with `$221` (slow threshold) and `$339` (enable mask).



> 🔥 **Danger**
> StallGuard should not be used unless the machine manufacturer has tuned the associated Trinamic parameters beforehand - the procedure for that is not simple. If enabled it is for advanced users that has a good understanding of how to tune the parameters.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Stall detection is off for the fast move. |
| 1-127 | Sensitivity | A lower value makes the driver more sensitive to stalls. A higher value requires a harder stall to trigger. |

#### Common Examples
*   **Heavy Gantry (less sensitive):**
    *   A gantry with high inertia may require a higher value to avoid false triggers.
    *   `$201=110`
*   **Light Gantry / More Sensitive:**
    *   `$201=50`

#### Tips & Tricks
- Since the Y-axis often carries more mass (the gantry), this value may need to be different from the X-axis (`$200`).
- Tune this by commanding Y-axis homing moves and observing the reliability of the stall trigger.

---

## `$202` – Z StallGuard2 Fast Threshold (TMC)
Sets the sensitivity of StallGuard for the **Z-axis** during the initial, fast-moving phase of a sensorless homing cycle.


> ℹ️ **Info**
> - This is a core setting for **Z-axis sensorless homing**.
> - This sensitivity value is used during the `$25` (Homing Search Rate) move.
> - A **lower value is more sensitive**. A value of `0` disables stall detection.
> - Works in conjunction with `$222` (slow threshold) and `$339` (enable mask).



> 🔥 **Danger**
> StallGuard should not be used unless the machine manufacturer has tuned the associated Trinamic parameters beforehand - the procedure for that is not simple. If enabled it is for advanced users that has a good understanding of how to tune the parameters.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Stall detection is off for the fast move. |
| 1-127 | Sensitivity | A lower value makes the driver more sensitive to stalls. A higher value requires a harder stall to trigger. |

#### Common Examples
*   **Standard Z-Axis:**
    *   `$202=100`

#### Tips & Tricks
- Sensorless homing on a lead-screw-driven Z-axis can be less reliable than on a belt-driven X/Y axis due to screw friction. It may require careful tuning.
- Be cautious when testing to prevent a crash if the stall is not detected.

---

## `$203` – A StallGuard2 Fast Threshold (TMC)
## `$204` – B StallGuard2 Fast Threshold (TMC)
## `$205` – C StallGuard2 Fast Threshold (TMC)
## `$206` – U StallGuard2 Fast Threshold (TMC)
## `$207` – V StallGuard2 Fast Threshold (TMC)
Sets the sensitivity of StallGuard for the A, B, C, U, or V axes, respectively, during the initial, fast-moving phase of a sensorless homing cycle. Refer to `$200` for full context.

---


## `$210` – X Hold Current (TMC)
Sets the percentage of the full running current that the **X-axis** driver will supply to the motor when it is idle.


> ℹ️ **Info**
> - This is a Trinamic-specific power-saving and heat-reduction feature. It works with the `$1` (Step Idle Delay).
> - After the idle delay expires, the driver will reduce the motor current to this percentage.
> - `0%` is the minimum, `100%` means no current reduction.


| Value (%) | Meaning | Description |
|:---------:|:--------|:------------|
| 0 - 100   | Percent | The percentage of running current to use for holding torque. |

#### Common Examples
*   **Aggressive Power Saving:**
    *   Reduces heat significantly but has very low holding torque.
    *   `$210=25`
*   **Balanced Hold and Heat (Recommended Start):**
    *   A good compromise for most axes.
    *   `$210=50`

#### Tips & Tricks
- This is a fantastic feature for reducing motor temperature on long jobs.
- If you notice the X-axis drifting or being easily moved by hand when idle, increase this value.

---

## `$211` – Y Hold Current (TMC)
Sets the percentage of the full running current that the **Y-axis** driver will supply to the motor when it is idle.


> ℹ️ **Info**
> - This is a Trinamic-specific power-saving and heat-reduction feature. It works with the `$1` (Step Idle Delay).
> - After the idle delay expires, the driver will reduce the motor current to this percentage.
> - `0%` is the minimum, `100%` means no current reduction.


| Value (%) | Meaning | Description |
|:---------:|:--------|:------------|
| 0 - 100   | Percent | The percentage of running current to use for holding torque. |

#### Common Examples
*   **Balanced Hold and Heat (Recommended Start):**
    *   A good compromise for most axes.
    *   `$211=50`
*   **Heavy Gantry:**
    *   May require more holding torque to prevent shifting.
    *   `$211=65`

#### Tips & Tricks
- If your Y-gantry is heavy, you may want a slightly higher hold current than the X-axis to ensure it stays put.

---

## `$212` – Z Hold Current (TMC)
Sets the percentage of the full running current that the **Z-axis** driver will supply to the motor when it is idle.


> ℹ️ **Info**
> - This is a Trinamic-specific power-saving and heat-reduction feature. It works with the `$1` (Step Idle Delay).
> - Crucial for Z-axes that are subject to gravity.


| Value (%) | Meaning | Description |
|:---------:|:--------|:------------|
| 0 - 100   | Percent | The percentage of running current to use for holding torque. |

#### Common Examples
*   **Strong Hold for a Heavy Spindle:**
    *   Keeps most of the holding torque to prevent the Z-axis from dropping.
    *   `$212=80`
*   **Using `$37` Instead:**
    *   An alternative is to set `$37=4` to keep the Z-axis always at 100% power, and leave `$212` at a lower value.

#### Tips & Tricks
- If your Z-axis drops when idle, the first thing to try is increasing this value. If that is not sufficient, use `$37=4` to keep it fully powered.

---

## `$213` – A Hold Current (TMC)
## `$214` – B Hold Current (TMC)
## `$215` – C Hold Current (TMC)
## `$216` – U Hold Current (TMC)
## `$217` – V Hold Current (TMC)
Sets the percentage of the full running current that the A, B, C, U, or V axis driver will supply to the motor when it is idle. Refer to `$210` for full context.

---

## `$220` – X StallGuard2 Slow Threshold (TMC)
Sets the sensitivity of StallGuard for the **X-axis** during the second, slower phase of a sensorless homing cycle.


> ℹ️ **Info**
> - After the initial fast search, the machine backs off and re-approaches the end-stop at the `$24` (Homing Locate Rate).
> - This setting defines the StallGuard sensitivity for that slow, precise move, allowing for more accurate homing.



> 🔥 **Danger**
> StallGuard should not be used unless the machine manufacturer has tuned the associated Trinamic parameters beforehand - the procedure for that is not simple. If enabled it is for advanced users that has a good understanding of how to tune the parameters.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Stall detection is off for this phase. |
| 1-127 | Sensitivity | A lower value makes the driver more sensitive to stalls. |

#### Common Examples
*   **Precise Homing:**
    *   Often set to be more sensitive (lower) than the fast threshold, as there is less risk of false triggers from acceleration.
    *   `$220=30`

#### Tips & Tricks
- Tuning this value is key to repeatable sensorless homing. It should be as sensitive as possible without triggering before the axis makes firm contact with the end-stop.
- This value is almost always different from the fast threshold (`$200`).

---

## `$221` – Y StallGuard2 Slow Threshold (TMC)
Sets the sensitivity of StallGuard for the **Y-axis** during the second, slower phase of a sensorless homing cycle.


> ℹ️ **Info**
> - Defines the StallGuard sensitivity for the slow, precise move on the Y-axis.
> - Used with `$24` (Homing Locate Rate).



> 🔥 **Danger**
> StallGuard should not be used unless the machine manufacturer has tuned the associated Trinamic parameters beforehand - the procedure for that is not simple. If enabled it is for advanced users that has a good understanding of how to tune the parameters.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Stall detection is off for this phase. |
| 1-127 | Sensitivity | A lower value makes the driver more sensitive to stalls. |

#### Common Examples
*   **Precise Homing:**
    *   `$221=35` (May be different from X due to gantry mass)

#### Tips & Tricks
- The ideal sensitivity can be affected by the mass of the axis. Tune this independently from the X-axis for best results.

---

## `$222` – Z StallGuard2 Slow Threshold (TMC)
Sets the sensitivity of StallGuard for the **Z-axis** during the second, slower phase of a sensorless homing cycle.


> ℹ️ **Info**
> - Defines the StallGuard sensitivity for the slow, precise move on the Z-axis.
> - Used with `$24` (Homing Locate Rate).



> 🔥 **Danger**
> StallGuard should not be used unless the machine manufacturer has tuned the associated Trinamic parameters beforehand - the procedure for that is not simple. If enabled it is for advanced users that has a good understanding of how to tune the parameters.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Stall detection is off for this phase. |
| 1-127 | Sensitivity | A lower value makes the driver more sensitive to stalls. |

#### Common Examples
*   **Precise Homing:**
    *   `$222=40`

#### Tips & Tricks
- Due to the nature of lead screws, finding a reliable slow stall sensitivity on the Z-axis may require more experimentation than for belt-driven axes.

---

## `$223` – A StallGuard2 Slow Threshold (TMC)
## `$224` – B StallGuard2 Slow Threshold (TMC)
## `$225` – C StallGuard2 Slow Threshold (TMC)
## `$226` – U StallGuard2 Slow Threshold (TMC)
## `$227` – V StallGuard2 Slow Threshold (TMC)
Sets the sensitivity of StallGuard for the A, B, C, U, or V axes, respectively, during the second, slower phase of a sensorless homing cycle. Refer to `$220` for full context.

---

## `$228` – `$299` – Reserved Driver/Plugin Axis Settings Range
This range is reserved for driver or plugin-specific axis settings beyond the core StallGuard parameters.

---


## `$300` – Hostname
Sets the machine's name on the network.


> ℹ️ **Info**
> - This is the name your controller will announce on the network.
> - It can be used to connect via mDNS (e.g., `grblHAL.local`) if `$70` has mDNS enabled.
> - It also helps identify the device in your router's client list.


| Value | Meaning |
|:------|:--------|
| String| A string of characters. |

#### Common Examples
*   **Default Hostname:**
    *   `$300=grblHAL`
*   **Custom Hostname for a specific machine:**
    *   `$300=MyCNC`or `$300=Laser` (mDNS respectively mycnc.local or laser.local)

#### Tips & Tricks
- For maximum compatibility, use a simple name without spaces or special characters.
- A reboot of the controller is often required for a new hostname to be broadcast on the network.

---

## `$301` – Ethernet IP Mode
Selects the method the controller uses to obtain an IP address for the **wired Ethernet** connection.


> ℹ️ **Info**
> - **Static** is useful if the controlling computer has a dedicated ethernet port for the controller. A dedicated network interface for the controller is preferred - no collisions or competition for bandwidth, or for networks where DHCP is not available.
> - **DHCP** is the standard for most networks, where your router automatically assigns an address.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Static | You must manually set the IP (`$302`), Gateway (`$303`), and Netmask (`$304`). |
| 1     | DHCP   | The controller asks your router for an IP address. (Recommended) |
| 2     | AutoIP | A fallback where the controller picks a random address if DHCP fails. |

#### Common Examples
*   **Home/Office Network with a Router:**
    *   This is the easiest option.
    *   `$301=1`
*   **Direct Connection to a PC (no router):**
    *   You must assign a permanent, non-conflicting address.
    *   `$301=0`

#### Tips & Tricks
- If you select Static mode, you are responsible for providing correct and non-conflicting network information.

---

## `$302` – Ethernet IP Address
Manually sets the static IP address for the controller.


> ℹ️ **Info**
> - This setting is **only** used if `$301=0` (Static IP Mode).
> - The IP address must be unique on your network.


| Value | Meaning | Description |
|:------|:--------|:------------|
| String| The IP address in dot-decimal notation, e.g., "192.168.1.200". |

#### Common Examples
*   **Typical Static IP on a Home Network:**
    *   Make sure this address is outside your router's DHCP assignment range.
    *   `$302=192.168.1.200`

#### Tips & Tricks
- If you set an IP that is already in use by another device, you will have an "IP conflict" and neither device may work correctly.
- The IP address must be in the same subnet as the Gateway and your computer (as defined by the Netmask).

---

## `$303` – Ethernet Gateway
Manually sets the Gateway (router) IP address.


> ℹ️ **Info**
> - This setting is **only** used if `$301=0` (Static IP Mode).
> - The Gateway is the address of the device that connects your local network to the internet (usually your router).
> - It is required for features like NTP time synchronization to work.


| Value | Meaning | Description |
|:------|:--------|:------------|
| String| Your router's IP address, e.g., "192.168.1.1". |

#### Common Examples
*   **Typical Home Router Address:**
    *   `$303=192.168.1.1`

#### Tips & Tricks
- If you can't connect to your controller from another network segment or if NTP fails, an incorrect Gateway address is a likely cause.

---

## `$304` – Ethernet Netmask
Manually sets the Subnet Mask for the controller.


> ℹ️ **Info**
> - This setting is **only** used if `$301=0` (Static IP Mode).
> - The Netmask defines the size of your local network.


| Value | Meaning | Description |
|:------|:--------|:------------|
| String| The Subnet Mask, e.g., "255.255.255.0". |

#### Common Examples
*   **Standard Home/Office Network:**
    *   This value is correct for the vast majority of local networks.
    *   `$304=255.255.255.0`

#### Tips & Tricks
- An incorrect Netmask can prevent the controller from communicating with other devices, even on the local network. When in doubt, use DHCP (`$301=1`).

---

## `$305` – Telnet Port
Configures the network port for the Telnet service.


> ℹ️ **Info**
> - The Telnet service provides a raw, text-based data stream to and from the grblHAL controller.
> - It is used by some G-code senders and for direct, low-level communication.


| Value | Meaning | Description |
|:------|:--------|:------------|
| Port #| A valid TCP port number. |

#### Common Examples
*   **Default Telnet Port:**
    *   `$305=23`

#### Tips & Tricks
- Usually there is no need to change this port unless you have a specific reason
- You will need this port number to configure your G-code sender if it uses Telnet.

---

## `$306` – HTTP Port
Configures the network port for the HTTP service.


> ℹ️ **Info**
> - The HTTP service provides a web server running on the controller, for loading the WebUI.
> - Modern web interfaces for grblHAL typically also use the WebSocket service (`$307`) for communication.


| Value | Meaning | Description |
|:------|:--------|:------------|
| Port #| A valid TCP port number. |

#### Common Examples
*   **Default HTTP Port:**
    *   `$306=80`

#### Tips & Tricks
  - This port is often used for the WebUI. For example, you might connect by typing `http://:` into a browser.

---

## `$307` – WebSocket Port
Configures the network port for the WebSocket service.


> ℹ️ **Info**
> - The WebSocket service provides a fast, modern, and efficient way for web-based user interfaces to communicate with the controller.
> - This, (along with Telnet `$305`) are the key services for most modern network-based G-code senders.


| Value | Meaning | Description |
|:------|:--------|:------------|
| Port #| A valid TCP port number. |

#### Common Examples
*   **Default WebSocket Port:**
    *   `$307=81`

#### Tips & Tricks
- This port is often used for the WebUI as well.

---

## `$308` – FTP Port
Configures the network port for the FTP (File Transfer Protocol) service.


> ℹ️ **Info**
> - The FTP service allows you to transfer G-code files to and from the controller's SD card over the network.
> - This is extremely convenient for sending job files to the machine without needing to physically move the SD card.


| Value | Meaning | Description |
|:------|:--------|:------------|
| Port #| A valid TCP port number. |

#### Common Examples
*   **Default FTP Port:**
    *   `$308=21`

#### Tips & Tricks
- Use a standard FTP client application (like FileZilla or WinSCP) to connect to the controller's IP address on this port.
- You will need the `admin` or `user` credentials (`$330`, `$331`) to log in.

---

## `$310` – WiFi AP SSID
Sets the name of the WiFi network (the SSID) that the controller will broadcast.


> ℹ️ **Info**
> - This is the network name you will look for and connect to from your computer or phone.
> - This setting is only active when the controller is in AP mode.


| Value | Meaning |
|:------|:--------|
| String| The name of your machine's WiFi network, e.g., "grblHAL-CNC". |

#### Common Examples
*   **Creating a network for your machine:**
    *   `$310=MyMill-WiFi`

#### Tips & Tricks
- Choose a unique name to easily identify your machine's network.
- A controller reboot is required for changes to take effect.

---

## `$311` – WiFi AP Password
Sets the password for the WiFi network created by the controller.


> ℹ️ **Info**
> - This password will be required for any device trying to connect to the controller's WiFi network.
> - It enables WPA2 security for the connection.


| Value | Meaning |
|:------|:--------|
| String| The WiFi password. Must be at least 8 characters. |

#### Common Examples
*   **Setting a secure password:**
    *   `$311=MySecurePassword123`

#### Tips & Tricks
- It is highly recommended to set a password to prevent unauthorized access to your machine.
- Leaving this setting blank may create an open, unsecured network, which is a security risk.

---

## `$312` – WiFi AP IP Address
Sets the IP address of the controller itself when it is acting as the access point.


> ℹ️ **Info**
> - This is the static IP address you will use to connect to the controller's services (e.g., the WebUI).
> - It also acts as the Gateway for any device that connects to this network.


| Value | Meaning |
|:------|:--------|
| String| The static IP address for the controller, e.g., "192.168.0.1". |

#### Common Examples
*   **Typical AP Address:**
    *   This is a common, non-routable IP address suitable for a small, isolated network.
    *   `$312=192.168.0.1`

#### Tips & Tricks
- When you connect your computer to this WiFi network, it will likely be assigned an IP address in the same range (e.g., `192.168.0.100`).
- This address must be set to a valid IP format.

---

## `$313` – Gateway 2 (Network Interface 2 Gateway)
Manually sets the Gateway (router) IP address for the second network interface.


> ℹ️ **Info**
> - This setting is used if `Setting_IpMode2` is `0` (Static IP Mode) for the second network interface.
> - If used for WiFi AP mode, this would be the IP address of the controller, acting as the gateway for connected devices.
> - For documentation purposes, this aligns with `Setting_Gateway2`.


| Value | Meaning | Description |
|:------|:--------|:------------|
| String| The gateway's IP address, e.g., "192.168.0.1". |

---

## `$314` – Netmask 2 (Network Interface 2 Netmask)
Manually sets the Subnet Mask for the second network interface.


> ℹ️ **Info**
> - This setting is used if `Setting_IpMode2` is `0` (Static IP Mode) for the second network interface.
> - For documentation purposes, this aligns with `Setting_NetMask2`.


| Value | Meaning | Description |
|:------|:--------|:------------|
| String| The Subnet Mask, e.g., "255.255.255.0". |

---

## `$315` – Telnet Port 2 (Network Interface 2 Telnet Port)
Configures the network port for the Telnet service on the second network interface.


> ℹ️ **Info**
> - Allows configuration of an alternative Telnet port for the second network interface.
> - For documentation purposes, this aligns with `Setting_TelnetPort2`.


| Value | Meaning | Description |
|:------|:--------|:------------|
| Port #| A valid TCP port number. |

---

## `$316` – HTTP Port 2 (Network Interface 2 HTTP Port)
Configures the network port for the HTTP service on the second network interface.


> ℹ️ **Info**
> - Allows configuration of an alternative HTTP port for the second network interface.
> - For documentation purposes, this aligns with `Setting_HttpPort2`.


| Value | Meaning | Description |
|:------|:--------|:------------|
| Port #| A valid TCP port number. |

---

## `$317` – WebSocket Port 2 (Network Interface 2 WebSocket Port)
Configures the network port for the WebSocket service on the second network interface.


> ℹ️ **Info**
> - Allows configuration of an alternative WebSocket port for the second network interface.
> - For documentation purposes, this aligns with `Setting_WebSocketPort2`.


| Value | Meaning | Description |
|:------|:--------|:------------|
| Port #| A valid TCP port number. |

---

## `$318` – FTP Port 2 (Network Interface 2 FTP Port)
Configures the network port for the FTP service on the second network interface.


> ℹ️ **Info**
> - Allows configuration of an alternative FTP port for the second network interface.
> - For documentation purposes, this aligns with `Setting_FtpPort2`.


| Value | Meaning | Description |
|:------|:--------|:------------|
| Port #| A valid TCP port number. |

---

## `$320` – Hostname 3 (Network Interface 3 Hostname)
Sets the machine's hostname for the third network interface.


> ℹ️ **Info**
> - This setting configures the hostname for a specific network interface, which is **normally used for WiFi Station mode** on controllers that support multiple network interfaces (e.g., ESP32 in AP/STA mode).
> - This hostname is separate from the primary hostname (`$300`).


| Value | Meaning |
|:------|:--------|
| String| The hostname for this network interface, e.g., "grblHAL-STA". |

#### Common Examples
*   **Assigning a specific hostname to the WiFi Station interface:**
    *   `$320=MyCNC_STA`

#### Tips & Tricks
- While this interface is "normally used for WiFi Station," this specific setting sets its *hostname*, not its SSID. The WiFi Station SSID is set by `$74`.

---

## `$321` – IP Mode 3 (Network Interface 3 IP Mode)
Selects the method the controller uses to obtain an IP address for the third network interface.


> ℹ️ **Info**
> - This setting configures the IP addressing mode for the network interface that is **normally used for WiFi Station mode**.
> - It works similarly to `$301` (Ethernet IP Mode).
> - **DHCP** (recommended) lets your router automatically assign an address.
> - **Static** requires manual configuration of IP Address, Gateway, and Netmask.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Static | You must manually set the IP (`$322`), Gateway (`$323`), and Netmask (`$324`) for this interface. |
| 1     | DHCP   | The controller asks your router for an IP address. (Recommended for dynamic networks) |
| 2     | AutoIP | A fallback where the controller picks a random address if DHCP fails. |

#### Common Examples
*   **For dynamically assigned IP for the WiFi Station interface:**
    *   `$321=1` (DHCP)
*   **For a fixed IP address for the WiFi Station interface:**
    *   `$321=0` (Static)

#### Tips & Tricks
- For most home networks, using DHCP (`1`) is recommended for simplicity and to avoid IP address conflicts.

---

## `$322` – IP Address 3 (Network Interface 3 IP Address)
Manually sets the static IP address for the third network interface.


> ℹ️ **Info**
> - This setting is **only** used if `$321=0` (Static IP Mode for the interface normally used for WiFi Station).
> - This will be the permanent IP address assigned to this specific network interface.


| Value | Meaning |
|:------|:--------|
| String| The IP address in dot-decimal notation, e.g., "192.168.1.201". |

#### Common Examples
*   **Typical Static IP for a WiFi Station interface:**
    *   `$322=192.168.1.201`

#### Tips & Tricks
- Ensure this IP address is unique on your network segment and does not conflict with other devices or your router's DHCP assignment range.

---

## `$323` – Gateway 3 (Network Interface 3 Gateway)
Manually sets the Gateway (router) IP address for the third network interface.


> ℹ️ **Info**
> - This setting is **only** used if `$321=0` (Static IP Mode for the interface normally used for WiFi Station).
> - This is the IP address of the gateway device (usually your router) for this network interface.
> - It is required for features like NTP time synchronization (`$332`) to work.


| Value | Meaning |
|:------|:--------|
| String| Your router's IP address, e.g., "192.168.1.1". |

#### Common Examples
*   **Typical home router address:**
    *   `$323=192.168.1.1`

---

## `$324` – Netmask 3 (Network Interface 3 Netmask)
Manually sets the Subnet Mask for the third network interface.


> ℹ️ **Info**
> - This setting is **only** used if `$321=0` (Static IP Mode for the interface normally used for WiFi Station).
> - The Netmask defines the size of the local network segment this interface is on.


| Value | Meaning |
|:------|:--------|
| String| The Subnet Mask, e.g., "255.255.255.0". |

#### Common Examples
*   **Standard subnet mask:**
    *   `$324=255.255.255.0`

---

## `$325` – Telnet Port 3 (Network Interface 3 Telnet Port)
Configures the network port for the Telnet service on the third network interface.


> ℹ️ **Info**
> - This applies to the network interface that is **normally used for WiFi Station mode**.
> - This allows for a separate Telnet port if this interface is used for communication and requires a distinct port.


| Value | Meaning | Description |
|:------|:--------|:------------|
| Port #| A valid TCP port number. |

---

## `$326` – HTTP Port 3 (Network Interface 3 HTTP Port)
Configures the network port for the HTTP service on the third network interface.


> ℹ️ **Info**
> - This applies to the network interface that is **normally used for WiFi Station mode**.
> - This allows for a separate HTTP port if this interface is used for serving a WebUI or other HTTP-based services.


| Value | Meaning | Description |
|:------|:--------|:------------|
| Port #| A valid TCP port number. |

---

## `$327` – WebSocket Port 3 (Network Interface 3 WebSocket Port)
Configures the network port for the WebSocket service on the third network interface.


> ℹ️ **Info**
> - This applies to the network interface that is **normally used for WiFi Station mode**.
> - This allows for a separate WebSocket port if this interface is used for real-time communication with a GUI or other applications.


| Value | Meaning | Description |
|:------|:--------|:------------|
| Port #| A valid TCP port number. |

---

## `$328` – FTP Port 3 (Network Interface 3 FTP Port)
Configures the network port for the FTP service on the third network interface.


> ℹ️ **Info**
> - This applies to the network interface that is **normally used for WiFi Station mode**.
> - This allows for a separate FTP port if this interface is used for file transfers to/from an SD card.


| Value | Meaning | Description |
|:------|:--------|:------------|
| Port #| A valid TCP port number. |

---

## `$330` – WebUI Admin Password
Sets the password for the `admin` account.


> ℹ️ **Info**
> - Used by the WebUI for authorisation


| Value | Meaning | Description |
|:------|:--------|:------------|
| String| The password. |

#### Common Examples
*   **Set a new admin password:**
    *   `$330=MySecurePassword123`
*   **Clear the password:**
    *   `$330=` (with no value after the equals sign)

#### Tips & Tricks
- It is highly recommended to set a secure `admin` password if your machine is on a shared or untrusted network.
- The default password may be blank

---

## `$331` – WebUI User Password
Sets the password for the `user` account.


> ℹ️ **Info**
> - Used by the WebUI for authorisation
> - The `user` account may have restricted privileges compared to the `admin` account


| Value | Meaning | Description |
|:------|:--------|:------------|
| String| The password. |

#### Common Examples
*   **Set a new user password:**
    *   `$331=Guest123`
*   **Clear the password:**
    *   `$331=` (with no value after the equals sign)

 ---

## `$332` – NTP Server URI 1
Sets the address of the primary Network Time Protocol (NTP) server.


> ℹ️ **Info**
> - NTP is an internet protocol used to automatically synchronize the controller's internal clock.
> - An accurate clock is useful for timestamping files on an SD card.
> - This setting provides the address of the primary time server to contact.


| Value | Meaning | Description |
|:------|:--------|:------------|
| URI   | The address of an NTP server. |

#### Common Examples
*   **Use the public NTP pool (recommended):**
    *   This is a resilient, distributed time source.
    *   `$332=pool.ntp.org`

#### Tips & Tricks
- The controller must have a valid internet connection (Gateway `$303` and DNS) for NTP to work.
- `$333` and `$334` can be used to specify secondary and tertiary backup NTP servers.

---

## `$333` – NTP Server URI 2
Sets the address of the secondary (backup) Network Time Protocol (NTP) server.


> ℹ️ **Info**
> - If the primary NTP server (`$332`) is unreachable, the controller will try to contact this server instead.
> - This provides redundancy for the time-syncing feature.


| Value | Meaning | Description |
|:------|:--------|:------------|
| URI   | The address of an NTP server. |

#### Common Examples
*   **Use a government time server as a backup:**
    *   `$333=time.nist.gov`

---

## `$334` – NTP Server URI 3
Sets the address of the tertiary (backup) Network Time Protocol (NTP) server.


> ℹ️ **Info**
> - If both the primary (`$332`) and secondary (`$333`) NTP servers are unreachable, the controller will try this server.


| Value | Meaning | Description |
|:------|:--------|:------------|
| URI   | The address of an NTP server. |

---

## `$335` – Timezone / Timezone ID
Sets the local timezone to correctly offset the UTC time received from NTP servers.


> ℹ️ **Info**
> - NTP servers provide time in Coordinated Universal Time (UTC). This setting applies an offset to display the correct local time.
> - This ensures that file timestamps on the SD card are accurate for your geographic location.
> - The format is a POSIX TZ string, which can be complex.


| Value | Meaning | Description |
|:------|:--------|:------------|
| String| The POSIX TZ string for your timezone. |

#### Common Examples
*   **USA Eastern Time (EST/EDT):**
    *   `$335=EST5EDT,M3.2.0,M11.1.0`
*   **Central European Time (CET/CEST):**
    *   `$335=CET-1CEST,M3.5.0,M10.5.0/3`

#### Tips & Tricks
- Searching online for "POSIX TZ string" for your specific location is the best way to find the correct value.

---

## `$336` – DST Active (boolean)
Indicates if Daylight Saving Time (DST) is currently active.


> ℹ️ **Info**
> - This setting is often managed automatically by the system when a full POSIX timezone string is used in `$335`.
> - In some simpler implementations, it may need to be set manually.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Standard time is in effect. |
| 1     | Enabled | Daylight Saving Time is in effect. |

---

## `$337` – WiFi AP BSSID
Stores the BSSID (MAC address) of the WiFi access point.


> ℹ️ **Info**
> - This is a technical setting for WiFi-enabled controllers.
> - It can be used to force the controller to connect to a specific access point, even if multiple access points have the same network name (SSID).


#### Tips & Tricks
- For most users on a simple home WiFi network, this setting can be left blank.

---

## `$338` – Trinamic Driver Enable (mask)
Configures which axes are controlled by Trinamic stepper drivers and enables their advanced features.


> ℹ️ **Info**
> - This setting is a **bitmask** used to specify which individual axes are equipped with Trinamic stepper drivers (e.g., TMC2209, TMC5160).
> - Enabling a bit for an axis allows grblHAL to utilize Trinamic-specific features for that axis, such as programmable current control (`$210`-`$217`) and StallGuard for sensorless homing (`$339`).
> - This setting is typically available for boards which have pluggable or software-configurable drivers.


| Bit | Value | Axis |
|:---:|:-----:|:-----|
| 0   | 1     | X-Axis has Trinamic driver |
| 1   | 2     | Y-Axis has Trinamic driver |
| 2   | 4     | Z-Axis has Trinamic driver |
| 3   | 8     | A-Axis has Trinamic driver |
| 4   | 16    | B-Axis has Trinamic driver |
| 5   | 32    | C-Axis has Trinamic driver |
| 6   | 64    | U-Axis has Trinamic driver |
| 7   | 128   | V-Axis has Trinamic driver |

#### Common Examples
*   **X and Y axes using Trinamic drivers:**
    *   `$338=3` (1 for X + 2 for Y)
*   **All primary 3 axes using Trinamic drivers:**
    *   `$338=7` (1 for X + 2 for Y + 4 for Z)

#### Tips & Tricks
- Only enable the bits corresponding to axes that genuinely use Trinamic drivers on your board and for which you intend to use their advanced features. Incorrectly enabling this can lead to unexpected behavior.
- Refer to your specific board's documentation to confirm which axes are wired to Trinamic-compatible drivers.

---


## `$339` – Sensorless Homing (Trinamic flag)
The master switch to enable sensorless homing for each axis.


> ℹ️ **Info**
> - This setting tells grblHAL to use the Trinamic StallGuard feature for homing instead of physical limit switches.
> - This is a **bitmask**: add together the values of the axes you want to home without switches.
> - It requires the StallGuard thresholds (`$200`-`$22x`) to be properly tuned.
> - **Spindle Ramp Down:** If `$9` bit 3 is set, this setting (`$339 > 0`) also enables Spindle Ramp Down for spindle off.



> 🔥 **Danger**
> StallGuard should not be used unless the machine manufacturer has tuned the associated Trinamic parameters beforehand - the procedure for that is not simple. If enabled it is for advanced users that has a good understanding of how to tune the parameters.


| Bit | Value | Axis |
|:---:|:-----:|:-----|
| 0   | 1     | X-Axis |
| 1   | 2     | Y-Axis |
| 2   | 4     | Z-Axis |
| 3   | 8     | A-Axis |
| 4   | 16    | B-Axis |
| 5   | 32    | C-Axis |
| 4   | 64    | U-Axis |
| 5   | 128   | V-Axis |


#### Common Examples
*   **Sensorless Homing on X and Y:**
    *   Common for CoreXY printers or CNCs where Z has a physical switch.
    *   `1` (X) + `2` (Y) → `$339=3`
*   **Sensorless on All Axes:**
    *   `1` (X) + `2` (Y) + `4` (Z) → `$339=7`

#### Tips & Tricks
- **Crucial:** Sensorless homing **only works for the homing cycle**. If you want Hard Limits (`$21`), you **must** still have physical switches installed.

---

## `$340` – Spindle at Speed Tolerance (%)
The tolerance used for the "spindle at speed" input signal.


> ℹ️ **Info**
> - For advanced spindles with RPM feedback, this tells grblHAL how close the actual speed must be to the commanded speed before it considers the spindle "at speed" and continues.
> - This is a percentage of the commanded `S` value.


| Value (%) | Description |
|:---------:|:------------|
| 0 - 100   | The allowable percentage deviation. |

#### Common Examples
*   **A 5% Tolerance:**
    *   If you command `S10000`, the spindle is considered "at speed" between 9500 and 10500 RPM.
    *   `$340=5`

*   **Disable Tolerance:**
    *   Ignore spindle at speed, use Spindle Delay instead.
    *   `$340=0`


> 🔥 **Danger**
> You may get **"Error 14"** errors if spindle is either unable to reach or stay within tolerance, or if communication is not working (Incorrect Modbus settings for example)



---

## `$341` – Tool Change Mode
Selects the procedure to be used for an `M6` tool change command.


> ℹ️ **Info**
> - This setting applies to Manual/Semi-Automatic Toolchanges, they are not used when the ATC is enabled.
> - It requires the sender to handle the new TOOL state: https://github.com/grblHAL/core/wiki/Manual,-semi-automatic-and-automatic-tool-change


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| `M6` commands are ignored. |
| 1     | Manual  | Pauses the machine and waits for the user to change the tool and press Cycle Start. |
| 2+    | Semi automatic | Initiates a predefined tool change sequence |

#### Common Examples
*   **Simple Manual Tool Change:**
    *   `$341=1`
*   **A predefined tool change sequence**
    *   `$341=2`


#### Tips & Tricks
- Semi Automatic tool change sequences are hardcoded in the core
- `$341` - `$346` are not available if an ATC is configured. See `$675`.

---

## `$342` – Tool Change Probing Distance (mm)
Sets the maximum distance the Z-axis will travel when searching for the toolsetter during a tool change.


> ℹ️ **Info**
> - This setting applies to Manual/Semi-Automatic Toolchanges, they are not used when the ATC is enabled.
> - It requires the sender to handle the new TOOL state: https://github.com/grblHAL/core/wiki/Manual,-semi-automatic-and-automatic-tool-change
> - When using an automated toolsetter, this is a safety setting to prevent a crash if the probe fails.
> - The value should be large enough to account for the difference between your longest and shortest tools.


| Value (mm)| Description |
|:---------:|:------------|
| 1 - N     | The maximum probing distance. Typically negative for a Z-axis moving down. |

#### Common Examples
*   **Typical Toolsetter Setup:**
    *   `$342=-50.0`

#### Tips & Tricks
- `$341` - `$346` are not available if an ATC is configured. See `$675`.

---

## `$343` – Tool Change Probe Feed (Locate Feed)
Sets the slower "locate" feed rate for the final, precise touch on the toolsetter.


> ℹ️ **Info**
> - After the initial fast search, the machine will retract and re-approach slowly at this rate for maximum accuracy.
> - This is analogous to the `$24` (Homing Locate Rate).
> - This setting applies to Manual/Semi-Automatic Toolchanges, they are not used when the ATC is enabled.
> - It requires the sender to handle the new TOOL state: https://github.com/grblHAL/core/wiki/Manual,-semi-automatic-and-automatic-tool-change


| Value (mm/min)| Description |
|:-------------:|:------------|
| 10 - 100      | A slow, precise speed for accurate tool measurement. |

#### Common Examples
*   **High-Precision Toolsetter:**
    *   `$343=25`


#### Tips & Tricks
- `$341` - `$346` are not available if an ATC is configured. See `$675`.

---

## `$344` – Tool Change Seek Rate
Sets the faster feed rate for the initial search for the toolsetter.


> ℹ️ **Info**
> - This is the speed the machine moves at the start of the tool measurement probe.
> - This is analogous to the `$25` (Homing Search Rate).
> - This setting applies to Manual/Semi-Automatic Toolchanges, they are not used when the ATC is enabled.
> - It requires the sender to handle the new TOOL state: https://github.com/grblHAL/core/wiki/Manual,-semi-automatic-and-automatic-tool-change


| Value (mm/min)| Description |
|:-------------:|:------------|
| 200 - 1000+   | A safe but efficient speed to find the toolsetter. |

#### Common Examples
*   **Standard Toolsetter Setup:**
    *   `$344=400`


#### Tips & Tricks
- `$341` - `$346` are not available if an ATC is configured. See `$675`.

---

## `$345` – Tool Change Probe Pull-off / Retract
Sets the distance the Z-axis retracts after the probe is complete.


> ℹ️ **Info**
> - This moves the tool clear of the toolsetter after the measurement is complete.
> - This is analogous to the `$27` (Homing Pull-off Distance).
> - This setting applies to Manual/Semi-Automatic Toolchanges, they are not used when the ATC is enabled.
> - It requires the sender to handle the new TOOL state: https://github.com/grblHAL/core/wiki/Manual,-semi-automatic-and-automatic-tool-change


| Value (mm)| Description |
|:---------:|:------------|
| 1 - N     | The distance to retract after probing. |

#### Common Examples
*   **Standard Toolsetter Setup:**
    *   `$345=2.0`


#### Tips & Tricks
- `$341` - `$346` are not available if an ATC is configured. See `$675`.

---

## `$346` – Tool Change Options (mask)
Configures advanced options for the tool change process.


> ℹ️ **Info**
> - This is a **bitmask** that enables or disables specific behaviors during an `M6` sequence.
> - The available options depends on the tool change mode selected by `$341`.
> - This setting applies to Manual/Semi-Automatic Toolchanges, they are not used when the ATC is enabled.
> - It requires the sender to handle the new TOOL state: https://github.com/grblHAL/core/wiki/Manual,-semi-automatic-and-automatic-tool-change


#### Tips & Tricks
- `$341` - `$346` are not available if an ATC is configured. See `$675`.


---

## `$347` - `$349` – Dual Axis Length Fail
A safety feature for ganged axes to detect if the gantry has become skewed or racked.


> ℹ️ **Info**
> - This feature is for machines with two motors driving a single axis (e.g., a dual-Y gantry).
> - It compares the positions of the two motors. If they differ by more than the allowed amount, it triggers an alarm.
> - `$347`: **Fail Percent:** The maximum allowed difference as a percentage of the move length.
> - `$348`: **Fail Min:** A minimum move length before this check is activated.
> - `$349`: **Fail Max:** A maximum difference in mm, regardless of percentage.



---

## `$350` – THC Mode
The master switch and mode selector for the Torch Height Control system.


> ℹ️ **Info**
> - This setting is used by the Plasma/THC plugin.
> - THC automatically adjusts torch height to maintain a constant arc voltage, which is critical for cut quality.


| Value | Meaning |
|:-----:|:--------|
| 0     | Disabled |
| 1     | Automatic |
| ...   | Plugin-specific modes |

---

## `$351` – THC Delay
Sets a delay after the "Arc OK" signal is received before THC becomes active.


> ℹ️ **Info**
> - This is the "pierce delay." It allows the torch to pierce the material completely before height control begins, preventing the torch from diving into molten metal.


| Value (seconds)| Description |
|:--------------:|:------------|
| 0.0 - N        | The delay time. |

---

## `$352` – THC Threshold
Sets the voltage "deadband" for THC corrections.


> ℹ️ **Info**
> - This is the +/- voltage window around the target arc voltage where no Z-axis correction will be made.
> - It prevents the Z-axis from constantly jittering ("hunting") due to tiny voltage fluctuations.


| Value (Volts) | Description |
|:-------------:|:------------|
| 0.0 - N       | The allowable voltage deviation before a correction is made. |

---

## `$353` - `$355` – THC PID Gains
Sets the P, I, and D gains for the THC's Z-axis correction PID controller.


> ℹ️ **Info**
> - `$353`: P-Gain (Proportional)
> - `$354`: I-Gain (Integral)
> - `$355`: D-Gain (Derivative)
> - These values are used to tune how aggressively and smoothly the Z-axis responds to changes in arc voltage. This is a very advanced tuning process.


---

## `$356` – THC VAD Threshold
Voltage-based Anti-dive threshold.


> ℹ️ **Info**
> - A feature to prevent "torch diving" at corners. When the machine slows down, this helps the THC logic to avoid misinterpreting the resulting voltage change.


---

## `$357` – THC Void Override
Enables THC override when crossing voids or previously cut kerfs.


> ℹ️ **Info**
> - When the torch crosses a void, voltage spikes and a simple THC will dive. This feature helps prevent that.


---

## `$358` – Arc Fail Timeout (sec)
Sets the maximum time to wait for the "Arc OK" signal after the torch is fired (`M3`).


> ℹ️ **Info**
> - After the torch is commanded to fire, the controller starts this timer.
> - It then waits for a valid "Arc OK" signal to be received on the input pin defined by `$367`.
> - If the "Arc OK" signal is not received before this timer expires, grblHAL will declare a fault and begin the retry sequence.
> - This prevents the machine from running a cutting path without the torch being properly lit and cutting.


| Value (sec)| Meaning | Description |
|:----------:|:--------|:------------|
| 0.1 - N    | Timeout | The duration to wait for the "Arc OK" signal. |

#### Common Examples
*   **Wait up to 5 seconds for the arc:**
    *   This provides ample time for the plasma cutter to fire and for the arc to transfer and stabilize.
    *   `$358=5.0`

#### Tips & Tricks
- This value should be long enough to account for your plasma cutter's entire pierce sequence.
- If it's too short, you may get false "misfire" alarms. If it's too long, the machine will wait unnecessarily before starting a retry.

---
## `$359` – Arc Retry Delay (sec)
Sets the delay between a failed arc attempt and the next attempt.


> ℹ️ **Info**
> - If the `$358` timer expires, grblHAL will turn off the torch, wait for this delay period, and then try to fire the torch again.
> - This delay allows the plasma cutter's internal systems to reset and for any post-flow air to stop before the next attempt.


| Value (sec)| Meaning | Description |
|:----------:|:--------|:------------|
| 0.1 - N    | Delay | The pause duration between retry attempts. |

#### Common Examples
*   **Wait 3 seconds between retries:**
    *   This gives the system time to reset before trying again.
    *   `$359=3.0`

#### Tips & Tricks
- Check your plasma cutter's manual for a recommended "post-flow" time, and set this delay to be slightly longer than that.

---

## `$360` – Arc Max Retries
Sets the number of times to attempt to fire the torch *after* the initial failure.


> ℹ️ **Info**
> - This setting controls how many times the retry cycle (`$359` delay -> fire torch -> `$358` timeout) will be repeated.
> - If the arc still fails after all retry attempts, grblHAL will abort the job and enter an alarm state.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | No Retries | If the first attempt fails, the job will alarm immediately. |
| 1-N   | # of Retries | The number of additional attempts to make. |

#### Common Examples
*   **Allow 2 retries:**
    *   The system will try to fire the torch a total of 3 times (the initial attempt + 2 retries).
    *   `$360=2`

#### Tips & Tricks
- Setting this to `1` or `2` can often recover from intermittent misfires caused by moisture or worn consumables, saving a large job from being ruined.
- If you are getting frequent misfires that require multiple retries, it is a sign that your plasma consumables (nozzle, electrode) need to be replaced.

---

## `$361` & `$362` – Arc Voltage Scale & Offset
Applies a scale factor and offset to the raw analog voltage reading from the THC.


> ℹ️ **Info**
> - These settings are used to calibrate the analog input (`$366`) to match the true arc voltage.
> - This allows you to correct for inaccuracies in the voltage divider or analog reading circuitry.
> - **Formula:** `True_Voltage = (Raw_ADC_Reading * Scale) + Offset`


| Setting | Description |
|:--------|:------------|
| `$361`  | **Voltage Scale:** A multiplier (e.g., `1.01` to increase reading by 1%). |
| `$362`  | **Voltage Offset:** A value to add or subtract (e.g., `-0.5` to subtract 0.5V). |

---

## `$363` – Arc Height Per Volt
Defines the relationship between arc voltage and torch height.


> ℹ️ **Info**
> - A fundamental tuning parameter for THC. It tells the controller how much to move the Z-axis for a given change in voltage.
> - The value is typically expressed in mm/Volt or inches/Volt.
> - This value is specific to your plasma cutter, material, and consumables.


---

## `$364` & `$365` – Arc OK Voltage Range
Defines the acceptable voltage window for the "Arc OK" signal.


> ℹ️ **Info**
> - In some systems without a dedicated "Arc OK" digital input, grblHAL can infer the signal by monitoring the arc voltage.
> - `$364`: **Arc OK High Voltage:** The upper voltage limit.
> - `$365`: **Arc OK Low Voltage:** The lower voltage limit.
> - If the measured arc voltage is within this window, the arc is considered stable.


---

## `$366` – Arc Voltage Analog Input Port
Maps the physical analog input pin for reading the torch voltage.


> ℹ️ **Info**
> - This setting is used by the Plasma/THC plugin.
> - It tells the plugin which analog-to-digital converter (ADC) pin on the controller is connected to the plasma torch's voltage divider output.


| Value | Meaning |
|:-----:|:--------|
| Pin # | The hardware ADC pin number. |

#### Tips & Tricks
- This is a hardware-specific mapping. You **must** consult the documentation for your specific controller board to find the correct pin number.

---

## `$367` – Arc OK Digital Input Port
Maps the physical digital input pin for the "Arc OK" signal.


> ℹ️ **Info**
> - This setting is used by the Plasma/THC plugin.
> - The "Arc OK" (or "Arc Transfer") signal is a digital output from the plasma cutter that confirms a stable cutting arc has been established.
> - grblHAL will not begin motion until this signal becomes active.


| Value | Meaning |
|:-----:|:--------|
| Pin # | The hardware digital input pin number. |

#### Tips & Tricks
- This is a hardware-specific mapping. You **must** consult the documentation for your specific controller board to find the correct pin number.

---

## `$368` – Cutter Down Digital Output Port
Maps the physical digital output pin to an external "Torch Down" signal.


> ℹ️ **Info**
> - This setting is used by some advanced THC systems.
> - Instead of controlling the Z-axis motor directly, grblHAL can output simple "Up" and "Down" signals to an external, dedicated torch height controller.
> - This setting defines the pin for the "Down" signal.


| Value | Meaning |
|:-----:|:--------|
| Pin # | The hardware digital output pin number. |

---

## `$369` – Cutter Up Digital Output Port
Maps the physical digital output pin to an external "Torch Up" signal.


> ℹ️ **Info**
> - This setting is used by some advanced THC systems.
> - It defines the pin for the "Up" signal to be sent to an external THC controller.
> - Works in conjunction with `$368`.


| Value | Meaning |
|:-----:|:--------|
| Pin # | The hardware digital output pin number. |

---

## `$370` – Invert I/O Port Inputs (mask)
Inverts the logic for the generic digital input pins.


> ℹ️ **Info**
> - This is a grblHAL-specific feature for advanced I/O control.
> - It allows you to invert the signal for any of the general-purpose input pins that are not already assigned to a specific function like limits or controls.
> - This is a **bitmask**: the value corresponds to the I/O port number, not a specific function.


| Bit | Value | Input to Invert |
|:---:|:-----:|:----------------|
| 0   | 1     | I/O Port 0      |
| 1   | 2     | I/O Port 1      |
| 2   | 4     | I/O Port 2      |
| ... | ...   | And so on...    |

#### Tips & Tricks
- This is an advanced setting used when integrating custom hardware or macros that read digital inputs.
- You must know the I/O port number that corresponds to the physical pin on your controller.
- Use the `$PINS` command to list all pins including auxiliary I/O ports.
- `$PINSTATE` command can be used to check pin capabilities and current state.


---

## `$371` – IO Port Pull-up Disable (mask)
Disables the internal pull-up resistors on the generic digital input pins.


> ℹ️ **Info**
> - This works exactly like `$17` (Control Inputs) and `$18` (Limit Inputs), but applies to the general-purpose I/O ports.
> - Only disable this if your external hardware provides its own pull-up or is an "active" (push-pull) driver.


| Bit | Value | Input Pull-up to Disable |
|:---:|:-----:|:-------------------------|
| 0   | 1     | I/O Port 0               |
| 1   | 2     | I/O Port 1               |
| 2   | 4     | I/O Port 2               |
| ... | ...   | And so on...             |

#### Tips & Tricks
- Use the `$PINS` command to list all pins including auxiliary I/O ports.
- `$PINSTATE` command can be used to check pin capabilities and current state.
- [M62, M63, M64 and M65 – Synchronized and Asynchronous I/O](../Reference/complete-g-m-code-reference#m62-m63-m64-and--m65--synchronized-and-asynchronous-io)  
-  [M66 – Wait for Input Signal](../Reference/complete-g-m-code-reference#m66--wait-for-input-signal)  
-  [M67, M68 – Set Analog Output](../Reference/complete-g-m-code-reference#m67-m68--set-analog-output)  

---

## `$372` – Invert I/O Port Outputs (mask)
Inverts the logic for the generic digital output pins.


> ℹ️ **Info**
> - This allows you to flip the signal for general-purpose outputs, for example, to control a relay that requires an active-low signal to turn on.
> - This is a **bitmask** corresponding to the I/O port number.


| Bit | Value | Output to Invert |
|:---:|:-----:|:-----------------|
| 0   | 1     | I/O Port 0       |
| 1   | 2     | I/O Port 1       |
| 2   | 4     | I/O Port 2       |
| ... | ...   | And so on...     |

#### Tips & Tricks
- Use the `$PINS` command to list all pins including auxiliary I/O ports.
- `$PINSTATE` command can be used to check pin capabilities and current state.
- [M62, M63, M64 and M65 – Synchronized and Asynchronous I/O](../Reference/complete-g-m-code-reference#m62-m63-m64-and--m65--synchronized-and-asynchronous-io)  
-  [M66 – Wait for Input Signal](../Reference/complete-g-m-code-reference#m66--wait-for-input-signal)  
-  [M67, M68 – Set Analog Output](../Reference/complete-g-m-code-reference#m67-m68--set-analog-output)  

---

## `$373` – IO Open-Drain Enable
Configures generic output pins to operate in "open-drain" mode.


> ℹ️ **Info**
> - This is an advanced electrical configuration. In open-drain mode, the pin can only pull the signal to Ground (low). It cannot drive it High. An external pull-up resistor is required.
> - This is useful for interfacing with devices that operate at a different voltage level or for connecting multiple devices to a single signal line.


#### Tips & Tricks
- Use the `$PINS` command to list all pins including auxiliary I/O ports.
- `$PINSTATE` command can be used to check pin capabilities and current state.
- [M62, M63, M64 and M65 – Synchronized and Asynchronous I/O](../Reference/complete-g-m-code-reference#m62-m63-m64-and--m65--synchronized-and-asynchronous-io)  
-  [M66 – Wait for Input Signal](../Reference/complete-g-m-code-reference#m66--wait-for-input-signal)  
-  [M67, M68 – Set Analog Output](../Reference/complete-g-m-code-reference#m67-m68--set-analog-output)  


---

## `$374` – ModBus Baud Rate (index)
Configures the serial communication speed for the built-in Modbus RTU interface.


> ℹ️ **Info**
> - This setting must **exactly** match the baud rate configured in your VFD or other Modbus device.
> - The value is an index, not the baud rate itself.


| Index | Baud Rate |
|:-----:|:----------|
| 0     | 9600      |
| 1     | 19200     |
| 2     | 38400     |
| 3     | 57600     |
| 4     | 115200    |

#### Common Examples
*   **Many VFDs default to 9600 baud:**
    *   `$374=0`
*   **Faster communication:**
    *   `$374=1` (for 19200 baud)

#### Tips & Tricks
  *   Check your VFDs manual, or go into the VFD settings and check what the Modbus Baud Rate is set to


---

## `$375` – ModBus RX Timeout (ms)
Sets the time grblHAL will wait for a response from a Modbus device before flagging an error.


> ℹ️ **Info**
> - If a response from the VFD is not received within this time, grblHAL will report a communication error.


| Value (ms) | Description |
|:----------:|:------------|
| 1 - N      | The timeout in milliseconds. |

#### Common Examples
*   **Default Timeout:**
    *   `$375=200`

#### Tips & Tricks
- If you are on a very slow or noisy serial line, you may need to increase this value slightly, but for most setups, the default is fine.

---

## `$376` – Rotary Axes Mask
Identifies which axes are rotary axes, as opposed to linear axes.


> ℹ️ **Info**
> - This is a crucial setting for machines with a 4th or 5th axis. It tells the G-code interpreter that coordinates for these axes are in degrees.
> - It also affects feed rate calculations when using Inverse Time Feed Mode (`G93`).
> - This is a **bitmask**: add together the values of your rotary axes.


| Bit | Value | Axis is Rotary |
|:---:|:-----:|:---------------|
| 0   | 1     | A-Axis |
| 1   | 2    | B-Axis |
| 2   | 4    | C-Axis |

#### Common Examples
*   **Standard 3-Axis Mill (No Rotary):**
    *   `$376=0`
*   **4-Axis Mill with a Rotary A-Axis:**
    *   `$376=1`
*   **5-Axis Mill with A and C Rotary Axes:**
    *   `1` (A) + `4` (C) → `$376=5`

#### Tips & Tricks
- The first three axes (X, Y, Z) are always assumed to be linear and cannot be set as rotary.

---

## `$377` – Bluetooth Module Status (Config Flag for Auto-Configuration)
Manages the initialization state of an external Bluetooth module


> ℹ️ **Info**
> - This setting is specifically for external UART-connected Bluetooth modules. It is **not** applicable for Bluetooth functionality provided directly by the controller's chipset.
> - It is used by the Bluetooth plugin to control and report on the module's initialization status.
> - Setting it to `0` typically signals the plugin to attempt (or re-attempt) auto-configuration of the external Bluetooth module. A successful auto-configuration process will then set this value to `1`.



> ℹ️ **Info**
> To achieve this an UART port and an interrupt capable auxillary input pin is required - the input pin has to be connected to the module STATE pin (See `$385`). The plugin will claim the highest numbered Aux input pin, this can be found by either checking the board map file or listing the available pins with the $pins system command.




| Value | Meaning |
|:-----:|:--------|
| 0     | Signals the Bluetooth plugin to attempt auto-configuration/initialization of the external module. |
| 1     | Indicates the external Bluetooth module has been successfully initialized (set by the plugin). |

#### Auto configuration

Ensure the $377 setting is set to 0 (it can be found in the Bluetooth group if your sender supports grouping of settings). Power up the controller and the module while pressing down the AT-mode switch on the module. This will change the controller baud rate to 38400 and it will then send the AT commands required for configuration. Reports will be sent to the default com port indicating success or failure. Success is also indicated by $377 beeing set to 1. After auto configuration is completed cycle power to both the module and the controller to start normal operation.

#### Manual configuration
If the module is already configured for correct operation (baud rate set to 115200 baud) then automatic switching can be enabled by setting $377 to 1.

#### Tips & Tricks
- For a comprehensive guide, refer to the [grblHAL Bluetooth Plugin documentation](https://github.com/grblHAL/Plugins_Bluetooth/#auto-configure).

---

## `$378` – Laser Coolant On Delay (sec)
## `$379` – Laser Coolant Off Delay (sec)
Sets a delay for when the laser coolant system turns on or off, respectively.


> ℹ️ **Info**
> - These are part of the closed-loop laser coolant control system (`$378` - `$383`, `$390`, `$391`).
> - `On Delay`: Time to wait after `M3`/`M4` before the coolant is assumed to be flowing.
> - `Off Delay`: Time the coolant pump continues to run after `M5` to cool down the laser.


| Value (seconds) | Description |
|:---------------:|:------------|
| 0.0 - N         | The delay duration in seconds. |

---

## `$380` – Laser Coolant Min Temp (°C)
## `$381` – Laser Coolant Max Temp (°C)
Define the acceptable operating temperature range for the laser coolant.


> ℹ️ **Info**
> - If the coolant temperature (read via `$390`) goes outside this range, an alarm or warning can be triggered to protect the laser.


| Value (°C) | Description |
|:----------:|:------------|
| N          | Temperature in degrees Celsius. |

---

## `$382` – Laser Coolant Offset (ADC calibration)
## `$383` – Laser Coolant Gain (ADC calibration)
Calibration parameters for the analog-to-digital converter (ADC) used to read the laser coolant temperature.


> ℹ️ **Info**
> - These are used to convert the raw ADC value from the temperature sensor into an accurate temperature reading.
> - Formula: `True_Temperature = (Raw_ADC_Reading * Gain) + Offset`


---

## `$385` – Keep Last Tool
Enables the persistence of the last used tool number across restarts.


> ℹ️ **Info**
> - Moved from the template plugin to the core (Build 20250618).
> - If enabled (`1`), the controller will remember which tool was active (`T` number) before a power cycle or reset and restore it on startup.


| Value | Meaning |
|:-----:|:--------|
| 0     | Disabled |
| 1     | Enabled |

#### Tips & Tricks
- This was formerly the "Bluetooth State Input" setting in older configurations.


---

## `$386` – Fan Port 0
## `$387` – Fan Port 1
## `$388` – Fan Port 2
## `$389` – Fan Port 3
Maps the physical output pins for up to four controllable fans.


> ℹ️ **Info**
> - These settings define which I/O port controls each fan.
> - Fans can be linked to spindle state via `$483`.


| Value | Meaning |
|:-----:|:--------|
| Pin # | The hardware digital output pin number. |

---

## `$390` – Laser Coolant Temp Port (Analog pin)
Maps the analog input pin for reading the laser coolant temperature sensor.


> ℹ️ **Info**
> - This tells the laser coolant control system which ADC pin to use for temperature feedback.


| Value | Meaning |
|:-----:|:--------|
| Pin # | The hardware ADC pin number. |

---

## `$391` – Laser Coolant OK Port (Digital pin)
Maps the digital input pin for the laser coolant flow switch.


> ℹ️ **Info**
> - This input provides feedback on whether the coolant is actually flowing, essential for laser safety.


| Value | Meaning |
|:-----:|:--------|
| Pin # | The hardware digital input pin number. |

---

## `$392` – Door Spindle On Delay (sec)
Adds a delay after the safety door is closed before the spindle is automatically restarted.


> ℹ️ **Info**
> - A safety feature used with the Safety Door (`$61`) system.
> - Provides a "grace period" after the door is closed before the spindle automatically turns back on.
> - **Spindle Ramp Up:** If `$9` bit 3 is set, this setting (`$392 > 0`) enables Spindle Ramp Up on door close and/or restore from parked.


---

## `$393` – Door Coolant On Delay (sec)
Adds a mandatory delay after the safety door is closed before coolant outputs are re-activated.


> ℹ️ **Info**
> - This is a safety feature, similar to `$392` (Door Spindle On Delay).
> - It prevents coolant from spraying unexpectedly immediately after the door is closed, giving the operator time to clear the area.


| Value (sec) | Description |
|:-----------:|:------------|
| 0.0 - N     | The pause duration in seconds. |

---
---

## `$394` – Spindle On Delay (sec)
Adds a mandatory delay after a spindle start command is executed, before motion resumes.


> ℹ️ **Info**
> - This is a critical setting for machines with VFDs or large spindles that require time to accelerate to the commanded speed.
> - It forces grblHAL to pause for a specified time after an `M3` or `M4` command.
> - **Spindle Ramp Up:** If `$9` bit 3 is set, this setting (`$394 > 0`) enables Spindle Ramp Up for spindle on and on RPM changes while spindle is enabled.



> 💡 **Tip**
> When "spindle-at-speed" is configured by `$340` this setting is ignored




| Value (sec) | Description |
|:-----------:|:------------|
| 0.0 - N     | The pause duration in seconds. |

#### Common Examples
*   **CNC with a VFD-controlled Spindle:**
    *   It might take 3-4 seconds for the spindle to reach 18000 RPM.
    *   `$394=4.0`
*   **Simple router with instant-on:**
    *   `$394=0.5` (a small safety delay)

#### Tips & Tricks
- Using this setting is much safer than relying on `G4` dwell commands in G-code, as it prevents the tool from plunging into the material before the spindle is at full speed.
- Time how long it takes for your spindle to reach its typical operating speed and set this value accordingly, adding a small safety margin.
- Also see `G65P6` which turns off all spindle delays for the next M3, M4 and M5 command. Useful for ATCs which use the spindle to lock/unlock the spindle collet nut.
- The reason for having both a general delay and a door open delay is that the general delay is not needed (nor wanted) if G4 is used for spindle delay in the g-code.

---

## `$395` – Default Spindle Index/Type
Selects the default spindle to be used if not otherwise specified by a command.


> ℹ️ **Info**
> - grblHAL supports multiple spindle types (e.g., PWM, Modbus VFD, Relay) that can coexist.
> - This setting determines which spindle is considered the "default" and will respond to standard `M3`/`M4`/`M5` commands.


| Value | Meaning |
|:-----:|:--------|
| 0     | Spindle 0 |
| 1     | Spindle 1 |
| ...   | ... |

#### Tips & Tricks
- This is an advanced setting for machines with multiple or complex spindle configurations. For most users with a single spindle or laser, the default value (`0`) is correct.

---

## `$396`, `$397` – WebUI Settings
Configures behavior for the network-based Web User Interface.


> ℹ️ **Info**
> - `$396`: **WebUI Timeout:** Sets a timeout for the WebUI session.
> - `$397`: **WebUI Auto-Report Interval:** Sets how often the WebUI receives an automatic status update from the controller.



---

## `$398` – Planner Buffer Blocks
Configures the size of the motion planner buffer.


> ℹ️ **Info**
> - The planner buffer is where grblHAL stores upcoming motion blocks. This allows it to "look ahead" to calculate smooth accelerations and manage cornering speeds.
> - A larger buffer allows for smoother motion on complex paths with many small line segments (like 3D carving or raster engraving).
> - The maximum size is limited by the available RAM on your controllerm or capped to a max of 1000 blocks


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 16-1000  | The number of motion blocks to buffer. |

#### Common Examples
*   **Standard Controller (e.g., STM32F4xx):**
    *   `$398=32`
*   **High-Performance Controller (e.g., iMXRT1062 / Teensy 4.1):**
    *   `$398=64`

#### Tips & Tricks
- The maximum useful value depends on the processor speed and whether it has a FPU or not. This since the planner buffer is continuously processed to determine the optimal feed rate. Since a larger buffer takes longer to process there will be a point where increasing the buffer size will lead to reduced performance.

---

## `$399` – CANbus Baud Rate
Sets the communication speed for an integrated CAN bus interface.


> ℹ️ **Info**
> - This is for controllers that communicate with external devices (e.g., smart motor drivers, I/O expanders) over a CAN bus network.
> - The value must match the baud rate of all other devices on the CAN bus.


| Index | Baud Rate |
|:-----:|:----------|
| 0     | 125 kbps  |
| 1     | 250 kbps  |
| 2     | 500 kbps  |
| 3     | 1 Mbps    |

---

## `$400` – Encoder 0 - Index (Base)
Selects the primary function for the first encoder (Encoder 0).


> ℹ️ **Info**
> - This is the master setting for the first encoder block (`$400`-`$409`). It determines what the encoder will control.
> - Encoders are typically used for Manual Pulse Generators (MPGs) or digital control knobs.
> - A value of `0` disables this encoder.


| Index | Function | Description |
|:-----:|:---------|:------------|
| 0     | Disabled | This encoder is not used. |
| 1-6   | Jog Axis X-C | Use the encoder to jog the specified axis. |
| 7     | Feed Rate Override | Use the encoder to adjust the feed rate override. |
| 8     | Rapid Rate Override | Use the encoder to adjust the rapid rate override. |
| 9     | Spindle Speed Override | Use the encoder to adjust the spindle speed override. |

#### Common Examples
*   **Jog Z-Axis with an MPG:**
    *   `$400=3`
*   **Control Feed Rate with a Knob:**
    *   `$400=7`

---

## `$401` – Encoder 0 - CPR / Resolution
Sets the Counts Per Revolution (CPR) of the Encoder 0 hardware.


> ℹ️ **Info**
> - This tells grblHAL how many signals the encoder generates for one full 360° turn.
> - For a quadrature encoder, CPR is typically 4 times its PPR (Pulses Per Revolution).
> - This value is usually found in the encoder's datasheet.


| Value | Meaning |
|:-----:|:--------|
| 1-N   | The CPR value of the encoder. |

#### Common Examples
*   **Standard 100-PPR MPG Pendant:**
    *   100 Pulses Per Revolution = 400 Counts Per Revolution.
    *   `$401=400`

---

## `$402` – `$449` – Encoder Settings (Extended)
This range is reserved for additional encoder configurations beyond the primary Encoder 0 (`$400`, `$401`). It may be used for multiple MPGs, digital potentiometers, or other rotational input devices. The specific settings within this range are plugin- or driver-dependent.

---

## `$450 - $459` – User Defined Slots
Ten general-purpose "slots" that are for private custom settings values implemented by plugins


> ℹ️ **Info**
> - These settings (`$450`-`$459`) are provided as persistent storage for use within custom plugins
> - The most common use is to store settings that are then read or used by the plugin.


| Value | Meaning |
|:-----:|:--------|
| Any   | Can store floating-point numbers or integers for use in plugins. The data type for each is declared by the plugin itself |


#### Tips & Tricks
- Do not use for plugins/customizations that are published and thus available for wide use

---

## `$460` – VFD Modbus Address
Sets the Modbus slave address for the primary VFD.


> ℹ️ **Info**
> - This is used by VFD plugins (e.g., GS20, YL620A) to communicate with the VFD via Modbus RTU.
> - This address *must* match the ID configured in the VFD's parameters.
> - If multiple VFDs are on the same Modbus network, each needs a unique address.


| Value | Meaning |
|:------|:--------|
| 1-247 | The unique Modbus slave ID of the VFD. |

#### Common Examples
*   **Typical VFD Address:**
    *   `$460=1`

#### Tips & Tricks
- Consult your VFD's manual for its Modbus slave ID parameter.

---

## `$461` – VFD RPM/Hz Scaling
Configures the RPM-to-frequency conversion for some VFD plugins.


> ℹ️ **Info**
> - These settings are used by some VFD drivers (like GS20, YL620A) to convert the `S` command (in RPM) to the frequency (in Hz) that the VFD requires.
> - `$460`: VFD Modbus Address (This appears to be a duplicate of `$360` for some drivers).
> - `$461`: **RPM per Hz:** The core conversion factor.


#### Common Examples for `$461`
*   **2-pole spindle motor (50 Hz → 3000 RPM):**
    *   `3000 RPM / 50 Hz = 60`.
    *   `$461=60`
*   **4-pole spindle motor (50 Hz → 1500 RPM):**
    *   `1500 RPM / 50 Hz = 30`.
    *   `$461=30`


---

## `$462` - `$473` - reserved for VFD spindle parameters. Currently some are defined and used by the `MODVFD VFD` driver.

---

## `$462` – VFD Register: Run/Stop
The Modbus register address that controls starting and stopping the spindle.


> ℹ️ **Info**
> - This is an advanced feature for controlling a spindle via a direct digital connection (Modbus RTU).
> - This value **must** match the specific register address defined in your VFD's manual for run control.
> - Used by the Spindle VFD plugin.


| Value | Meaning |
|:------|:--------|
| 0-N   | The Modbus register address. |

#### Common Examples
*   **Typical Huanyang VFD:**
    *   The run control command is often at address `0x2000`.
    *   `$462=8192` (which is 2000 in hexadecimal)

#### Tips & Tricks
- This is one of the key settings for VFD integration. An incorrect address here will mean the spindle will not start or stop.
- The rest of the `$46x` block defines the other registers and command words needed for full VFD control.

---

---

## `$463` – VFD Register: Set Frequency
The Modbus register address for setting the target spindle speed (as a frequency).


> ℹ️ **Info**
> - Used by the VFD plugin to control spindle RPM.
> - When you send an `S` command, grblHAL calculates the required frequency and writes it to this register in the VFD.
> - This value **must** match the address specified in your VFD's manual for "Frequency Setting" or "Target Frequency".


| Value | Meaning |
|:------|:--------|
| 0-N   | The Modbus register address. |

#### Common Examples
*   **Typical Huanyang VFD:**
    *   The frequency setting command is often at address `0x2001`.
    *   `$463=8193`

#### Tips & Tricks
- If your spindle turns on but always runs at the same speed regardless of the `S` command, this register address is likely incorrect.

---

## `$464` – VFD Register: Get Frequency
The Modbus register address for reading the *actual* spindle speed (as a frequency) from the VFD.


> ℹ️ **Info**
> - Used by the VFD plugin for monitoring and for features like "spindle at speed" checking.
> - This allows grblHAL to read back the real speed from the VFD.


| Value | Meaning |
|:------|:--------|
| 0-N   | The Modbus register address. |

#### Common Examples
*   **Typical Huanyang VFD:**
    *   The output frequency is often readable from address `0x2103`.
    *   `$464=8451`

---

## `$465` – VFD Command Word for CW
The value to write to the Run/Stop register (`$462`) to start the spindle clockwise (`M3`).


> ℹ️ **Info**
> - VFDs use specific numerical codes ("command words") to tell them what to do.
> - This value is the code for "Run Forward". It must match your VFD's manual.


| Value | Meaning |
|:------|:--------|
| 0-N   | The command word for clockwise rotation. |

#### Common Examples
*   **Typical Huanyang VFD:**
    *   The "Run Forward" command is often `18`.
    *   `$465=18`

---

## `$466` – VFD Command Word for CCW
The value to write to the Run/Stop register (`$462`) to start the spindle counter-clockwise (`M4`).


> ℹ️ **Info**
> - This is the command word for "Run Reverse". It must match your VFD's manual.
> - Not all spindles/VFDs support reverse operation.


| Value | Meaning |
|:------|:--------|
| 0-N   | The command word for counter-clockwise rotation. |

#### Common Examples
*   **Typical Huanyang VFD:**
    *   The "Run Reverse" command is often `34`.
    *   `$466=34`

---

## `$467` – VFD Command Word for STOP
The value to write to the Run/Stop register (`$462`) to stop the spindle (`M5`).


> ℹ️ **Info**
> - This is the command word for "Stop". It must match your VFD's manual.


| Value | Meaning |
|:------|:--------|
| 0-N   | The command word for stop. |

#### Common Examples
*   **Typical Huanyang VFD:**
    *   The "Stop" command is often `1`.
    *   `$467=1`

---

## `$468` – RPM Value Multiplier
A multiplier used in the formula to convert RPM to the frequency value the VFD expects.


> ℹ️ **Info**
> - The formula is: `VFD_Frequency = (RPM * Multiplier) / Divider`.
> - VFDs often expect frequency in units of 0.01Hz or 0.1Hz. These settings allow you to scale the RPM value correctly.


| Value | Meaning |
|:------|:--------|
| 1-N   | The multiplier for the scaling formula. |

#### Common Examples
*   **Typical Huanyang VFD (expects frequency in 0.01Hz):**
    *   To convert RPM (rev/min) to 0.01Hz, the formula is `(RPM * 100) / 60`.
    *   `$468=100` (or sometimes `50` depending on pole count)

---

## `$469` – RPM Value Divider
A divider used in the formula to convert RPM to the frequency value the VFD expects.


> ℹ️ **Info**
> - The formula is: `VFD_Frequency = (RPM * Multiplier) / Divider`.


| Value | Meaning |
|:------|:--------|
| 1-N   | The divider for the scaling formula. |

#### Common Examples
*   **Typical Huanyang VFD (expects frequency in 0.01Hz):**
    *   To convert RPM (rev/min) to 0.01Hz, the formula is `(RPM * 100) / 60`.
    *   `$469=60`

---

## `$470` & `$471` – VFD Register: Additional Mapping
Reserved slots for mapping additional Modbus registers.


> ℹ️ **Info**
> - Some plugins may need to read or write other VFD parameters, such as motor current, faults, or temperature.
> - These slots provide a place to map those extra register addresses.


---

## `$472` – VFD 20 (Additional Modbus Register Mapping)
## `$473` – VFD 21 (Additional Modbus Register Mapping)
Reserved slots for mapping additional Modbus registers to extend VFD control or monitoring capabilities. Refer to `$470` for context.

---

## `$476` - `$479` – VFD Modbus Addresses
Provides additional slots for defining Modbus addresses for up to four VFDs.


> ℹ️ **Info**
> - This allows grblHAL to control multiple VFDs on the same Modbus network.
> - `$476`: Address for VFD 0
> - `$477`: Address for VFD 1
> - `$478`: Address for VFD 2
> - `$479`: Address for VFD 3


---

## `$480` – Fan 0 Off Delay
Sets an "off delay" timer for a connected fan.


> ℹ️ **Info**
> - This can be used as a "run-on" timer. After the fan is commanded to turn off, it will continue to run for this duration.


| Value (seconds) | Description |
|:---------------:|:------------|
| 0 - N           | The run-on time in seconds. |

#### Tips & Tricks
- Useful for ensuring a component (like a spindle or laser) is fully cooled down after the job is complete.
- Can be used to ensure all the smoke is ventilated from an enclosed laser machine for example

---

## `$481` – Auto Report Interval (ms)
Sets the interval for the automatic, unsolicited streaming of status reports.


> ℹ️ **Info**
> - This is an advanced feature primarily for network-based connections.
> - When set to a non-zero value, the controller will automatically send a `?` status report at this interval without the GUI needing to request it.
> - This can reduce network traffic compared to a constant polling loop from the sender.


| Value (ms) | Meaning | Description |
|:----------:|:--------|:------------|
| 0          | Disabled| Status reports are only sent when requested with `?`. (Default) |
| 100 - N    | Interval | The time in milliseconds between each automatic report. |

#### Common Examples
*   **Stream a report 5 times per second:**
    *   `$481=200`

#### Tips & Tricks
- This should only be enabled if your G-code sender is specifically designed to work with an auto-reporting stream. Using it with a standard polling sender will result in a flood of duplicate messages.
- May also be useful for pendants (pendant firmware needs ability to be configured not to send realtime polls)
- `0x8C` Realtime command can be used to toggle auto real time report mode on/off, available when the auto real time report is enabled. The current state can be queried. ioSender turns it off when connected and restores it on disconnect.

---

## `$482` – Timezone Offset
Sets the timezone as a simple offset from UTC in minutes.


> ℹ️ **Info**
> - This is a simpler alternative to the full POSIX TZ string in `$335`.
> - It is used to correct the UTC time from an NTP server to your local time.
> - It does **not** automatically handle Daylight Saving Time.


| Value | Meaning |
|:------|:--------|
| -N to +N| The offset from UTC in minutes. |

#### Common Examples
*   **USA Eastern Standard Time (EST is UTC-5):**
    *   -5 hours * 60 minutes/hour = -300 minutes.
    *   `$482=-300`
*   **Central European Time (CET is UTC+1):**
    *   +1 hour * 60 minutes/hour = 60 minutes.
    *   `$482=60`

---


## `$483` – Fan To Spindle Link
Links a fan's operation directly to the spindle or laser's state.


> ℹ️ **Info**
> - This setting allows a fan to be automatically turned on whenever the spindle/laser is running (`M3`/`M4`) and turned off when the spindle stops (`M5`).
> - This is commonly used for a spindle/laser cooling fan or a dust collection vacuum that should only run when cutting.
> - The value is a **bitmask** linking a fan number to a spindle/tool head number.


---

## `$484` – Unlock Required After E-Stop
A safety feature that requires an explicit unlock command after an E-stop has been cleared by a reset.


> ℹ️ **Info**
> - This prevents the machine from becoming immediately active after a reset that follows an alarm condition.
> - It forces the operator to deliberately unlock the machine (`$X`) before any motion is possible.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| The machine is IDLE and ready for commands immediately after reset. |
| 1     | Enabled (Default) | The machine enters an ALARM state after reset, requiring `$X` to unlock. (Safer) |

#### Common Examples
*   **For Enhanced Safety:**
    *   `$484=1`

---

## `$485` – Enable Tool Persistence
Controls whether the last used tool number is remembered after a reset.


> ℹ️ **Info**
> - If enabled, the controller will save the last active tool (`T` number) to memory.
> - When the controller reboots, that tool will be automatically re-activated, along with its associated offsets.


| Value | Meaning |
|:-----:|:--------|
| 0     | Disabled |
| 1     | Enabled |

---

## `$486` – Offset Lock (mask)
A safety feature that prevents G-code commands from modifying specific work coordinate systems.


> ℹ️ **Info**
> - When enabled, this setting blocks any G-code command (e.g., `G10 Lx`) that attempts to change the offset of selected work coordinate systems.
> - This is a safety feature to prevent a running G-code program from accidentally overwriting your carefully set work zero positions for critical coordinate systems.
> - This is a **bitmask**: add together the values of the G59.x work coordinate systems you want to protect from modification.


| Bit | Value | Work Coordinate System to Lock |
|:---:|:-----:|:-------------------------------|
| 0   | 1     | Lock G59.1 offset             |
| 1   | 2     | Lock G59.2 offset             |
| 2   | 4     | Lock G59.3 offset             |

#### Common Examples
*   **Default (No offsets locked):**
    *   `$486=0`
*   **Lock G59.3 (often used for toolsetter):**
    *   `$486=4`
*   **Lock G59.1 and G59.2:**
    *   `$486=3` (1 for G59.1 + 2 for G59.2)

#### Tips & Tricks
- This is particularly useful if G59.3 is designated for your toolsetter location, preventing accidental changes to its reference point during a job.
- If a `G10` command attempts to modify a locked offset, it will trigger an error.

---


---

## `$487`, `$488` – Spindle I/O Port Remapping
Allows remapping of the optional on/off spindle (type 9 and 10) control pins to different physical I/O ports.


> ℹ️ **Info**
> - This is an advanced hardware configuration setting.
> - It allows you to override the default board pinout and assign the spindle control signals to different pins.
> - This is useful for custom machine builds or when a default pin has been damaged.


| Setting | Signal to Remap |
|:--------|:----------------|
| `$487`  | Spindle On/Enable Port |
| `$488`  | Spindle Direction Port |


#### Tips & Tricks
- You must know the I/O Port numbers for your specific controller.
- Changing these without understanding your board's hardware can prevent your spindle from working.

---

## `$490` - `$499` – Macro M-Code Mapping (EEPROM/Flash)
Assigns custom M-codes (from M100 upwards) to execute specific G-code sequences directly stored in the controller's settings.


> ℹ️ **Info**
> - This is a powerful feature primarily used by the **Keypad Macro plugin** to associate custom G-code sequences with M-codes, which can then be triggered by physical button presses (via `$500+` MacroPort inputs or a keypad plugin).
> - `$490` corresponds to `M100`, `$491` to `M101`, and so on up to `$499` for `M109`.
> - The **value of the setting is the actual G-code sequence** to be executed, stored directly in the controller's EEPROM (or flash emulation). These stored macros have a **limited length** due to storage constraints.
> - Multiple G-code blocks can be defined within a single setting by separating them with a vertical bar (`|`).


| Setting | M-Code | Description |
|:--------|:-------|:------------|
| `$490`  | M100   | Executes the G-code sequence stored in setting $490 |
| `$491`  | M101   | Executes the G-code sequence stored in setting $491 |
| ...     | ...    | ...         |
| `$499`  | M109   | Executes the G-code sequence stored in setting $499 |

#### Common Examples
*   **Move to a origin position when M100 is called:**
    *   `$490=G90 G0 Z0 X0 Y0`
*   **Perform a simple Z probe when M101 is called:**
    *   `$491=G91 G38.2 Z-10 F100`

#### Tips & Tricks
- Due to length limitations of macros stored in settings, for **longer or more complex macros**, it is recommended to store them as `macro` files on the SD card. You can then call these SD card files from within an `$49x` macro using the `G65 P` command.
- For example, if you have a `500.macro` file on the SD card, you could set `$490=G65 P500`.
- These macros are most effective when combined with the MacroPort Input Mapping (`$500+`) or the Keypad plugin for physical button activation.


---

## `$510` - `$517` – Spindle Enable Mapping
Assigns a specific spindle type to each of the 8 available spindle slots.


> ℹ️ **Info**
> - grblHAL can support up to 8 different spindles (e.g., PWM, Relay, Modbus, etc.).
> - This block of settings determines which "driver" or type of spindle is assigned to each slot.
> - `$510`: Configuration for Spindle 0
> - `$511`: Configuration for Spindle 1
> - ... and so on.


---

## `$518` – Reserved
This is an unused slot in the settings enum.

---

## `$519` – Encoder-to-Spindle Mapping
Links a specific encoder to a specific spindle for closed-loop control.


> ℹ️ **Info**
> - This setting tells the closed-loop spindle PID controller (`$80`-`$86`) which encoder to use as its feedback source.
> - For example, you might link Encoder 0 to Spindle 0.


| Value | Meaning |
|:-----:|:--------|
| 0-N   | The index of the encoder to use. |

---

## `$520` - `$527` – Spindle Tool Start Offset
Assigns a starting tool number for each spindle.


> ℹ️ **Info**
> - This is used in multi-spindle or ATC setups.
> - It allows you to define a range of tool numbers that belong to a specific spindle.
> - For example, you could assign tools 1-10 to Spindle 0 and tools 11-20 to Spindle 1.


---

## `$530` – MQTT Broker IP Address
Sets the IP address of the MQTT Broker for IoT integration.


> ℹ️ **Info**
> - MQTT is a lightweight messaging protocol often used for IoT devices.
> - If your grblHAL build supports MQTT, this allows it to connect to an MQTT broker to publish status updates or receive commands.



> 🔥 **Danger**
> grblHAL has no higher level MQTT functionality, custom plugin code has to be added to make use of the protocol.


| Value | Meaning |
|:------|:--------|
| String| The IP address of the MQTT Broker, e.g., "192.168.1.10". |

---

## `$531` – MQTT Broker Port
Sets the port number for connecting to the MQTT Broker.


> ℹ️ **Info**
> - The standard MQTT port is 1883.



> 🔥 **Danger**
> grblHAL has no higher level MQTT functionality, custom plugin code has to be added to make use of the protocol.



| Value | Meaning |
|:------|:--------|
| Port #| A valid TCP port number. |

---

## `$532` – MQTT Broker Username
Sets the username for authenticating with the MQTT Broker.


> ℹ️ **Info**
> - If your MQTT Broker requires authentication, enter the username here.



> 🔥 **Danger**
> grblHAL has no higher level MQTT functionality, custom plugin code has to be added to make use of the protocol.



| Value | Meaning |
|:------|:--------|
| String| The username for MQTT authentication. |

---

## `$533` – MQTT Broker Password
Sets the password for authenticating with the MQTT Broker.


> ℹ️ **Info**
> - If your MQTT Broker requires authentication, enter the password here.



> 🔥 **Danger**
> grblHAL has no higher level MQTT functionality, custom plugin code has to be added to make use of the protocol.



| Value | Meaning |
|:------|:--------|
| String| The password for MQTT authentication. |

---

## `$534` – Output RS274/NGC Debug Messages
Enables debugging messages from the RS274/NGC Expressions inside Macros.


> ℹ️ **Info**
> - This is a diagnostic tool for developers and advanced users writing Macros that uses **RS274/NGC expressions**.
> - The RS274/NGC interpreter is what enables powerful features like `O-words` (macros/subroutines), variables (e.g., `#100`), mathematical expressions, and flow control (`IF/ELSE`, `WHILE`).
> - When enabled, this setting allows `(debug, ...)` logs from within your macros to print to the Serial console
> - Debug output should be **disabled** during normal operation as it may confuse the end user, but is invaluable while developing/troubleshooting Macros


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Standard operation. No debug messages are printed to the Serial console. (Default) |
| 1     | Enabled | Debugging messages for the RS274/NGC interpreter are sent to the console. |

#### Common Examples
*   **Normal Operation:**
    *   This should be the setting for all regular jobs.
    *   `$534=0`
*   **Debugging a Complex Macro:**
    *   You are writing a tool-change macro with `IF` statements and want to see your `(debug, ...)` logs
    *   `$534=1`

#### Tips & Tricks
- This setting is your best friend when trying to figure out why a complex macro or `O-word` subroutine isn't working as expected.

---

## `$535` – Network MAC Address Override
Allows overriding the default MAC (Media Access Control) address of the primary network interface.


> ℹ️ **Info**
> - While the MAC address is typically a hardware identifier, this setting makes it **user-settable**.
> - This is particularly useful when using network modules (such as certain Wiznet modules) that may come with a shared or non-unique MAC address, which can cause network conflicts if multiple devices are on the same network.
> - By setting `$535`, you can assign a unique MAC address to your grblHAL controller's primary network interface, preventing network issues.


| Value | Meaning |
|:------|:--------|
| String| A unique 12-character hexadecimal string representing the MAC address (e.g., "00:11:22:AA:BB:CC"). |

#### Common Examples
*   **Assigning a custom MAC address to resolve conflicts:**
    *   `$535=00:1A:C2:FF:EE:33`

#### Tips & Tricks
- This setting is vital for ensuring network stability and preventing IP conflicts when deploying multiple grblHAL controllers, especially with hardware known to have shared MAC addresses.
- You can use online tools (e.g., [browserling.com/tools/random-mac](https://www.browserling.com/tools/random-mac)) to generate unique MAC addresses.
- Alternatively, you might use the MAC address from a device not currently in use, such as an old router or network printer, which is often printed on the back of the device.

---

## `$536` – RGB Strip Length 0
## `$537` – RGB Strip Length 1
Sets the number of LEDs in a connected RGB LED strip for two separate channels.


> ℹ️ **Info**
> - These settings are for controlling addressable RGB LED strips, often used for machine status indicators or ambient lighting.
> - Each setting defines the length of a specific strip, allowing the controller to address individual LEDs.


| Value | Meaning |
|:-----:|:--------|
| 0-N   | The number of LEDs in the strip. |

---


## `$538` – Fast Rotary "Go to G28" Behaviour

Controls the behavior of rotary axes, particularly when executing a G28 command, to ensure the shortest path is taken or to manage continuous rotation.


> ℹ️ **Info**
> - `G28` sends axes to a pre-defined home position.
> - This setting can modify how rotary axes handle this move, for example, by always taking the shortest path.



#### Common Example
`G91G28A0`  
`G90`
Return move should complete in half a rotation or less if enabled by setting `$538=1`

---


## `$539` – Spindle Off Delay (sec)
Adds a mandatory delay after the spindle is turned off (`M5`).


> ℹ️ **Info**
> - This complements `$394` (Spindle On Delay).
> - It forces a pause to allow the spindle to fully spin down before the machine moves again.
> - This is a critical safety feature to prevent tool crashes or workpiece damage if the machine moves while the spindle is still coasting to a stop.


| Value (sec) | Description |
|:-----------:|:------------|
| 0.0 - N     | The pause duration in seconds after an `M5` command. |

#### Common Examples
*   **Heavy Spindle:**
    *   A large spindle might take 5-10 seconds to come to a complete stop.
    *   `$539=10.0`
*   **Small Spindle with a VFD Brake:**
    *   `$539=2.0`

---

## `$541` – Panel Modbus Address
Sets the Modbus slave address for an external control panel if it uses Modbus for communication.


> ℹ️ **Info**
> - This setting is part of the optional driver-implemented settings for external control panels (`$540`-`$579`).
> - It must match the Modbus slave ID configured on the physical control panel.


| Value | Meaning |
|:------|:--------|
| 1-247 | The unique Modbus slave ID of the panel. |

---

## `$542` – Panel Update Interval
Sets the interval (in milliseconds) at which an external control panel or pendant requests or receives status updates from the controller.


> ℹ️ **Info**
> - This setting is part of the optional driver-implemented settings for external control panels (`$540`-`$579`).
> - A lower value provides more real-time feedback but increases communication traffic.


| Value (ms) | Meaning |
|:----------:|:--------|
| 10 - N     | The update interval in milliseconds. |

---

## `$543` – Jog Speed x1
Sets the feed rate (in mm/min) to be used for the slowest "x1" step-style jogging moves from an external control panel.


> ℹ️ **Info**
> - This is an optional, driver-specific setting, primarily used by pendants and jog wheels. It may not be available on all boards.
> - It defines the speed for precise, incremental jogs (e.g., when the "x1" jog increment is selected).
> - Works in conjunction with `$547` (Jog Distance x1).


| Value (mm/min) | Meaning |
|:--------------:|:--------|
| 1 - N          | The feed rate for short, precise jogging moves. |

#### Common Examples
*   **Fine Positioning Speed:**
    *   `$543=50`

---

## `$544` – Jog Speed x10
Sets the feed rate (in mm/min) to be used for the medium "x10" step-style jogging moves from an external control panel.


> ℹ️ **Info**
> - This is an optional, driver-specific setting for pendants and jog wheels.
> - It defines the speed for incremental jogs when the "x10" jog increment is selected.
> - Works in conjunction with `$548` (Jog Distance x10).


| Value (mm/min) | Meaning |
|:--------------:|:--------|
| 1 - N          | The feed rate for medium, incremental jogging moves. |

#### Common Examples
*   **Controlled Medium Jog:**
    *   `$544=250`

---

## `$545` – Jog Speed x100
Sets the feed rate (in mm/min) to be used for the fastest "x100" step-style jogging moves from an external control panel.


> ℹ️ **Info**
> - This is an optional, driver-specific setting for pendants and jog wheels.
> - It defines the speed for incremental jogs when the "x100" jog increment is selected.
> - Works in conjunction with `$549` (Jog Distance x100).


| Value (mm/min) | Meaning |
|:--------------:|:--------|
| 1 - N          | The feed rate for fast, incremental jogging moves. |

#### Common Examples
*   **Rapid Incremental Positioning:**
    *   `$545=1000`

---

## `$546` – Panel Jog Speed Keypad
Sets a specific jog speed preset used by an external control panel's keypad.


> ℹ️ **Info**
> - This is part of the optional driver-implemented settings for external control panels (`$540`-`$579`).
> - It allows the panel to trigger a predefined jog speed, often used for a "fine" or "coarse" jog button.


| Value (mm/min) | Meaning |
|:--------------:|:--------|
| 1 - N          | The feed rate for keypad-triggered jog moves. |

---

## `$550` – Panel Jog Distance Keypad
Sets a specific incremental jog distance preset used by an external control panel's keypad.


> ℹ️ **Info**
> - This is part of the optional driver-implemented settings for external control panels.
> - It allows the panel to trigger a predefined jog distance (e.g., 0.001mm, 0.01mm, 0.1mm, 1mm).


| Value (mm) | Description |
|:----------:|:------------|
| 0.001 - N  | The incremental distance for keypad-triggered jog steps. |

---

## `$551` – Panel Jog Accel Ramp
Sets an acceleration ramp factor for jogging operations initiated from an external control panel.


> ℹ️ **Info**
> - This is part of the optional driver-implemented settings for external control panels.
> - It can be used to provide a smoother or more aggressive acceleration profile specifically for manual jogging.


| Value | Meaning |
|:------|:--------|
| 0-N   | An acceleration ramp factor, specific to the panel driver. |

---

## `$554` – Panel Encoder 1 Mode
## `$555` – Panel Encoder 1 CPD
## `$556` – Panel Encoder 2 Mode
## `$557` – Panel Encoder 2 CPD
## `$558` – Panel Encoder 3 Mode
## `$559` – Panel Encoder 3 CPD
These settings configure the operating mode and Counts Per Division (CPD) for additional encoders on an external control panel.


> ℹ️ **Info**
> - These are part of the optional driver-implemented settings for external control panels.
> - `Mode`: Defines the function of the encoder (e.g., jog an axis, adjust overrides).
> - `CPD`: Sets the counts per division for the encoder, similar to `$401`.


---

## `$560` – `$579` – Panel & Pendant Settings (Extended)
This range is reserved for further configuration options specific to external control panels and pendants, as implemented by various drivers.

---

## `$590` - `$599` – Button Action Mapping (MacroPort)
Assigns a specific system action to be performed when a physical input mapped to a MacroPort is triggered.


> ℹ️ **Info**
> - These settings define the action that grblHAL will take when a physical input pin (configured in `$500`-`$509`) for a given MacroPort index is activated.
> - This mapping allows physical buttons or external signals to trigger either custom G-code macros or predefined real-time system commands.
> - `$590` defines the action for MacroPort 0, `$591` for MacroPort 1, and so on, up to `$599` for MacroPort 9.


| Value | Action Description |
|:-----:|:-------------------|
| **0** | **Run Associated Macro:** Executes the G-code macro defined in the corresponding `$49x` setting (e.g., if `$590=0`, MacroPort 0 triggers the G-code from `$490`, which is M100). |
| 1     | Cycle Start        | Initiates or resumes the G-code program (`0x81` real-time command). |
| 2     | Feed Hold          | Pauses the current G-code program (`0x85` real-time command). |
| 3     | Park               | Triggers the parking cycle (`0x84` real-time command). |
| 4     | Reset              | Performs a soft reset of the controller (`0x18` real-time command). |
| 5     | Spindle Stop (during feed hold) | Disables the spindle output if currently active during a feed hold. |
| 6     | Mist Toggle        | Toggles the mist coolant output. |
| 7     | Flood Toggle       | Toggles the flood coolant output. |
| 8     | Probe Connected Toggle | Toggles the internal "probe connected" flag. |
| 9     | Optional Stop Toggle | Toggles the optional stop (`M1`) functionality. |
| 10    | Single Block Mode Toggle | Toggles single-block execution mode. |

#### Common Examples
*   **Pressing a button on MacroPort 0 runs its custom macro (M100):**
    *   `$590=0` (`$490` contains the `M100` G-code)
*   **Pressing a button on MacroPort 1 triggers a Feed Hold:**
    *   `$591=2`
*   **Pressing a button on MacroPort 2 triggers a Cycle Start:**
    *   `$592=1`

#### Tips & Tricks
- This system provides immense flexibility for customizing physical control panels and pendants.
- You can mix and match, having some buttons trigger custom macros (value `0`) and others trigger built-in grblHAL functions (values `1`-`10`).
- Ensure the G-code for any macro you intend to run (when `$59x=0`) is correctly defined in the corresponding `$49x` setting.

---

## `$600` – `$639` – Modbus TCP Settings
This range is reserved for settings related to Modbus TCP/IP communication. This would typically involve configuring IP addresses, ports, and slave IDs for Modbus TCP devices on a network. The specific settings and their functions are dependent on the Modbus TCP plugin implementation.

---


## `$640` - `$649` – Kinematics Slots
Settings used to pass parameters to a specialized machine kinematics module.


> ℹ️ **Info**
> - Most CNC machines use a simple "Cartesian" kinematic model where X, Y, and Z are independent.
> - grblHAL can support more complex machine types, such as **CoreXY**, SCARA, or robotic arms, through a kinematics module.
> - These settings are used to pass the necessary geometric parameters (like arm lengths, motor positions, or belt paths) to the active kinematics module.


| Setting | Example Use |
|:--------|:------------|
| `$640`  | Parameter 0 | For a SCARA arm, this might be the length of the first arm segment. |
| `$641`  | Parameter 1 | For a SCARA arm, this might be the length of the second arm segment. |

#### Tips & Tricks
- For standard Cartesian machines, these settings have no effect and can be ignored.
- If you are using a special kinematics build of grblHAL (like CoreXY), you must configure these settings according to the documentation for that specific kinematic model.

---

## `$650` – Filesystem Options (mask)
Configures various options related to the controller's filesystem, typically involving SD card and LittleFS behavior.


> ℹ️ **Info**
> - This setting is a **bitmask** that controls fundamental behaviors of the grblHAL filesystem.
> - The exact options available are dependent on the available and configured file systems (e.g., SD card, internal LittleFS).
> - It is particularly useful for managing how macros, configuration files, and other machine-critical data are handled.


| Bit | Value | Option | Description |
|:---:|:-----:|:-------|:------------|
| 0   | 1     | **Auto Mount SD Card** | Automatically mounts the SD card on controller startup. This is highly useful if tool change macros, startup scripts, or other essential files are stored on an SD card that is permanently inserted into the controller. |
| 1   | 2     | **Hide LittleFS** | When set, the content of the internal LittleFS filesystem will not be listed (e.g., via the `$F` command or in the WebUI). |
| 2   | 4     | **Hierarchical Listing** | (Build 20251111+) Enables directory support. Files are listed per directory, and directories are shown with size `-1`. Use `$F=subdir` to navigate down and `$F=..` to go up. |

#### Common Examples
*   **Auto-mount SD & Enable Directories:**
    *   `1 + 4 = 5` → `$650=5`

#### Tips & Tricks
- Hierarchical listing is essential for organizing large numbers of G-code files into folders.
- If your machine relies on macros stored on an SD card for automatic operation (e.g., on startup or for tool changes), enabling `Auto Mount SD Card` is essential.

---

## `$651` – `$670` – Stepper Driver Settings
This range is reserved for individual stepper driver-specific configurations. This might include settings for motor current, microstepping, stealthChop/spreadCycle modes, or other advanced Trinamic features that are applied per individual driver rather than per axis. The exact parameters and their meaning are dependent on the specific stepper driver plugin.

---

## `$671` – Invert Home Pins (mask)
Inverts the logic for the homing switch inputs


> ℹ️ **Info**
> - For machines that have separate homing and limit switches. Few board maps support this.


---

## `$672` – Reserved 672
This is a reserved setting slot.

---

## `$673` – Coolant On Delay (sec)
Adds a mandatory delay after a generic coolant M-command (`M7`, `M8`) is executed, before motion resumes.


> ℹ️ **Info**
> - Some coolant systems, especially mist systems or those with long hoses, need time for the coolant to reach the cutting tool.
> - This setting forces grblHAL to pause for a specified time after an `M7` or `M8` command is processed.


| Value (sec) | Description |
|:-----------:|:------------|
| 0.0 - N     | The pause duration in seconds. |

#### Tips & Tricks
- This provides a more reliable way to ensure coolant is present than adding `G4` dwell commands to your G-code.
- If this is a non-zero value, there will be a noticeable pause after every `M7`/`M8`.
- This is distinct from `$393` (Door Coolant On Delay), which is specifically triggered by a safety door event.

---

## `$674` – THC Options (mask)
Configures advanced options for the THC (Torch Height Control) plugin.


> ℹ️ **Info**
> - This is a **bitmask** that enables or disables specific behaviors within the THC system.
> - The available options are defined by the specific THC plugin being used.
> - This is a companion to the main THC settings in the `$350+` block.


---

## `$675` – Macro ATC Options (mask)
Configures advanced options for an Automatic Tool Changer (ATC) that is controlled by G-code macros.


> ℹ️ **Info**
> - It becomes available when tc.macro is found on the SD card / in LittleFS
> - It provides fine-grained control over specific behaviors during the macro-driven tool change process, such as handling `M6 T0` commands and error reporting for missing macros.


| Bit | Value | Option | Description |
|:---:|:-----:|:-------|:------------|
| 0   | 1     | Execute M6 T0 | By default, an `M6 T0` command (tool change to tool 0) is not sent to the `tc.macro`. Setting this bit enables the `tc.macro` to execute for `M6 T0`. |
| 1   | 2     | Fail M6 if tc.macro not found | If this bit is set, grblHAL will raise an error (alarm) on an `M6` command if the `tc.macro` file is not found on the SD card or if the SD card is not mounted. |

#### Common Examples
*   **Default behavior (M6T0 is not routed to tc.macro, it silently selects tool 0 - which may mean no tool):**
    *   `$675=0`
*   **Allow M6 T0 to trigger macro, and fail if macro not found:**
    *   `$675=3` (1 for Execute M6 T0 + 2 for Fail M6 if tc.macro not found)

#### Tips & Tricks
- Use the "Fail M6 if tc.macro not found" option (`$675=2` or `3`) to ensure robust error handling in production environments where tool change macros are critical.
- Ensure your `tc.macro` file is correctly named and located on the SD card if you are using macro-based ATC.

---

---

## `$676` – Reset Actions (mask)
Configures additional actions to be performed automatically when the controller undergoes a soft or hard reset.


> ℹ️ **Info**
> - This setting is a **bitmask** that allows you to customize the behavior of grblHAL upon a reset event.
> - It is useful for ensuring the machine returns to a predictable and safe state, such as clearing specific status flags or overrides.


| Bit | Value | Option | Description |
|:---:|:-----:|:-------|:------------|
| 0   | 1     | Clear homed status if position was lost | If set, the machine's "homed" status will be cleared upon reset if the controller detects that its position may have been lost (e.g., due to a power cycle). |
| 1   | 2     | Clear offsets (except G92) | If set, all work coordinate system offsets (G54-G59.3) will be cleared upon reset, **except** for the G92 temporary offset. This forces the user to re-establish work zeros. |
| 2   | 4     | Clear rapids override | Resets the rapid feed rate override to 100% upon reset. |
| 3   | 8     | Clear feed override | Resets the programmed feed rate override to 100% upon reset. |

#### Common Examples
*   **Default (no options enabled, standard reset behavior):**
    *   `$676=0`
*   **Clear homed status if position lost, and clear all offsets (except G92):**
    *   `$676=3` (1 for Clear homed status + 2 for Clear offsets)
*   **Reset all overrides to 100% on reset:**
    *   `$676=12` (4 for Clear rapids override + 8 for Clear feed override)

#### Tips & Tricks
- Carefully consider which options to enable based on your machine's safety requirements and workflow. Clearing offsets ensures a fresh start but requires re-zeroing.
- Enabling "Clear homed status if position was lost" is a good safety measure, forcing a re-homing cycle if the machine's absolute position is uncertain.

---


## `$677` – Stepper Spindle Options
Configures options for a "stepper spindle," where the spindle is driven by a stepper motor.


> ℹ️ **Info**
> - An advanced feature for controlling a spindle that requires step and direction signals, similar to a motion axis.
> - This allows for precise, synchronized control of the spindle's rotation.


---

---

## `$678` – Relay Port for Toolsetter
Assigns a physical auxiliary digital output port to control a relay for the toolsetter.


> ℹ️ **Info**
> - This setting specifies which auxiliary digital output port will be used to activate a relay associated with the toolsetter.
> - A common use case is a mechanism to deploy/retract the toolsetter, or to select the toolsetter itself using a relay.
> - Set this value to `-1` to disable the relay output for the toolsetter.
> - **Probe selection is handled by the inbuilt `G65 P5 Q` macro**, where `` is the probe ID (e.g., `Q1` for toolsetter). The toolsetter can also be selected automatically during `@G59.3` tool changes.


| Value | Meaning |
|:-----:|:--------|
| -1    | Disabled (no relay output for toolsetter) |
| 0-N   | The hardware auxiliary digital output port number to control the toolsetter relay. |

#### Common Examples
*   **Default (Toolsetter relay disabled):**
    *   `$678=-1`
*   **Control a toolsetter relay via auxiliary port 2:**
    *   `$678=2`

#### Tips & Tricks
- This feature requires your selected driver/board to provide at least one free auxiliary digital output port capable of driving the relay coil, either directly or via a buffer.
- Ensure the relay's polarity and wiring match the expected output of the selected port (can be inverted with `$372`).

---

## `$679` – Relay Port for Secondary Probe
Assigns a physical auxiliary digital output port to control a relay for the secondary probe.


> ℹ️ **Info**
> - This setting specifies which auxiliary digital output port (by its hardware number) will be used to activate a relay associated with a secondary probe (e.g., a touch plate, or an additional part probe).
> - This can be used for deploying the probe or selecting between multiple probe inputs using a relay.
> - Set this value to `-1` to disable the relay output for the secondary probe.
> - **Probe selection is handled by the inbuilt `G65 P5 Q` macro**, where `` is the probe ID (e.g., `Q2` for secondary probe).


| Value | Meaning |
|:-----:|:--------|
| -1    | Disabled (no relay output for secondary probe) |
| 0-N   | The hardware auxiliary digital output port number to control the secondary probe relay. |

#### Common Examples
*   **Default (Secondary probe relay disabled):**
    *   `$679=-1`
*   **Control a secondary probe relay via auxiliary port 3:**
    *   `$679=3`

#### Tips & Tricks
- This feature requires your selected driver/board to provide at least one free auxiliary digital output port capable of driving the relay coil.
- This provides an advanced method for managing multiple probe devices on your machine, leveraging `G65 P5 Q` for programmatic selection.

---

## `$680` – Stepper Enable Delay (ms)
Sets a delay (in milliseconds) after the stepper motors are enabled before any motion is allowed.


> ℹ️ **Info**
> - Some stepper drivers or motor configurations might require a short stabilization time after receiving the enable signal before they can reliably accept step pulses.
> - This delay is in addition to a standard 2 ms delay that drivers typically enforce.


| Value (ms) | Description |
|:----------:|:------------|
| 0 - N      | The delay duration in milliseconds. |

---


## `$681` – Modbus Serial Format
Configures the data bit and parity settings for Modbus RTU serial communication.


> ℹ️ **Info**
> - This is an advanced setting for Modbus-enabled systems, specifically defining the serial port parameters for Modbus RTU.
> - It is crucial that this setting **matches the serial communication settings of the Modbus slave device** (e.g., your VFD) to ensure proper data exchange and prevent communication errors.


| Value | Description |
|:-----:|:------------|
| **0** | **8-bit No Parity:** Data is transmitted in 8 bits with no parity bit. |
| **1** | **8-bit Even Parity:** Data is transmitted in 8 bits with an even parity bit for error checking. |
| **2** | **8-bit Odd Parity:** Data is transmitted in 8 bits with an odd parity bit for error checking. |

#### Common Examples
*   **Default for many Modbus devices (no parity):**
    *   `$681=0`
*   **If your VFD specifies 8-bit even parity:**
    *   `$681=1`

#### Tips & Tricks
- Always consult the manual for your Modbus device (e.g., VFD, control panel) to determine the correct serial format settings. Mismatched settings will lead to communication failures.
- This setting works in conjunction with `$374` (Modbus Baud Rate) to establish a stable Modbus RTU link.

---


## `$682` – THC Feed Factor
Sets a factor to adjust the Z-axis feed rate for THC correction moves.


> ℹ️ **Info**
> - A tuning parameter for the THC plugin.
> - It can be used to scale the speed of the THC's Z-axis adjustments to match the capabilities of the machine and the cutting parameters.


---

## `$683` – ATCi Configuration (mask)
Configures the operating modes for the Sienci Automatic Tool Changer Interface plugin.


> ℹ️ **Info**
> - This is a **bitmask**: add together the values of the options you want to enable.
> - **Rack Monitor:** Uses `AUXINPUT7` to detect if the rack is physically mounted. If the rack is removed, the Keepout zone is automatically disabled.
> - **TC Macro Monitor:** Automatically disables the Keepout zone while a Tool Change macro is running to allow tool fetching.


| Bit | Value | Option | Description |
|:---:|:-----:|:-------|:------------|
| 0   | 1     | **Enable Plugin** | Master switch to enable the Keepout Zone logic on startup. |
| 1   | 2     | **Monitor Rack Presence** | Only enforce Keepout if the rack sensor (`AUXINPUT7`) is triggered. |
| 2   | 4     | **Monitor TC Macro** | Automatically disable Keepout when a tool change macro is active. |

#### Common Examples
*   **Enable Basic Keepout:**
    *   `$683=1`
*   **Enable Full Automation (Rack Sensor + Macro Awareness):**
    *   `$683=7` (1+2+4)

---

## `$684` – `$687` – ATCi Keepout Zone Boundaries
Defines the rectangular safety zone around the tool rack in machine coordinates.


> ℹ️ **Info**
> - These settings define the X and Y limits of the area where the spindle is forbidden to enter during normal operation (jogging/G-code).
> - Entering this zone is only allowed if `M810 P0` is sent, or if the "Monitor TC Macro" option is enabled and a macro is running.
> - **Note:** The plugin includes a "jog-out" feature allowing you to escape the zone if trapped, but prevents jogging deeper in.


| Setting | Description | Units |
|:--------|:------------|:------|
| `$684`  | **X Min:** Left boundary of the zone. | mm |
| `$685`  | **Y Min:** Front boundary of the zone. | mm |
| `$686`  | **X Max:** Right boundary of the zone. | mm |
| `$687`  | **Y Max:** Back boundary of the zone. | mm |

#### Tips & Tricks
- Move your machine to the front-left corner of your rack area and note the machine coordinates for `$684`/`$685`.
- Move to the back-right corner and note coordinates for `$686`/`$687`.
- Add a small buffer (e.g., 5mm) to these values to ensure safety.

---



## `$700` – Subroutine Scanning
Controls how the `M98` command searches for subroutines.


> ℹ️ **Info**
> - Determines whether the controller looks for subroutines within the current file before looking for external macro files.
> - Useful for keeping subroutines and main program in a single file.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | External Only | Always looks for an external file `P.macro` on the SD card/filesystem. |
| 1     | Scan Current | (Default) Scans the current file for `O sub` blocks first. If not found, looks for external file. |

#### Tips & Tricks
- Use `$700=1` if you want to use "internal" subroutines defined in the same G-code file.

---

## `$709` – PWM Spindle Options (Secondary)

Functions the same as `$9`, but applies to the **secondary PWM spindle** if available (spindle type 15 or 16).  


> ℹ️ **Info**
> - Only applies if a **secondary PWM spindle** is configured.
> - Uses the same bitmask definitions as `$9`.
> - Related settings:
> - `$9` – PWM Spindle Options (Primary)


| Bit | Value | Description |
|-----|-------|-------------|
| 0   | 1     | Disable PWM output entirely |
| 1   | 2     | Let RPM control spindle **on/off** signal (S0 disables spindle, S>0 enables) |
| 2   | 4     | Disable laser capability (does not affect $32 when primary spindle is controlling laser) |

#### Common Examples
* **Enable secondary PWM with RPM control:**  
  `$709=3`

* **Disable secondary PWM output:**  
  `$709=1`

#### Tips & Tricks
- Mirrors `$9` functionality but for the secondary spindle.  
- Allows keeping the primary spindle in laser mode while using the secondary spindle for normal PWM tasks.

---

## `$716` – Invert Secondary Spindle Outputs (mask)

Controls polarity of the **spindle control outputs** (PWM, enable, direction).  
Some spindle drivers expect inverted logic.


> ℹ️ **Info**
> - For spindle types 11, 12 and 13
> - Expressed as a **mask**:
> - Bit 0 = Spindle Enable
> - Bit 1 = Spindle Direction
> - Bit 2 = Spindle PWM
> - Related settings:
> - `$16` – Invert Primary Spindle Outputs (mask)


#### Common Examples
* **Default:**  
  `$716=0`

* **Invert Spindle Enable only:**  
  `$716=1`

* **Invert all signals:**  
  `$716=7`

#### Tips & Tricks
- If the spindle **runs when it should stop**, check `$716`.  
- Combine with `$33–$36` for full PWM control tuning.  

---

## `$730` & `$731` – PWM2 Spindle Max/Min Speed (RPM)
Sets the max (`$730`) and min (`$731`) spindle speed for the **secondary** PWM channel.


> ℹ️ **Info**
> - These are the direct equivalents of `$30` and `$31`, but for the secondary PWM output, controlled by `M3.1`, `M4.1`, `M5.1`.
> - They are used to scale the `S` command to the PWM output for a second device like a laser or servo.


#### Common Examples
*   **Laser on Secondary Channel (0-1000 Power Scale):**
    *   `$730=1000`
    *   `$731=0`

---

## `$732` – Spindle Mode 1 (Secondary Spindle Mode)
Enables or disables a specific mode (e.g., Laser Mode) for the **secondary** PWM spindle.


> ℹ️ **Info**
> - This is the direct equivalent of `$32` (Laser Mode), but applies to the secondary spindle (often controlled by `M3.1`, `M4.1`, `M5.1`).
> - When enabled (`1`), it optimizes motion control for laser cutting/engraving, similar to the primary laser mode.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Standard spindle operation for the secondary spindle. |
| 1     | Enabled | Optimized for lasers on the secondary spindle. |

---

## `$733` – PWM2 Spindle PWM Frequency (Hz)
Sets the frequency of the **secondary** PWM signal.


> ℹ️ **Info**
> - This is the direct equivalent of `$33`. It must be set correctly for the device connected to the second channel.


#### Common Examples
*   **Laser on Secondary Channel:**
    *   `$733=1000`

---

## `$734`, `$735`, `$736` – PWM2 Spindle PWM Off, Min, Max Values
Sets the raw PWM output range for the **secondary** channel.


> ℹ️ **Info**
> - These are the direct equivalents of `$34`, `$35`, and `$36`.
> - They map the `S` command range (`$730`/`$731`) to the hardware's PWM duty cycle range for the second channel.


#### Common Examples
*   **Laser on Secondary Channel (Full 0-100% Power):**
    *   Assuming a 0-1000 PWM range.
    *   `$734=0`
    *   `$735=0`
    *   `$736=1000`

---

## `$737` – Linear Spindle 1 Piece 1
## `$738` – Linear Spindle 1 Piece 2
## `$739` – Linear Spindle 1 Piece 3
## `$740` – Linear Spindle 1 Piece 4
Configures a multi-point calibration curve to correct a non-linear response from a **secondary** spindle controller or VFD.


> ℹ️ **Info**
> - These are the direct equivalents of `$66` - `$69`, but for the secondary PWM output.
> - They define correction points for the secondary spindle's PWM-to-RPM (or PWM-to-voltage) linearity.
> ℹ️ **Info**
> - Some advanced motor drivers provide a "warning" signal that can indicate a potential issue (like high temperature) before it becomes a critical fault.
> - grblHAL can monitor these signals.


| Setting | Description |
|:--------|:------------|
| `$742`  | **Motor Warnings Enable (mask):** A bitmask to enable monitoring for each axis. |
| `$743`  | **Motor Warnings Invert (mask):** A bitmask to invert the logic of the warning signal. |

---

## `$744` & `$745` – Motor Faults Enable & Invert
Configures the inputs for critical motor fault detection.


> ℹ️ **Info**
> - Many industrial stepper and servo drivers provide a "fault" or "alarm" output signal that activates on critical errors (over-voltage, stall, etc.).
> - grblHAL can monitor these signals and trigger an immediate machine alarm.
> - This is a critical safety feature for high-reliability machines.


| Setting | Description |
|:--------|:------------|
| `$744`  | **Motor Faults Enable (mask):** A bitmask to enable monitoring for each axis. (X=1, Y=2, Z=4, etc.) |
| `$745`  | **Motor Faults Invert (mask):** A bitmask to invert the logic of the fault signal (active-high vs. active-low). |

#### Common Examples
*   **Enable Fault Detection on X, Y, Z:**
    *   `$744=7`
*   **Fault Signal is Active-Low (Needs Inversion) on X, Y, Z:**
    *   `$745=7`

#### Tips & Tricks
- You must have the fault output from your motor drivers wired to the correct input pins on your controller for this feature to work.
- Consult your controller's documentation for the motor fault pin assignments.

---

## `$750` - `$759` – Event Trigger Source Selection (Eventout Plugin)
Configures which real-time system state change will activate each of the ten available Event Slots (0-9).


> ℹ️ **Info**
> - This advanced feature is specifically implemented by the **`eventout` plugin** (often found in `Plugins_misc`). It enables highly responsive, direct hardware control based on various real-time machine states.
> - Each setting (`$750` to `$759`) corresponds to an **Event Slot (0-9)**. The **value you assign to each setting selects the source trigger** for that Event Slot from the predefined list of `EVENT_TRIGGERS`.
> - When an Event Slot is activated by its chosen trigger, it will control the auxiliary I/O port assigned to it via the corresponding `$76x` setting.
> - A value of `0` ("None") disables the trigger for that Event Slot.


| Value | Event Trigger Source      | Description                               |
|:-----:|:--------------------------|:------------------------------------------|
| **0** | **None**                  | No trigger assigned to this Event Slot.   |
| **1** | **Spindle enable (M3/M4)**| Activates when the primary spindle is commanded ON (`M3`/`M4`). |
| **2** | **Laser enable (M3/M4)**  | Activates when the primary laser is commanded ON (`M3`/`M4`).   |
| **3** | **Mist enable (M7)**      | Activates when mist coolant is commanded ON (`M7`).      |
| **4** | **Flood enable (M8)**     | Activates when flood coolant is commanded ON (`M8`).     |
| **5** | **Feed hold**             | Activates when the controller enters a Feed Hold state. |
| **6** | **Alarm**                 | Activates when the controller enters an Alarm state.    |
| **7** | **Spindle at speed**      | Activates when the spindle is confirmed to be at commanded speed (requires `$340` and encoder feedback for closed-loop systems). |
| **8** | **Motion**                | Activates when the machine is in motion (G0, G1, G2, G3, G38.x). |
| **9** | **Optional stop toggle**  | Activates when the Optional Stop `(M1)` state is toggled ON. |
| **10** | **Single Stepping Mode** | Activates when the controller is in Single Stepping (Single Block) mode. |
| **11** | **Block delete toggle**  | Activates when the Block Delete (/ skip) state is toggled ON. |


#### Common Examples
*   **Activate Event Slot 0 when the Spindle is enabled:**
    *   `$750=1`
*   **Activate Event Slot 1 when the controller enters an Alarm state:**
    *   `$751=6`
*   **Activate Event Slot 2 when Flood coolant is enabled:**
    *   `$752=4`

#### Tips & Tricks
- This system allows you to create highly responsive, hardware-level automation by linking machine states to specific output pins.
- The physical auxiliary output pin itself is assigned via the corresponding `$76x` setting.
- Ensure the selected trigger source matches your intended automation logic. This is an advanced feature for users familiar with the `eventout` plugin.

---

## `$760` - `$769` – Event I/O Port Assignment (Eventout Plugin)
Assigns a physical auxiliary digital output port to be controlled by each of the ten Event Slots (0-9).


> ℹ️ **Info**
> - This setting works in conjunction with `$750`-`$759` to provide direct hardware control based on real-time system states, as part of the **`eventout` plugin**.
> - Each setting (`$760` to `$769`) corresponds to an **Event Slot (0-9)**. The **value you assign specifies which auxiliary I/O Port** will be activated when its corresponding Event Slot becomes active (as determined by the trigger selected in `$75x`).
> - A value of `-1` disables the output control for that Event Slot.


| Setting | Controls Output for Event Slot | Assigns to Auxiliary I/O Port Number |
|:--------|:-------------------------------|:-------------------------------------|
| `$760`  | Event Slot 0 (Trigger defined by `$750`) | Hardware auxiliary output pin number |
| `$761`  | Event Slot 1 (Trigger defined by `$751`) | Hardware auxiliary output pin number |
| ...     | ...                            | ...                                  |
| `$769`  | Event Slot 9 (Trigger defined by `$759`) | Hardware auxiliary output pin number |

#### Common Examples
*   **When Event Slot 0 is active, control auxiliary I/O Port 5:**
    *   `$760=5` (If `$750=1`, then Port 5 activates when Spindle is enabled. This could trigger a dust collector).
*   **When Event Slot 1 is active, control auxiliary I/O Port 7:**
    *   `$761=7` (If `$751=6`, then Port 7 activates when the controller is in an Alarm state. This could trigger a warning light or a main power shutdown relay).

#### Tips & Tricks
- This system enables sophisticated hardware-level responses. For example, you could activate a fume extractor (Port 7) whenever the laser is enabled (`$752=2`, `$762=7`).
- You must know the auxiliary I/O port numbers for your specific controller board. Use the `$PINS` command to list available ports.
- If an active-low signal is required for the connected device, you can use `$372` (Invert I/O Port Outputs) to invert the logic of the selected auxiliary port.

---

## `$770` – Laser X Offset
Sets the X-axis offset for a non-default **laser spindle** from the primary spindle.


> ℹ️ **Info**
> - This setting defines the X-axis distance from the primary spindle's tool center point to the laser's focal point.
> - It is a key feature for machines with multiple tools (e.g., a primary milling spindle and a secondary laser) that are not parfocal in the X-axis.
> - When you switch to a laser spindle (or a spindle designated as a laser), grblHAL will automatically apply this offset to all subsequent X-axis moves, effectively shifting the coordinate system to match the laser's position.
> - This value is an "X offset from current position for non-default laser spindle."


| Value (mm) | Description |
|:----------:|:------------|
| -N to +N   | The X-axis distance from the primary spindle to the laser spindle. |

#### Common Examples
*   **A laser is mounted 50.5mm to the right (positive X) of the primary spindle:**
    *   `$770=50.5`

#### Tips & Tricks
- This offset is applied per spindle. You would configure this for the specific laser spindle ID after selecting it (e.g., via `M104 Qx`).

---

## `$771` – Laser Y Offset
Sets the Y-axis offset for a non-default **laser spindle** from the primary spindle.


> ℹ️ **Info**
> - This setting defines the Y-axis distance from the primary spindle's tool center point to the laser's focal point.
> - It is a key feature for machines with multiple tools that are not parfocal in the Y-axis.
> - When you switch to a laser spindle, grblHAL will automatically apply this offset to all subsequent Y-axis moves, shifting the coordinate system to match the laser's position.
> - This value is a "Y offset from current position for non-default laser spindle."


| Value (mm) | Description |
|:----------:|:------------|
| -N to +N   | The Y-axis distance from the primary spindle to the laser spindle. |

#### Common Examples
*   **A laser is mounted 10.0mm towards the front (positive Y) of the primary spindle:**
    *   `$771=10.0`

#### Tips & Tricks
- Measure the precise physical offset between your primary spindle and your laser's focal point to ensure accurate cutting/engraving.
- This offset works with `$770` to apply a complete (X,Y) shift for the laser.

---

## `$772` – Laser Offset Options (mask)
Configures options for how the laser offset feature behaves, particularly concerning work coordinate updates.


> ℹ️ **Info**
> - This setting is a **bitmask** that modifies the behavior of the laser offset system, especially when changing between spindles.
> - It controls whether a `G92` offset is automatically applied or updated to maintain work position consistency when switching to or from a laser spindle.


| Bit | Value | Option                     | Description                                                                                             |
|:---:|:-----:|:---------------------------|:--------------------------------------------------------------------------------------------------------|
| 0   | 1     | Keep new position          | If set, when a laser spindle with an offset is activated, the machine's work position shifts by the offset amount, meaning the G-code continues from the laser's perspective. |
| 1   | 2     | Update G92 on spindle change | If set, when a laser spindle with an offset is activated, the internal `G92` offset is adjusted to keep the **work position identical** from the original spindle's perspective. |

#### Common Examples
*   **Default (no options, simple coordinate shift):**
    *   `$772=0`
*   **Update G92 offset to maintain work position consistency on spindle change:**
    *   `$772=2` ("If update G92 offset is enabled then it is adjusted to keep the work position identical for the spindles.")

#### Tips & Tricks
- The "Update G92 on spindle change" option (`$772=2`) is generally preferred if you want your G-code programs to continue relative to the workpiece origin, regardless of which tool (spindle or laser) is active. This makes the tool change "transparent" to the work coordinates.
- Test these options carefully with your setup to understand how your work zero behaves when switching between the primary spindle and the laser.

---


## `$773` – `$779` – Reserved Spindle Offset Settings
This range is explicitly reserved for future spindle offset-related settings.
