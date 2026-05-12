# Firmware Flashing

This guide will walk you through the process of getting grblHAL firmware onto your controller board. There are two main approaches: using the **Web Builder** (recommended for most users) or **manual compilation** (for advanced users).

## Prerequisites

Before you begin, make sure you have:

1. **A compatible controller board** (see [Hardware Selection](./03-controller-support.md))
2. **A USB cable** to connect your board to your computer
3. **Basic knowledge** of your controller board model
4. **Drivers installed** for your board (if required by your OS)

> 💡 **Tip**
> If you're updating existing grblHAL firmware, **always backup your settings** first using `$$` command and saving the output. Some firmware updates may reset settings to defaults.

---

## Method 1: Web Builder (Recommended)

The **grblHAL Web Builder** is an online tool that generates pre-compiled firmware binaries customized to your specifications - no complex toolchain required!

### Step 1: Access the Web Builder

Navigate to the grblHAL Web Builder:
- **URL:** [https://svn.io-engineering.com:8443/](https://svn.io-engineering.com:8443/)

### Step 2: Configure Your Firmware

The Web Builder interface has several configuration sections:

#### **A. Select Driver**
Choose the driver that matches your board's microcontroller:
- **ESP32** - For ESP32-based boards (e.g., MKS DLC32, BlackBox X32, xPro V5)
- **STM32F4xx** - For STM32F4 boards (e.g., BlackPill, Fysetc S6, SuperLongBoard)
- **STM32H7xx** - For STM32H7 boards (e.g., BTT Octopus, BTT SKR 3)
- **RP2040** - For Raspberry Pi Pico-based boards (e.g., PicoCNC, BTT SKR Pico)
- **iMXRT1062** - For Teensy 4.x boards
- **LPC176x** - For LPC1768/1769 boards (e.g., BTT SKR V1.4 Turbo)
- **SAM3X8E** - For Arduino Due
- And more...

#### **B. Select Board**
After selecting the driver, choose your specific board from the dropdown. Examples:
- "BTT SKR Pico" (for RP2040 driver)
- "BlackBox X32" (for ESP32 driver)
- "Flexi-HAL" (for STM32F4xx driver)

#### **C. Select Plugins (Optional)**
Choose additional features you want to enable:

**General Plugins:**
- SD card support
- Keypad support
- Bluetooth
- EEPROM/FRAM support
- Spindle sync
- Laser coolant
- And more...

**Network/WebUI:**
- Wi-Fi (ESP32 boards)
- Ethernet (supported boards)
- WebUI interface
- Telnet/FTP support

**Advanced Features:**
- Odometer
- Fans control
- Tool length offset
- Custom plugins

> ⚠️ **Warning**
> Some 3rd party plugins may cause compilation failures. If the build fails, try removing recently added plugins.

#### **D. Bootloader Version (If Applicable)**
Some boards require a bootloader-compatible version for SD card updates or specific flashing methods. Check your board's documentation.

### Step 3: Generate and Download

1. Click **"Generate and download firmware"** button
2. Wait for the build to complete (usually 10-30 seconds)
3. A `.bin` file will download to your computer
4. Note the filename - it contains your configuration details

---

## Step 4: Flash the Firmware

The flashing method depends on your board type. Choose the appropriate method below:

### **Method A: STM32 Boards (DFU Mode)**

For boards like BlackPill, Nucleo, BTT SKR, Flexi-HAL:

#### **Option 1: JavaScript STM32 Flasher (No Installation Required)**

The easiest method - works directly in your web browser!

1. **Put board into DFU mode:**
   - Connect USB cable
   - Hold BOOT0 button (or set BOOT jumper)
   - Press and release RESET button
   - Release BOOT0 button
   - Board should now be in DFU mode

2. **Open the online flasher:**
   - Navigate to: [https://petervanderwalt.github.io/javascript-stm32-flasher/](https://petervanderwalt.github.io/javascript-stm32-flasher/)
   - Click "Connect" and select your STM32 device
   - Click "Choose File" and select your `.bin` file
   - Set flash address to `0x08000000` (or `0x08008000` for bootloader versions)
   - Click "Program" and wait for completion
   - Disconnect and reconnect USB

> 💡 **Tip**
> This tool requires a browser with WebUSB support (Chrome, Edge, or Opera). It won't work in Firefox or Safari.

#### **Option 2: STM32CubeProgrammer (Desktop Application)**

1. **Install STM32CubeProgrammer**
   - Download from [STMicroelectronics website](https://www.st.com/en/development-tools/stm32cubeprog.html)

2. **Put board into DFU mode** (same as Option 1)

3. **Flash using STM32CubeProgrammer:**
   - Open STM32CubeProgrammer
   - Select "USB" connection
   - Click "Connect"
   - Click "Open file" and select your `.bin` file
   - Set start address to `0x08000000` (or `0x08008000` for bootloader versions)
   - Click "Download"
   - Wait for completion
   - Disconnect and reconnect USB

#### **Option 3: dfu-util (Command Line)**

**Alternative: Using dfu-util (command line):**
```bash
dfu-util -a 0 -s 0x08000000:leave -D firmware.bin
```

### **Method B: ESP32 Boards**

For boards like MKS DLC32, BlackBox X32, xPro V5, TinyBee:

1. **Install esptool or ESP Flash Download Tool**
   - **esptool:** `pip install esptool`
   - **ESP Tool:** Download from [Espressif](https://www.espressif.com/en/support/download/other-tools)

2. **Flash using esptool:**
   ```bash
   esptool.py --chip esp32 --port COM3 --baud 921600 write_flash 0x10000 firmware.bin
   ```
   Replace `COM3` with your actual port.

3. **Or use ESP Flash Download Tool:**
   - Open the tool
   - Select ESP32
   - Add your `.bin` file at address `0x10000`
   - Select COM port and baud rate (921600)
   - Click "START"

### **Method C: RP2040 Boards (Pi Pico, BTT SKR Pico)**

1. **Put board into bootloader mode:**
   - Hold BOOTSEL button while connecting USB
   - Board appears as USB mass storage device "RPI-RP2"

2. **Copy firmware:**
   - Drag and drop the `.uf2` file (Web Builder generates this for RP2040)
   - Board will automatically reboot with new firmware

### **Method D: Teensy 4.x Boards**

1. **Install Teensy Loader:**
   - Download from [PJRC website](https://www.pjrc.com/teensy/loader.html)

2. **Flash firmware:**
   - Open Teensy Loader
   - Click "Open HEX File" and select your `.hex` file
   - Press the button on Teensy board
   - Firmware uploads automatically

### **Method E: Arduino Due (SAM3X8E)**

1. **Use Arduino IDE or bossac:**
   - Install Arduino IDE with Due support
   - Select "Arduino Due (Programming Port)"
   - Use "Upload" to flash the `.bin` file

2. **Or use bossac command line:**
   ```bash
   bossac -e -w -v -b firmware.bin -R
   ```

### **Method F: SD Card Update (Bootloader Versions)**

Some boards support firmware updates via SD card:

1. Rename firmware file to specific name (check board documentation)
2. Copy to root of FAT32-formatted SD card
3. Insert SD card into board
4. Power on - firmware updates automatically
5. Remove SD card after update completes

---

## Method 2: Manual Compilation (Advanced)

For developers or users who need custom modifications:

### Prerequisites

- **Git** installed
- **Appropriate toolchain** for your platform (varies by driver)

### Steps

1. **Navigate to the grblHAL drivers repository:**
   
   - **Drivers Repository:** [https://github.com/grblHAL/drivers](https://github.com/grblHAL/drivers)
   
   Common drivers include:
   - **STM32F4xx** - STM32F4 boards (BlackPill, Flexi-HAL, BTT SKR 2, etc.)
   - **STM32F7xx** - STM32F7 boards
   - **STM32H7xx** - STM32H7 boards (BTT Octopus, BTT SKR 3, etc.)
   - **ESP32** - ESP32-based boards (MKS DLC32, BlackBox X32, xPro V5, etc.)
   - **RP2040** - Raspberry Pi Pico-based boards (PicoCNC, BTT SKR Pico, etc.)
   - **iMXRT1062** - Teensy 4.x boards
   - **LPC176x** - LPC1768/1769 boards (BTT SKR V1.4 Turbo, etc.)
   - **SAM3X8E** - Arduino Due
   - And more...

2. **Click on your driver** to access its specific repository

3. **Follow the driver's README for complete build instructions**
   
   Each driver has unique requirements for:
   - Cloning and setup
   - Required toolchain installation
   - Build system (STM32CubeIDE, CMake, PlatformIO, ESP-IDF, Pico SDK, Arduino IDE, etc.)
   - Configuration options
   - Compilation commands
   - Plugin integration
   - Flashing methods

> ⚠️ **Warning**
> **Build processes vary significantly between drivers.** Always follow the README in your specific driver repository. Do not attempt to generalize build steps across different drivers.

---

## Verification

After flashing, verify your installation:

1. **Connect via USB** to your computer
2. **Open a serial terminal** (115200 baud, 8N1)
   - Use Arduino IDE Serial Monitor, PuTTY, or your G-code sender
3. **Send `$I` command**
   - You should see grblHAL version info and board name
4. **Send `$$` command**
   - You should see all settings

**Example response:**
```
[VER:2.1.3-beta.20250101:grblHAL driver for STM32F4xx]
[OPT:VL,15,128]
[NEWOPT:ENUMS,RT+,SED,TC,ETH]
[FIRMWARE:grblHAL]
[BOARD:Flexi-HAL]
```

---

## Troubleshooting

### Board Not Recognized

- **Check USB cable** (must be data cable, not charge-only)
- **Install drivers** (CH340, CP2102, or board-specific drivers)
- **Try different USB port**
- **Check Device Manager** (Windows) or `lsusb` (Linux) to see if device appears

### Flashing Fails

- **Verify correct driver/board selection** in Web Builder
- **Check DFU/bootloader mode** is properly entered
- **Try lower baud rate** for ESP32 (460800 instead of 921600)
- **Check start address** for STM32 (0x08000000 vs 0x08008000)
- **Disable antivirus** temporarily (can interfere with flashing tools)

### Board Boots but No Response

- **Check baud rate** (should be 115200)
- **Try different terminal program**
- **Send `Ctrl+X` (soft reset)** to wake up grblHAL
- **Check for correct COM port**

### Settings Reset After Update

- This is normal for major version updates
- **Restore from backup** using `$=` commands
- Or reconfigure manually using `$$` as reference

---

## Next Steps

Once firmware is successfully flashed:

1. **Configure your machine** - Set steps/mm, max rates, acceleration
2. **Test basic motion** - See [First Connection & Motion](./05-first-connection.md)
3. **Calibrate your machine** - Jump to [Machine Calibration](../03-Machine-Calibration/01-introduction.md)

---

## Additional Resources

- **grblHAL Wiki:** [https://github.com/grblHAL/core/wiki](https://github.com/grblHAL/core/wiki)
- **Web Builder:** [https://svn.io-engineering.com:8443/](https://svn.io-engineering.com:8443/)
- **Driver Repositories:** [https://github.com/grblHAL](https://github.com/grblHAL)
- **Community Forum:** [https://github.com/grblHAL/core/discussions](https://github.com/grblHAL/core/discussions)

