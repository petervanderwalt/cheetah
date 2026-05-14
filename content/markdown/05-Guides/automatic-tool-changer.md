# Tool Changes & Offsets

Changing tools mid-job allows you to use different end mills (e.g., roughing, finishing, v-carving) in a single project. grblHAL supports standard G-code tool change commands (`M6`) and length offsets (`G43`).

## The Basic Tool Change (`M6`)

By default, when grblHAL encounters an `M6 T` command:
1. It stops the spindle (`M5`).
2. It pauses the program (Feed Hold).
3. It waits for you to physically change the tool.
4. It waits for you to press **Cycle Start** to resume.

**The Problem:** The new tool is likely a different length than the old one. If you just resume, your Z-zero will be wrong, and you'll cut air or crash into the bed.

---

## Solving the Length Problem

You have two main strategies:

### **Strategy 1: Re-Zero Z (Simple)**
After changing the tool, you manually re-probe or re-zero the Z-axis to the top of the stock.
1. Job Pauses (`M6`).
2. Change Tool.
3. Jog to a clear spot.
4. Probe Z / Set Z Zero.
5. Resume Job.

**Pros:** Simple, works with any sender.
**Cons:** Risk of losing X/Y position if you move the machine too much; requires accessible stock surface.

### **Strategy 2: Tool Length Offsets (Professional)**
This method uses `G43` to compensate for the difference in length between tools.

**Concept:**
- **Reference Tool (T1):** The tool you set Z-zero with. Length Offset = 0.
- **New Tool (T2):** Longer or shorter than T1.
- **Offset (H2):** The difference in length.

**Workflow:**
1. **Measure T1:** Touch off T1 on a fixed sensor (tool setter). Store this position.
2. **Run Job with T1.**
3. **Change to T2.**
4. **Measure T2:** Touch off T2 on the *same* fixed sensor.
5. **Calculate Difference:** `Offset = T2_Position - T1_Position`.
6. **Apply Offset:** `G43 H2` automatically adjusts Z.

---

## Configuring grblHAL for Tool Changes

You typically handle tool changes via your **Sender Software** (ioSender, UGS, etc.) using macros.

### **Example Macro: Semi-Auto Tool Change**

A typical macro for a machine with a fixed tool setter:

```gcode
; --- Tool Change Detected ---
M5              ; Stop Spindle
G53 G0 Z0       ; Lift Z to safe height
G53 G0 X0 Y0    ; Move to tool change position (front-left)
M0              ; Pause for user to change tool

; --- User Changes Tool & Presses Start ---
G53 G0 X200 Y200 ; Move to Tool Setter location
G38.2 Z-100 F300 ; Fast probe down
G91 G0 Z2       ; Retract 2mm
G38.2 Z-5 F50   ; Slow probe for accuracy
G10 L20 P1 Z... ; Update Z offset (Logic depends on sender script)
G53 G0 Z0       ; Retract safely
```

**Note:** Advanced senders like **ioSender** have built-in "Tool Change" tabs where you simply enter the position of your tool setter, and it handles the math automatically.

### **Settings Used**
- **`$341`**: Tool Change Mode (if enabled in firmware).
- **`$342`**: Tool Change Probing Distance.
- **`$343`**: Tool Change Locate Feed Rate.

---

## Automatic Tool Changers (ATC)

For machines with an automatic spindle (ISO20/30, BT30) and a tool rack:
1. **Requires specialized hardware** (pneumatic drawbar, tool forks, sensors).
2. **Requires Macros:** Custom M6 macros to handle the pick-and-place logic.
3. **Requires I/O:** Inputs/Outputs for Drawbar Open/Close, Dust Shoe Open/Close.

grblHAL is fully capable of driving ATCs, but it requires compiling a custom build with the **ATC Plugin** or writing complex macros.

**Relevant Settings:**
- **`$675`**: Macro ATC Options (Enable `M6 T0`, enforce `tc.macro` presence).
- **`$683`**: ATCi Configuration (Rack monitoring and keepout zones).
---

## Best Practices
1. **Always use a "Safe Z" height** before moving to the tool change position.
2. **Clean the collet** every change. Dust adds runout.
3. **Measure twice.** If using offsets, verify the first tool change carefully.

---

**Next:** Explore specialized spindle and laser capabilities: [Spindles & Lasers Setup](./spindles-and-lasers.md)
