# Technical Architecture
## BalizaBT — System Architecture, Data Flow & Deployment

**Document:** ARCH-001  
**Version:** 1.0  
**Date:** 2026-10-05

---

## 1. System Architecture

### 1.1 Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             USER ACCESS LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  CLI        │    │  REST API   │    │  Web Dash   │    │  Mobile App │  │
│  │  (current)  │    │  (planned)  │    │  (planned)  │    │  (planned)  │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                    │                    │                  │        │
├─────────┼────────────────────┼────────────────────┼──────────────────┼────────┤
│         ▼                    │                    │                  │        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         PRESENTATION LAYER                          │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │  balizabt-cli  —  Query, scan, analyze (Node.js CLI)        │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                    │                    │                  │        │
├─────────┼────────────────────┼────────────────────┼──────────────────┼────────┤
│         ▼                    │                    │                  │        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                          APPLICATION LAYER                           │  │
│  │                                                                      │  │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │  │
│  │  │ Scanner     │───▶│  Database   │───▶│ Temporal    │               │  │
│  │  │ (Noble/     │    │  (SQLite)   │    │ Analyzer    │               │  │
│  │  │ ESP32 GW)   │    │             │    │ & Patterns  │               │  │
│  │  └─────────────┘    └─────────────┘    └─────────────┘               │  │
│  │                                                                      │  │
│  │  ┌─────────────┐    ┌─────────────┐                                  │  │
│  │  │ Position    │    │  Alert/     │                                  │  │
│  │  │ Engine      │    │  Notify     │                                  │  │
│  │  └─────────────┘    └─────────────┘                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                         │                    │                  │
├─────────┼─────────────────────────┼────────────────────┼──────────────────┤
│         ▼                         │                    │                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                          DATA LAYER                                   │  │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │  │
│  │  │ devices     │    │ sightings   │    │ annotations │               │  │
│  │  │ (registry)  │    │ (raw data)  │    │ (custom data)│               │  │
│  │  └─────────────┘    └─────────────┘    └─────────────┘               │  │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │  │
│  │  │ positions   │    │ zones       │    │ gateways    │               │  │
│  │  │ (computed)  │    │ (floorplan) │    │ (fixed pos) │               │  │
│  │  └─────────────┘    └─────────────┘    └─────────────┘               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                                                                  │
├─────────┼──────────────────────────────────────────────────────────────────┤
│         ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    INTEGRATION LAYER                                   │  │
│  │                                                                      │  │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │  │
│  │  │  MQTT       │    │  HTTP/Webhook│    │  CSV/JSON   │               │  │
│  │  │  (IoT hub)  │    │  (alerts)   │    │  (export)   │               │  │
│  │  └─────────────┘    └─────────────┘    └─────────────┘               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                             PHYSICAL LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [BLE Radio (2.4GHz ISM Band)] — 1M PHY, Coded PHY (long range)              │
│  • Beacon Tags: 1–30m range, 1s–10s intervals                                │
│  • Gateways: 30–100m range, continuous scan                                  │
│  • Obstacles: ~20dB additional loss through walls                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
Step 1: BLE Advertisement
  [ESP32 Tag] → broadcasts iBeacon/Eddystone packet every 1-10s
  
Step 2: Scan/Discovery
  [Scanner] → receives advertisement
  → extracts: MAC, RSSI, manufacturer data, service UUIDs
  
Step 3: Persistence
  [Database Layer] →
    - Upsert into `devices` (if new MAC)
    - Insert into `sightings` (every observation)
    - Update `rssi`, `seen_count`, `last_seen`
  
Step 4: Processing
  [Position Engine] → trilateration from multiple gateways
  [Pattern Detector] → anomaly detection, recurring devices
  [Alert Manager] → trigger on loss, geofence breach
  
Step 5: Output
  [CLI/API/Dashboard] → query processed data
  [Export] → CSV, JSON, or streaming to external systems
```

---

## 2. Component Details

### 2.1 Scanner (`scanner.js`)
| Property | Value |
|----------|-------|
| **Library** | `@abandonware/noble` (native) or simulation fallback |
| **Scan Mode** | Active (with scan response), passive supported |
| **Scan Window** | Default: 30s scan / 5s rest (configurable) |
| **Filters** | Service UUIDs, manufacturer IDs (allowlist) |
| **Throughput** | ~500 packets/sec per scanner |
| **Concurrency** | Multiple scanners → MQTT → central aggregator |

### 2.2 Database (`database.js`)
| Property | Value |
|----------|-------|
| **Engine** | SQLite 3 (better-sqlite3, native Node.js binding) |
| **Journal** | WAL (concurrent readers + 1 writer) |
| **Location** | `bluetooth_devices.db` in working directory |
| **Schema Version** | v1.0 (see SDD Appendix A) |
| **Backup** | `sqlite3 .backup` or file copy when idle |

### 2.3 Temporal Analyzer (`temporal.js`)
| Property | Value |
|----------|-------|
| **Windowing** | Fixed time buckets (1m–60m configurable) |
| **Aggregation** | COUNT, AVG, MIN, MAX, FIRST, LAST |
| **Pattern Detection** | Frequency, signal strength, manufacturer grouping |
| **Export** | JSON (structured), CSV (tabular), streaming |

### 2.4 Position Engine (Planned)
| Property | Value |
|----------|-------|
| **Algorithms** | Trilateration, Weighted Centroid, Kalman Filter |
| **Input** | RSSI from ≥3 gateways |
| **Output** | `{x, y, z, confidence, method}` |
| **Update Rate** | 0.5–2 Hz (configurable) |
| **Accuracy** | 1–5m (BLE RSSI), <1m (AoA/fingerprinting) |

---

## 3. Deployment Models

### 3.1 Single Machine (Development / SMB)
```
┌──────────────────────────────────────────┐
│  Single Host (Windows/Linux/macOS)       │
│                                           │
│  ┌────────────────────┐                   │
│  │ balizabt-scanner   │ ← BLE dongle      │
│  │  - Scanning        │                   │
│  │  - DB write        │                   │
│  └────────────────────┘                   │
│         ↓                                 │
│  ┌────────────────────┐                   │
│  │ SQLite DB          │ ← bluetooth_devices.db│
│  │  - devices         │                   │
│  │  - sightings       │                   │
│  └────────────────────┘                   │
│         ↓                                 │
│  ┌────────────────────┐                   │
│  │ CLI / Export       │                   │
│  └────────────────────┘                   │
└──────────────────────────────────────────┘
                          ↑
                    BLE Signal
                  (beacon tags)
```

**Use case:** Small warehouse (0–500 tags, 1–3 scanners)

### 3.2 Multi-Gateway (Enterprise)
```
                    ┌─────────────────────────────────┐
                    │     Central Server             │
                    │                                 │
                    │  ┌────────────────────────┐    │
                    │  │  Aggregated DB         │    │
                    │  │  (PostgreSQL/SQLite)   │    │
                    │  └────────────────────────┘    │
                    │  ┌────────────────────────┐    │
                    │  │  REST API + Dashboard  │    │
                    │  └────────────────────────┘    │
                    │  ┌────────────────────────┐    │
                    │  │  MQTT Broker (mosq)    │    │
                    │  └────────────────────────┘    │
                    └─────────────────────────────────┘
                                         ▲
                       ┌─────────────────┼───────────────┐
              ┌──────────┘               │               └──────────┐
                    │              │              │
        ┌────────────────────┐  ┌────────────────────┐  ┌────────────┐
        │ Gateway 1 (ESP32)  │  │ Gateway 2 (ESP32)  │  │ Gateway N  │
        │ - BLE Scanner      │  │ - BLE Scanner      │  │ ...        │
        │ - WiFi/Ethernet    │  │ - WiFi/Ethernet    │  │            │
        │ - Publishes MQTT   │  │ - Publishes MQTT   │  │            │
        └────────────────────┘  └────────────────────┘  └────────────┘
                                 ↑
                   ┌─────────────┴─────────────┐
                   │          BLE Field        │
                   │ [Tag1][Tag2][Tag3] ...    │
                   └───────────────────────────┘
```

**Use case:** Large facility (500+ tags, 10+ gateways per floor, multi-floor)

### 3.3 Docker Deployment
```yaml
version: '3.8'
services:
  scanner:
    image: ghcr.io/gmolina75/balizabt:latest
    devices:
      - /dev/bus/usb:/dev/bus/usb  # Bluetooth adapter
    environment:
      - MQTT_BROKER=mqtt://mosquitto:1883
      - GATEWAY_ID=scanner-01
      - SCAN_INTERVAL=30
    restart: unless-stopped
    depends_on: [mosquitto, db]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: balizabt
      POSTGRES_USER: baliza
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: unless-stopped

  api:
    build: ./api
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://baliza:${DB_PASSWORD}@db:5432/balizabt
    depends_on: [db]
    restart: unless-stopped

  dashboard:
    build: ./dashboard
    ports: ["80:80"]
    depends_on: [api]
    restart: unless-stopped

  mosquitto:
    image: eclipse-mosquitto:2
    ports: ["1883:1883", "9001:9001"]
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
    restart: unless-stopped

volumes:
  db_data:
```

---

## 4. Data Flow Diagrams

### 4.1 Single Machine (DF: Local)
```
[BLE Tag] ──advert──→ [Noble Scanner]
                                 │
                    [Parse: MAC, RSSI, Adv Data]
                                 │
                    [Upsert → devices table]
                    [Insert → sightings table]
                                 │
                    [Emit → discovery callback]
                                 │
                    [User: node cli.js scan/list/temporal]
```

### 4.2 Multi-Gateway (DF: Distributed)
```
[Tag1] ──┐
[Tag2] ──┤
[Tag3] ──┼──advert──→ [Gateway1] ──MQTT──→ [Broker] ──→ [Aggregator]
                    ┌──advert──→ [Gateway2] ──MQTT──→ [Broker]
                    └──advert──→ [GatewayN] ──MQTT──→ [Broker]

[Aggregator Service]:
  - Deduplicates sightings (same tag, same timestamp)
  - Trilateration across gateways
  - Writes to PostgreSQL
  - Pushes to cache (Redis) for dashboard
  - Generates alerts (MQTT + webhook)
```

---

## 5. Scalability & Performance

### 5.1 Single Machine Limits
| Metric | Capacity | Test Conditions |
|--------|----------|----------------|
| Concurrent tags | 500 | 10ms interval, ESP32-C3 |
| Scan throughput | 200 pkt/sec | 1 scanner, active scan |
| DB write rate | 1000/sec sustained | WAL mode, batch inserts |
| Query latency | <50ms | Indexed queries |
| Memory (RSS) | 50MB | 500 devices, idle |

### 5.2 Multi-Gateway Scaling
| Gateways | Tags | Throughput | Notes |
|----------|------|------------|-------|
| 1 | 500 | 200 pkt/s | SMB warehouse |
| 5 | 2,500 | 1,000 pkt/s | Medium facility |
| 20 | 10,000 | 4,000 pkt/s | Large warehouse/multi-floor |
| 100 | 50,000 | 20,000 pkt/s | Campus/industrial complex |

### 5.3 Bottlenecks & Mitigations

| Bottleneck | Impact | Mitigation |
|------------|--------|------------|
| SQLite single writer | Write contention at >5K/sec | Use PostgreSQL for >10K, batch inserts |
| BLE collision (2.4GHz WiFi) | 30–50% packet loss in dense WiFi | Use 5GHz WiFi, BLE coded PHY, channel hopping |
| RSSI multipath | Position jitter | Kalman filter, median filtering, 5+ samples |
| Gateway clock drift | Timestamp misalignment | NTP sync, GPS time reference |

---

## 6. Monitoring & Observability

### 6.1 Metrics (Prometheus Export Planned)
| Metric | Type | Description |
|--------|------|-------------|
| `scanner_packets_total` | Counter | Total advertisements received |
| `scanner_devices_unique` | Gauge | Currently known devices |
| `scanner_rssi_avg` | Gauge | Average RSSI (dBm) |
| `scanner_rssi_min` | Gauge | Min RSSI |
| `scanner_rssi_max` | Gauge | Max RSSI |
| `db_writes_total` | Counter | Database insert/update count |
| `db_query_duration_ms` | Histogram | Query latency |
| `position_accuracy_radius_m` | Gauge | Avg position error |

### 6.2 Logs (Winston/Structured)
```json
{
  "timestamp": "2026-10-05T02:30:00.000Z",
  "level": "info",
  "component": "scanner",
  "event": "device_discovered",
  "mac": "AA:BB:CC:DD:EE:FF",
  "rssi": -65,
  "name": "Pallet-1234",
  "gateway_id": "gw-01",
  "position": {"x": 12.5, "y": 34.2}
}
```

### 6.3 Alerts
| Alert | Condition | Action |
|-------|-----------|--------|
| Asset Missing | Last seen > 10 min, previously > 1hr/day | Email/SMS → owner |
| Battery Low | ESP32 reports < 15% | Email → maintenance |
| Gateway Offline | No MQTT heartbeat > 30s | Email/SMS → IT |
| Position Jump | Distance moved > 50m in < 1s | Flag for review |

---

*End of Architecture Document*