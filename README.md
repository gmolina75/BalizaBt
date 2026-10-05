# BalizaBT — Bluetooth Scanner & Temporal Analyzer

A Node.js application for discovering nearby Bluetooth Low Energy (BLE) devices, storing them in a SQLite database, and performing temporal analysis to detect patterns over time.

## ⚡ Current Status: **Simulation Mode Working (Windows Native)**

**Real hardware scanning requires native C++ bindings** (`@abandonware/bluetooth-hci-socket`) which fail to compile on Windows due to node-gyp/Python toolchain issues. **Simulation mode works 100% out of the box** — no hardware needed.

For real hardware: use **WSL2**, **Docker**, or **Linux** where native compilation succeeds.

## Features

- **Bluetooth Scanning** — Simulation mode with 8 realistic devices (iPhone, Galaxy, AirPods, Watch, Tile, Thermostat, Speaker, Fitbit) with real manufacturer IDs and RSSI variation
- **Persistent Storage** — SQLite database with WAL mode, indices, foreign keys
- **Temporal Analysis** — Aggregates sightings into time intervals to visualize device presence over time
- **Pattern Detection** — Finds recurring devices, strong signals, new arrivals, manufacturer/service groups
- **Device Annotation** — Add custom names, notes, tags, and tracking flags
- **CLI Interface** — Full command-line control for scanning, querying, and analysis

## Quick Start

```bash
# Install dependencies (already done)
npm install

# Run tests (all pass)
npm test

# Scan for 30 seconds (simulation)
npm run scan 30000

# List discovered devices
npm run list

# Show temporal analysis (last 24h, 5-min intervals)
npm run temporal

# Find patterns
npm run patterns

# Show statistics
npm run stats
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `scan [duration_ms] [service_uuids...]` | Scan for Bluetooth devices |
| `list [options]` | List discovered devices |
| `device <address\|id>` | Show device details |
| `annotate <address\|id> --name "Name" --notes "Notes" --tags "tag1,tag2"` | Add custom info |
| `track <address\|id> [on\|off\|toggle]` | Toggle device tracking |
| `patterns [options]` | Find patterns in data |
| `temporal [options]` | Show temporal mass analysis |
| `stats` | Show database statistics |
| `history <address\|id> [hours]` | Show device sighting history |
| `export [json]` | Export all data as JSON |
| `help` | Show help |

### List Options
- `--tracked` — Show only tracked devices
- `--untracked` — Show only untracked devices
- `--search <term>` — Search by name/address
- `--min-rssi <value>` — Minimum RSSI filter
- `--since <ISO_date>` — Filter by last seen date
- `--limit <n>` — Limit results

### Temporal Options
- `--interval <min>` — Aggregation interval in minutes (default: 5)
- `--hours <n>` — Time window in hours (default: 24)

## Architecture

```
├── cli.js          # Command-line interface
├── database.js     # SQLite database layer (better-sqlite3)
├── scanner.js      # Bluetooth scanner (simulation mode, real hardware placeholder)
├── temporal.js     # Temporal aggregation & pattern analysis
├── test.js         # Automated tests
└── bluetooth_devices.db  # SQLite database (created on first run)
```

### Database Schema

**devices** — One row per unique MAC address
- `address` (PK) — MAC address
- `name` — Advertised device name
- `rssi` — Latest signal strength (dBm)
- `manufacturer_data` — Raw manufacturer data (JSON)
- `service_uuids` — Advertised service UUIDs (JSON)
- `custom_name` — User-defined name
- `custom_notes` — User notes
- `custom_tags` — User tags (JSON array)
- `is_tracked` — Whether device is tracked
- `seen_count` — Total sightings
- `first_seen`, `last_seen` — Timestamps

**sightings** — One row per advertisement received
- `device_id` (FK) — References devices
- `timestamp` — When seen
- `rssi` — Signal strength at that moment
- `distance_estimate` — Calculated distance in meters
- `raw_advertisement` — Full advertisement payload (JSON)

## Real Bluetooth Hardware (WSL2 / Docker / Linux)

**Windows native compilation fails** for `@abandonware/bluetooth-hci-socket`. Working alternatives:

### Option 1: WSL2 (Recommended)
```bash
# In WSL2 Ubuntu:
sudo apt update && sudo apt install -y nodejs npm python3 build-essential libbluetooth-dev
cd /mnt/c/your/project/path
npm install
# Change scanner.js: simulationMode: false
```

### Option 2: Docker
```dockerfile
FROM node:20-bullseye
RUN apt-get update && apt-get install -y python3 build-essential libbluetooth-dev bluez
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "cli.js", "scan", "30000"]
```

### Option 3: Linux VM / Native Linux
Same as WSL2 — native compilation works.

### Manufacturer IDs Used in Simulation
| ID (dec) | ID (hex) | Vendor |
|----------|----------|--------|
| 76 | 0x004C | Apple |
| 117 | 0x0075 | Samsung |
| 218 | 0x00DA | Tile |
| 741 | 0x02E5 | Google/Nest |
| 224 | 0x00E0 | Google/Fitbit |

## Temporal Mass Analysis

The core analytical concept is building a **temporal mass** — a time-series view of all nearby Bluetooth devices, enriched with your annotations:

```
Timeline (5-min intervals):
┌──────────────┬────────┬───────────┬────────┬──────────┐
│ Interval     │ Devices│ Sightings │ Avg RSSI│ Details  │
├──────────────┼────────┼───────────┼────────┼──────────┤
│ 14:00-14:05  │   12   │    47     │  -62    │ 3 tracked│
│ 14:05-14:10  │   15   │    52     │  -58    │ 5 tracked│
└──────────────┴────────┴───────────┴────────┴──────────┘
```

This lets you:
- See which devices are consistently present (yours, neighbors)
- Detect new/unknown devices appearing
- Track signal strength changes (movement, battery)
- Correlate with your manual annotations

## 📚 Documentación Completa

| Documento | Descripción |
|----------|-------------|
| 📖 [SDD](./docs/specs/SDD.md) | Diseño de Software completo |
| 📱 [ESP32](./docs/specs/ESP32.md) | Firmware y programación de tags |
| 🏗️ [Sistema](./docs/architecture/SYSTEM.md) | Arquitectura del sistema |
| 🔬 [Deep Dive](./docs/architecture/TECH_DEEP_DIVE.md) | Análisis técnico profundo |
| 🗺️ [Floor Plan](./docs/specs/FLOORPLAN.md) | Colocación y diseño de balizas |
| 🧪 [Instalación](./docs/guides/INSTALL.md) | Guía de instalación paso a paso |
| 🔧 [Hardware](./docs/guides/HARDWARE.md) | Tags ESP32 y componentes |
| 📏 [Calibración](./docs/guides/CALIBRATION.md) | Calibración de precisión |
| 🛠️ [Solución de Problemas](./docs/guides/TROUBLESHOOT.md) | Guía de troubleshooting |
| 💰 [Precios](./docs/landing/PRICING.md) | Modelo de precios freemium |
| ✨ [Características](./docs/landing/FEATURES.md) | Tabla completa de features |
| ❓ [FAQ](./docs/landing/FAQ.md) | Preguntas frecuentes |
| 🌐 [API](./docs/specs/API.md) | Documentación REST API |
| 📈 [Competencia](./docs/market/COMPETITIVE.md) | Análisis de mercado |
| 🚀 [Go-To-Market](./docs/market/GTM.md) | Estrategia de lanzamiento |
| 🎬 [Guion Demo](./docs/presentations/DEMO_SCRIPT.md) | Script de demostración |
| 🎯 [Hoja de Ruta](./docs/roadmap.md) | Roadmap del producto |
| 📋 [Índice](./docs/INDEX.md) | Índice maestro de documentación |

## Extending

### Add Custom Device Fields
Edit `database.js` → `devices` table schema and `upsertDevice()` function.

### Add New Pattern Types
Edit `temporal.js` → `findPatterns()` method.

### Export to Other Formats
Modify `exportData()` in `database.js` for CSV, InfluxDB, etc.

### Web Dashboard
The JSON export can feed any frontend (React, Svelte, etc.) for real-time visualization.

## License

MIT