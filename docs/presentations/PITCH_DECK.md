# BalizaBT Presentation Deck
## Investor / Sales Pitch

**10 Slides — 10 Minutes**

---

## Slide 1: The Problem

```
Title: "Enterprises lose billions annually to lost assets"

Content:
• 20% of warehouse inventory is unaccounted for (Gartner, 2025)
• Average large facility loses $250K+/year to misplaced tools/equipment
• Asset tracking solutions cost $25–100 per tag + $500+/month cloud fees
• No open-source, on-premise alternative exists

Visual: Split-screen — chaotic warehouse vs. organized tracked warehouse
```

---

## Slide 2: The Solution

```
Title: "BalizaBT — Track Anything for $3"

Content:
• Open-source Bluetooth LE positioning platform
• ESP32 tags at $3 (vs $25–100 proprietary)
• Zero cloud dependency — your data stays local
• Immediate live demo (no hardware needed)

Visual: $3 tag vs $50 tag comparison
```

---

## Slide 3: Market Opportunity

```
Title: "$12.8B RTLS Market by 2029 (CAGR 19.6%)"

Content:
• TAM: $12.8B by 2029
• SAM: $4.2B (warehousing + manufacturing)
• SOM: $50M (target 500 SMB warehouse customers by Y3)

Segments:
┌─────────────┬──────────┬──────────┐
│ Segment     │ 2024     │ 2029     │
├─────────────┼──────────┼──────────┤
│ RTLS        │ $5.2B    │ $12.8B   │
│ Asset Track │ $2.1B    │ $5.4B    │
│ Indoor Pos. │ $1.8B    │ $4.7B    │
│ BLE Beacons │ $3.2B    │ $8.9B    │
└─────────────┴──────────┴──────────┘
```

---

## Slide 4: Competitive Advantage

```
Title: "How We Win"

4 Columns:

┌─ Affordability ───────────────────┐
│ $3 tags vs $50+ competitors       │
│ 90% lower hardware cost           │
└───────────────────────────────────┘

┌─ Developer Experience ────────────┐
│ Live demo in browser (no HW)      │
│ CLI + REST API + ESP32 firmware   │
│ Full source available              │
└───────────────────────────────────┘

┌─ Data Sovereignty ────────────────┐
│ Zero cloud, zero subscriptions    │
│ SQLite local DB                   │
│ GDPR/air-gap compliant            │
└───────────────────────────────────┘

┌─ Temporal Intelligence ───────────┐
│ Pattern detection built-in        │
│ Heatmaps, dwell time, flow        │
│ Predictive loss alerts            │
└───────────────────────────────────┘
```

---

## Slide 5: Technology Architecture

```
Title: "How It Works"

Diagram:

[ESP32 Tags] → [BLE Radio] → [Scanner (Noble/ESP32)]
                                      ↓
                      [SQLite Local DB + Temporal Engine]
                                      ↓
              [CLI / REST API / Web Dashboard (v2)]

Key Stats:
• 0 cloud dependencies
• 3s average discovery latency
• 12-month battery life (CR2032)
• $0/month software cost
```

---

## Slide 6: Product Demo (Live)

```
Title: "Live Demo — No Hardware Required"

Walkthrough:
1. Run: npm run scan 60000
2. Show: npm run list
3. Show: npm run temporal
4. Show: npm run patterns
5. Show: npm run export

Key Lines:
✓ "This is the scanner finding 8+ devices right now"
✓ "All stored in SQLite — fully offline"
✓ "Now the temporal analysis over 5-min intervals"
✓ "Pattern detection found Apple devices clustered"
✓ "Export to JSON — plug into PowerBI, Grafana, whatever"

Timing: 2 minutes
```

---

## Slide 7: Business Model

```
Title: "$7.5M ARR by 2028"

Revenue Streams:
1. Hardware Bundles (pre-flashed ESP32): 50% margin, $499–4999
2. Professional Subscription: $2,999/yr (unlimited + API + dashboard)
3. Enterprise Support: $9,999–49,999/yr (custom + SLA)

Projections:
                │ 2026 │ 2027  │ 2028
────────────────┼──────┼───────┼──────
Revenue         │ $250K│ $1.8M │ $7.5M
Customers       │ 22   │ 170   │ 625
Tags Deployed   │ 500  │ 50K   │ 500K
```

---

## Slide 8: Go-to-Market

```
Title: "Path to $50K MRR"

Phase 1 — 0 to 50 Customers (Months 1–6):
• Open source → GitHub stars, dev adoption
• Warehouse pilot program (free 30-day trial)
• Content marketing: "Build Your Own Tracker for $3"

Phase 2 — 50 to 500 Customers (Months 6–24):
• System integrator partnerships
• Industry vertical templates (warehouse, healthcare, office)
• Case study content → demand gen

Phase 3 — Scale (Months 24–36):
• OEM integration (WMS, CMMS, EAM platforms)
• Distributor channel (electrical, industrial suppliers)
• Certification program for installers
```

---

## Slide 9: Ask

```
Title: "Join Us"

Ask: $1.5M Seed Round

Use of Funds:
┌────────────────────────┬──────────┐
│ Engineering (50%)       │ $750K    │
│ • Web Dashboard         │          │
│ • Mobile App            │          │
│ • AoA Positioning       │          │
│ • Certification         │          │
├────────────────────────┼──────────┤
│ Go-to-Market (30%)      │ $450K    │
│ • 3 enterprise sales    │          │
│ • Partner development   │          │
│ • Marketing content     │          │
├────────────────────────┼──────────┤
│ Operations (20%)        │ $300K    │
│ • Legal/IP              │          │
│ • Working capital       │          │
│ • Certifications        │          │
└────────────────────────┴──────────┘

Team:
• Founder: devMaster (full-stack + embedded systems)
• Seeking: CTO (embedded/IoT), Head of Sales, UI/UX Designer
```

---

## Slide 10: Vision / Close

```
Title: "The Last Asset Tracking Platform You'll Ever Need"

Vision:
"Open, affordable, and privacy-first positioning for every industry."

Why Now:
• ESP32-C6 (2024) → AoA + Thread + Matter
• UWB commoditization (prices dropping 80% since 2022)
• Enterprises mandating data sovereignty
• Developer preference for open source + on-premise

Call to Action:
"Join us in building the open future of asset tracking.
github.com/gmolina75/BalizaBt"

QR Code → GitHub repo
```

---

*End of Pitch Deck*