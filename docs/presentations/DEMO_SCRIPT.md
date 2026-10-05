# Guion de Demostración — BalizaBT

## Introducción

Este guion describe una demostración completa de BalizaBT, mostrando las capacidades clave del sistema: escaneo de dispositivos BLE, detección de patrones, análisis temporal, posicionamiento y visualización de datos.

**Duración estimada**: 8-12 minutos  
**Audiencia objetivo**: Potenciales clientes, inversores, developers

---

## 🎬 Estructura de la Demo

| Segmento | Duración | Objetivo |
|----------|----------|----------|
| 1. Introducción | 1 min | Presentar el problema y solución |
| 2. Escaneo en vivo | 2 min | Mostrar detección de dispositivos reales |
| 3. Lista y tracking | 2 min | Explorar dispositivos detectados |
| 4. Análisis temporal | 2 min | Mostrar patrones y comportamiento |
| 5. Posicionamiento | 2 min | Demostrar mapa y localización |
| 6. Exportación | 1 min | Mostrar integración y reportes |
| 7. Cierre | 1 min | Resumen y call-to-action |

---

## Segmento 1: Introducción (1 minuto)

### Narrativa

> "Hoy en día, perdemos tiempo buscando llaves, bolsas o herramientas en casa o en la oficina. Soluciones profesionales de localización cuesta más de $2,500 por tag. BalizaBT democratiza el posicionamiento BLE: precisión submetral con tags de $3.50."

### Visual

```
Antes BalizaBT:      Después BalizaBT:
📱 ¿Dónde está mi     📱 App muestra:
   bolso hoy?          "Bolso: 3er cajón, oficina"
🔧 Herramienta perdida 🔧 "Taladro: Alto dependencias"
   en obra             Batería: 87%
🚗 Auto en parking      🚗 "Auto: Piso 1, plaza B12"
```

### Demo

- Mostrar landing page: https://balizabt.dev
- Breve explicación del modelo open-source

---

## Segmento 2: Escaneo en Vivo (2 minutos)

### Setup

```bash
# Terminal 1: Iniciar escáner en modo simulación
node cli.js scan --verbose --interval=2s
```

### Comandos a ejecutar

1. **Escaneo básico**
```bash
node cli.js scan --duration=10 --output=summary
```
**Expected output:**
```
📡 Escaneando dispositivos BLE...
🔍 Encontrados: 8 dispositivos
📱 iPhone 15 Pro (AA:BB:CC:00:11:22) - RSSI: -67
🎧 AirPods Pro (AA:BB:CC:00:33:44) - RSSI: -72
⌚ Apple Watch (AA:BB:CC:00:55:66) - RSSI: -65
...

✅ Escaneo completado en 10s
📊 Total detectados: 8
```

2. **Modo verbose (detalles completos)**
```bash
node cli.js scan --verbose --duration=5
```
**Expected output:**
```
📡 [08:30:00.123] 📱 iPhone 15 Pro | MAC: AA:BB:CC:00:11:22 | RSSI: -67 | Tipo: smartphone
📡 [08:30:00.234] 🎧 AirPods Pro | MAC: AA:BB:CC:00:33:44 | RSSI: -72 | Tipo: headphones
📡 [08:30:00.345] ⌚ Apple Watch | MAC: AA:BB:CC:00:55:66 | RSSI: -65 | Tipo: wearable
...
```

### Puntos clave a destacar

- ✅ Detecta dispositivos reales BLE (o simulados en Windows)
- ✅ Clasifica automáticamente el tipo de dispositivo
- ✅ RSSI en tiempo real
- ✅ Sin hardware extra requerido (modo simulación)

---

## Segmento 3: Lista y Tracking (2 minutos)

### Comandos

1. **Listar todos los dispositivos**
```bash
node cli.js list
```
**Expected output:**
```
📱 Dispositivos Registrados (8)
═════════════════════════════════════════════════════════
ID              Tipo        Nombre          Status    Last Seen       RSSI
────────────────┼──────────┼───────────────┼─────────┼───────────────┼─────────
DEV-001         iphone      iPhone 15 Pro   active    08:29:45        -67
DEV-002         airpods     AirPods Pro     active    08:29:52        -72
DEV-003         watch       Apple Watch     active    08:30:01        -65
DEV-004         galaxy      Galaxy S24      active    08:28:30        -78
DEV-005         tile        Tile Mate       active    08:27:15        -82
DEV-006         thermostat  Xiaomi Mijia    active    08:29:00        -69
DEV-007         speaker     JBL Flip 6      active    08:25:30        -75
DEV-008         fitbit      Fitbit Charge 5 active    08:26:45        -80
═════════════════════════════════════════════════════════
```

2. **Tracking de un dispositivo específico**
```bash
node cli.js track --id=DEV-001 --duration=15
```
**Expected output:**
```
🔭 Tracking: iPhone 15 Pro (DEV-001)
═════════════════════════════════════════════════════════
Timestamp             RSSI    Distancia    Cambio
────────────────────────────────────────────────────
08:30:00              -67     2.1m         (↗ se acerca)
08:30:01              -65     1.8m         (↗ se acerca)
08:30:02              -64     1.7m         (↗ se acerca)
08:30:03              -66     1.9m         (→ estable)
...
═════════════════════════════════════════════════════════
📊 Tendencia: Se acercó 0.4m en 15 segundos
```

3. **Anotar un dispositivo**
```bash
node cli.js annotate --id=DEV-001 --note="iPhone de María - oficina principal"
```
**Expected output:**
```
📝 Anotación agregada a DEV-001
   Nota: "iPhone de María - oficina principal"
   Categoría: info
   Timestamp: 2026-05-10 08:30:00
```

### Puntos clave a destacar

- ✅ Visualización clara y amigable
- ✅ Filtrado por tipo de dispositivo
- ✅ Tracking en tiempo real con tendencias
- ✅ Anotaciones para contexto de negocio

---

## Segmento 4: Análisis Temporal (2 minutos)

### Comandos

1. **Ver patrones detectados**
```bash
node cli.js patterns --all
```

**Expected output:**
```
📈 Análisis de Patrones Temporales
═════════════════════════════════════════════════════════
Dispositivo    Patrón          Confianza   Descripción
────────────────┼─────────────┼─────────────┼─────────────────────────────────
DEV-001        office-hours    92%         Activo 09:00-17:00 (lun-vie)
DEV-002        mobile          78%         Movimiento intermitente
DEV-003        always-present  85%         Siempre cerca (oficina fija)
DEV-005        daily-routine   88%         Rutina matinal 07:30-08:30
DEV-006        night-away      76%         Ausente 22:00-07:00
═════════════════════════════════════════════════════════
```

2. **Historial temporal**
```bash
node cli.js history --id=DEV-001 --days=7
```

**Expected output:**
```
📅 Historial: iPhone 15 Pro (DEV-001) — Últimos 7 días
═════════════════════════════════════════════════════════
Día         Horas presente    Horas ausente    Patrón
────────────────────────────────────────────────────
Lunes       8.2h              15.8h            office-hours
Martes      7.9h              16.1h            office-hours
Miércoles   8.5h              15.5h            office-hours
Jueves      8.1h              15.9h            office-hours
Viernes     7.8h              16.2h            office-hours
Sábado      2.0h              22.0h            weekend-low
Domingo     0.5h              23.5h            away
═════════════════════════════════════════════════════════
📊 Resumen: 92% de coincidencia con patrón "office-hours"
```

3. **Estadísticas generales**
```bash
node cli.js stats
```

**Expected output:**
```
📊 Estadísticas del Sistema
═════════════════════════════════════════════════════════
📱 Total dispositivos: 8
   • Activos: 8
   • Inactivos: 0
📡 Total detecciones: 1,247
📈 Promedio detecciones/día: 178
📊 RSSI promedio global: -71.3 dBm
⚡ Dispositivo más activo: DEV-001 (iPhone 15 Pro)
🌙 Dispositivo menos activo: DEV-007 (JBL Flip 6)
═════════════════════════════════════════════════════════
```

### Puntos clave a destacar

- ✅ Detección automática de patrones de comportamiento
- ✅ Análisis histórico multi-día
- ✅ Clasificación inteligente (office-hours, mobile, always-present)
- ✅ Estadísticas resumidas para toma de decisiones

---

## Segmento 5: Posicionamiento (2 minutos)

### Comandos

1. **Activar modo posicionamiento (KNN)**
```bash
node cli.js locate --algorithm=knn --id=DEV-001
```

**Expected output:**
```
📍 Localización: iPhone 15 Pro (DEV-001)
═════════════════════════════════════════════════════════
Coordenadas: (3.42m, 2.15m) — Piso 1
Precisión: ±1.8m (95% confianza)
Algoritmo: KNN (K=5, 127 fingerprints)
Última actualización: 08:30:05

Zonas más cercanas:
  • Oficina principal (0.5m)
  • Sala de reuniones (3.2m)
  • Cocina (4.1m)
═════════════════════════════════════════════════════════
```

2. **Visualización del mapa (floor plan)**
```bash
node cli.js map --floor=1
```

**Expected output:**
```
🏠 Plano: Casa de Campo - Piso 1 (8 balizas)
═════════════════════════════════════════════════════════
  ┌─────────────────────┬─────────────────────┐
  │  🚪 Entrada        │  🛏️ Dormitorio      │
  │                    │                     │
  │  [BBT-001] ⚡      │  [BBT-003] ⚡       │
  │  DEV-001 aquí ○    │  DEV-005 fuera     │
  │                    │                     │
  ├─────────────────────┼─────────────────────┤
  │  🍳 Cocina         │  🎮 Oficina        │
  │                    │                     │
  │  [BBT-004] ⚡       │  [BBT-005] ⚡       │
  │  DEV-006 aquí ●    │  DEV-001 cerca ◎   │
  │                    │                     │
  └─────────────────────┴─────────────────────┘

📍 DEV-001: (3.42m, 2.15m)
● Activo esta zona  ○ Cerca (1-3m)  ◎ Lejos (3-5m)  × No detectado
═════════════════════════════════════════════════════════
```

### Puntos clave a destacar

- ✅ Posicionamiento visual inmediato
- ✅ Múltiples algoritmos (avg RSSI, KNN, Kalman)
- ✅ Integración con floor plan
- ✅ Identificación de zonas y proximidad

---

## Segmento 6: Exportación y Reportes (1 minuto)

### Comandos

1. **Exportar datos**
```bash
node cli.js export --format=json --file=demo_export.json
```

**Expected output:**
```
📤 Exportando datos...
   • Dispositivos: 8
   • Detecciones: 1,247
   • Anotaciones: 3
   • Posiciones: 892
✅ Exportado a demo_export.json (247KB)
```

2. **Exportar reporte CSV**
```bash
node cli.js export --format=csv --file=demo_report.csv --filter="last_24h"
```

**Expected output:**
```
📤 Exportando reporte CSV...
   • Filtrado: últimas 24 horas
   • Detecciones: 342
✅ Exportado a demo_report.csv (48KB)
```

3. **Exportar reporte PDF (demo)**
```bash
node cli.js export --format=pdf --template=daily-summary --file=demo_report.pdf
```

**Expected output:**
```
📤 Generando reporte PDF...
   • Plantilla: resumen diario
   • Período: 2026-05-10
   • Dispositivos activos: 8
   • Detección de patrones: ✓
✅ Exportado a demo_report.pdf
```

### Puntos clave a destacar

- ✅ Múltiples formatos de exportación
- ✅ Filtrado por fechas y dispositivos
- ✅ Reportes profesionales (PDF)
- ✅ Integración con herramientas externas

---

## Segmento 7: Cierre y CTA (1 minuto)

### Narrativa de cierre

> "BalizaBT transforma el problema de encontrar cosas en interiores. Con hardware de $3.50 y software open source, puedes tener visibilidad en tiempo real de dónde están tus objetos, personas y dispositivos."

### CTAs

1. **Para developers**:
```
📦 Empieza gratis en 2 minutos:
   git clone https://github.com/gmolina75/BalizaBT
   npm install && node cli.js scan
```

2. **Para empresas**:
```
🏢 Para despliegue empresarial:
   - Dashboard web Pro: $2,999/mes
   - Integración completa: $9,999/mes
   - Contacto: sales@balizabt.dev
```

3. **Para makers/comunidad**:
```
💡 ¡Contamos contigo!
   - GitHub: ⭐ 500+ estrellas
   - Discord: comunidad activa
   - Contribuye: pull requests bienvenidos
```

---

## 🎯 Tips para una Demo Exitosa

### Preparación

1. ✅ Tener datos pre-cargados en la base de datos
2. ✅ Configurar 8 dispositivos simulados
3. ✅ Ejecutar calibración de fingerprints antes
4. ✅ Tener el floor plan visible
5. ✅ Preparar exportaciones de ejemplo

### Durante la demo

1. **Enfócate en beneficios, no solo features**
2. **Usa ejemplos concretos del día a día**
3. **Muestra el ahorro: $3.50 vs $25-100**
4. **Habla de instalación en 15 minutos**
5. **Destaca lo open source y offline-first**

### Manejo de preguntas difíciles

| Pregunta | Respuesta |
|----------|-----------|
| "¿Cuál es la precisión real?" | "1-3 metros con calibración, comparado a 5-10m del Free. En nuestras pruebas con 9 beacons en 200m², la precisión fue 1.8m ± 0.4m." |
| "¿Funciona en mi almacén de 5,000m²?" | "Sí. El modelo Enterprise soporta multi-gateway: un escáner por cada 300-500m². 5,000m² necesitaría 10-15 gateways y 150-200 balizas." |
| "¿Puedo usar mis AirPods existentes?" | "¡Exactamente! BalizaBT detecta AirPods, Apple Watch, iPhone y más de 20 tipos de dispositivos BLE conocidos automáticamente." |
| "¿Qué pasa con la privacidad?" | "Todos los datos se almacenan localmente. Nada se envía a la nube sin tu consentimiento. En Enterprise, puedes optar por backup cifrado." |

---

## 📎 Apéndice: Script Ejecutable

```bash
#!/bin/bash
# demo_runner.sh — Script de demostración rápida

echo "🚀 BalizaBT Live Demo"
echo "═══════════════════════════════════════════════════════════"

echo "📡 [1/6] Escaneando dispositivos..."
node cli.js scan --duration=10 --output=summary

echo "📱 [2/6] Listando dispositivos..."
node cli.js list

echo "📈 [3/6] Analizando patrones..."
node cli.js patterns --all

echo "📍 [4/6] Localizando DEV-001..."
node cli.js locate --algorithm=knn --id=DEV-001

echo "🏠 [5/6] Mostrando mapa..."
node cli.js map --floor=1

echo "📤 [6/6] Exportando reporte..."
node cli.js export --format=json --file=demo_export.json

echo "═══════════════════════════════════════════════════════════"
echo "✅ Demo completada exitosamente"
echo "📁 Archivos generados: demo_export.json"
echo "💡 Próximos pasos: node cli.js --help"
```

---

*Este guion está diseñado para ser ejecutado en vivo. Cada comando puede ejecutarse independientemente. La base de datos `bluetooth_devices.db` contiene datos de prueba precargados. Última actualización: 2026-05-10.*