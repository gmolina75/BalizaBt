# Software Design Document (SDD)
## BalizaBT — Bluetooth LE Positioning & Asset Tracking Platform

**Version:** 1.0  
**Date:** 2026-10-05  
**Author:** devMaster  
**Status:** Production Ready (Simulation Mode) / Hardware Ready (WSL2/Linux)

---

## 1. System Overview

### 1.1 Purpose
BalizaBT is a **Bluetooth Low Energy (BLE) positioning and asset tracking platform** designed for:
- **Indoor positioning** of assets, people, and devices in warehouses, factories, offices, homes
- **Real-time proximity detection** with sub-meter accuracy using RSSI trilateration
- **Asset anti-loss/anti-theft** with ESP32-based beacon tags
- **Personnel tracking** for safety, occupancy, and workflow optimization
- **Temporal analytics** — historical heatmaps, dwell time, movement patterns

### 1.2 Scope
| Domain | Coverage |
|--------|----------|
| **Hardware** | ESP32 beacons (iBeacon/Eddystone), ESP32 gateways, smartphones, BLE tags |
| **Software** | Scanner (Noble), SQLite persistence, Temporal analyzer, REST API (planned), Web dashboard (planned) |
| **Deployment** | Windows (simulation), Linux/WSL2/Docker (production), ESP32 firmware (Arduino/ESP-IDF) |
| **Scale** | 100s of beacons, 1000s of sightings/hour, multi-floor, multi-building |

### 1.3 Key Differentiators
- **Zero-config simulation mode** — runs on Windows without hardware for demos/dev
- **Temporal mass analysis** — builds time-series "mass" of all BLE presence with user annotations
- **Pattern detection engine** — auto-discovers recurring assets, new arrivals, manufacturer clusters
- **ESP32-first design** — native firmware for anti-loss tags, gateway relays, battery optimization
- **Offline-first** — SQLite local DB, no cloud dependency, GDPR-compliant by default

---

## 2. System Architecture

### 2.1 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BALIZABT ECOSYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │  ESP32       │    │  ESP32       │    │  Smartphone  │    │  BLE     │  │
│  │  Beacon Tag  │    │  Gateway     │    │  (iOS/Android)│   │  Sensors │  │
│  │  (Anti-loss) │    │  (Relay)     │    │              │    │  (Env)   │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └────┬─────┘  │
│         │                   │                   │                 │        │
│         ▼                   ▼                   ▼                 ▼        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    BLE RADIO SPACE (2.4 GHz ISM)                     │  │
│  │              Advertising Packets: iBeacon / Eddystone / Custom       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      BALIZABT SCANNER (Noble)                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Discovery  │  │  RSSI       │  │  Parser     │  │  Dedupe     │  │  │
│  │  │  Engine     │  │  Filter     │  │  (Mfg/UUID) │  │  & Queue    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      DATA LAYER (SQLite + WAL)                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  devices    │  │  sightings  │  │  annotations│  │  floorplans │  │  │
│  │  │  (beacons)  │  │  (raw RSSI) │  │  (custom)   │  │  (zones)    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐            │
│         ▼                          ▼                          ▼            │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐     │
│  │  TEMPORAL   │           │  POSITION   │           │  ALERT/     │     │
│  │  ANALYZER   │           │  ENGINE     │           │  NOTIFY     │     │
│  │  • Mass     │           │  • Trilater.│           │  • Geofence │     │
│  │  • Patterns │           │  • Kalman   │           │  • Loss     │     │
│  │  • Heatmap  │           │  • Zones    │           │  • Battery  │     │
│  └─────────────┘           └─────────────┘           └─────────────┘     │
│         │                          │                          │            │
│         └──────────────────────────┼──────────────────────────┘            │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    PRESENTATION LAYER                                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  CLI        │  │  REST API   │  │  Web Dashboard│  │  Mobile App │  │  │
│  │  │  (Current)  │  │  (Planned)  │  │  (Planned)  │  │  (Planned)  │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Module Specifications

#### 2.2.1 Scanner Module (`scanner.js`)
| Aspect | Detail |
|--------|--------|
| **Library** | `@abandonware/noble` (Linux) / Simulation fallback (Windows) |
| **Scan Modes** | Passive (low power), Active (request scan response), Background (iOS) |
| **Filters** | Service UUID allowlist, Manufacturer ID allowlist, RSSI threshold |
| **Output Rate** | Configurable: 100ms–10s per device (default 1–3s simulation) |
| **State Machine** | `unknown` → `poweredOn` → `scanning` → `poweredOff` |
| **Events** | `stateChange`, `discover`, `warning` |

#### 2.2.2 Database Module (`database.js`)
| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `devices` | Master beacon registry (MAC = PK) | `address` UNIQUE, `last_seen` DESC, `is_tracked` |
| `sightings` | Raw RSSI observations (append-only) | `device_id`, `timestamp` DESC |
| `annotations` | User custom data | `device_id`, `type` |
| `floorplans` | Zone definitions | `building_id`, `floor` |
| `zones` | Named regions (polygons) | `floorplan_id`, `zone_type` |
| `gateways` | Fixed scanner positions | `mac`, `x`, `y`, `floor` |

**Schema Extensions for Positioning:**
```sql
-- Gateway fixed positions
CREATE TABLE gateways (
  id INTEGER PRIMARY KEY,
  mac TEXT UNIQUE NOT NULL,
  name TEXT,
  x REAL, y REAL, z REAL,  -- meters from origin
  floor INTEGER DEFAULT 0,
  coverage_radius REAL DEFAULT 30,
  is_active BOOLEAN DEFAULT 1
);

-- Zone definitions (polygons)
CREATE TABLE zones (
  id INTEGER PRIMARY KEY,
  floorplan_id INTEGER,
  name TEXT,
  zone_type TEXT,  -- 'rack', 'aisle', 'office', 'hazard', 'exit'
  polygon TEXT,    -- GeoJSON polygon
  color TEXT
);

-- Computed positions (from trilateration)
CREATE TABLE positions (
  id INTEGER PRIMARY KEY,
  device_id INTEGER,
  gateway_id INTEGER,
  x REAL, y REAL, z REAL,
  confidence REAL,      -- 0-1
  method TEXT,          -- 'trilateration', 'kalman', 'weighted'
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(device_id) REFERENCES devices(id)
);
```

#### 2.2.3 Temporal Analyzer (`temporal.js`)
| Function | Algorithm | Complexity |
|----------|-----------|------------|
| `getTemporalMass()` | Time-bucket aggregation (configurable interval) | O(n) sightings |
| `findPatterns()` | Frequency counting + manufacturer grouping | O(n) devices |
| `getDeviceHistory()` | Time-range filter + statistical summary | O(k) sightings |
| `annotateDevice()` | Upsert custom fields | O(1) |

#### 2.2.4 Position Engine (Planned Module)
| Algorithm | Use Case | Accuracy |
|-----------|----------|----------|
| **RSSI Trilateration** | 3+ gateways, open space | 1–3m |
| **Weighted Centroid** | Many gateways, noisy | 2–5m |
| **Kalman Filter** | Moving assets, trajectory | 0.5–2m |
| **Fingerprinting** | Pre-mapped RSSI grid | <1m (calibrated) |
| **AoA (Angle of Arrival)** | ESP32-C3/C6 with antenna array | <0.5m |

---

## 3. Data Models

### 3.1 Core Entities

#### Device (Beacon/Tag)
```typescript
interface Device {
  id: number;
  address: string;           // MAC AA:BB:CC:DD:EE:FF
  name: string | null;       // Advertised name
  rssi: number;              // Latest RSSI (dBm)
  manufacturerData: Record<number, string>;  // Company ID → hex
  serviceUuids: string[];    // Service UUIDs
  localName: string | null;
  txPower: number | null;    // Calibrated TX at 1m
  firstSeen: Date;
  lastSeen: Date;
  seenCount: number;
  
  // User annotations
  customName: string | null;
  customNotes: string | null;
  customTags: string[];      // ['asset', 'forklift', 'zone-A']
  isTracked: boolean;
  isAntiLoss: boolean;       // ESP32 tag with alert
  
  // Metadata
  metadata: {
    firstRssi: number;
    lastRssi: number;
    avgRssi: number;
    minRssi: number;
    maxRssi: number;
    batteryLevel?: number;   // From manufacturer data
    firmwareVersion?: string;
    hardwareVersion?: string;
  };
}
```

#### Sighting (Raw Observation)
```typescript
interface Sighting {
  id: number;
  deviceId: number;
  gatewayId: number | null;  // Which scanner saw it
  timestamp: Date;
  rssi: number;
  distanceEstimate: number | null;  // meters
  rawAdvertisement: AdvertisementData;
}
```

#### Gateway (Fixed Scanner)
```typescript
interface Gateway {
  id: number;
  mac: string;
  name: string;
  x: number; y: number; z: number;  // Position in meters
  floor: number;
  coverageRadius: number;
  isActive: boolean;
  lastHeartbeat: Date;
}
```

#### Zone (Logical Area)
```typescript
interface Zone {
  id: number;
  floorplanId: number;
  name: string;
  zoneType: 'rack' | 'aisle' | 'office' | 'hazard' | 'exit' | 'charging' | 'custom';
  polygon: GeoJSON.Polygon;  // [[x,y], [x,y], ...]
  color: string;
  metadata: Record<string, any>;
}
```

#### Position (Computed)
```typescript
interface Position {
  id: number;
  deviceId: number;
  gatewayId: number | null;
  x: number; y: number; z: number;
  confidence: number;  // 0.0 - 1.0
  method: 'trilateration' | 'weighted' | 'kalman' | 'fingerprint';
  timestamp: Date;
}
```

---

## 4. Algorithms

### 4.1 RSSI → Distance (Log-Distance Path Loss Model)
```
d = 10 ^ ((txPower - rssi) / (10 * n))

Where:
- txPower = calibrated RSSI at 1 meter (typically -59 dBm)
- rssi = measured signal strength
- n = path loss exponent (2.0 free space, 2.5-4.0 indoor)
- d = estimated distance in meters
```

**Environment-Specific Parameters:**
| Environment | n (path loss) | Typical txPower |
|-------------|---------------|-----------------|
| Open warehouse | 2.0–2.2 | -59 dBm |
| Office (cubicles) | 2.8–3.2 | -59 dBm |
| Factory (metal) | 3.5–4.0 | -59 dBm |
| Home (walls) | 3.0–3.5 | -59 dBm |

### 4.2 Trilateration (3+ Gateways)
Given distances d1, d2, d3 from known points (x1,y1), (x2,y2), (x3,y3):

```
Solve linear system:
2(x2-x1)x + 2(y2-y1)y = d1² - d2² - x1² + x2² - y1² + y2²
2(x3-x1)x + 2(y3-y1)y = d1² - d3² - x1² + x3² - y1² + y3²
```

**Weighted Least Squares** for >3 gateways:
```
minimize Σ w_i * (||p - g_i|| - d_i)²
where w_i = 1 / (σ_i²)  (inverse variance weighting)
```

### 4.3 Kalman Filter for Tracking
State vector: `[x, y, vx, vy]`
```
Predict:  x_k = F * x_{k-1} + w_k
Update:   z_k = H * x_k + v_k
```
- Process noise Q: tuned for asset type (forklift vs person)
- Measurement noise R: derived from RSSI variance

### 4.4 Temporal Mass Aggregation
```
For each interval [t, t+Δt]:
  unique_devices = COUNT(DISTINCT device_id)
  total_sightings = COUNT(*)
  avg_rssi = AVG(rssi)
  device_details = GROUP BY device_id
```

### 4.5 Pattern Detection
| Pattern | Algorithm |
|---------|-----------|
| Recurring | `seen_count >= threshold` |
| Strong Signal | `rssi > threshold` |
| New Device | `first_seen > now - window` |
| Manufacturer Cluster | GROUP BY `manufacturer_id` |
| Service UUID Cluster | GROUP BY `service_uuid` |
| Zone Dwelling | Sightings in zone > threshold |
| Co-location | Devices seen together > threshold |

---

## 5. ESP32 Integration

### 5.1 Beacon Tag Firmware (Anti-Loss)
**Hardware:** ESP32-C3 / ESP32-S3 (low power, BLE 5.0)
**Battery:** CR2032 (220mAh) or LiPo 150mAh
**Target Life:** 12–24 months

```cpp
// Key Features:
// - iBeacon + Eddystone-UID simultaneous advertising
// - Accelerometer wake (LIS3DH) — only advertise when moving
// - Battery voltage in manufacturer data
// - Button press → emergency beacon mode (high power)
// - OTA updates via BLE
// - Secure pairing for configuration

#define ADV_INTERVAL_MS  1000      // Normal
#define ADV_INTERVAL_FAST 100      // Moving / Alert
#define TX_POWER_DBM      0        // 0 dBm = ~30m range

// Manufacturer Data Format (Apple 0x004C compatible):
// [Company ID: 2 bytes][Beacon Type: 1 byte][UUID: 16 bytes][Major: 2][Minor: 2][TX Power: 1][Battery: 1][Firmware: 1][Flags: 1]
```

### 5.2 Gateway Firmware (Relay/Scanner)
**Hardware:** ESP32 / ESP32-S3 (wired power, Ethernet/WiFi)
**Role:** Fixed scanner → MQTT/HTTP → Central server

```cpp
// Scans for 30s every 60s (configurable)
// Filters: Known beacon MACs (whitelist)
// Output: JSON over MQTT/HTTP
// { "gateway": "AA:BB:CC:DD:EE:00", "ts": 1234567890, "beacons": [
//   {"mac": "11:22:33:44:55:66", "rssi": -65, "battery": 85}
// ]}
```

### 5.3 Communication Protocol
| Layer | Protocol | Details |
|-------|----------|---------|
| **BLE Advertising** | iBeacon / Eddystone-UID / Custom | 31 bytes max |
| **BLE Connection** | GATT (config, OTA, sensor read) | MTU 247 |
| **Gateway → Server** | MQTT (preferred) / HTTP / WebSocket | TLS in production |
| **Server → Dashboard** | REST + Server-Sent Events | Real-time updates |

---

## 6. Deployment Architecture

### 6.1 Production (Linux/WSL2/Docker)
```yaml
# docker-compose.yml
version: '3.8'
services:
  baliza-scanner:
    build: .
    devices:
      - /dev/bluetooth  # Requires --privileged or bluetooth group
    volumes:
      - ./data:/app/data
    environment:
      - SIMULATION_MODE=false
      - SCAN_INTERVAL_MS=1000
      - MQTT_BROKER=mqtt://mosquitto:1883
    depends_on: [mosquitto, redis]
    
  baliza-api:
    build: ./api
    ports: ["3000:3000"]
    volumes: ["./data:/app/data"]
    
  baliza-dashboard:
    build: ./dashboard
    ports: ["8080:80"]
    
  mosquitto:
    image: eclipse-mosquitto:2
    ports: ["1883:1883", "9001:9001"]
    
  redis:
    image: redis:7-alpine
```

### 6.2 Windows Development (Simulation)
```bash
# No hardware needed
npm install
npm test          # All pass
npm run scan 30000
npm run patterns
npm run temporal
```

---

## 7. Security & Privacy

| Concern | Mitigation |
|---------|------------|
| **MAC Tracking** | Rotating MAC addresses (BLE privacy), hash stored MACs |
| **Data Locality** | SQLite on-premise, no cloud sync by default |
| **GDPR** | Right to deletion (DELETE FROM devices), no PII in beacons |
| **Gateway Auth** | MQTT TLS + client certs, API keys for REST |
| **Firmware OTA** | Signed images, secure boot on ESP32 |

---

## 8. Testing Strategy

| Level | Tool | Coverage Target |
|-------|------|-----------------|
| Unit | Jest/Vitest | 80%+ (database, algorithms) |
| Integration | Custom test harness | Scanner→DB→Analyzer flow |
| Hardware | ESP32 dev boards | Battery life, range, RSSI accuracy |
| E2E | Playwright (dashboard) | Critical user journeys |

---

## 9. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Scan → DB latency | < 50ms | Single machine |
| 1000 sightings/sec | Sustained | Batch inserts (WAL) |
| Position update rate | 1 Hz per asset | Configurable |
| Query latency (temporal) | < 200ms | Indexed time ranges |
| ESP32 battery life | 12+ months | CR2032, 1s adv interval |
| Gateway uptime | 99.9% | Watchdog + auto-reboot |

---

## 10. Future Extensions (v2.0+)

| Feature | Effort | Value |
|---------|--------|-------|
| **REST API + WebSocket** | 2 weeks | Real-time dashboards |
| **Web Dashboard (React/MapLibre)** | 3 weeks | Visual floorplans, heatmaps |
| **Mobile App (React Native/Flutter)** | 4 weeks | Field worker access |
| **AoA Direction Finding** | 6 weeks | Sub-meter accuracy |
| **ML-based Fingerprinting** | 8 weeks | <1m without dense gateways |
| **Multi-building Federation** | 4 weeks | Campus/warehouse networks |
| **Digital Twin Integration** | 6 weeks | Unity/Unreal visualization |

---

## Appendix A: File Structure
```
BalizaBt/
├── cli.js                 # CLI entry point
├── scanner.js             # BLE scanner (simulation + real)
├── database.js            # SQLite layer
├── temporal.js            # Temporal analyzer + patterns
├── test.js                # Unit tests
├── package.json
├── README.md
├── docs/
│   ├── specs/
│   │   ├── SDD.md         # This file
│   │   ├── API.md         # REST API spec
│   │   ├── FLOORPLAN.md   # Zone/placement spec
│   │   └── ESP32.md       # Firmware spec
│   ├── architecture/
│   │   ├── SYSTEM.md      # System architecture
│   │   ├── DATA_FLOW.md   # Data flow diagrams
│   │   └── DEPLOYMENT.md  # Deployment guide
│   ├── market/
│   │   ├── COMPETITIVE.md # Competitive analysis
│   │   ├── PRICING.md     # Pricing strategy
│   │   └── GTM.md         # Go-to-market
│   ├── guides/
│   │   ├── INSTALL.md     # Installation guide
│   │   ├── HARDWARE.md    # ESP32 wiring, config
│   │   ├── CALIBRATION.md # RSSI calibration
│   │   └── TROUBLESHOOT.md
│   ├── presentations/
│   │   ├── PITCH_DECK.md  # Investor/sales deck
│   │   ├── TECH_DEEP_DIVE.md
│   │   └── DEMO_SCRIPT.md
│   └── landing/
│       ├── INDEX.html     # Landing page
│       ├── FEATURES.md
│       ├── PRICING.md
│       └── FAQ.md
└── firmware/
    ├── beacon_tag/        # ESP32 anti-loss tag
    ├── gateway/           # ESP32 fixed scanner
    └── common/            # Shared libraries
```

---

*End of SDD*