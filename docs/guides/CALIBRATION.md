# Guía de Calibración — BalizaBT

## Introducción

La calibración es el proceso de ajustar el sistema de posicionamiento BLE para maximizar la precisión dentro de un entorno específico. La precisión típica sin calibración es de 5-10 metros; con calibración puede alcanzar 1-3 metros en interiores.

---

## 1. Calibración de RSSI (Received Signal Strength Indicator)

### Principio

El RSSI disminuye con la distancia siguiendo el modelo de pérdida de trayectoria:
```
RSSI = RSSI₀ - 10n·log₁₀(d/d₀)
```
Donde:
- `RSSI₀`: RSSI a 1 metro (promedio)
- `n`: exponente de atenuación (1.5-4 dependiendo del entorno)
- `d`: distancia en metros

### Procedimiento

**Paso 1: Escoger puntos de referencia conocidos**

```
┌─────────────────────────────────────┐
│   Punto de referencia con distancia │
│   conocida a cada beacon            │
└─────────────────────────────────────┘
```

| Punto | Coordenadas (x,y) | Beacon 1 RSSI | Beacon 2 RSSI | Beacon 3 RSSI |
|-------|-------------------|---------------|---------------|---------------|
| A     | (2.0, 1.5)        | TBD           | TBD           | TBD           |
| B     | (5.0, 3.0)        | TBD           | TBD           | TBD           |
| C     | (1.0, 4.5)        | TBD           | TBD           | TBD           |

**Paso 2: Medir RSSI**

```bash
# Medir RSSI a 30 segundos en cada punto
node cli.js calibrate-rssi --id="BBT-001" --duration=30 --point="A"
node cli.js calibrate-rssi --id="BBT-002" --duration=30 --point="A"
node cli.js calibrate-rssi --id="BBT-003" --duration=30 --point="A"
```

**Paso 3: Calcular parámetros**

| Beacon | RSSI₀ @ 1m | Exponente n | R² calidad |
|--------|------------|------------|-----------|
| BBT-001 | -62 dBm | 2.1 | 0.92 |
| BBT-002 | -65 dBm | 2.3 | 0.89 |
| BBT-003 | -63 dBm | 2.0 | 0.94 |

### Script de Calibración Automática

```bash
# Ejecutar calibración completa
node cli.js calibrate-auto --room="salon" --beacons="3"

# Output esperado:
# 📡 Escaneando 3 beacons...
# 📍 Punto A completado (RSSI promedio calculado)
# 📍 Punto B completado
# 📍 Punto C completado
# 📊 Modelo de atenuación: RSSI = -64 - 10*2.1*log10(d)
# ✅ Calibración completada. Precisión estimada: 1.8m
```

---

## 2. Calibración de Tiempo (Timing Calibration)

### Optimización de Intervalos de Escáner

| Escenario | Intervalo escaneo | Potencia CPU | Precisión | Consumo |
|-----------|-------------------|---------------|-----------|---------|
| Monitoreo continuo | 1s | Alta | ✅ Máxima | Alto |
| Balanceado | 5s | Media | ✅ Alta | Moderado |
| Ahorro energía | 30s | Baja | ⚠️ Moderada | Bajo |

```bash
# Configurar para monitoreo continuo
node cli.js configure --scan-interval 1000

# Configurar para ahorro energía (tags remotos)
node cli.js configure --scan-interval 30000
```

---

## 3. Calibración de Posicionamiento (Triangulación)

### Fingerprinting

1. **Recolección de huellas digitales**:
   - En cada celda del mapa, registrar el RSSI promedio de cada beacon
   - Repetir en diferentes momentos del día

```bash
# Crear mapa de huellas digitales
node cli.js fingerprint-collect --grid-size=2 --duration=300
```

2. **Almacenamiento**: Las huellas se guardan en `fingerprints` table:
   ```sql
   CREATE TABLE fingerprints (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       x REAL NOT NULL,
       y REAL NOT NULL,
       device_id TEXT NOT NULL,
       rssi_avg REAL NOT NULL,
       rssi_stddev REAL,
       timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY(device_id) REFERENCES devices(id)
   );
   ```

3. **Posicionamiento con KNN**:
   ```bash
   # Calcular posición usando K vecinos más cercanos
   node cli.js locate --knn=5
   ```

### Calibración de Geometría

**Verificación del layout de beacons**:

```bash
# Visualizar layout
node cli.js layout-show

# Validar triangulación
node cli.js calibrate-geometry --validate
```

---

## 4. Calibración de Ambiente

### Factores Ambientales

| Factor | Impacto | Solución |
|--------|---------|----------|
| Humedad alta (>70%) | Atenuación +3dB | Compensar +3dB en config |
| Metal/reflección | Multipath + variación | Ajustar n=3.0 (entorno rígido) |
| Madera gruesa | Atenuación -5dB | Añadir beacon adicional |
| Humedad baja (<20%) | Reflexión estática | Sin compensación |

```bash
# Configurar compensación ambiental
node cli.js environment --humidity-compensation +3dB
node cli.js environment --material-factor 1.2
```

---

## 5. Métricas de Calibración

### Reporte de Precisión

```bash
# Generar reporte de precisión
node cli.js calibration-report

📋 REPORTE DE CALIBRACIÓN
═════════════════════════
📍 Dispositivos calibrados: 9
📏 Precisión promedio: 1.8m (objetivo: <3m)
📊 Desviación estándar: 0.4m
📈 Cobertura: 98% del área
⚠️ Zonas de error: 2 (necesitan beacon adicional)

✅ Estado: CALIBRADO - Listo para producción
```

### Threshold de Alerta

| Métrica | Umbral OK | Umbral Warning | Umbral Critical |
|---------|-----------|----------------|----------------|
| Precisión avg | <3m | 3-5m | >5m |
| Cobertura | >95% | 90-95% | <90% |
| Desviación | <0.5m | 0.5-1m | >1m |

---

## 6. Re-calibración

### Automática

```bash
# Recalibrar cada 24 horas
node cli.js recalibrate-auto --schedule="24h"
```

### Manual (cuando se mueve hardware)

```bash
# Re-calibrar un beacon movido
node cli.js recalibrate-beacon --id="BBT-001"

# Re-calibrar todos
node cli.js recalibrate-all
```

---

## 7. Guía de Ajustes Rápidos (Troubleshooting)

| Síntoma | Causa probable | Acción |
|---------|---------------|--------|
| Posición salta >5m | Multipath/metales | Añadir beacon, reducir TX power |
| RSSI bajo (< -90) | Distancia o obstáculo | Reubicar beacon más cerca |
| Drift consistente | Drift de temperatura | Calibrar en condiciones estables |
| "Zona muerta" | Cobertura insuficiente | Añadir beacon de refuerzo |
| Falsos positivos | Huellas estancadas | Recolectar fingerprints frescas |

---

## 8. Calibración de Producción

### Proceso de Entrega

```
1. Instalación hardware (ver HARDWARE.md)
2. Calibración de geometría
3. Recolección de fingerprints (3 rounds, 1h cada uno)
4. Validación con ground truth (10 puntos)
5. Generación de certificado de calibración
6. Despliegue a producción
```

### Certificado de Calibración

```
📅 Fecha: 2026-05-10
👤 Técnico: devMaster
🏠 Sitio: Casa 200m²
📡 Beacons: 9 ESP32-C3
📏 Precisión: 1.8m promedio
📊 Cobertura: 98%
✅ Certificado: CAL-2026-05-10-BBT
```