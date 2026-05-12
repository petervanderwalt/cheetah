# Creating Vendor Profiles

The **[grblHAL Web Builder](http://svn.io-engineering.com:8080/)** allows vendors to provide pre-configured firmware options for their machines. This guide details how to create and host your own machine profiles.

## Overview

To list your machines in the Web Builder, you need to:
1.  **Host a Repository:** Create a public GitHub repository to store your profiles.
2.  **Create Profile Files:** Create JSON files defining the configuration for each machine.
3.  **Create an Index:** Create a `profiles.json` file that lists your available machines.
4.  **Register:** Submit your repository to be added to the Web Builder's main list.

---

## 1. Directory Structure

We recommend a structure similar to the [Sienci Labs profiles](https://github.com/Sienci-Labs/grblhal-profiles):

```text
my-grblhal-profiles/
├── profiles.json        # Main index file
└── profiles/            # Folder containing individual machine configurations
    ├── my-router.json
    └── my-lathe.json
```

### Reference Implementation
**Sienci Labs** maintains a comprehensive repository of profiles for their machines (LongMill, AltMill) and generic configurations. You can use their repository as a template or reference for structuring your own files.

*   **GitHub Repository:** [Sienci-Labs/grblhal-profiles](https://github.com/Sienci-Labs/grblhal-profiles)


---

## 2. The Index File (`profiles.json`)

This file tells the Web Builder which machines you offer. It must be located at the root of your repository.

**Example `profiles.json`:**
```json
{
  "machines": [
    {
      "name": "My CNC Router 3018",
      "profileURL": "https://github.com/YourOrg/grblhal-profiles/blob/main/profiles/router3018.json",
      "URL": "https://your-website.com/product/router3018",
      "type": "router",
      "description": "A beginner-friendly desktop CNC router."
    },
    {
      "name": "Pro Lathe X1",
      "profileURL": "https://github.com/YourOrg/grblhal-profiles/blob/main/profiles/lathe_x1.json",
      "URL": "https://your-website.com/product/lathe-x1",
      "type": "lathe",
      "description": "High-precision turning center."
    }
  ]
}
```

*   **profileURL:** The link to the individual JSON file (the builder will automatically convert this to a raw link).
*   **URL:** A link to your product page (optional).

---

## 3. Machine Profile JSON

Each machine file (e.g., `profiles/router3018.json`) defines the specific settings and compile-time options. It supports a base configuration and multiple "variants".

**Structure:**
```json
{
  "machine": {
    "default_driver": "STM32F4xx",
    "default_board": "BOARD_MY_CUSTOM_V1",
    "default_symbols": {
      "NETWORKING_ENABLE": 1,
      "SDCARD_ENABLE": 1
    },
    "setting_defaults": {
      "DEFAULT_X_STEPS_PER_MM": 200,
      "DEFAULT_X_MAX_RATE": 5000
    }
  },
  "variants": [
    {
      "name": "Standard (3-Axis)",
      "default_symbols": { "N_AXIS": 3 }
    },
    {
      "name": "Pro (4-Axis)",
      "default_symbols": { "N_AXIS": 4 },
      "setting_defaults": { "DEFAULT_A_STEPS_PER_MM": 8.88 }
    }
  ]
}
```

### Symbols vs. Defaults

It is crucial to understand the difference between **Symbols** and **Defaults**:

#### **Symbols (`default_symbols`)**
These correspond to **Compile-Time options** (C Preprocessor `#define`). They determine *what features are built into the firmware*.
*   **Examples:** Enabling Wi-Fi, changing the number of axes, enabling specific plugins (Trinamic drivers, WebUI).
*   **Impact:** Changing these requires re-compiling the firmware.
*   **Lookup:** These are the names found in `my_machine.h` or usually prefixed with `ENABLE_` in the code.
*   **Web Builder UI:** These symbols control which checkboxes and dropdowns are selected in the Web Builder interface.

#### **Defaults (`setting_defaults`)**
These correspond to **Runtime Settings** (EEPROM values). They set the *default values* for `$` settings (like Steps/mm), so the user doesn't have to manually configure them after flashing.
*   **Examples:** Steps per mm (`$100`), Max Velocity (`$110`), Pulse microseconds (`$0`).
*   **Impact:** These values are loaded into the specific controller's defaults.
*   **Lookup:**
    *   **Standard Settings (`$`...):** Look for `#define` names in [config.h](https://github.com/grblHAL/core/blob/master/config.h) (e.g., `DEFAULT_X_STEPS_PER_MM`).
    *   **Driver Settings (`$301`...):** Look for names in [driver_opts.h](https://github.com/grblHAL/core/blob/master/driver_opts.h).

---

## 4. Testing Your Profiles

You can test your profiles using the development version of the Web Builder before submitting them.

1.  Push your changes to your GitHub repository.
2.  Go to the **[Web Builder (Dev Version)](https://svn.io-engineering.com:8443/index2.html?dev=1)**.
3.  Open the browser console (F12).
4.  You may need to manually invoke the loading function or use a URL parameter if supported (check `index2.js` logic for `vendor` parameters). *Note: The easiest way is currently to examine how `drivers.json` loads vendors and simulate that process or request a test add.*

## 5. Publishing

Once your profiles are ready, you can request to be added to the official `drivers.json` file used by the Web Builder. This is typically done by contacting the grblHAL maintainers or submitting a Pull Request to the repository hosting the Web Builder configuration.
