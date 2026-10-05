# ESP32 Firmware Specification
## BalizaBT Beacon Tag & Gateway

**Document:** ESP32-FW-SPEC-001  
**Version:** 1.0  
**Date:** 2026-10-05

---

## 1. Overview

### 1.1 Supported Hardware Platforms
| Chip | BLE Version | CPU | Flash | RAM | Ideal Use |
|------|-------------|-----|-------|-----|-----------|
| ESP32-C3 | BLE 5.0 | 32-bit RISC-V (160MHz) | 4MB | 400KB | Beacon Tag (low power) |
| ESP32-S3 | BLE 5.0 | Dual-core Xtensa (240MHz) | 8MB | 520KB | Gateway (WiFi) |
| ESP32-C6 | BLE 5.3 | 32-bit RISC-V (160MHz) | 4MB | 320KB | AoA Tag, Matter Controller |
| ESP32-H2 | BLE 5.2 | 32-bit RISC-V (160MHz) | 4MB | 320KB | Zigbee/Matter Coordinator |

### 1.2 Use Cases
- **Beacon Tag (Anti-Loss / Asset Tracking):** ESP32-C3/C6, battery-powered, 1–3 year life
- **Gateway (Fixed Scanner):** ESP32-S3, PoE/wired, continuous scan
- **Portable Scanner:** ESP32-S3, battery, for spot-checks
- **AoA Locator:** ESP32-C6, 4-antenna array, sub-meter positioning

---

## 2. Beacon Tag Firmware (Anti-Loss)

### 2.1 Hardware Requirements
```
ESP32-C3 Module (ESP-12C3 / ESP-C3-12F):
  - 3.3V regulator (AMS1117-3.3 or AP2112)
  - CR2032 battery holder + boost converter (B02S03C) or LiPo (MCP73831)
  - 3mm LED (status/alert)
  - 100nF + 10µF decoupling caps
  - Optional: LIS3DH accelerometer (motion wake)
  - Optional: DS18B20 temperature sensor

BOM Cost: $1.80/unit @ 1K
```

### 2.2 Firmware Architecture
```cpp
// main.cpp
#include <BLEDevice.h>
#include <BLEAdvertising.h>
#include <BLEUtils.h>

// Configuration (stored in NVS)
struct Config {
  char deviceName[32];    // "Asset-001"
  uint8_t txPower;        // 0, -6, -12, -18 dBm
  uint16_t advInterval;   // ms (default: 1000)
  uint8_t minRssi;        // Below this → "lost" (default: -90)
  bool buttonAlert;       // Button press → high-power beacon
  bool motionWake;        // Accelerometer → wake from deep sleep
  uint16_t batteryCheckInterval; // minutes
};

// Task Scheduler
enum TaskId {
  TASK_ADVERTISE,
  TASK_BATTERY_CHECK,
  TASK_BUTTON_CHECK,
  TASK_MOTION_CHECK,
  TASK_OTA_CHECK,
};

// State Machine
enum BeaconState {
  STATE_SLEEP,         // Deep sleep (10µA)
  STATE_IDLE,          // Normal advertise (0.5mA avg)
  STATE_ALERT,         // Button/motion alert (2mA avg)
  STATE_CRITICAL,      // Battery < 2.5V, low duty cycle
  STATE_OTA,          // Firmware update mode
};
```

### 2.3 BLE Advertising (iBeacon + Eddystone-UID)
```cpp
// Manufacturer Data (Apple iBeacon compatible)
// Byte layout:
// [0-1] Company Identifier (0x004C = Apple)
// [2]   Beacon Type (0x02 = iBeacon)
// [3]   Data Length (0x15 = 21 bytes)
// [4-19] Proximity UUID (16 bytes)
// [20-21] Major (2 bytes) — Floor/Area
// [22-23] Minor (2 bytes) — Rack ID
// [24]   TX Power at 1m (-59 = 0xC5 as signed)
// [25]   Battery Level (0-100%)
// [26]   Firmware Version (0-255 = 1.0-2.55)
// [27]   Alert Flag (0=normal, 1=button, 2=motion, 3=critical)
// [28]   Reserved (0xFF)

void advertiseBeacon() {
  BLEAdvertising* adv = BLEDevice::getAdvertising();
  adv->setManufacturerData(buildManufacturerData());
  adv->setScanResponse(true);
  adv->start(sizeof(ibeacon_data), ibeacon_data, false);
}
```

### 2.4 Power Management
| Mode | Avg Current | Duration | Notes |
|------|-------------|----------|-------|
| Deep Sleep (motion off) | 8–12 µA | Forever | Wake on ext interrupt |
| Deep Sleep (motion on) | 10–15 µA | Forever | Accelerometer IRQ |
| Advertising (1s interval) | 450 µA | Continuous | ~85% duty cycle |
| Advertising (10s interval) | 45 µA | Continuous | Power save mode |
| Button Alert (100ms) | 8 mA burst | 1s | Then back to normal |

### 2.5 Battery Life Estimation
```
Battery: CR2032 (220 mAh usable)

Normal mode (1s adv interval, 3.3V → 1.8V cutoff):
  220 mAh / 0.45 mA = 488 hours = ~20 days

Power-save mode (10s adv interval):
  220 mAh / 0.045 mA = 4,888 hours = ~204 days

With motion wake (90% sleep):
  220 mAh / 0.05 mA = 4,400 hours = ~183 days

With LiPo 150 mAh (rechargeable):
  Normal: 150/0.45 = 138 days
  Power-save: 150/0.045 = 3.4 years (!)
```

### 2.6 Button Alert Protocol
1. Hold button ≥ 3 seconds → Enter Alert Mode
2. Switch to 100ms advertising interval (high visibility)
3. Set Alert Flag in manufacturer data
4. Blink LED rapidly (100ms on/off)
5. After 1 hour or second button press → back to normal

---

## 3. Gateway Firmware (Fixed Scanner)

### 3.1 Hardware Requirements
```
ESP32-S3-WROOM-1 Module:
  - USB-C power (5V/1A)
  - Ethernet PHY (LAN8720 or internal EMAC for S3)
  - Optional PoE (Adafruit PoE Framer + magjack)
  - Status LEDs (Power, WiFi, BLE, MQTT)
  - IP65 enclosure (wall/pole mount)
```

### 3.2 Firmware Architecture
```cpp
// scanner.cpp
class BLEGateway {
public:
  void initWiFi(const char* ssid, const char* password);
  void initMQTT(const char* broker, const char* clientId);
  void startScan();
  void stopScan();
  void broadcastPosition(float x, float y, float z);
  void sendTelemetry(const std::string& payload);
  
private:
  WiFiClient wifiClient;
  PubSubClient mqtt;
  BLEScan* scanner;
  TaskHandle_t scanTask;
  TaskHandle_t mqttTask;
  
  // Position (calibrated)
  float x, y, z;
  int floor;
  char buildingId[32];
};

// Scan cycle: 30s scan → 5s rest → 30s scan...
void scanTask(void* param) {
  BLEGateway* gw = (BLEGateway*)param;
  while(1) {
    gw->startScan();
    vTaskDelay(30000 / portTICK_PERIOD_MS);
    gw->stopScan();
    vTaskDelay(5000 / portTICK_PERIOD_MS);
  }
}
```

### 3.3 MQTT Protocol
```json
{
  "gateway": "AA:BB:CC:DD:DD:00",
  "timestamp": 1727948400,
  "floor": 1,
  "building": "Warehouse-A",
  "position": {"x": 12.5, "y": 34.2, "z": 0.0},
  "devices": [
    {"mac": "11:22:33:44:55:66", "rssi": -65, "name": "Asset-001"},
    {"mac": "AA:BB:CC:DD:EE:01", "rssi": -48, "name": "Forklift-02"}
  ]
}
```

**Topics:**
- `baliza/gateway/{gateway_id}/heartbeat` — LWT, online/offline
- `baliza/gateway/{gateway_id}/scan` — Scan results
- `baliza/devices/{device_mac}/position` — Processed positions
- `baliza/devices/{device_mac}/alert` — Loss/motion alerts
- `baliza/config/gateway/{gateway_id}` — Remote config updates

### 3.4 WiFi Fallback / Dual Mode
```cpp
// If Ethernet fails → WiFi AP mode
// Gateway starts its own AP → mobile app configures WiFi
// Credentials stored in NVS
```

---

## 4. OTA (Over-the-Air Updates)

### 4.1 OTA Protocol
- **HTTPS server** — Serve signed firmware images
- **Signature** — Ed25519, public key in bootloader
- **Rollback prevention** — Version check, anti-rollback counter
- **Atomic update** — Two app slots (OTA_0, OTA_1)

### 4.2 Update Flow
```
1. Gateway checks manifest (HTTPS)
2. Compares version → newer available?
3. Downloads image (HTTPS, chunked, resume)
4. Verifies signature (Ed25519)
5. Writes to inactive OTA slot
6. Sets boot partition
7. Restarts → verify boot → mark as "seen"
8. If boot fails 3x → rollback
9. Notify cloud: firmware_version="1.2.3"
```

---

## 5. Configuration & Calibration

### 5.1 Initial Setup (BLE Config Mode)
1. Hold button 5s → Enter Config Mode (blinking LED, open AP)
2. Connect to WiFi `BalizaBT-Setup-XXXX`
3. Connect to `http://192.168.4.1`
4. Select WiFi, enter gateway position (map click or manual)
5. Choose scan interval, MQTT broker URL
6. Save → Reboot as gateway

### 5.2 RSSI Calibration
```
calibrate_rssi(device_mac, known_distance_meters, rssi_at_1m):
  // Measure at 1 meter, 3 meters, 5 meters
  // Fit log-distance path loss model
  // Store n (path loss exponent), txPower in device metadata
```

### 5.3 Zone Calibration
- Walk through each zone with a calibrated tag
- Gateway records RSSI vectors
- Build fingerprint map
- Store zone mapping for quick lookup

---

## 6. Firmware Development Guide

### 6.1 Toolchain
```bash
# Install ESP-IDF v5.x
pip install -r $HOME/esp/esp-idf/requirements.txt
. $HOME/esp/esp-idf/export.sh

# Or use Arduino CLI (simpler)
arduino-cli core install espressif:esp32
```

### 6.2 Project Structure
```
firmware/
├── beacon_tag/                    # ESP32-C3/C6
│   ├── src/
│   │   ├── main.cpp
│   │   ├── advertising.cpp
│   │   ├── power_mgr.cpp
│   │   ├── button.cpp
│   │   ├── config.cpp
│   │   └── ota.cpp
│   ├── include/
│   │   ├── config.h
│   │   ├── advertising.h
│   │   └── power_mgr.h
│   └── platformio.ini
│
├── gateway/                       # ESP32-S3
│   ├── src/
│   │   ├── main.cpp
│   │   ├── ble_scanner.cpp
│   │   ├── wifi_mgr.cpp
│   │   ├── mqtt_client.cpp
│   │   └── ota.cpp
│   ├── include/
│   └── platformio.ini
│
└── common/
    ├── ble_parser.cpp             # Shared
    ├── telemetry.cpp
    └── utils.cpp
```

### 6.3 Key Library Dependencies
| Library | Purpose | License |
|---------|---------|---------|
| `espressif/arduino-esp32` | Core framework | Apache-2.0 |
| `bblanchon/arduino-json` | JSON serialization | MIT |
| `knolleary/pubsubclient` | MQTT client | BSD-3 |
| `adafruit/Adafruit_LIS3DH` | Accelerometer | MIT |
| `espressif/esp-secure-cert-mgr` | TLS certificates | Apache-2.0 |

---

## 7. Testing & Validation

### 7.1 Automated Tests
```cpp
// tests/test_advertising.cpp
TEST_CASE("Beacon data format correct") {
  auto data = buildManufacturerData({
    .uuid = {0x12, 0x34, ...},
    .major = 0x0001,
    .minor = 0x0002,
    .txPower = -59,
    .battery = 85
  });
  REQUIRE(data[0] == 0x4C);  // Apple CoID LSB
  REQUIRE(data[1] == 0x00);  // Apple CoID MSB
  REQUIRE(data[2] == 0x02);  // iBeacon type
  REQUIRE(data[3] == 0x15);  // Length
}
```

### 7.2 RF Validation
- **Range test:** 30m line-of-sight, 10m obstructed
- **Battery drain log:** 6-month accelerated aging
- **Interference:** 2.4GHz WiFi co-channel impact

### 7.3 Field Validation
- **Warehouse:** 50 tags × 10 gateways × 1 week
- **Office:** 100 tags × 5 gateways × 2 weeks
- **Home:** 10 tags × 1 gateway × 1 month

---

*End of ESP32 Specification*