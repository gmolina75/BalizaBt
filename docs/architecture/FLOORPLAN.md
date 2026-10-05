# Floor Plan & Beacon Placement Specification
## BalizaBT — Indoor Positioning Setup Guide

---

## 1. Floor Plan System

### 1.1 Floor Plan Registration
```bash
# Register a floor plan via CLI (planned API endpoint)
node cli.js floorplan create \
  --building "Warehouse-A" \
  --floor 1 \
  --name "Main Floor" \
  --width 100 \
  --height 80 \
  --unit meters \
  --image floorplan_main.png
```

### 1.2 Coordinate System
- **Origin (0,0):** Bottom-left corner of the floor plan
- **Units:** Meters (configurable: meters / feet)
- **X-axis:** Horizontal (east/west), positive east
- **Y-axis:** Vertical (north/south), positive north
- **Z-axis:** Height above floor (for multi-level)

### 1.3 Zone Types

| Zone Type | Purpose | Color |
|-----------|---------|-------|
| `rack` | Storage shelving | #3B82F6 (blue) |
| `aisle` | Walking/driving paths | #6B7280 (gray) |
| `office` | Administrative areas | #10B981 (green) |
| `hazard` | Restricted/danger areas | #EF4444 (red) |
| `exit` | Emergency exits | #F59E0B (amber) |
| `charging` | Device charging stations | #8B5CF6 (purple) |
| `receiving` | Loading dock/receiving | #06B6D4 (cyan) |
| `custom` | User-defined | #6366F1 (indigo) |

---

## 2. Beacon Placement Strategy

### 2.1 General Principles
1. **Coverage Overlap:** Each point covered by ≥2 beacons (preferably 3)
2. **Height:** Beacons at 2.5–3.0m off ground (avoid floor placement)
3. **Avoid:** Metal surfaces, inside cabinets, behind thick concrete
4. **Line-of-Sight:** Minimize obstructions between beacon and tags

### 2.2 Placement Density Calculator

| Environment | Beacon Density | Spacing | Coverage Radius |
|-------------|----------------|---------|-----------------|
| Open warehouse (low clutter) | Low | 15–20m | 30m+ |
| Standard warehouse (racks) | Medium | 10–15m | 25m |
| Dense storage (high racks) | High | 8–12m | 20m |
| Office (partitions) | Medium | 10–12m | 20m |
| Metal-heavy (factory) | High | 6–10m | 15m |
| Outdoor (covered yard) | Medium | 12–18m | 30m |

### 2.3 Mathematical Formula
For a rectangular area of `W × H` meters:
```
beacons_needed = ceil(W / spacing) * ceil(H / spacing) * density_factor

Where density_factor:
  - Open space: 0.5
  - Standard:   1.0
  - Dense:      1.5
```

### 2.4 Example: 100m × 80m Warehouse
```
Area = 8,000 m²
Spacing = 15m (medium density)
Grid = ceil(100/15) × ceil(80/15) = 7 × 6 = 42 positions
Density factor = 1.0
Total beacons = 42
Coverage per beacon = ~700 m²
Total coverage = 42 × 700 = 29,400 m²
```

---

## 3. Beacon Types & Placement Roles

### 3.1 Gateway Beacons (Fixed, Powered)
| Property | Specification |
|----------|--------------|
| **Device** | ESP32-S3 with Ethernet/WiFi |
| **Power** | PoE or USB-C (5V/1A) |
| **Mounting** | Wall/ceiling, 2.5–3m height |
| **Orientation** | Antenna perpendicular to mounting surface |
| **Spacing** | 10–15m apart (overlap zone) |
| **Quantity** | ~1 per 100–200 m² |

### 3.2 Asset Tags (Mobile, Battery)
| Property | Specification |
|----------|--------------|
| **Device** | ESP32-C3 (coin cell version) |
| **Attachment** | Adhesive back, zip-tie mount |
| **Battery** | CR2032 (220 mAh) or LiPo 150mAh |
| **Placement** | On the asset, clear of metal |
| **Orientation** | Antenna facing upward (vertical) |

### 3.3 Anchor Beacons (Reference Points)
| Property | Specification |
|----------|--------------|
| **Device** | ESP32-C3, always-on (powered) |
| **Mounting** | Known coordinates (pre-calibrated) |
| **Placement** | Corners, edges, known landmarks |
| **Quantity** | Minimum 3 per floor, ideally 4+ |

---

## 4. Zone Definition

### 4.1 Zone Polygon Format
```json
{
  "zone_id": "rack-row-A1",
  "floor": 1,
  "zone_type": "rack",
  "name": "Row A, Racks 1-10",
  "polygon": [
    [12.5, 34.0],
    [22.5, 34.0],
    [22.5, 38.0],
    [12.5, 38.0]
  ],
  "metadata": {
    "capacity": 100,
    "zone_manager": "John Smith",
    "inventory_types": ["pallet", "box"]
  }
}
```

### 4.2 Zone Assignment Logic
- A device is "in zone" if its estimated position is inside the zone polygon
- For edge cases (boundary), assign to the zone with highest RSSI sum
- Buffer zones: 0.5m inside the polygon wall to reduce jitter

### 4.3 Geofencing
```bash
# Alert when tag enters/exits a zone
node cli.js geofence create \
  --zone-id "hazard-zone-1" \
  --condition "enter" \
  --action "alert:sms:security-team" \
  --action "log:incident:211" \
  --severity "high"
```

---

## 5. Calibration Workflow

### 5.1 Phase 1: Physical Installation
```
1. Map the floor plan → register zones with coordinates
2. Install gateway beacons at planned locations
3. Install anchor beacons at known positions
4. Mount asset tags on high-value items
5. Power cycle all gateways
```

### 5.2 Phase 2: Radio Calibration
```
node cli.js calibrate start \
  --method "rssi" \
  --duration 300 \
  --devices "AA:BB:CC:DD:DD:01,AA:BB:CC:DD:DD:02,..."

# Walk each tag through each zone for 30 seconds
# System learns RSSI fingerprint at known positions
# Output: calibration_report.json
```

### 5.3 Phase 3: Position Tuning
```
node cli.js position tune \
  --reference-device "AA:BB:CC:DD:EE:01" \
  --known-location "x=15.0,y=22.5,z=0.0,floor=1" \
  --duration 60 \
  --save
```

---

## 6. Placement Validation

### 6.1 Coverage Heatmap
After installation, run validation scan:
```bash
# CLI: simulate walk-through
node cli.js validate coverage \
  --floor 1 \
  --resolution 1.0 \
  --output coverage_report.json

# Output: heatmap of RSSI strength across the floor
# Identifies dead zones, overlapping coverage, anomalies
```

### 6.2 Positioning Accuracy Test
```bash
# Place 5 known test points
node cli.js validate accuracy \
  --reference-points 5 \
  --duration 30 \
  --report accuracy_report.json

# Output: 
# - Mean error (meters)
# - 95th percentile error
# - Error distribution per zone
# - Recommendations (add beacon at X, remove from Y)
```

### 6.3 Battery Life Validation
```bash
node cli.js validate battery \
  --device-id AA:BB:CC:DD:EE:FF \
  --days 30 \
  --report battery_report.json

# Output:
# - Estimated remaining life
# - RSSI trend (degradation curve)
# - Wakeup reliability
```

---

## 7. Best Practices

### 7.1 DOs
✅ Mount beacons 2.5–3m high, away from metal  
✅ Ensure 20–30% coverage overlap  
✅ Use Ethernet gateways for fixed backbone  
✅ Calibrate RSSI in each unique environment  
✅ Document every beacon's MAC → location mapping  
✅ Rotate CR2032 batteries annually (preventive)  
✅ Test with heaviest-tagged asset in the worst location  

### 7.2 DON'Ts
❌ Stick tags directly onto metal surfaces  
❌ Place beacons behind thick concrete or steel  
❌ Rely on default RSSI values without calibration  
❌ Ignore WiFi 2.4GHz interference (use channel planning)  
❌ Forget seasonal inventory changes affect signal paths  
❌ Mix beacon heights (causes inconsistent RSSI)  

---

## 8. Example: Small Warehouse Setup

### 8.1 Parameters
- Size: 50m × 40m (2,000 m²)
- 8m ceiling with metal racks
- WiFi: 20 APs (2.4GHz)
- Assets: 200 pallets, 50 forklifts

### 8.2 Placement Plan
```
Gateway Beacons (WiFi, PoE):
  GW-01: (5, 5, 3.0) — SW corner
  GW-02: (45, 5, 3.0) — SE corner
  GW-03: (25, 20, 3.0) — Center
  GW-04: (5, 35, 3.0) — NW corner
  GW-05: (45, 35, 3.0) — NE corner
  GW-06: (25, 30, 3.0) — North center

Anchor Beacons (reference):
  AN-01: (0, 0, 0) — known SW
  AN-02: (50, 0, 0) — known SE
  AN-03: (0, 40, 0) — known NW
  AN-04: (50, 40, 0) — known NE

Estimated cost:
  6 × $49.99 (ESP32-S3 Gateway) = $299.94
  4 × $12.99 (ESP32-C3 Anchor) = $51.96
  200 × $3.99 (ESP32-C3 Tag) = $798.00
  Total: ~$1,150 for 200 assets + full facility coverage
```

### 8.3 Expected Accuracy
| Metric | Value |
|--------|-------|
| Mean positioning error | 1.8 m |
| 95th percentile | 3.5 m |
| Coverage gaps | 0 m² (99.6% coverage) |
| Battery life (tags) | 18 months (CR2032, 3s interval) |
| False positive rate | < 0.1% |

---

*End of Floor Plan & Beacon Placement Spec*