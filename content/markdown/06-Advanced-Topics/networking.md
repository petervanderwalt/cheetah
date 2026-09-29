# Networking & Connectivity

grblHAL offers powerful networking capabilities that go beyond standard USB connections. Depending on your controller hardware (e.g., Teensy 4.1, ESP32, RP2040), you may have access to **Ethernet**, **Wi-Fi**, **Bluetooth**, and a dedicated **WebUI**.

This guide covers the setup and configuration for these advanced connectivity options.

---

## Ethernet

Ethernet provides a robust, interference-resistant connection ideal for production environments. It eliminates USB length limits and susceptibility to EMI (Electro-Magnetic Interference).

### Basic PC Setup (Direct Connection)
If you are connecting your PC directly to the controller (without a router/switch in between), you must configure a **Static IP** on your computer's network adapter.

> **Note:** These steps follow the [Sienci Labs SLB Ethernet Guide](https://sienci.zendesk.com/hc/en-us/articles/41759221954708-Ethernet-connection-SLB-and-SLB-EXT).

#### 1. Configure the Controller (Static IP)
First, connect via USB and configure grblHAL to use a Static IP address. This ensures the controller always has a known address.
*   **IP Mode:** Static
*   **IP Address:** e.g., `192.168.5.15`
*   **Gateway:** `192.168.5.1`
*   **Netmask:** `255.255.255.0`

*Check your specific board documentation for the exact `$` settings to configure IP parameters.*

#### 2. Configure Windows Network Adapter
1.  Connect the Ethernet cable between your PC and the controller.
2.  On Windows, search for **"View network connections"**.
3.  Right-click your **Ethernet** adapter (often "Ethernet 2" or similar) and select **Properties**.
4.  Select **Internet Protocol Version 4 (TCP/IPv4)** and click **Properties**.
5.  Select **"Use the following IP address"**:
    *   **IP address:** `192.168.5.5` (Must be different from the controller, but in the same range)
    *   **Subnet mask:** `255.255.255.0`
    *   **Default gateway:** Leave blank or use `192.168.5.1`.
6.  Click **OK** to save.

#### 3. Connect via G-Code Sender
*   Open your sender (e.g., **gSender**, **ioSender**).
*   Select **Ethernet/Network** as the connection type.
*   Enter the controller's IP address (`192.168.5.15`) and Port (usually `23`).
*   Click **Connect**.

---

## Wi-Fi

Wi-Fi allows for wireless control and is available on chips like the **ESP32** and **Raspberry Pi Pico W**. You can typically operate in two modes:

### 1. Station Mode (Recommended)
The controller connects to your existing home/workshop Wi-Fi network.
*   **Range:** limited by your router's signal.
*   **Access:** Any device on the network can control the machine.

**Configuration:**
You typically need to set the **SSID** (Network Name) and **Password** via USB first.
*   `$74=`
*   `$75=`
*   `$73=1` (Enable Wi-Fi / Station Mode)
*(Note: Setting numbers can vary by driver key. Use `$S` or `$P` to list available settings)*

### 2. Access Point (AP) Mode
The controller creates its own Wi-Fi network that you connect your PC to.
*   **Range:** Limited to the controller's antenna.
*   **Access:** Direct connection; no router needed.

---

## WebUI (`Plugin_WebUI`)

Many network-enabled grblHAL builds (especially ESP32, RP2040, and Teensy 4.1) include an embedded **Web User Interface**. This allows you to control the machine from any device with a browser (PC, Tablet, Smartphone) without installing software.

### Features
The WebUI is surprisingly powerful and includes:
*   **Dashboard:** real-time DRO (Digital Readout), Jogging, Homing, and Macro buttons.
*   **File Management:** Upload, delete, and **run G-code files** directly from the SD card.
*   **Console:** Send manually typed G-code commands and view the output log.
*   **Configuration:** Easy-to-use forms for changing grblHAL `$` settings without memorizing numbers.
*   **Tablet Mode:** A touch-friendly interface optimized for mounting a tablet on your machine.
*   **Camera Support:** View a stream from an ESP32-CAM or similar URL.

### Installation & Compatibility
*   **Build Option:** The WebUI must be enabled at compile time (or selected in the **[Web Builder](http://svn.io-engineering.com:8080/)**).
*   **File Storage:**
    *   **FlashFS (Recommended):** The WebUI files (`index.html.gz`, etc.) are compressed and stored in the controller's internal flash memory. This is faster and doesn't require an SD card for the UI itself.
    *   **SD Card:** On some older or memory-constrained builds, you may need to copy the `index.html.gz` file to the root of your SD card.

### Essential Settings
If the WebUI is active but you cannot connect, check these settings via USB:

| Setting | Description | Recommended Value |
| :--- | :--- | :--- |
| `$306` | **HTTP Port:** The port for the web server. | `80` |
| `$307` | **WebSocket Port:** The port for real-time data. | `81` |
| `$300` | **Hostname:** The network name of the device. | `grblhal` |
| `$70` | **Network Services:** Bitmask to enable services. | `15` (enables HTTP, Telnet, MDNS, etc.) |

### How to Access
1.  Connect your machine to Wi-Fi (see above) or Ethernet.
2.  Find the IP address (type `$I` in a serial terminal if you don't know it).
3.  Open a web browser on a device connected to the **same network**.
4.  Type `http://` (e.g., `http://192.168.1.50`).
    *   *Tip: If you set a hostname, you might be able to access it via `http://grblhal.local` depending on your network.*

---

## Bluetooth

Bluetooth allows for wireless serial communication, effectively replacing the USB cable with a wireless link. It is commonly used for wireless pendants or simple control apps.

### Setup & Pairing
1.  **Enable:** Bluetooth is usually enabled at compile-time (`BLUETOOTH_ENABLE`).
2.  **Pairing:**
    *   On your PC/Phone, scan for Bluetooth devices.
    *   Look for a device named `grblHAL` (or similar).
    *   Pair with it (default PIN is often `1234` or `0000`).
3.  **Connection:**
    *   Once paired, the OS assigns a **COM Port** (Windows) or device file (Linux/Mac).
    *   In your G-code sender, select this **COM Port** and the appropriate baud rate (Bluetooth often negotiates speed automatically, but try `115200`).

> **Tip:** Bluetooth can have higher latency than USB or Ethernet. It is great for pendants but less ideal for sending large, high-speed G-code files directly.
