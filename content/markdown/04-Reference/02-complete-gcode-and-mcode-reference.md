# Complete G-code & M-code Reference

This page is a comprehensive reference for all known grblHAL G-code and M-code commands. It is designed to be a single source of truth for machine operation and G-code programming.

Use the table of contents on the right to navigate, or use your browser's search function (`Ctrl+F`) to find a specific command.

---

# General Tips & Best Practices

1.  **Start Every File with a Safety Block:** Every G-code program should begin with a "safety block" or preamble that sets the machine to a known, predictable state. This prevents crashes and unexpected behavior.
    ```gcode
    G90 G21 G17 G40 G49 G80 G94 ; Absolute, MM, XY Plane, Cancel Comp/Offsets, Cancel Cycle, Units/Min
    M5 M9 ; Spindle and Coolant Off
    G53 G0 Z0 ; Retract Z to machine top safely
    ```

2.  **Explicit is Better Than Implicit:** Don't assume the machine is in the correct state. Explicitly command `G90`/`G91`, `G20`/`G21`, and select your work offset (`G54`, etc.) in your program.

3.  **Understand Modality:** Remember which commands are modal. Forgetting that a `G1` is active can lead to an unintended cutting move when you meant to make a rapid `G0` move. Forgetting a canned cycle (`G81`) is active can lead to unintended drilling. Always cancel modes (use `G80` or `G0` / `G1` can also be used ) when you are done with them.

4.  **Use `G53` for Safety:** When you need to move to a known, fixed machine position (like a tool change station or home), use `G53`. It bypasses all offsets and is the most reliable way to avoid collisions in these situations. A `G53 G0 Z0` is one of the safest commands in G-code.  NB! **only use if the machine is homed! as G53 depends on machine coordinates**

5.  **Comment Your Code:** Use parentheses `()` or semicolons `;` to add comments to your G-code. This is invaluable for documenting complex sections, manual tool changes, or special setups.
    ```gcode
    (*** Begin Finishing Pass for Part A ***)
    T2 M6 (Load 3mm Ball End Mill)
    G43.1 Z125.5 (Apply tool length offset)
    S18000 M3
    ```  
    or  
    ```gcode
    M3 S10000 ; Set spindle speed to 10,000RPM
    ```


---

---

# Command Letters

These letters have a specific, singular meaning in a G-code block. They can appear on their own or with other commands.

| Word | Description |
|------|-------------|
| **`F-`** | **Feed Rate.**  |
| **`S-`** | **Spindle Speed.**  |
| **`T-`** | **Tool Select.**  |
| **`O-`** | **Program Name / Subroutine Number.**|

## `F` – Feed Rate
Sets the velocity for linear moves (`G1`, `G2`, `G3`) in units per minute (`G94`) or units per revolution (`G95`).
#### Examples
* **Set feed rate, then start the a move:**  
  `F500`  
  `G1 X100`

## `S` – Spindle Speed
Sets the target RPM for the spindle. It is used by `M3` and `M4`.
#### Examples
* **Set spindle speed, then start the spindle:**  
  `S10000`  
  `M3`


## `T` – Tool Select
Pre-selects a tool number for a subsequent `M6` tool change command.
#### Examples
* **Pre-select tool number 5 for a later change:**  
  `T5`  
  `( ... some cutting operations ... )`  
  `M6 T5` (The `T5` here is often optional if the tool is already pre-selected)


## `O` – O-Code Subroutines and Labels

The `O`-word (numeric) serves as a general label within a G-code file (e.g., for `GOTO` commands if supported by the sender). More significantly, grblHAL utilizes `O`-words to define and call subroutines stored in external files, largely following [LinuxCNC's "O-Code"](https://linuxcnc.org/docs/html/gcode/o-code.html) specification for file-based macros.

**Syntax (Numeric Label):** `O`  
**Syntax (Subroutine Call - External File):** `O call [L]`  
**Syntax (Numeric Subroutine Call - External File):** `O call [L]`


> ℹ️ **Info**
> -   **Labels:** An `O` on a line by itself can function as a target for a `GOTO` command within the G-code stream (the `GOTO` command itself is typically handled by the G-code sender, not grblHAL's core).
> -   **External File Subroutines (Macros):** This is grblHAL's primary method for direct controller-level O-code execution.
> -   `O call` (e.g., `Otool_probe call`) or `O call` instructs grblHAL to look for and execute a specific file from storage (e.g., SD card, LittleFS).
> -   The file name is derived from the `O`-word: `o.macro` or `o.macro` (the `.macro` extension is configurable, but common).
> -   File lookup paths are specified in the grblHAL configuration's INI file, typically `PROGRAM_PREFIX` or `SUBROUTINE_PATH`.
> -   File names must consist of lowercase letters, numbers, dashes (`-`), and underscores (`_`) only. The interpreter will convert uppercase letters in the `O` to lowercase for the filename lookup (e.g., `O call` looks for `myfile.macro`).
> -   An external subroutine file must contain a single subroutine definition, enclosed by `o sub` and `o endsub` (or `o sub` and `o endsub`).
> -   The optional `L` parameter specifies how many times the subroutine file should be executed.
> -   **In-file Numeric Subroutines (`O sub`...`endsub`):** While grblHAL's G-code parser recognizes the syntax for defining numeric subroutines directly within the main G-code file, their full execution control (e.g., call stack management, local variables) when called by `O call` is typically a feature handled by the G-code sender software. grblHAL's core focuses on the external file execution for robustness and simplicity.


#### Examples
*   **Calling a named macro file (directly executed by grblHAL):**
    ```gcode
    (Main Program)
    G53 G0 Z0
    Otool_probe call (grblHAL executes 'tool_probe.macro' from storage)
    ...
    ```

    **Example `tool_probe.macro` file content (must be named `tool_probe.macro` and located in the configured path):**
    ```gcode
    o sub
      ( Code for probing here, e.g., )
      G91 G38.2 Z-20 F100
      ( ... calculate offset ... )
    o endsub
    M2 (Optional: M2 to reset/end the macro file after execution)
    ```

*   **Calling a numbered macro file (directly executed by grblHAL):**
    ```gcode
    (Main Program)
    G53 G0 Z0
    O123 call L2 (grblHAL executes 'o123.macro' twice from storage)
    ...
    ```

    **Example `o123.macro` file content (must be named `o123.macro` and located in the configured path):**
    ```gcode
    o123 sub
      ( Code for a specific operation, e.g., )
      G1 X10 Y10 F500
      G1 Z-2 F100
    o123 endsub
    M2
    ```

#### Tips & Tricks
-   For **external file subroutines** (`O call` or `O call`), the `O sub` and `O endsub` lines within the file are mandatory.
-   An `O return` statement can be used for an early exit from an external subroutine file. When an external macro file finishes (either by `endsub` or `return`, or simply reaching the end of the file), execution returns to the line after the `O call` in the main program.
-   The use of `M2` or `M30` at the end of an external macro file is a common practice, especially for older CAM posts, but `endsub` is the explicit O-code mechanism.



---

# G-Codes

G-codes primarily control the machine's motion, coordinate systems, and operational modes.

---

## `G0` – Rapid Positioning

**Syntax:**  
> `G0 axes`  

Moves the machine at the maximum possible travel speed to a specified coordinate. `G0` is a non-cutting move intended to reduce job time by moving quickly between operations.


> ℹ️ **Info**
> - **Modal:** `G0` is part of the Motion Mode group. It remains active until another motion mode command (`G1`, `G2`, `G3`, etc.) is issued.
> - **Feed Rate:** The `F` word is ignored during a `G0` move; the machine always moves at its rapids rate, defined by settings `$110-$115` (Max rate) and `$120-$125` (Acceleration).
> - **Coordination:** All specified axes move together and will complete their travel at the same time.


| Parameter | Description |
|-----------|-------------|
| **X, Y, Z, A, B, C, U, V** | Target coordinates for any of the 8 supported axes. |

#### Common Examples
* **Move to X=100, Y=50 in machine rapids (absolute mode):**  
  `G90 G0 X100 Y50`

* **Move Z axis up by 10mm and rotate A axis to 90 degrees rapidly (incremental mode):**  
  `G91 G0 Z10 A90`

* **Full rapid move of a 5-axis machine:**  
  `G90 G0 X15.5 Y32.75 Z-2.0 B45 C-180`

#### Tips & Tricks
- Always ensure the path is clear before executing a `G0` command to avoid collisions. It's common practice to retract the Z-axis to a safe height first.
- `G0` is functionally similar to a `G1` move with the feed rate set to maximum, but `G0` is the standard, more explicit, and safer way to command a rapid move.

---

## `G1` – Linear Interpolation

**Syntax:**  
> `G1 axes `  

Moves the machine in a straight line at a defined feed rate (`F`). This is the primary command for cutting, engraving, printing, and any other material-affecting process.


> ℹ️ **Info**
> - **Modal:** `G1` is part of the Motion Mode group and will stay active until another motion command is issued.
> - **Feed Rate:** A feed rate (`F` word) must be active for `G1` to execute. This can be set on the same line or a preceding line.
> - **Coordination:** All specified axes move in a synchronized straight line to their destination.


| Parameter | Description |
|-----------|-------------|
| **X, Y, Z, A, B, C, U, V** | Target coordinates for any of the 8 supported axes. |
| **F** | Feed rate for the move in current units (mm/min or inches/min). This is modal. |

#### Common Examples
* **Cut a straight line to X=200 at a feed rate of 500 mm/min:**  
  `G1 X200 F500`

* **Perform a 4-axis tapered cut:**  
  `G1 X100 A30 F300`

* **Complex 6-axis move:**  
  `G1 X50 Y25 Z-5 A90 B45 C180 F150`

#### Tips & Tricks
- The `F` value is modal. Once you set it, all subsequent `G1` moves will use that feed rate until a new `F` value is commanded.
- To cut a simple line, you only need to specify the axes that are changing. `G1 X100` will move only the X-axis if the machine is already at the correct Y and Z position.

---

## `G2` & `G3` – Arc / Helical Interpolation

**Syntax:**  
> `G2 axes offsets (center format)`  
> `G2 axes R- (radius format)`  
> `G2 offsets|R-  (full circles)`  

Moves the machine along a circular arc (`G2` = Clockwise, `G3` = Counter-Clockwise) at the current feed rate. If a linear axis (like Z) is also commanded, it creates a helical motion.


> ℹ️ **Info**
> - **Modal:** Part of the Motion Mode group.
> - **Plane Selection:** Arcs are performed on the currently active plane (`G17` XY, `G18` XZ, `G19` YZ). The default is `G17` (XY plane).
> - **Two Forms:** Can be defined using either `R` (radius) or `I, J, K` (center offset) parameters.


| Parameter | Description |
|-----------|-------------|
| **X, Y, Z** | The destination coordinates of the arc on the selected plane. |
| **I, J, K** | **Offset Mode:** The X, Y, or Z offset from the *start point* to the arc's *center point*. `I` for X, `J` for Y, `K` for Z. Only the two axes on the active plane are used (e.g., `I` and `J` for the `G17` XY plane). |
| **R** | **Radius Mode:** The radius of the arc. Positive `R` for arcs  180°. |
| **P** | **Optional:** Number of full circles to make. See also the LinuxCNC documentation - the initial circle does not have to be complete. http://linuxcnc.org/docs/html/gcode/g-code.html#gcode:g2-g3 |
| **F** | Feed rate for the move. |

#### `IJK` (Offset) Mode Example
* **Cut a 90° clockwise arc in the XY plane from (0,0) to (10,10) with the center at (10,0):**  
  `G17 G90` (Select XY plane, absolute mode)  
  `G0 X0 Y0` (Start at origin)  
  `G2 X10 Y10 I10 J0 F200`

#### `R` (Radius) Mode Example
* **Cut a semicircle clockwise in the XY plane from (0,0) to (20,0) with a radius of 10:**  
  `G17 G90`  
  `G0 X0 Y0`  
  `G2 X20 Y0 R10 F200`

#### Helical Motion Example
* **Create a thread-like motion by adding a Z move to an arc:**  
  `G17 G90`  
  `G2 X10 Y10 Z-5 I10 J0 F150` (Moves in an arc on XY while also moving down on Z)

#### Tips & Tricks
- **`IJK` mode is generally preferred** as it's mathematically unambiguous. `R` mode can sometimes describe two possible arcs between two points; grblHAL follows the standard convention (positive `R` for the shorter arc, negative `R` for the longer arc).
- Using `IJK` in `G91` (incremental) mode is very powerful for creating repeating patterns. The offsets are still calculated from the start point of the arc.

---

## `G4` – Dwell

**Syntax:**  
> `G4 P-`  

Pauses the machine for a specified period of time. All axes stop moving, but other machine functions (like spindle or coolant) remain in their current state.


> ℹ️ **Info**
> - **Non-Modal:** `G4` is active only for the block in which it appears.
> - **Purpose:** Useful for clearing chips at the bottom of a hole, allowing a spindle to reach full speed, etc.


| Parameter | Description |
|-----------|-------------|
| **P** | Dwell time in seconds. |

#### Common Examples
* **Pause for 2.5 seconds:**  
  `G4 P2.5`

* **Drill a hole, then dwell at the bottom to break the chip:**  
  `G1 Z-10 F100`  
  `G4 P0.5`  
  `G0 Z5`

#### Tips & Tricks
- The `P` value can be a decimal.
- Dwell commands are executed in order, so the machine will finish any preceding motion before the pause begins.

---

## `G5`, `G5.1` – Spline Interpolation

**Syntax:**  
> `G5 X- Y- Z- I- J- P-` (Quadratic Spline)  
> `G5.1 X- Y- Z- I- J- K- L-` (Cubic Spline)  

These commands enable the machine to move along complex curves defined by control points, rather than simple arcs. This is used for generating very smooth, fluid paths in advanced machining.


> ℹ️ **Info**
> - **Modal:** Part of the Motion Mode group.
> - **`G5` (Quadratic Spline):** Defines a quadratic spline segment. The path passes through the start point, the specified control point (often `I`, `J`), and the endpoint (`X`, `Y`, `Z`).
> - **`G5.1` (Cubic Spline):** Defines a cubic spline segment. This provides even greater control over the curve's shape, often using multiple control points.
> - **Reference:** For more detailed syntax and usage, refer to the [LinuxCNC documentation](http://linuxcnc.org/docs/html/gcode/g-code.html#gcode:g5).


| Parameter | Description |
|-----------|-------------|
| **X, Y, Z** | End point of the spline segment. |
| **I, J, K, L** | Control points for shaping the spline. The specific combination depends on the spline type and implementation. |
| **P** | For `G5`, defines the second control point (intermediate point). |
| **F** | Feed rate for the spline move. |

#### Example (Conceptual)
* **Creating a smooth curve using a quadratic spline:**  
  `G0 X0 Y0` (Start point)  
  `G5 X20 Y10 I10 J15 F100` (Move to X20 Y10, with control point X10 Y15)

#### Tips & Tricks
- Spline commands are typically generated by CAM software for free-form surface machining (e.g., 3D carving, mold making) where smooth transitions are critical.
- Manual programming of splines is complex due to the mathematical nature of control points.
- Although `G5` and `G5.1` are supported, elliptical arcs cannot be generated using scaling with `G51`.

---

## `G7`, `G8` – Lathe Diameter / Radius Mode

**Syntax:**  
> `G7` (Diameter Mode)  
> `G8` (Radius Mode)  

These commands are used exclusively in lathe operations to define whether X-axis movements are interpreted as changes in the workpiece's radius or diameter.


> ℹ️ **Info**
> - **Modal:** Part of the Lathe Mode group. Only active if grblHAL is configured with lathe support (setting `$22=2`).
> - **`G7` (Diameter Mode):** All X-axis coordinates and movements are interpreted as diameters. If you command `G1 X50`, the tool moves to a position where the workpiece diameter will be 50 units.
> - **`G8` (Radius Mode):** All X-axis coordinates and movements are interpreted as radii. If you command `G1 X25`, the tool moves to a position where the workpiece radius will be 25 units (meaning a 50-unit diameter).


| Command | X-Axis Interpretation |
|---------|-----------------------|
| **`G7`** | Diameter              |
| **`G8`** | Radius                |

#### Common Examples (Lathe)
* **Turn a shaft to a 20mm diameter:**  
  `G7` (Ensure diameter mode is active)  
  `G0 X20 Z0`  
  `G1 Z-50 F0.1`

* **Face a part, defining moves by radius:**  
  `G8` (Ensure radius mode is active)  
  `G0 X25 Z0` (Move to 25mm radius, 50mm diameter)  
  `G1 X0 F0.1` (Face to center)

#### Tips & Tricks
- Always explicitly set `G7` or `G8` at the beginning of a lathe program to avoid misinterpreting X-axis movements.
- Most CAM software for lathes will output G-code in diameter mode (`G7`).
- The machine coordinates always display in terms of radius.

---

## `G10 L2` & `G10 L20` – Set Coordinate System Data

**Syntax:**  
> `G10 L2 P- axes` (absolute)  
> `G10 L20 P- axes` (relative)  

Provides a way to programmatically set and offset work coordinate systems (G54-G59.3). This is an advanced feature that allows for precise, repeatable fixture setups without manually touching off each time.


> ℹ️ **Info**
> - **Non-Modal.**
> - `L2` sets the specified coordinate system's origin *relative to the machine origin*.
> - `L20` sets the specified coordinate system's origin *based on the current position*.


| Parameter | Description |
|-----------|-------------|
| **L2** or **L20** | Specifies the "set data" mode. `L2` for absolute, `L20` for relative. |
| **P** | The work coordinate system to modify (1=`G54`, 2=`G55`, ... 9=`G59.3`). |
| **X,Y,Z,A,B,C,U,V**| The coordinate values to set for the origin of the selected system. |

#### `G10 L2` Example
* **Set the G55 origin to X=100, Y=250.5, Z=-20 from the machine's home position:**  
  `G10 L2 P2 X100 Y250.5 Z-20`  
  (Now, when `G55` is active, a `G0 X0 Y0` command will move the machine to machine coordinates X=100, Y=250.5)

#### `G10 L20` Example
* **Move to a fixture location and set G56 to that exact spot:**  
  `G53 G0 X300 Y150` (Move to the desired origin in machine coordinates)  
  `G10 L20 P3 X0 Y0 Z5` (Set the G56 origin. The current XY is now G56's X0Y0. Z is set to 5)

#### Tips & Tricks
- `G10` is extremely powerful for automated setups, especially with multiple identical fixtures.
- The values are stored persistently in grblHAL's memory, so they survive a reset.
- You can omit axes. `G10 L2 P1 X50` will only change the X value for `G54` and leave Y, Z, etc., unchanged.

---

## `G17`, `G18`, `G19` – Plane Selection

**Syntax:**  
> `G17` (XY plane)  
> `G18` (XZ plane)  
> `G19` (YZ plane)  

Selects the active plane for circular interpolation (`G2`/`G3`), cutter compensation, and some canned cycles. This determines which pair of axes an arc will be drawn on.


> ℹ️ **Info**
> - **Modal:** Belongs to the Plane Select modal group. `G17` is the default on startup.
> - **`G17`**: XY Plane (most common for 2.5D CNC work). Arcs use `I` (X offset) and `J` (Y offset).
> - **`G18`**: XZ Plane (used for lathes or profiling on the side of a part). Arcs use `I` (X offset) and `K` (Z offset).
> - **`G19`**: YZ Plane. Arcs use `J` (Y offset) and `K` (Z offset).


| Command | Selected Plane | Arc Center Offsets |
|---------|----------------|--------------------|
| **`G17`** | **XY**         | `I` (for X), `J` (for Y) |
| **`G18`** | **XZ**         | `I` (for X), `K` (for Z) |
| **`G19`** | **YZ**         | `J` (for Y), `K` (for Z) |

#### Common Examples
* **Standard milling operation in the XY plane:**  
  `G17`  
  `G2 X10 Y15 I5 J0 F300`

* **Creating an arc on the front face of a part (XZ plane):**  
  `G18`  
  `G3 X20 Z-5 I10 K0 F250`

#### Tips & Tricks
- Always explicitly set your plane at the beginning of a program or after a tool change to avoid unexpected arc movements.
- Even if you are not cutting arcs, some canned cycles may behave differently depending on the active plane.
- The non-selected axis can still be moved during an arc command, resulting in helical motion. For example, `G17 G2 X10 Y10 I10 J0 Z-5` creates a circular ramp.

---

## `G20`, `G21` – Unit Selection

**Syntax:**  
> `G20` (inches)  
> `G21` (millimeters)  

Sets the G-code interpreter's units for all position, feed rate, and offset data.


> ℹ️ **Info**
> - **Modal:** Part of the Units modal group. The setting is persistent and will remain active until changed.
> - **`G20`**: Inches. All values are interpreted as inches, and feed rates are in inches/minute.
> - **`G21`**: Millimeters. All values are interpreted as millimeters, and feed rates are in mm/minute.


| Command | System Units |
|---------|--------------|
| **`G20`** | Inches       |
| **`G21`** | Millimeters  |

#### Common Examples
* **Set the machine to work in millimeters:**  
  `G21`  
  `G1 X100 F500`  (Moves to X=100mm at 500mm/min)

* **Set the machine to work in inches:**  
  `G20`  
  `G1 X4 F20` (Moves to X=4in at 20in/min)

#### Tips & Tricks
- It is critical safety practice to include either `G20` or `G21` at the very beginning of every G-code file. This prevents misinterpreting a 10mm move as a 10-inch move, which could cause a crash.
- This setting affects how *grblHAL interprets G-code*, but does not change the machine's internal step/mm settings (`$100`, etc.).
- Also checkout `$13` [Report in Inches (boolean)](../Reference/complete-settings-reference/#13--report-in-inches-boolean)

---

## `G28`, `G30` – Go to Pre-Defined Position

**Syntax:**  
> `G28  axes`  
> `G30  axes`

Commands the machine to perform a rapid move to a stored, user-defined position. This is often used as a safe "home" or tool change position.


> 🔥 **Danger**
> Do not use `G28` or `G30` unless the machine has been homed (`$H`) or its absolute machine position is otherwise reliably known. Executing these commands on an unhomed machine can lead to unexpected movements and potential crashes.



> ℹ️ **Info**
> - **Non-Modal.**
> - The command is a two-part move. First, it moves to the specified intermediate coordinate (`X`, `Y`, `Z`, etc.), then it moves to the final stored position for all axes.
> - If no intermediate coordinate is given, it moves all axes directly to the stored position.
> - The positions for `G28` and `G30` are set with `G28.1` and `G30.1`, respectively.
> - The values persist after E-stop resets, settings updates, and power-offs. They are based on the machine coordinates and relate to your homing position.


| Command | Parameter(s) | Description |
|---------|----------------|-------------|
| **`G28`** | `X,Y,Z..` (optional) | Moves to the `G28` stored position. |
| **`G30`** | `X,Y,Z..` (optional) | Moves to the `G30` stored position. |

#### Common Examples
* **Go directly to the G28 position:**  
  `G28`

* **Go to the G28 position via an intermediate point (e.g., to lift Z first for safety):**  
  `G28 Z0` (First moves Z to 0 in the current WCS, then moves all axes to the stored `G28` position)

* **Go to the second saved position, G30:**
  `G30`

#### Tips & Tricks
- The pre-defined positions are stored in machine coordinates.
- A common use case is `G53 G0 Z0` followed by `G28`. This ensures the Z-axis is fully retracted in machine coordinates before moving to the `G28` XY position, which is a very safe sequence.
- `G28.1` and `G30.1` do not take axis parameters; they set the stored position to the machine's current position.

---

## `G28.1`, `G30.1` – Set Pre-Defined Position

**Syntax:**  
> `G28.1`  
> `G30.1`

Stores the machine's current absolute position as the `G28` or `G30` pre-defined location.


> ℹ️ **Info**
> - **Non-Modal.**
> - This command captures the machine's current coordinates at the moment of execution and saves them persistently.


#### Common Examples
* **Move to a safe tool change location and store it as G28:**  
  `G53 G0 X-50 Y-50 Z-5` (Move to a safe spot in machine coordinates)  
  `G28.1` (Store this position)

* **Set a position at the front of the machine for easy access as G30:**
  `G53 G0 X-200 Y-400 Z-10`
  `G30.1`

#### Tips & Tricks
- Before running `G28.1` or `G30.1`, it's best to move the machine using `G53` (move in machine coordinates) to ensure you are setting the position precisely where you want it, independent of any work offsets.

---

## `G38.2`, `G38.3`, `G38.4`, `G38.5` – Probing

**Syntax:**  
> `G38.2 axes F-`  
> `G38.3 axes F-`  
> `G38.4 axes F-`  
> `G38.5 axes F-`  

Performs a straight probing operation. The machine moves along a specified path until a connected probe input changes state (e.g., makes or breaks contact). The machine stops and records the trigger coordinate.


> ℹ️ **Info**
> - **Non-Modal.**
> - **`G38.2`**: Probe toward workpiece, stop on contact, signal error if no contact.
> - **`G38.3`**: Probe toward workpiece, stop on contact, no error if no contact.
> - **`G38.4`**: Probe away from workpiece, stop on loss of contact, signal error if it starts un-triggered.
> - **`G38.5`**: Probe away from workpiece, stop on loss of contact, no error if it starts un-triggered.


| Command | Description |
|---------|-------------|
| **`G38.2`** | Probe towards, error on fail. |
| **`G38.3`** | Probe towards, success on fail. |
| **`G38.4`** | Probe away, error on fail. |
| **`G38.5`** | Probe away, success on fail. |
| **X,Y,Z..** | The destination coordinates of the probe move. The probe will stop short if it triggers. |
| **F** | The feed rate (speed) of the probing move. |

#### Common Examples
* **Probe down in Z to find the top of a workpiece:**  
  `G91 G38.2 Z-20 F100` (Probe down 20mm at 100mm/min. Will stop when the probe touches.)

* **Find the center of a bore by probing in two directions:**
  `G38.2 X-10 F50` (Probe left)  
  *Record position*  
  `G0 X1` (Move away slightly)  
  `G38.2 X10 F50` (Probe right)  
  *Record position and calculate center*

#### Tips & Tricks
- Upon successful probing, grblHAL reports the trigger position, which can be accessed via `?` status reports or parsed by a GUI.
- Use a slow feed rate (`F`) for probing to get accurate results and prevent damage to the probe tip. A common practice is to perform a fast probe to find the surface, back off slightly, then perform a second, much slower probe for high accuracy.
- `G38.3` is useful for checking if a tool is present or finding the edge of a part when you don't know exactly where it is.

---

## `G40` – Cancel Cutter Radius Compensation

**Syntax:**  
> `G40`  

Disables cutter radius compensation (`G41`/`G42`). This is the default state.


> ℹ️ **Info**
> - **Modal:** Part of the Cutter Compensation group.
> - It is recommended to issue a `G40` at the beginning and end of all CNC programs to ensure a known state.


#### Example
* **Ensure compensation is off before starting a job:**  
  `G40`

---

*Note: Full `G41`/`G42` cutter radius compensation is not present in the grblHAL core but may be available via plugins. The `G40` command is included for compatibility and to ensure a known state.*

---

## `G43.1`, `G43.2`, `G49` – Tool Length Offsets

**Syntax:**  
> `G43.1 axes`  
> `G43.2 axes`  
> `G49`  

Applies or removes a tool length offset, primarily along the Z-axis. This allows the machine to compensate for tools of different lengths without changing the G-code program.


> ℹ️ **Info**
> - **Modal:** Part of the Tool Length Offset group.
> - **`G43.1`**: Dynamic Tool Length Offset. Applies the offset specified by the `Z`, `A`, `B`, `C`, or other axis word. This is a powerful, flexible way to manage tool lengths.
> - **`G43.2`**: Additional Tool Length Offset. Applies a secondary offset, which can be stacked on top of the current offset.
> - **`G49`**: Cancel Tool Length Offset. Removes any active tool length offset.
> - **Tool Table Integration (`G43 H-`):** If a tool table is enabled, `G43` (without `.1` or `.2`) can be used with an `H` word (e.g., `G43 H1`) to apply the Z-length offset stored for the tool number specified by the `H` word. The `H` word generally should match the active tool number.


| Command | Parameter(s) | Description |
|---------|----------------|-------------|
| **`G43.1`** | `Z,A,B,C...` | Applies a dynamic offset to the specified axis. For example `G43.1 Z10` shifts the Z-axis origin by 10 units. |
| **`G43.2`** | `Z,A,B,C...` | Applies an additional (additive) offset. |
| **`G49`** | None | Cancels all active tool length offsets. |
| **`G43 H`** | `H` word | Applies the tool length offset from the tool table for tool number ``. (Requires tool table plugin). |

#### Common Examples
* **Load a tool that is 5.2mm longer than the master tool:**  
  `G43.1 Z5.2` (All subsequent Z moves will be adjusted by +5.2mm)

* **Cancel the tool offset before a tool change:**
  `G49`
  `M6 T2`

* **Apply the Z-length offset for tool #1 from the tool table:**
  `T1 M6` (Change to tool 1)
  `G43 H1` (Apply its stored offset)

#### Tips & Tricks
- `G49` should be commanded before any tool change (`M6`) and at the end of a program.
- `G43.1` in grblHAL applies the offset directly. For example, after probing a new tool, a macro can calculate the difference and issue the correct `G43.1` command.
- When a tool table is used, `G43 H` becomes the standard way to apply offsets as it looks up the value automatically.

---

## `G50`, `G51` – Coordinate System Scaling

**Syntax:**  
> `G50` (cancel scaling)  
> `G51 X- Y- Z- A- B- C-` (apply scaling)  

These commands enable or disable scaling of coordinate systems. This allows G-code programs to be run at different sizes or even mirrored, without modifying the original program.


> ℹ️ **Info**
> - **Modal:** Part of the Scaling group. `G50` is the default.
> - **grblHAL Implementation:** grblHAL implements the Mach3 version of `G50`/`G51`. There is a compile-time option to enable a different (Fanuc-style) version.
> - **`G51` (Apply Scaling):** Scales subsequent motion commands by a factor specified for each axis. A value of `-1` for an axis will mirror (flip) that axis. It is not permitted to use unequal scale factors to produce elliptical arcs with `G2` or `G3`.
> - **`G50` (Cancel Scaling):** Disables any active scaling, returning the coordinate system to its unscaled state.
> - **Visual Cue:** When scaling is active, some senders like ioSender may display a yellow dot behind the axis DRO (Digital ReadOut).


| Command | Parameter(s) | Description |
|---------|----------------|-------------|
| **`G50`** | None | Cancels all active scaling. |
| **`G51`** | `X,Y,Z...` | Applies a scaling factor to the specified axes. Example: `X2.0` doubles the X dimension, `X-1` mirrors X. |

#### Common Examples
* **Run a job at half size:**  
  `G51 X0.5 Y0.5 Z0.5`  
  `(G-code for the part)`  
  `G50` (Cancel scaling)

* **Mirror a PCB drilling pattern along the X-axis:**  
  `G51 X-1`  
  `(G-code for drilling holes)`  
  `G50`

#### Tips & Tricks
- Scaling applies to all subsequent motion commands until `G50` is issued.
- It's a powerful feature for design adjustments or creating mirrored parts without complex CAM operations.

---


## `G53` – Move in Machine Coordinates

**Syntax:**  
> `G53 G0 axes`  
> `G53 G1 axes `

Executes a linear or rapid move in the absolute machine coordinate system, temporarily ignoring any work coordinate systems (`G54`, etc.) and offsets.


> ℹ️ **Info**
> - **Non-Modal:** `G53` is only active for the block in which it is commanded.
> - It must be combined with a motion command like `G0` or `G1`.


| Parameter(s) | Description |
|--------------|-------------|
| **`G0` or `G1`** | Specifies rapid or linear motion. |
| **`X,Y,Z...`** | The target coordinates in the machine's absolute reference frame. |

#### Common Examples
* **Rapidly move the Z-axis to its highest point (machine Z=0) regardless of work offsets:**  
  `G53 G0 Z0`  (A very common safety move)

* **Move to a specific fixture point for a tool probe, using machine coordinates for consistency:**
  `G53 G0 X-10 Y-10`

#### Tips & Tricks
- `G53` is the most reliable way to move to a known, fixed position on the machine (like a tool change station or probing location) because it is not affected by any offsets.
- The next block of G-code will revert to the previously active work coordinate system.

---

## `G54` to `G59.3` – Work Coordinate Systems (WCS)

**Syntax:**  
> `G54`  
> `G55`  
> `G56`  
> `G57`  
> `G58`  
> `G59`  
> `G59.1`  
> `G59.2`  
> `G59.3`  

Selects one of the available work coordinate systems. A WCS defines a user-programmable origin (X0, Y0, Z0, etc.) for a specific job or fixture. This separates the program's zero point from the machine's home position.


> ℹ️ **Info**
> - **Modal:** Part of the WCS group. `G54` is typically the default.
> - grblHAL supports 9 work coordinate systems:
> - `G54` (P1)
> - `G55` (P2)
> - `G56` (P3)
> - `G57` (P4)
> - `G58` (P5)
> - `G59` (P6)
> - `G59.1` (P7)
> - `G59.2` (P8)
> - `G59.3` (P9) - **Note:** Used by Tool Change Modes 2 & 3 as the tool change position.


| Command | WCS Selected |
|---------|--------------|
| **`G54`** | System 1     |
| **`G55`** | System 2     |
| **...** | ...          |
| **`G59.3`**| System 9     |

#### Common Example
* **Running a job on two different vices on the machine bed:**
  `G10 L20 P1 X0 Y0 Z0` (Set G54 origin on the first vice)  
  `G10 L20 P2 X150 Y0 Z0` (Set G55 origin on the second vice, 150mm to the right)

  `G54`  
  `(run g-code for part 1)`

  `G55`
  `(run the same g-code for part 2)`

#### Tips & Tricks
- The origins for each WCS are set using the `G10 L2` or `G10 L20` commands or through the GUI by "zeroing" the axes.
- WCS values are stored persistently.
- Use different WCS for different fixtures, or even for different sides of the same part in a multi-stage operation.

---

## `G61`, `G61.1` – Path Control Mode

**Syntax:**  
> `G61` (exact stop)  
> `G61.1` (exact stop alias)  


These commands control how the machine handles corners and transitions between sequential motion commands. This choice is a trade-off between speed and accuracy.


> ℹ️ **Info**
> - **Modal:** Part of the Control Mode group.
> - **`G61` (Exact Stop Mode):** The machine comes to a full stop at the end of each programmed move before starting the next. This ensures every corner is perfectly sharp but can cause jerky motion and slow down jobs significantly.
> - **`G61.1` (Exact Stop Mode):** An alias for `G61`.


| Command | Mode | Corner Behavior |
|---------|------|-----------------|
| **`G61`** | Exact Stop | Sharp corners, decelerates to zero at each vertex. |


#### Common Examples
* **Engraving a precise technical drawing with sharp corners:**  
  `G61`  
  `(G-code for drawing)`


#### Tips & Tricks
- For most applications (2D profiling, 3D carving), `G64` is the preferred mode as it results in faster and smoother operation.
- Use `G61` only when absolute corner sharpness is required, such as inlays or mechanical parts with tight tolerances. Be aware that it can leave "witness marks" or small circular divots at each corner on some materials due to the momentary stop.

---

## `G65` – Subprogram Call with Arguments

**Syntax:**  
> `G65 P [L] [A- B- C- ...]`  

`G65` allows calling a subprogram (macro) and passing arguments to it. This is a common feature in industrial controllers, enabling highly parameterized and reusable code.


> ℹ️ **Info**
> - **Requires NGC Expressions:** `G65` is supported in grblHAL only if NGC expressions (G-code expressions and flow control) are enabled in the firmware.
> - **Subprogram Location:**
> - User-defined `G65` macros are typically stored on an SD card (or in LittleFS) in the root folder, named `P.macro`, where `` is the `P` argument.
> - **User-provided macros should generally start with a `P` word value of 100 or greater** to avoid conflicts with built-in macros (P1-P7).
> - **Argument Passing:** Arguments (e.g., `A`, `B`, `C`, `X`, `Y`, `Z`, etc.) passed with `G65` are assigned to named variables within the called subprogram.
> - **Nesting:** Nesting of `G65` macros is not allowed.
> - **Reference:** For more details on expressions and flow control, refer to the [grblHAL wiki page on Expressions and flow control](https://github.com/grblHAL/core/wiki/Expressions-and-flow-control). Also, a reference for G65 in other systems: [cnczone.com](https://www.cnczone.com/forums/attachments/2/0/6/1/9/22462.attach).


| Parameter | Description |
|-----------|-------------|
| **P** | The number of the subprogram to call (e.g., `P100` calls `P100.macro`). |
| **L** | **Optional:** Repeat count. The macro will be executed `L` times. (Available from build 20260125). |
| **A, B, C, X, Y, Z...** | Arguments to be passed to the subprogram. These become local variables inside the macro. |

### User Macro Example (P100+)

* **Call a custom macro `P100.macro` to drill a hole with a specific depth and feed rate:**  
  `(Content of P100.macro: )`  
  `# = #1 ; A argument becomes local variable #`  
  `# = #2 ; B argument becomes local variable #`  
  `G91 G1 Z-# F#`  
  `G0 Z#`  
  `M99` (Return from subprogram)

  `(Main program G-code: )`  
  `G0 X10 Y10`  
  `G65 P100 A5.0 B200` (Call P100.macro, drill 5mm deep at 200mm/min)  
  `G0 X20 Y20`  
  `G65 P100 A8.0 B150` (Call P100.macro, drill 8mm deep at 150mm/min)

### Tips & Tricks
- `G65` is a powerful tool for creating reusable, modular G-code for complex operations.
- Variables are assigned to arguments based on their letter, e.g., `A` is typically `#1`, `B` is `#2`, `X` is `#24`, etc.
- **Reserve P1-P7 for built-in macros** - Start your custom macros at P100 or higher.

---

## Built-in G65 Macros (P1-P7)

grblHAL provides several built-in `G65` macros for system-level operations. These are reserved and should not be overridden by user macros.


> 📝 **Note**
> Built-in macros will set the `_value_returned` parameter to `1` if a value is returned. The value is then stored in the `_value` parameter.


---

### `G65 P1` – Read/Write Settings

**Purpose:** Read or write grblHAL numeric settings.

**Syntax:**
- `G65 P1 Q` - Read setting value
- `G65 P1 Q S` - Set setting value (Available from build 20251028)

**Parameters:**
- `Q` = Setting number (e.g., `Q110` for $110)
- `S` = New value to set (optional)

**Returns:**
- `_value` = Current setting value (for read operations)
- `_value_returned` = 1 if successful

**Examples:**
```gcode
; Read current X-axis max rate ($110)
G65 P1 Q110
# = _value
(MSG, X-axis max rate: # mm/min)

; Set X-axis max rate to 5000 mm/min
G65 P1 Q110 S5000
```

**Alternative:** The `PRM[]` function can also be used to read settings:
```gcode
# = PRM[110]
```

---

### `G65 P2` – Read Tool Offset

**Purpose:** Read tool offset values from the tool table.

**Syntax:**
- `G65 P2 Q R`

**Parameters:**
- `Q` = Tool number (e.g., `Q1` for Tool 1)
- `R` = Axis number (0=X, 1=Y, 2=Z, 3=A, etc.)

**Returns:**
- `_value` = Tool offset value for the specified axis
- `_value_returned` = 1 if successful

**Example:**
```gcode
; Read Z-axis offset for Tool 3
G65 P2 Q3 R2
# = _value
(MSG, Tool 3 Z offset: # mm)

; Read X-axis offset for Tool 1
G65 P2 Q1 R0
# = _value
```

---

### `G65 P3` – Get/Set Parameter

**Purpose:** Read or write parameter values. Useful for simulating arrays since parameter numbers can be expressions.

**Syntax:**
- `G65 P3 I [S]` - Get parameter value
- `G65 P3 I Q` - Set parameter value

**Parameters:**
- `I` = Parameter number to read/write
- `S` = Optional: Set parameter `` = parameter `` (copy operation)
- `Q` = Value to set parameter to

**Returns:**
- `_value` = Parameter value (for read operations without `S`)
- `_value_returned` = 1 if successful

**Examples:**
```gcode
; Read parameter #100
G65 P3 I100
# = _value

; Set parameter #100 to 42.5
G65 P3 I100 Q42.5

; Copy parameter #100 to parameter #200
G65 P3 I100 S200

; Simulate an array using expressions
# = 5
G65 P3 I[1000 + #] Q123.45  ; Set parameter #1005 to 123.45
```

**Use Case:** The `P3` macro is particularly useful for simulating arrays, as both `I` and `S` can be expressions.

---

### `G65 P4` – Get Machine State

**Purpose:** Query the current machine state.

**Syntax:**
- `G65 P4`

**Returns:**
- `_value` = Current machine state code
- `_value_returned` = 1 if successful

**State Codes:**

| State | Description |
|-------|-------------|
| 0     | Idle |
| 2     | Check mode1 |
| 4     | Cycle (motion ongoing) |
| 10    | Tool change |

**Example:**
```gcode
; Check if machine is idle before starting operation
G65 P4
IF [_value NE 0]
  (MSG, ERROR: Machine not idle!)
  M0
ENDIF

; Wait for motion to complete
G65 P4
WHILE [_value EQ 4]
  G4 P0.1  ; Wait 100ms
  G65 P4
ENDWHILE
```

**Available from:** Build 20250107

---

### `G65 P5` – Select Probe Input

**Purpose:** Select which probe input to use for probing operations.

**Syntax:**
- `G65 P5 Q`

**Parameters:**
- `Q` = Probe ID

**Probe IDs:**

| Probe | Description |
|-------|-------------|
| 0     | Primary probe |
| 1     | Toolsetter |
| 2     | Secondary probe |

**Example:**
```gcode
; Use primary probe for workpiece probing
G65 P5 Q0
G38.2 Z-50 F100  ; Probe down

; Switch to toolsetter for tool measurement
G65 P5 Q1
G38.2 Z-100 F50  ; Probe tool length
```


> 📝 **Note**
> Selecting a probe input that is not available will raise an error.


**Available from:** Build 20250514

---

### `G65 P6` – Disable Spindle Delays

**Purpose:** Disable spindle on/off delays for the next `M3`, `M4`, or `M5` command.

**Syntax:**
- `G65 P6`

**Use Case:** When you need the spindle to start/stop immediately without waiting for the configured delay times (settings `$392` and `$394`).

**Example:**
```gcode
; Normal spindle start with delay
M3 S10000
G4 P2  ; Wait for spindle to reach speed

; Quick spindle restart without delay
M5
G65 P6  ; Disable delays for next spindle command
M3 S10000  ; Starts immediately, no delay
```

**Available from:** Build 20250922

---

### `G65 P7` – Send Modbus Message

**Purpose:** Send Modbus RTU/TCP communication from G-code to read/write registers on Modbus-enabled devices such as VFDs (Variable Frequency Drives), PLCs, sensors, and other industrial equipment.

**Syntax:**
*   `G65 P7 S- F- R- ` (Function codes 1-4: Read operations)
*   `G65 P7 S- F- R- A-` (Function codes 5 and 6: Write single coil/register)
*   `G65 P7 S- F-` (Function code 7: Read exception status)
*   `G65 P7 S- F- R- A-  ` (Function codes 16 and 17: Write multiple registers)

**Parameters:**
*   `S`: Modbus server (slave) address (1-247).
*   `F`: Modbus function code (1-7, 16, 17 supported).
*   `R`: Register base address (0-65535).
*   `X`: Number of registers to read (1-3, default 1). Only for read operations.
*   `A`: First value (for writes) or first register value.
*   `B`: Second value (for multi-register writes).
*   `C`: Third value (for multi-register writes).

**Returns:**
*   On exception: `_value_returned` is set to `0`, and `_value` contains the Modbus exception code.
*   On success: `_value_returned` is set to the number of values received. `_value`, `_value2`, and `_value3` are set accordingly.

---

#### Supported Modbus Function Codes

    #### **Function Code 1 (0x01): Read Coils**
    
    Reads the ON/OFF status of discrete output coils (digital outputs) from the slave device.
    
    **Use Case:** Reading the state of relay outputs, digital I/O pins, or binary flags.
    
    **Syntax:** `G65 P7 S F1 R X`
    
    **Example:**
    ```gcode
    ; Read 8 coils starting from address 100 on slave device 1
    G65 P7 S1 F1 R100 X8
    ; _value will contain the coil states as a bitmask
    ```

    #### **Function Code 2 (0x02): Read Discrete Inputs**
    
    Reads the ON/OFF status of discrete input contacts (digital inputs) from the slave device.
    
    **Use Case:** Reading the state of limit switches, sensors, or other digital input signals.
    
    **Syntax:** `G65 P7 S F2 R X`
    
    **Example:**
    ```gcode
    ; Read status of 4 discrete inputs starting from address 200 on slave 1
    G65 P7 S1 F2 R200 X4
    ; Check if input is active
    # = [_value AND 1]  ; Check bit 0
    ```

    #### **Function Code 3 (0x03): Read Holding Registers**
    
    Reads the contents of holding registers (read/write registers) from the slave device. This is the most commonly used function for reading configuration, setpoints, and status values.
    
    **Use Case:** Reading VFD speed setpoints, temperature values, counters, configuration parameters.
    
    **Syntax:** `G65 P7 S F3 R X`
    
    **Example:**
    ```gcode
    ; Read current spindle speed from VFD at slave address 1, register 1000
    G65 P7 S1 F3 R1000 X1
    # = _value
    
    ; Read 3 consecutive registers (e.g., X, Y, Z position from a controller)
    G65 P7 S2 F3 R500 X3
    # = _value
    # = _value2
    # = _value3
    ```

    #### **Function Code 4 (0x04): Read Input Registers**
    
    Reads the contents of input registers (read-only registers) from the slave device. These typically contain sensor readings, measurements, or status information.
    
    **Use Case:** Reading analog sensor values, measurement data, device status codes.
    
    **Syntax:** `G65 P7 S F4 R X`
    
    **Example:**
    ```gcode
    ; Read temperature sensor value from register 300 on slave 3
    G65 P7 S3 F4 R300 X1
    # = _value
    
    ; Read multiple sensor values
    G65 P7 S3 F4 R400 X3
    # = _value
    # = _value2
    # = _value3
    ```

    #### **Function Code 5 (0x05): Write Single Coil**
    
    Writes (forces) a single coil (digital output) to either ON or OFF.
    
    **Use Case:** Controlling relays, solenoids, indicator lights, or digital outputs.
    
    **Syntax:** `G65 P7 S F5 R A`
    
    **Parameters:**
    *   `A`: Value to write (0 = OFF, 65280 or 0xFF00 = ON)
    
    **Example:**
    ```gcode
    ; Turn ON coil at address 50 on slave device 1
    G65 P7 S1 F5 R50 A65280
    
    ; Turn OFF coil at address 50
    G65 P7 S1 F5 R50 A0
    
    ; Practical example: Activate a clamp
    G65 P7 S1 F5 R100 A65280  ; Clamp ON
    G4 P0.5                    ; Wait 0.5 seconds
    ; ... perform machining ...
    G65 P7 S1 F5 R100 A0       ; Clamp OFF
    ```

    #### **Function Code 6 (0x06): Write Single Register**
    
    Writes a value to a single holding register. This is the most common function for setting parameters, setpoints, and configuration values.
    
    **Use Case:** Setting VFD speed, writing configuration parameters, updating setpoints.
    
    **Syntax:** `G65 P7 S F6 R A`
    
    **Example:**
    ```gcode
    ; Set VFD spindle speed to 12000 RPM (register 2000 on slave 1)
    G65 P7 S1 F6 R2000 A12000
    
    ; Set a temperature setpoint to 75°C (register 500 on slave 2)
    G65 P7 S2 F6 R500 A75
    
    ; Practical example: Variable spindle speed based on material
    # = 1  ; 1=aluminum, 2=steel
    IF [# EQ 1]
      # = 18000
    ELSE
      # = 12000
    ENDIF
    G65 P7 S1 F6 R2000 A#
    M3  ; Start spindle
    ```

    #### **Function Code 7 (0x07): Read Exception Status**
    
    Reads the exception status (8 coils/bits) from the slave device. This is a specialized diagnostic function.
    
    **Use Case:** Reading device error flags, alarm states, or diagnostic information.
    
    **Syntax:** `G65 P7 S F7`
    
    **Example:**
    ```gcode
    ; Read exception status from slave 1
    G65 P7 S1 F7
    # = _value
    
    ; Check for specific error conditions
    IF [_value GT 0]
      (MSG, ERROR: Device exception detected!)
      M0  ; Stop program
    ENDIF
    ```

    #### **Function Code 16 (0x10): Write Multiple Registers**
    
    Writes values to multiple consecutive holding registers in a single transaction. More efficient than multiple Function Code 6 calls.
    
    **Use Case:** Setting multiple parameters simultaneously, writing coordinate data, bulk configuration updates.
    
    **Syntax:** `G65 P7 S F16 R A > >`
    
    **Example:**
    ```gcode
    ; Write 3 values to consecutive registers starting at 1000 on slave 1
    G65 P7 S1 F16 R1000 A100 B200 C300
    ; Register 1000 = 100
    ; Register 1001 = 200
    ; Register 1002 = 300
    
    ; Practical example: Set XYZ position setpoints
    # = 150.5
    # = 200.0
    # = 50.0
    G65 P7 S2 F16 R500 A# B# C#
    ```

    #### **Function Code 17 (0x11): Report Server ID**
    
    Reads the identification and additional information from the slave device (serial line only).
    
    **Use Case:** Device identification, firmware version checking, diagnostic information retrieval.
    
    **Syntax:** `G65 P7 S F17`
    
    **Example:**
    ```gcode
    ; Get server ID from slave device 1
    G65 P7 S1 F17
    ; _value will contain device identification data
    ```

    ---

    ### Error Handling

    When a Modbus transaction fails or the slave device returns an exception, grblHAL sets:
    *   `_value_returned = 0`
    *   `_value` = Modbus exception code

    **Common Modbus Exception Codes:**
    *   `1`: Illegal Function (function code not supported by device)
    *   `2`: Illegal Data Address (register address doesn't exist)
    *   `3`: Illegal Data Value (value out of range)
    *   `4`: Slave Device Failure (device malfunction)
    *   `5`: Acknowledge (device accepted but needs time to process)
    *   `6`: Slave Device Busy (device is processing another request)
    *   `7`: Negative Acknowledge (device cannot perform the function)
    *   `8`: Memory Parity Error (data corruption detected)

    **Example Error Handling:**
    ```gcode
    ; Attempt to read register with error checking
    G65 P7 S1 F3 R1000 X1
    
    IF [_value_returned EQ 0]
      (MSG, Modbus Error! Exception Code: #)
      IF [_value EQ 2]
        (MSG, ERROR: Invalid register address)
      ENDIF
      IF [_value EQ 4]
        (MSG, ERROR: Device failure)
      ENDIF
      M0  ; Stop program on error
    ELSE
      # = _value
      (MSG, Spindle RPM: #)
    ENDIF
    ```

    ---

    ### Practical Application Examples

    #### **Example 1: VFD Spindle Control**
    ```gcode
    ; Read current VFD frequency
    G65 P7 S1 F3 R1000 X1
    # = _value
    (MSG, Current Frequency: # Hz)
    
    ; Set new frequency to 400 Hz (24000 RPM for 2-pole motor)
    G65 P7 S1 F6 R1000 A400
    
    ; Start VFD
    G65 P7 S1 F5 R100 A65280  ; Write coil to start
    G4 P2  ; Wait 2 seconds for spindle to spin up
    ```

    #### **Example 2: Reading Multiple Sensors**
    ```gcode
    ; Read 3 temperature sensors from a monitoring device
    G65 P7 S3 F4 R100 X3
    # = _value
    # = _value2
    # = _value3
    
    ; Check for overheating
    IF [# GT 80]
      (MSG, WARNING: Spindle temperature high!)
      M5  ; Stop spindle
      M0  ; Pause program
    ENDIF
    ```

    #### **Example 3: Automated Tool Measurement**
    ```gcode
    ; Trigger tool measurement on external probe system
    G65 P7 S2 F5 R200 A65280  ; Activate measurement
    G4 P1  ; Wait for measurement
    
    ; Read measured tool length
    G65 P7 S2 F3 R500 X1
    # = _value
    
    ; Apply tool offset
    G43.1 Z#
    (MSG, Tool length: # mm)
    ```

    ---

    :::warning Testing Status
    This feature has only been tested with a Modbus simulator. Use with caution in production environments and report any issues to the grblHAL development team.
    :::

    :::tip Configuration
    Ensure your grblHAL firmware is compiled with Modbus support enabled and that the Modbus communication parameters (baud rate, parity, stop bits) match your slave devices. Modbus settings are typically configured via grblHAL settings `$3xx` range.
    :::

    :::info Additional Resources
    - [Modbus Protocol Specification](https://www.modbustools.com/modbus.html)
    - [Modbus Function Codes Reference](https://www.productinfo.schneider-electric.com/powerpactmodbuscommguide/)
    - [grblHAL Modbus Plugin Documentation](https://github.com/grblHAL/Plugins_spindle)
    :::

---

## `G66`, `G67` – Modal Macro Call

**Syntax:**
> `G66 P [L] [A- B- C- ...]`
> `G67`

`G66` acts like `G65` but is **modal**. The specified macro is called after every subsequent motion command (`G0`, `G1`, `G2`, `G3`, etc.) until cancelled by `G67`.


> ℹ️ **Info**
> - **Purpose:** Useful for drilling canned cycles, custom probing cycles, or repeating an operation at multiple locations.
> - **Cancellation:** `G67` cancels the modal macro state.


---

**Notes:**

1 In check mode, non-built-in `G65` macros will not be run; only file availability will be checked.

---


## `G76`, `G81` to `G89` – Canned Cycles

**Syntax:**  
> `G81 Z- R-  `  
> `G82 Z- R- P-  `  
> `G83 Z- R- Q-  `  
> `G73 Z- R- Q-  `  
> `G85 Z- R-  `  
> `G86 Z- R-  `  
> `G89 Z- R- P-  `  
> `G76 Z- R- I- J- K- L- P- Q- F-` (Lathe Threading)  

Canned cycles are powerful shortcuts that combine several distinct movements into a single G-code command, typically for hole-making operations like drilling, boring, and tapping. Instead of programming each feed, retract, and rapid move manually, you define the cycle's parameters once. The cycle then repeats at every new coordinate provided until a `G80` (Cancel Canned Cycle) is issued.


> ℹ️ **Info**
> - **Modal:** Once a canned cycle is active, it remains active. Every new position command for the axes on the active plane (`X` and `Y` in `G17`) will execute the full cycle at that location.
> - **Parameters:**
> - **`Z`**: The final depth of the hole (absolute or incremental).
> - **`R`**: The retract position (the Z-height to which the tool rapids before starting the feed move).
> - **`P`**: Dwell time (in seconds) at the bottom of the hole (used in `G82`, `G89`).
> - **`Q`**: The peck depth for each cutting feed in `G73` and `G83`.
> - **`F`**: The feed rate for the cutting portions of the cycle.
> - **`L`**: **Optional:** Number of repeats (if supported by plugins).
> - **Return Behavior:** The return height after the cycle is controlled by `G98` and `G99` (see below).
> - **`G76` (Threading Cycle) and `G33` (Spindle Synced Motion):** These specialized lathe threading and spindle-synchronized cycles require a **spindle encoder** to synchronize spindle rotation with axis motion. Few grblHAL drivers/boards currently support this hardware requirement.


#### Available Cycles in grblHAL
*   **`G81`**: Simple Drilling Cycle. Rapids to R, feeds to Z, rapids out.
*   **`G82`**: Drilling Cycle with Dwell. Same as `G81` but dwells at the bottom of the hole for time `P`.
*   **`G83`**: Peck Drilling Cycle (Deep Hole). After each peck of depth `Q`, the drill fully retracts out of the hole to clear chips.
*   **`G73`**: Peck Drilling Cycle (Chip Breaking). After each peck of depth `Q`, the drill retracts a small, fixed amount to break the chip, but does not exit the hole.
*   **`G85`**: Boring Cycle. Feeds to Z, then feeds back out to R. Leaves a high-quality surface finish.
*   **`G86`**: Boring Cycle. Feeds to Z, stops spindle, rapids out.
*   **`G89`**: Boring Cycle with Dwell. Feeds to Z, dwells for time `P`, feeds back out to R.
*   **`G76`**: Threading Cycle (Lathe). A specialized cycle for cutting threads.

#### Canned Cycle Example (`G81`)
* **Drill three holes at X10, X20, and X30:**
  `G90 G21` (Absolute mode, millimeters)
  `G0 X0 Y0 Z5` (Start above the workpiece)
  `G99` (Set return plane to R-level)
  `G81 Z-10 R2 F150` (Define the cycle: drill to Z-10, retract plane is Z+2, feed 150)
  `X10 Y10` (Drills the first hole here)
  `X20` (Drills the second hole at X20, Y10)
  `X30` (Drills the third hole at X30, Y10)
  `G80` (Cancel the cycle)
  `G0 Z5` (Safely retract Z)

---

## `G80` – Cancel Canned Cycle

**Syntax:**  
> `G80`

Immediately cancels any active canned cycle mode (`G81`-`G89`). It is a critical safety command to ensure that subsequent motion commands are not interpreted as part of a cycle.


> ℹ️ **Info**
> - **Modal:** Part of the Motion Mode group. It reverts the machine to `G1` (Linear Motion) behavior.
> - Always use `G80` after a series of canned cycle operations.
> - Issuing any new motion command from the Motion Mode group (e.g., `G0`, `G1`, `G2`, `G3`) will also cancel an active canned cycle. For `G0` and `G1` commands, axis parameters are optional, meaning `G0` or `G1` on a line by itself will also cancel the canned cycle.


#### Example
* **Drill a series of holes and then cancel the cycle to move to a new area:**  
  `G81 Z-10 R2 F100` (Start drilling cycle)  
  `X10`  
  `X20`  
  `G80` (Cancel the drilling cycle)
  `G0 X50 Y50` (Now a normal rapid move)

---

## `G90`, `G91` – Distance Mode

**Syntax:**  
> `G90` (absolute)  
> `G91` (incremental)  

Controls how coordinate values (`X`, `Y`, `Z`, etc.) are interpreted by the machine. This is one of the most fundamental G-code concepts.


> ℹ️ **Info**
> - **Modal:** Part of the Distance Mode group. This setting is persistent. `G90` is the default.
> - **`G90` (Absolute Mode):** All coordinate values are interpreted as a position relative to the current work coordinate system's origin (e.g., `X10` means "move to the X=10 line").
> - **`G91` (Incremental Mode):** All coordinate values are interpreted as a distance *from the current position* (e.g., `X10` means "move 10 units in the positive X direction from where you are now").


| Command | Mode | Interpretation of Coordinates |
|---------|-------------|-------------------------------|
| **`G90`** | Absolute    | As a destination from the WCS origin (0,0). |
| **`G91`** | Incremental | As a distance and direction from the current point. |

#### Common Examples
* **Moving to a specific point (10, 20) using Absolute mode:**  
  `G90`  
  `G0 X10 Y20`

* **Moving a rectangle 50 units wide and 30 units tall using Incremental mode:**  
  `G91`  
  `G1 X50 F300` (Move right 50)  
  `G1 Y30` (Move up 30)  
  `G1 X-50` (Move left 50)  
  `G1 Y-30` (Move down 30)

#### Tips & Tricks
- Most CAM software generates code in `G90` (Absolute) mode.
- `G91` is extremely useful for writing simple, repeatable subroutines and macros, such as probing routines or patterns, because they work correctly regardless of where they are started.
- It is good practice to explicitly state `G90` or `G91` at the beginning of a program.

---

## `G92`, `G92.1`, `G92.2` – Coordinate System Offset

**Syntax:**  
> `G92 axes`  
> `G92.1` (cancel offset)  
> `G92.2` (suspend offset)  

`G92` applies a temporary, "volatile" offset to the machine's coordinate system. It makes the machine believe its current position is the value specified in the command. This is an older method of setting a work zero and is often discouraged in favor of `G10` and the persistent `G54-G59` work coordinate systems.


> ℹ️ **Info**
> - **Modal.**
> - **`G92`**: Apply an offset. For example, `G92 X0 Y0` tells the machine "your current location is now X0, Y0".
> - **`G92.1` or `G92.2`**: Clear any active `G92` offset, restoring the original coordinate system.
> - **`G92.3`**: Restore a previously-cleared `G92` offset. (Less common).


| Command | Action |
|---------|--------|
| **`G92 X.. Y..`** | Sets the current point to the specified coordinate value. |
| **`G92.1`** | Clears any active `G92` offset. |

#### `G92` Example
* **Temporarily set the corner of a workpiece as the origin:**  
  `G0 X100 Y50` (Move to the physical corner)  
  `G92 X0 Y0 Z0` (Tell grblHAL this spot is now the origin)  
  `(All subsequent moves are relative to this new temporary zero)`
  ...
  `G92.1` (Clear the offset and return to the underlying G54/etc. system)

#### Tips & Tricks
- **Warning:** `G92` offsets are easy to forget about and can lead to unexpected crashes. It's often safer to use a dedicated Work Coordinate System like `G55` for temporary setups.
- A `G92` offset is applied *on top of* the active G54-G59 WCS.
- Some legacy CAM posts still use `G92`, particularly for multi-axis machines to reset a rotary axis's position (e.g., `G92 A0`).

---

## `G93`, `G94`, `G95` – Feed Rate Mode

**Syntax:**  
> `G93` (inverse time)  
> `G94` (units per minute)  
> `G95` (units per revolution)  

Determines how the `F` word (feed rate) is interpreted.


> ℹ️ **Info**
> - **Modal:** Part of the Feed Rate Mode group. `G94` is the default and most common mode for milling.
> - **`G93` (Inverse Time Mode):** The `F` word represents "1 / minutes". The feed rate is calculated so that the move completes in `1/F` minutes. This is mainly used in 5-axis simultaneous motion where maintaining a constant tool-tip speed is complex.
> - **`G94` (Units Per Minute Mode):** The `F` word is interpreted directly as linear units (mm or inches) per minute. This is the standard for most CNC mills, routers, and 3D printers.
> - **`G95` (Units Per Revolution Mode):** The `F` word is interpreted as linear units per spindle revolution. This is the standard for CNC lathes, where chip load is directly tied to RPM.


| Command | Feed Rate Interpretation | Primary Use |
|---------|--------------------------|-------------|
| **`G93`** | 1 / minutes (Inverse Time) | 5-Axis Simultaneous Machining |
| **`G94`** | Units / Minute           | Milling, Routing, 3D Printing |
| **`G95`** | Units / Revolution       | Lathes, Threading |

#### Examples
* **Standard milling at 500 mm/min:**  
  `G94`  
  `G1 X100 F500`

* **Lathe turning at 0.2 mm per revolution:**  
  `G95`  
  `S1000 M3` (Spindle at 1000 RPM)  
  `G1 Z-50 F0.2` (The effective feed rate is 1000 RPM * 0.2 mm/rev = 200 mm/min)

---

## `G96`, `G97` – Spindle Speed Mode

**Syntax:**  
> `G96 S- ` (constant surface speed)  
> `G97 S-` (constant RPM)  

Controls how the `S` word (spindle speed) is interpreted. This is primarily for CNC lathes but can be useful in other specialized applications.


> ℹ️ **Info**
> - **Modal:** Part of the Spindle Speed Mode group. `G97` is the default.
> - **Lathe Mode Only:** `G96` and `G97` are only available if grblHAL is compiled with lathe support.
> - **`G96` (Constant Surface Speed - CSS):** The `S` word defines a desired surface speed (e.g., meters per minute in mm mode or feet per minute in inch mode). The controller will continuously adjust the spindle RPM based on the X-axis diameter to maintain this speed at the cutting edge. A maximum RPM must be set using `G50 S-` (Mach3 syntax) or by a `D` word on the `G96` line (e.g., `G96 S150 D1000`).
> - **`G97` (Constant RPM Mode):** The `S` word is interpreted directly as revolutions per minute. The spindle speed is fixed until a new `S` command is issued. This is used for operations like drilling and tapping where a constant RPM is required.


| Command | Spindle Speed Interpretation | Primary Use |
|---------|------------------------------|-------------|
| **`G96`** | Constant Surface Speed (CSS) | Lathe Facing/Turning |
| **`G97`** | Constant RPM                 | Milling, Drilling, Lathe Threading |

#### `G96` Example (Lathe)
* **Facing a part on a lathe with a surface speed of 150 m/min:**
  `G50 S4000` (Limit the spindle to a max of 4000 RPM for safety)
  `G96 S150 M3` (Turn on CSS mode at 150 m/min)
  `G1 X0 F0.2` (As X moves from a large diameter to zero, RPM will increase to maintain S150)

#### Tips & Tricks
- Always use `G97` for drilling, tapping, and threading operations, as a constant, known RPM is required. `G97 S800 M3`.
- `G96` provides a better surface finish and improved tool life on lathes when diameter is changing significantly.
- Set a prudent RPM limit (with `G50 S-` or `D-` word) when using `G96` to prevent the spindle from exceeding safe speeds at small diameters.

---

## `G98`, `G99` – Canned Cycle Return Mode

**Syntax:**  
> `G98` (return to initial level)  
> `G99` (return to R level)  

Controls the Z-height that the tool retracts to *between holes* during a canned cycle sequence.


> ℹ️ **Info**
> - **Modal:** Part of the Canned Cycle Return group.
> - **`G98` (Return to Initial Z):** At the end of each cycle, the tool retracts all the way to the Z-position that it was at *just before* the canned cycle was initiated. This is the safest mode, as it can clear clamps and other obstructions between hole locations.
> - **`G99` (Return to R-Plane):** At the end of each cycle, the tool retracts only to the R-level specified in the canned cycle block. This is faster when drilling a series of holes on a flat, unobstructed surface, as it minimizes Z-axis travel.


| Command | Retract Behavior in Canned Cycle |
|---------|----------------------------------|
| **`G98`** | Retract to initial Z-height.     |
| **`G99`** | Retract to the `R` level.        |

#### Example
* **Drilling two holes, one of which has a clamp in between:**
  `G90 G0 X10 Y10 Z20` (Start high above the part, Z=20 is the "initial height")

  `G98` (Use G98 to retract fully to Z=20, clearing the clamp)
  `G81 Z-5 R2 F100` (Define cycle)
  `X10 Y10` (Drill first hole, tool retracts to Z=20)
  `X50 Y10` (Drill second hole across the clamp, tool retracts to Z=20)
  `G80`

* **Drilling a fast pattern on a flat plate:**
  `G90 G0 X10 Y10 Z5` (Start just above the part)

  `G99` (Use G99 to retract only to R-level for speed)
  `G81 Z-5 R2 F100` (R-level is Z=2)
  `X10 Y10` (Drill hole, retracts to Z=2)
  `X20 Y10` (Drill hole, retracts to Z=2)
  `G80`

---

# M-Codes

M-codes control miscellaneous machine functions. These are actions that are not related to axis motion, such as controlling the spindle, coolant, program flow, and I/O.

---

## `M0`, `M1`, `M2`, `M30` – Program Flow & Stopping

**Syntax:**  
> `M0 |(message)` (program stop)  
> `M1 |(message)` (optional stop)  
> `M2` (program end)  
> `M30` (program end & rewind)  

These commands control the execution and termination of a G-code program.


> ℹ️ **Info**
> - **`M0` (Program Stop):** Unconditionally halts the program. All axes, spindle, and coolant stop. The operator must press the cycle start button to resume the program from the next line.
> - **`M1` (Optional Stop):** Behaves exactly like `M0`, but only if the "Optional Stop" input or switch on the machine/GUI is enabled. If the switch is off, the controller ignores `M1` and continues execution. This is useful for inspection points that are not needed on every run.
> - **`M2` (Program End):** Ends the program. Typically performs a reset of the controller, clears offsets, and puts the machine in an idle state. Behavior can vary slightly.
> - **`M30` (Program End, Pallet Change):** The most common command to end a program. It does everything `M2` does but also typically rewinds the G-code file back to the beginning, ready for the next part.


| Command | Action | Resumption |
|---------|--------|------------|
| **`M0`**  | Unconditional Program Stop | Requires operator intervention (Cycle Start) |
| **`M1`**  | Optional Program Stop      | Requires operator intervention if enabled |
| **`M2`**  | Program End and Reset      | Program ends |
| **`M30`** | Program End and Rewind     | Program ends |

#### Common Examples
* **Stop the program to allow for manual chip clearing:**  
  `G0 Z20`  
  `M0`  
  `G0 X50 Y50`

* **Place an optional stop after a critical feature for inspection:**  
  `(G-code for a finishing pass)`  
  `M1` (If Optional Stop is on, machine will pause here)

* **Standard way to end a G-code file:**  
  `G0 Z20` (Retract to a safe height)  
  `M5` (Spindle off)  
  `M30`

#### Tips & Tricks for `M30`
- If running a program from an SD card, you can enable rewind mode with `$FR` prior to starting it. A cycle start command (realtime or via a button) can then be used to return it to the beginning. A message is typically output at program end prompting for this.

---

## `M3`, `M4`, `M5` – Spindle Control

**Syntax:**  
> `M3 S-` (spindle on CW)  
> `M4 S-` (spindle on CCW)  
> `M5` (spindle off)  

These are the fundamental commands for controlling the spindle's rotation.


> ℹ️ **Info**
> - **`M3` (Spindle On, Clockwise - CW):** Starts the spindle rotating in the clockwise direction (the standard direction for most right-hand tools). The speed is determined by the last active `S` word.
> - **`M4` (Spindle On, Counter-Clockwise - CCW):** Starts the spindle rotating in the counter-clockwise direction. This is used for left-hand tools, such as some taps and specialty cutters.
> - **`M5` (Spindle Off):** Stops the spindle's rotation.


| Command | Spindle State | Direction |
|---------|---------------|-----------|
| **`M3 S`** | On | Clockwise (CW) |
| **`M4 S`** | On | Counter-Clockwise (CCW) |
| **`M5`** | Off | N/A |

#### Common Examples
* **Start the spindle at 10,000 RPM in the forward direction:**  
  `S10000 M3`

* **Stop the spindle:**  
  `M5`

* **Start the spindle for a left-hand thread tapping operation at 500 RPM:**  
  `S500 M4`

#### Tips & Tricks
- It's good practice to command the `S` word on the same line or just before the `M3`/`M4` command.
- The controller will wait for the spindle to reach the commanded speed before executing the next motion command if "Wait for Spindle at Speed" is enabled in the settings. This is crucial for tapping and heavy cuts.

---

## `M6` – Tool Change

**Syntax:**  
> `M6 `

Initiates a tool change sequence. The behavior of `M6` is highly dependent on the machine's configuration and whether an automatic tool changer (ATC) is present, or if manual tool change protocols are enabled.


> ℹ️ **Info**
> - **`M6` is a Tool Change command.** An Automatic Tool Changer (ATC) is a *special case* of how `M6` can be implemented.
> - **With ATC:** An `M6` command, typically combined with a tool number (`T` word), will trigger a pre-defined macro (often `tc.macro` or `P200.macro` for RapidChange ATC) that executes the physical tool change sequence.
> - **Without ATC (Manual Tool Change):**
> - `M6` typically functions as a programmed stop (`M0`). It moves the machine to a safe tool change position, turns off the spindle, and waits for the operator to manually change the tool and press "Cycle Start" to continue.
> - If the sender supports the grblHAL tool change protocol extension, various manual tool change modes can be configured using setting `$341`.
> - If no specific protocol or macro is configured, `M6` may be handled directly by the sender application, or grblHAL can be configured to ignore `M6` commands.
> - **Reference:** For more general information about M6, see [LinuxCNC documentation](https://linuxcnc.org/docs/2.5/html/gcode/m-code.html#sec:M6-Tool-Change).


| Parameter | Description |
|-----------|-------------|
| **`T`** | The tool number to be loaded. For example, `T3` selects tool #3. |

#### Common Examples
* **Command a change to Tool #5:**  
  `T5 M6`

* **Simple manual tool change sequence:**  
  `M5` (Stop spindle)  
  `G53 G0 Z0` (Move Z to machine home)  
  `G53 G0 X0 Y0` (Move to front for access)  
  `T2 M6` (Select tool 2 and pause. A message "Change to tool 2" may appear in the GUI)

#### Tips & Tricks
- The `T` word only *selects* the tool. `M6` is the command that *executes* the change.
- The logic for the tool change process (both manual and automatic) is often defined in a system macro file, typically named `tc.macro` (tool change) or `P200.macro` (for RapidChange ATC) located on the controller's SD card or accessible by the sender. This allows for extensive customization of the tool change procedure. For an example, see projects like [Rapidchange ATC](https://services.rapidchangeatc.com/docs/).
- After a tool change, a `G43` or `G43.1` command is typically used to apply the new tool's length offset.


---

## `M98`, `M99` – Subroutine Call & Return

**Syntax:**
> `M98 P [L]` (Call Subroutine)
> `M99` (Return)

Executes a subroutine (a separate block of G-code or an external file) and then returns to the main program.


> ℹ️ **Info**
> - **`M98 P`:** Jumps to the subroutine with the specified number.
> - If **Scan Current (`$700=1`)** is enabled, it first looks for a label `O sub` in the current file.
> - If not found (or `$700=0`), it looks for an external file named `xxx` (or `xxx.nc`, `xxx.gcode`, etc.) on the SD card/filesystem.
> - **`L`:** Optional repeat count. The subroutine will act `` times before returning.
> - **`M99`:** Marks the end of the subroutine. Control returns to the line following the `M98` call.
> - If `M99` is used in the main program (not in a sub), it acts as a "Rewind and Loop" command, jumping back to the beginning of the file.


| Parameter | Description |
|-----------|-------------|
| **`P`** | The subroutine number or filename to call. |
| **`L`** | (Optional) Number of times to repeat the subroutine. |

#### Examples
*   **External Subroutine:**
    *   `M98 P1001` (Calls file `1001.gcode` from SD card)
*   **Internal Subroutine (with `$700=1`):**
    ```gcode
    M98 P100 L3   ; Call sub 100 three times
    M30           ; End main program

    O100 sub      ; Define subroutine 100
    G91 G0 X10    ; Move X
    M99           ; Return
    ```

---

## `M7`, `M8`, `M9` – Coolant Control

**Syntax:**  
> `M7` (mist coolant on)  
> `M8` (flood coolant on)  
> `M9` (all coolant off)  

These commands control the machine's coolant systems. In grblHAL, these are typically mapped to specific output pins which can control relays for pumps or solenoids.


> ℹ️ **Info**
> - **`M7` (Mist Coolant On):** Activates the mist coolant output pin. This is intended for an air/oil mist system.
> - **`M8` (Flood Coolant On):** Activates the flood coolant output pin. This is the primary coolant command for most machines.
> - **`M9` (Coolant Off):** Deactivates *both* the mist (`M7`) and flood (`M8`) outputs.


| Command | Mapped Output | Action |
|---------|---------------|--------|
| **`M7`** | Mist | On |
| **`M8`** | Flood | On |
| **`M9`** | Both | Off |

#### Common Examples
* **Turn on the flood coolant before a cutting move:**  
  `M8`  
  `G1 Z-5 F300`

* **Turn on both mist and flood (if the machine is equipped):**  
  `M7 M8`

* **Turn off all coolant at the end of the job:**  
  `G0 Z20`  
  `M9`

#### Tips & Tricks
- The specific physical pins used for coolant are defined in the driver board's configuration file.
- These outputs can be repurposed to control other accessories, like a vacuum clamp or an air blast, if coolant is not used.



---

## `M48`, `M49` – Override Control

**Syntax:**  
> `M48` (enable overrides)  
> `M49` (disable overrides)

Enables or disables the real-time feed rate, spindle speed, and rapid override switches. This allows the G-code program to enforce a specific speed or feed, preventing accidental changes by the operator.


> ℹ️ **Info**
> - **`M48` (Enable Overrides):** Allows the physical override switches/dials and GUI sliders to function normally. This is the default state.
> - **`M49` (Disable Overrides):** Ignores all override controls. The machine will run at 100% of the programmed feed, rapid, and spindle speeds.


| Command | Override State |
|---------|----------------|
| **`M48`** | Enabled |
| **`M49`** | Disabled |

#### Example
* **Ensure a critical finishing pass is run at the exact programmed feed rate:**  
  `... (roughing passes with M48 active) ...`  
  `M49` (Disable overrides)  
  `G1 X100 F150` (This move will be exactly 150 units/min)  
  `... (finishing path) ...`  
  `M48` (Re-enable overrides for the next operation)

---

## `M50`, `M51`, `M53` – Feed, Spindle, Rapid Override Control

**Syntax:**  
> `M50` (turn feed override off)  
> `M51` (turn spindle speed override off)  
> `M53` (turn rapid override off)  

These commands provide granular control over enabling or disabling specific override functions (feed rate, spindle speed, rapid rate). This is in contrast to `M48`/`M49` which enable/disable all overrides simultaneously.


> ℹ️ **Info**
> - **Non-Modal:** These commands are executed immediately upon being read.
> - **Purpose:** Allow a G-code program to selectively prevent operator override of feed rate, spindle speed, or rapid rate for critical operations. This ensures predictable machine behavior.
> - **`M50` (Feed Override Off):** Disables the feed rate override. The machine will run at 100% of the programmed `F` value.
> - **`M51` (Spindle Speed Override Off):** Disables the spindle speed override. The spindle will run at 100% of the programmed `S` value.
> - **`M53` (Rapid Override Off):** Disables the rapid override. `G0` moves will execute at 100% of the configured maximum rapid rate.
> - **Re-enabling:** To re-enable these overrides, the corresponding `M48` command (Enable Overrides) would typically be used, or a specific override enable M-code if supported by a plugin. In a standard grblHAL configuration, `M48` re-enables all of them.
> - **Reference:** For more details, see the [LinuxCNC M-code documentation on M50-M53](https://linuxcnc.org/docs/2.5/html/gcode/m-code.html#sec:M50-Feed-Override).


| Command | Action |
|---------|--------|
| **`M50`** | Disable Feed Rate Override |
| **`M51`** | Disable Spindle Speed Override |
| **`M53`** | Disable Rapid Override |

#### Common Examples
* **Run a critical finishing pass with exact programmed feed and spindle speed:**  
  `M50 M51` (Disable feed and spindle overrides)  
  `G1 X100 F150 S5000 M3` (Ensures exact feed and speed)  
  `(Finishing path)`  
  `M48` (Re-enable all overrides)

* **Prevent rapid moves from being slowed down during a tool change sequence:**  
  `M53`  
  `G53 G0 X0 Y0 Z0` (Rapid moves will be at full speed)  
  `M48`

#### Tips & Tricks
- Use these commands sparingly and only when absolute control over speed or feed is required, as they limit operator intervention.
- Always remember to re-enable overrides with `M48` after the critical operation is complete.

---

## `M56` – Parking Motion Override

**Syntax:**  
> `M56 P-`  

This is a special grblHAL extension command used to enable or disable the controller's parking motion behavior. This command is only available when both the parking feature and this specific override option are enabled in the grblHAL firmware.


> ℹ️ **Info**
> - **Legacy Grbl Extension:** Originally a Grbl legacy extension for park override.
> - **grblHAL specific:** In grblHAL, `M56` with `P1` enables parking motion, while `P0` disables it.
> - **Requirements:** Requires grblHAL to be compiled with parking support and the `M56` override feature specifically enabled.
> - **Parking Motion:** Refers to the automatic movement of axes to a safe or designated "park" position, often configured for events like program pauses, spindle stops, or tool changes.


| Parameter | Description |
|-----------|-------------|
| **`P1`** | Enable parking motion. |
| **`P0`** | Disable parking motion. |

#### Example
* **Temporarily disable parking motion during a critical part of a program:**  
  `M56 P0` (Disable parking)  
  `(Critical cutting moves)`  
  `M56 P1` (Re-enable parking)

#### Tips & Tricks
- Use `M56` when you need to prevent the machine from automatically moving to a park position during operations where such a move would be undesirable or unsafe.
- Always re-enable parking motion when it's safe and beneficial, such as before tool changes or at program end.

---

## `M62`, `M63`, `M64` and  `M65` – Synchronized and Asynchronous I/O

**Syntax:**  
> `M62 P-` (sync output on)  
> `M63 P-` (sync output off)  
> `M64 P-` (async output on)  
> `M65 P-` (async output off)  

These are advanced commands for controlling digital output pins, either synchronized with motion or immediately.


> ℹ️ **Info**
> - **`P`**: The digital output pin number to control.
> - **`M62`/`M63` (Synchronized):** The output pin change is queued with motion commands. The pin will switch its state at the *exact moment* the next motion command begins. This is perfect for laser firing or triggering a camera.
> - **`M64`/`M65` (Asynchronous):** The output pin change happens immediately when the command is read, without waiting for motion. This is for general-purpose I/O.


| Command | Action | Timing |
|---------|--------|----------|
| **`M62 P`** | Turn Output `n` ON | Synchronized with next motion |
| **`M63 P`** | Turn Output `n` OFF | Synchronized with next motion |
| **`M64 P`** | Turn Output `n` ON | Immediate |
| **`M65 P`** | Turn Output `n` OFF | Immediate |

#### Synchronized Example (Laser Engraving)
* **Turn on the laser just as the cut starts, and turn it off just as it ends:**  
  `G0 X10 Y10` (Move to start position)  
  `M62 P1` (Queue "Laser ON" for output pin 1)  
  `G1 X20 F500` (Laser turns on at the start of this move)  
  `M63 P1` (Queue "Laser OFF")  
  `G0 X30` (Laser turns off at the start of this rapid move)

---



## `M66` – Wait for Input Signal

**Syntax:**  
> `M66 P- L- Q-`  

This command pauses program execution until a specified digital input pin changes state, or a timeout occurs. It is supported if auxiliary inputs (analog or digital) are available and configured.


> ℹ️ **Info**
> - **Non-Modal:** Executed when encountered.
> - **Requires Input:** This command is only functional if your grblHAL setup has auxiliary inputs (analog or digital) available and configured.
> - **Parameters:**
> - `P`: The digital input pin number to monitor.
> - `L`: The desired state to wait for (`L0` for low, `L1` for high).
> - `Q`: Optional. Timeout in seconds. If the state is not met within this time, an error is generated.


| Parameter | Description |
|-----------|-------------|
| **`P`** | Digital input pin number. |
| **`L0/1`** | Desired state: `0` (low) or `1` (high). |
| **`Q`** | Optional timeout in seconds. |

#### Example
* **Wait for a part sensor (connected to pin 2) to go high, with a 10-second timeout:**  
  `M66 P2 L1 Q10`  
  `(Program will pause here until pin 2 goes high or 10s passes)`

---

## `M67`, `M68` – Set Analog Output

**Syntax:**  
> `M67 P- Q-` (synchronized analog output)  
> `M68 P- Q-` (asynchronous analog output)  

These commands control analog output pins, either synchronized with motion or immediately. They are supported if analog outputs are available and configured.


> ℹ️ **Info**
> - **Non-Modal:** Executed when encountered.
> - **Requires Analog Output:** These commands are only functional if your grblHAL setup has auxiliary analog outputs available and configured.
> - **`P`**: The analog output pin number to control.
> - **`Q`**: The target analog value. Typically, `Q0` is minimum, and `Q255` (for 8-bit) or `Q1023` (for 10-bit) is maximum, depending on the DAC resolution.
> - **`M67` (Synchronized):** The analog output change is queued with motion commands. The output will switch its state at the *exact moment* the next motion command begins. This is useful for laser power control or material flow.
> - **`M68` (Asynchronous):** The analog output change happens immediately when the command is read, without waiting for motion. This is for general-purpose analog control.


| Command | Action | Timing |
|---------|--------|----------|
| **`M67 P Q`** | Set Analog Output `n` to `value` | Synchronized with next motion |
| **`M68 P Q`** | Set Analog Output `n` to `value` | Immediate |

#### Synchronized Example (Laser Power Control)
* **Set laser power (on analog output 0) just as the cut starts, and turn it off just as it ends:**  
  `G0 X10 Y10` (Move to start position)  
  `M67 P0 Q150` (Queue "Laser Power 150" for analog output 0)  
  `G1 X20 F500` (Laser power sets to 150 at the start of this move)  
  `M67 P0 Q0` (Queue "Laser Power OFF")  
  `G0 X30` (Laser turns off at the start of this rapid move)

---

## `M70`, `M71`, `M72`, `M73` – Modal State Save/Restore

**Syntax:**  
> `M70` (save state)  
> `M71` (invalidate state)  
> `M72` (restore state)  
> `M73` (save & auto-restore)  

These are powerful but advanced M-codes that allow the controller to save and restore its current modal state. This includes the active G-codes (like `G0`/`G1`, `G17`/`G18`, `G54`, `G90`/`G91`), feed rate, spindle speed, etc.


> ℹ️ **Info**
> - These are part of the grblHAL core but are considered advanced features.
> - They are extremely useful for writing "safe" subroutines or macros that can perform an action without permanently altering the machine's state from the main G-code program.
> - **`M70` (Save Modal State):** Pushes the current modal state onto a memory stack.
> - **`M71` (Invalidate Modal State):** Marks the saved state as invalid (less common).
> - **`M72` (Restore Modal State):** Pops the last saved state from the memory stack, restoring the machine to exactly how it was before the `M70` call.
> - **`M73` (Save and Auto-Restore):** A more advanced feature used for subprograms.


#### Example: A Safe Probing Macro
Imagine you have a macro to find the center of a hole. This macro needs to use `G91` (incremental mode) and `G1` with a specific feed rate. However, the main program might be running in `G90` with a different feed rate. Using `M70`/`M72` ensures the macro doesn't mess up the main program's state.

* **Macro G-code (`find_center.nc`):**  
  `M70` (Save the state of the main program)

  `G91 G1 F100` (Switch to incremental, set a slow feed rate for probing)  
  `(G-code for probing in X and Y to find the center...)`

  `M72` (Restore the original state. The machine is now back in G90/G91, G54, etc., with its original feed rate)


---

## `M98` – Subroutine Call

**Syntax:**
> `M98 P [L]`

Calls a subroutine.


> ℹ️ **Info**
> - **Internal vs External:** Behavior depends on setting `$700`.
> -   `$700=1` (Default): Scans the current file for `O sub` blocks. If found, executes internal subroutine. If not found, looks for external file `P.macro` (or named macro).
> -   `$700=0`: Always looks for external file `P.macro`.
> -   **Execution:**
> -   **Internal:** The program logic may perform a "check mode" pass to locate subroutines before running.
> -   **External:** Executes the file from the SD card/local file system.
> -   **Return:** Use `M99` to return from the subroutine.


---

## `M99` – Return from Subprogram

**Syntax:**  
> `M99 `

Marks the end of a subprogram and returns execution to the main program or the calling subroutine.


> ℹ️ **Info**
> - **Purpose:** This command is essential for controlling program flow when using subprograms.
> - **`G65` Calls:** `M99` is used to return from a `G65` subprogram call, restoring the modal state and returning to the line immediately after the `G65` call.
> - **`tc.macro`:** If your tool change (`M6`) logic is implemented as a macro (e.g., `tc.macro` or `P200.macro` for RapidChange ATC), `M99` is used at the end of that macro to return control to the main G-code program.
> - **Optional `P` word:** The optional `P` word is typically used to specify the line number within the calling program to return to, but its specific implementation can vary.


#### Example
* **Returning from a tool change macro:**  
  `(Inside tc.macro or P200.macro)`  
  `...`  
  `G53 G0 X-50 Y-50 Z-5` (Move to tool change position)  
  `M99` (Return to main program after tool change)

---



## `M220` – Set Feed Rate Override Percentage

**Syntax:**  
> `M220 S-`

Allows setting the feed rate override value programmatically from within G-code.


> ℹ️ **Info**
> - **Origin:** Marlin firmware.
> - This command provides a way to control the feed rate override slider/knob via code. `S` is typically used for the percentage value.


| Parameter | Description |
|-----------|-------------|
| **`S`** | The feed rate override percentage (e.g., `S100` for 100%, `S50` for 50%). |

#### Example
* **Slow down the next section of a program to 50% of the programmed feed rate:**  
  `M220 S50`  
  `(G-code for a detailed or difficult section)`
  `M220 S100` (Return to 100% feed rate)

---

## `M280` – Set Servo Position

**Syntax:**  
> `M280 P- S-`

Commands a servo motor connected to a specific output pin to move to a given position. This is often used for controlling auxiliary machine components like tool probes, dust shoes, or material clamps.


> ℹ️ **Info**
> - **Origin:** Marlin firmware.
> - Requires a servo plugin to be active in grblHAL.
> - The `P` word specifies the servo index (which pin it's connected to), and the `S` word specifies the position, typically in microseconds (e.g., 1000-2000µs) or degrees (0-180).


| Parameter | Description |
|-----------|-------------|
| **`P`** | The servo number/pin index to command. |
| **`S`** | The target position for the servo. |

#### Example
* **Deploy a touch probe connected to servo #0:**  
  `M280 P0 S90` (Move servo 0 to the 90-degree position)

* **Stow the touch probe:**  
  `M280 P0 S0` (Move servo 0 back to the 0-degree position)

---

## `M400` – Finish Moves

**Syntax:**  
> `M400`

Waits for all moves in the planner buffer to complete before processing the next command. It is functionally similar to a `G4 P0` (zero-second dwell).


> ℹ️ **Info**
> - **Origin:** Marlin / OpenPnP.
> - This command ensures the machine is completely stationary before the next G-code line is executed. This is useful when an external action needs to happen at a precise location, like taking a picture for a computer vision system.


#### Example
* **Move to a location, wait until stopped, then trigger an output:**  
  `G0 X50 Y50`  
  `M400` (Wait for the move to finish completely)  
  `M64 P1` (Immediately turn on output 1 to trigger a camera)

---

# Plugin-Specific G-codes & M-codes

This section provides a comprehensive list of G-code and M-code commands introduced or specifically extended by grblHAL's official plugins. These commands augment the core G-code and M-code functionality, enabling specialized features for various hardware and applications.

Also see [grblhal_docs/Reference/complete_plugin_reference](complete_plugin_reference)

---

## Plugin: Plasma / Torch Height Control (THC)
Repo: `https://github.com/grblHAL/Plugin_plasma`

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M62` | `M62 P[port]` | Disable THC, synchronized with motion |
| `M63` | `M63 P[port]` | Enable THC, synchronized with motion |
| `M64` | `M64 P[port]` | Disable THC, immediate |
| `M65` | `M65 P[port]` | Enable THC, immediate |
| `M67` | `M67 E[port] Q[percent]` | Immediate velocity reduction |
| `M68` | `M68 E[port] Q[percent]` | Velocity reduction synchronized |

---

## Plugin: Fan Control (`Plugin_fans`)
Repo: `https://github.com/grblHAL/Plugin_fans`

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M106` | `M106 P[fan] S[speed]` | Turn fan ON, set PWM speed (0–255) |
| `M107` | `M107 P[fan]` | Turn fan OFF |

---

## Plugin: RGB LED Strip - `Plugins_misc`
Repo: `https://github.com/grblHAL/Plugins_misc`

| Command | Syntax | Description |
|---------|--------|-------------|
| `M150` | `M150 [B] [I] [K] [P] [R] [S] [U] [W]` | Set LED color/brightness for a strip or individual LED. |

#### Parameters

*   **`B`**: Blue component intensity (0-255).
*   **`I`**: LED index for individual control (0-255). Available if the number of LEDs in the strip is > 1.
*   **`K`**: Keep unspecified values, meaning only the provided color/brightness components will be changed, others will retain their previous state.
*   **`P`**: Brightness (0-255).
*   **`R`**: Red component intensity (0-255).
*   **`S`**: Strip index (0 or 1). Default is 0.
*   **`U`**: Green component intensity (0-255).
*   **`W`**: White component intensity (0-255).

#### Example
```gcode
; Set strip 1 to bright red
M150 R255 U0 B0 S1

; Set strip 1 to purple
M150 R128 B128 S1

; Set strip 0 to 50% brightness (P127) for all LEDs
M150 P127 S0

; Set the third LED (index 2) on strip 0 to blue, keeping other colors
M150 I2 B255 K S0

; Turn all LEDs off
M150 R0 U0 B0 S1
```

---

## Plugin: Feed Override (`Plugins_misc`)
Repo: `https://github.com/grblHAL/Plugins_misc`

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M220` | `M220 [B] [R] [S[percent]]` | Feed override: B=backup, R=restore, S=set % |

---

## Plugin: Servo Control (`Plugins_misc`)
Repo: `https://github.com/grblHAL/Plugins_misc`

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M280` | `M280 P[servo] S[position]` | Control analog/PWM servo: P=index, S=angle 0–180° |

---

## Plugin: OpenPNP (`Plugin_OpenPNP`)
Repo: `https://github.com/grblHAL/Plugin_OpenPNP`

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M42` | `M42 P[ioport] S[0/1]` | Set digital output |
| `M204` | `M204 P[axes] S[accel]` | Set axis acceleration |
| `M205` | `M205 [axes]` | Set jerk |
| `M143` | `M143 P[port] Q[scale] R[offset]` | Read Analog/Digital input |
| `M144` | `M144 P[port]` | Read Digital input |
| `M145` | `M145 P[port] Q[scale] R[offset]` | Read Analog input |

---

## Plugin: Motor / Trinamic (`Plugins_motor`)
Repo: `https://github.com/grblHAL/Plugins_motor`

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M122` | `M122 [axes]` | Driver report/debug |
| `M569` | `M569 [axis] S[0/1]` | Set driver mode: StealthChop / SpreadCycle |
| `M906` | `M906 [axes] S[current]` | Set RMS current |
| `M911` | `M911` | Report prewarn flags |
| `M912` | `M912` | Clear prewarn flags |
| `M913` | `M913 [axes]` | Hybrid threshold |
| `M914` | `M914 [axes]` | Homing sensitivity |

---

## Plugin: Spindle (`Plugins_spindle`)
Repo: `https://github.com/grblHAL/Plugins_spindle`

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M104` | `M104 P[n]` | Select spindle |
| `M51` | `M51 [options]` | Enable spindle features (Plugin_spindle specific) |

---

## Plugin: Encoder (`Plugin_encoder`)
Repo: `https://github.com/grblHAL/Plugin_encoder`

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M114` | `M114` | Report current position (includes spindle encoder if available) |

---

## Plugin: Sienci ATCi

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M810` | `M810 P[0\|1]` | Runtime toggle for ATCi Keepout Zone enforcement. `P1` enables protection, `P0` disables it. |

---

# System Commands ($)

System commands are special real-time or near-real-time commands that start with `$`. They are used to configure, control, and query the machine state.

## Core Commands

| Command | Description |
|---------|-------------|
| **`$$`** | View current settings. |
| **`$#`** | View G-code parameters (WCS offsets, probe positions, tool offsets). |
| **`$G`** | View G-code parser state (active modes like G54, G17, G90, etc.). |
| **`$I`** | View build info string. |
| **`$N`** | View startup blocks. |
| **`$X`** | **Kill Alarm Lock.** Unlocks the machine from an alarm state (e.g., hard limit). Use with caution! |
| **`$H`** | **Run Homing Cycle.** Homes all axes specified in `$23`. |
| **`$HX`** | **Home Individual Axis.** Homes only the X axis (replace X with Y, Z, etc.). |
| **`$J=...`** | **Jogging.** Execute a jogging motion. |
| **`$SLP`** | **Sleep.** Put the machine to sleep. |

## Tool Change Extensions

These commands are specific to manual and semi-automatic tool change modes.

| Command | Description |
|---------|-------------|
| **`$TLR`** | **Set Tool Length Reference.** Sets the current tool length offset as the reference. Used after a successful probe for the first tool in a job. |
| **`$TPW`** | **Tool Probe Workpiece.** Initiates a probing sequence to set the dynamic tool offset for a new tool. Only available in Tool Change Modes 1 and 2. |

## Reporting & Enumeration (grblHAL Extensions)

grblHAL provides advanced reporting commands for Senders to query capabilities without hardcoded lists.

| Command | Description |
|---------|-------------|
| **`$EA`** | **Enumerate Alarms.** Lists all supported alarm codes and descriptions. |
| **`$EE`** | **Enumerate Errors.** Lists all supported error codes and descriptions. |
| **`$ES`** | **Enumerate Settings.** Lists all supported settings with types, ranges, and descriptions. |
| **`$EG`** | **Enumerate Setting Groups.** Lists the hierarchy of setting groups. |
| **`$pins`** | **Enumerate Pins.** Lists processor pin mappings. |
| **`$pinstate`** | **Enumerate Pin States.** Lists current state of auxiliary pins. |
| **`$ports`** | **Enumerate Serial Ports.** Lists available UART ports. |
| **`$SPINDLES`** | **Enumerate Spindles.** Lists available spindles. |

## File System Commands
(Updated Build 20260310)

These commands allow navigation and management of the SD card or internal LittleFS file system.

| Command | Description |
|---------|-------------|
| **`$F`** | **List Files.** Lists CNC-compatible files (`.nc`, `.gcode`, etc.) in the current working directory. |
| **`$F+`** | **List All Files.** Lists all files in the current working directory regardless of extension. |
| **`$F=[file]`** | **Run File.** Starts execution of the specified G-code file. |
| **`$CWD=[path]`** | **Change Directory.** Sets the Current Working Directory. Usage: `$CWD=/` (root), `$CWD=..` (up), `$CWD=subdir` (down). If called without arguments, it reports the current path. |
| **`$PWD`** | **Print Working Directory.** Reports the current working directory in the format `[CWD:/path/to/dir]`. |
| **`$FM`** | **Mount SD Card.** Manually triggers a mount of the SD card. |
| **`$FU`** | **Unmount SD Card.** Safely unmounts the SD card. |
| **`$FD=[file]`** | **Delete File.** Permanently removes a file from the storage. |

---

### Storage Systems in grblHAL
grblHAL for ESP32 utilizes a **Virtual File System (VFS)** layer that allows it to interact with different storage media through a unified set of commands.

#### SD Card (FatFs)
The SD card is the primary high-capacity storage for G-code files, typically formatted as **FAT32**.
- **Mount Point:** Usually mounted at the root (`/`).
- **Performance:** Ideal for large 3D carving jobs or complex laser engraving.
- **Hot-Swapping:** Supported on most ESP32 boards with a detect pin.

#### Internal Flash (LittleFS)
LittleFS is a fail-safe file system designed for microcontrollers, using the ESP32's internal flash memory.
- **Mount Point:** Often used as a fallback if no SD card is present, or mounted at a specific path like `/flash`.
- **Use Case:** Best for small macro files, tool tables (`tool.tbl`), and persistent system configuration.
- **Reliability:** Resistant to power loss during write operations.

#### Navigation & Usage
grblHAL keeps track of a **Current Working Directory (CWD)**. By default, this is the root `/`. When you use `$F` to list files or `$F=` to run one, grblHAL looks inside the CWD. You can navigate into subfolders using `$CWD=foldername` and back up using `$CWD=..`.

> [!TIP]
> You can use `$PWD` at any time to verify where you are in the file system. This is particularly useful when managing complex folder structures for different projects.

## Advanced System Commands

| Command | Description |
|---------|-------------|
| **`$REBOOT`** | **System Reboot.** Hard resets the controller. Connection will be lost. (Build 20251208) |
| **`$DFU`**    | **Enter Bootloader.** Reboots the controller into DFU/Bootloader mode for firmware flashing. Connection will be lost. |
| **`$MODBUSCMD`**| **Modbus Command.** Send raw Modbus commands. (Build 20260215) |
| **`$TTLOAD`** | **Reload Tool Table.** Reloads the tool table from storage. (Build 20251111) |


---
