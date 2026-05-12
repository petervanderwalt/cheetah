---
title: "Hardware Selection"
---

# Controller Support

This page provides a list of grblHAL-supported controllers, links to the appropriate drivers, and the Web Builer tool for building the firmware

| Controller | Product Image | Driver | WebBuilder |
| :--- | :--- | :--- | :--- |
| [6-Pack CNC Controller](https://github.com/bdring/6-Pack_CNC_Controller) | ![](/images/controllers/6pack.jpg) | [ESP32](https://github.com/grblHAL/ESP32) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=ESP32&board=BDRING%206-axis%20I2S) |
| [Arduino CNC shield](https://www.arduino.cc/en/Main/ArduinoMotorShieldR3) with [Arduino Due](https://store.arduino.cc/arduino-due) | ![](/images/controllers/arduinocncshield.webp) | [SAM3X8E](https://github.com/grblHAL/SAM3X8E) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=SAM3X8E&board=Arduino%20Due) |
| [Arduino Due](https://store.arduino.cc/arduino-due) | ![](/images/controllers/due.webp) | [SAM3X8E](https://github.com/grblHAL/SAM3X8E) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=SAM3X8E&board=cmgrath%20v3) |
| [Bigtreetech Octopus MAX EZ](https://github.com/bigtreetech/Octopus-Max-EZ) | ![](/images/controllers/octopus_max_ez.webp) | [STM32H7xx](https://github.com/grblHAL/STM32H7xx) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=STM32H7xx&board=BTT%20Octopus%20MAX%20EZ) |
| [Bigtreetech Octopus MAX EZ](https://github.com/bigtreetech/Octopus-Max-EZ) | ![](/images/controllers/octopus.webp) | [STM32H7xx](https://github.com/grblHAL/STM32H7xx) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=STM32H7xx&board=BTT%20Octopus) |
| [Bigtreetech Rodent](https://github.com/bigtreetech/Rodent) | ![](/images/controllers/rodent.webp) | [STM32H7xx](https://github.com/grblHAL/STM32H7xx) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=STM32H7xx&board=BTT%20Rodent) |
| [Bigtreetech Scylla](https://github.com/bigtreetech/Scylla) | ![](/images/controllers/schylla.webp) | [STM32F4xx](https://github.com/grblHAL/STM32F4xx) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=STM32F4xx&board=BTT%20Scylla) |
| [Bigtreetech SKR 3](https://biqu.equipment/products/bigtreetech-btt-skr-3-control-board-for-3d-printer) | ![](/images/controllers/bttskr3.webp) | [STM32H7xx](https://github.com/grblHAL/STM32H7xx) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=STM32H7xx&board=BTT%20SKR%203) |
| [Bigtreetech SKR PICO](https://biqu.equipment/products/btt-skr-pico-v1-0) | ![](/images/controllers/pico.webp) | [RP2040](https://github.com/grblHAL/RP2040) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=RP2040&board=BTT%20SKR%20Pico) |
| [Bigtreetech SKR V1.4 Turbo](https://www.biqu.equipment/products/btt-skr-v1-4-skr-v1-4-turbo-32-bit-control-board) | ![](/images/controllers/skr1.4.webp) | [LPC176x](https://github.com/grblHAL/LPC176x) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=LPC176x&board=BTT%20SKR%20V1.4%20Turbo) |
| [EK-TM4C123GXL LaunchPad](https://www.ti.com/tool/EK-TM4C123GXL) | ![](/images/controllers/TM4C123G.png) | [TM4C123](https://github.com/grblHAL/TM4C123) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=TM4C123&board=TI%20EK-TM4C123GXL) |
| [Expatria Technologies PicoBOB G540](https://github.com/Expatria-Technologies/PicoBOB) | ![](/images/controllers/picobob.webp) | [RP2040](https://github.com/grblHAL/RP2040) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=RP2040&board=PicoBOB_G540) |
| [Flexi-HAL](https://github.com/Expatria-Technologies/Flexi-HAL) | ![](/images/controllers/flexihal.webp) | [STM32F4xx](https://github.com/grblHAL/STM32F4xx) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=STM32F4xx&board=Flexi-HAL) |
| [Fysetc E4](https://www.fysetc.com/products/fysetc-e4-board-with-built-in-wi-fi-and-bluetooth-4-pcs-tmc2209-240mhz-16m-flash-3d-printer-control-board) | ![](/images/controllers/fysetce4.png) | [ESP32](https://github.com/grblHAL/ESP32) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=ESP32&board=Fysetc%20E4%20V1.0) |
| [Fysetc S6 V2](https://wiki.fysetc.com/FYSETC_S6/) | ![](/images/controllers/fysetcs6.webp) | [STM32F4xx](https://github.com/grblHAL/STM32F4xx) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=STM32F4xx&board=Fysetc%20S6%20V2.0) |
| [Makerbase MKS-DLC32](https://github.com/makerbase-mks/MKS-DLC32) | ![](/images/controllers/dlc32.png) | [ESP32](https://github.com/grblHAL/ESP32) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=ESP32&board=MKS%20DLC32%20V2.0) |
| [Makerbase MKS-TinyBee](https://github.com/makerbase-mks/MKS-TinyBee) | ![](/images/controllers/tinybee.jpg) | [ESP32](https://github.com/grblHAL/ESP32) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=ESP32&board=MKS%20TinyBee%20V1.0) |
| [Makerbase MKS SBASE V1.3](https://github.com/makerbase-mks/MKS-SBASE) | ![](/images/controllers/MKS-SBASE-V1.3.jpg) | [LPC176x](https://github.com/grblHAL/LPC176x) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=LPC176x&board=MKS%20SBASE%20V1.3) |
| [MSP430F5529 LaunchPad](https://www.ti.com/tool/MSP-EXP430F5529LP) | ![](/images/controllers/MSP430F5529 LaunchPad.png) | [MSP430F5529](https://github.com/grblHAL/MSP430F5529) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=MSP430F5529&board=TI%20MSP430F5529LP) |
| [OpenBuilds BlackBox X32](https://openbuildspartstore.com/blackbox-motion-control-system-x32/) | ![](/images/controllers/blackboxx32.jpg) | [ESP32](https://github.com/grblHAL/ESP32) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=ESP32&board=BlackBox%20X32) |
| [Pi Pico on PicoCNC](https://github.com/phil-barrett/PicoCNC) | ![](/images/controllers/picocnc.jpg) | [RP2040](https://github.com/grblHAL/RP2040) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=RP2040&board=PicoCNC) |
| [Smoothieboard](https://smoothieware.org/smoothieboard) | ![](/images/controllers/smoothieboard.jpg) | [LPC176x](https://github.com/grblHAL/LPC176x) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=LPC176x&board=Smoothieboard) |
| [Spark Concepts xPro V5](https://www.spark-concepts.com/cnc-xpro-v5/) | ![](/images/controllers/xprov5.webp) | [ESP32](https://github.com/grblHAL/ESP32) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=ESP32&board=xPro%20V5) |
| [WeAct Blackpill](https://github.com/WeActTC/MiniSTM32F4x1) | ![](/images/controllers/blackpill.jpg) | [STM32F4xx](https://github.com/grblHAL/STM32F4xx) | [WebBuilder](https://svn.io-engineering.com:8443/?driver=STM32F4xx&board=WeAct%20Blackpill%20Minimal) |
