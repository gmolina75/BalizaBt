# API REST — BalizaBT

## Introducción

BalizaBT expone una API RESTful para integración con sistemas externos, dashboard web y aplicaciones móviles. La API está diseñada con principios RESTful, documentada con OpenAPI 3.0 y autenticada vía API key o JWT.

---

## Base URL

| Ambiente | URL |
|----------|-----|
| Desarrollo | `http://localhost:3000/api/v1` |
| Producción | `https://api.balizabt.dev/v1` |

---

## Autenticación

### API Key (Recomendado para servicios)

```bash
curl -H "X-API-Key: sk_live_xxxxxxxxxxxxxxxx" \
  https://api.balizabt.dev/v1/devices
```

### JWT (Recomendado para usuarios)

```bash
# 1. Login
curl -X POST https://api.balizabt.dev/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@balizabt.dev","password":"tu_password"}'

# 2. Usar token
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1..." \
  https://api.balizabt.dev/v1/devices
```

---

## Respuesta de Errores

Todos los errores siguen el formato RFC 7807 (Problem Details):

```json
{
  "type": "https://api.balizabt.dev/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "The provided device ID is invalid.",
  "instance": "/v1/devices/invalid-id",
  "errors": [
    { "field": "deviceId", "message": "Must be a valid MAC address or UUID" }
  ]
}
```

### Códigos de Estado HTTP

| Código | Descripción | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recursos creados |
| 400 | Bad Request | Parámetros inválidos |
| 401 | Unauthorized | Autenticación fallida |
| 403 | Forbidden | Permisos insuficientes |
| 404 | Not Found | Recurso no existe |
| 409 | Conflict | Conflicto de estado |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Error interno |

---

## Endpoints

### Dispositivos (Devices)

#### Listar dispositivos

```
GET /devices
```

**Parámetros de consulta:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `type` | string | null | Filtrar por tipo (`iphone`, `esp32`, `tag`, etc.) |
| `status` | string | all | `active`, `inactive`, `all` |
| `limit` | integer | 100 | Máximo número de resultados |
| `offset` | integer | 0 | Paginación |

**Respuesta:**

```json
{
  "data": [
    {
      "id": "BBT-001",
      "type": "esp32",
      "name": "Baliza Entrada",
      "mac": "AA:BB:CC:DD:00:01",
      "first_seen": "2026-05-10T08:30:00Z",
      "last_seen": "2026-05-10T14:22:15Z",
      "rssi_avg": -65.2,
      "tags": ["entrada", "principal"],
      "status": "active"
    }
  ],
  "meta": {
    "total": 8,
    "limit": 100,
    "offset": 0
  }
}
```

#### Obtener dispositivo específico

```
GET /devices/{deviceId}
```

**Respuesta:**

```json
{
  "id": "BBT-001",
  "type": "esp32",
  "name": "Baliza Entrada",
  "mac": "AA:BB:CC:DD:00:01",
  "first_seen": "2026-05-10T08:30:00Z",
  "last_seen": "2026-05-10T14:22:15Z",
  "rssi_history": [-65, -64, -66, -63, -65],
  "tags": ["entrada", "principal"],
  "annotations": [
    {
      "id": "ann-001",
      "timestamp": "2026-05-10T10:00:00Z",
      "note": "Instalado en pared de entrada",
      "user": "devMaster"
    }
  ],
  "status": "active"
}
```

#### Registrar nuevo dispositivo

```
POST /devices
```

**Request body:**

```json
{
  "id": "BBT-009",
  "type": "esp32",
  "name": "Baliza Cocina",
  "mac": "AA:BB:CC:DD:00:09",
  "tags": ["cocina", "refuerzo"]
}
```

**Respuesta:** `201 Created` + objeto dispositivo

---

### Detecciones (Sightings)

#### Listar detecciones

```
GET /sightings
```

**Parámetros de consulta:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `device_id` | string | null | Filtrar por dispositivo |
| `start_time` | ISO 8601 | null | Fecha inicio (UTC) |
| `end_time` | ISO 8601 | null | Fecha fin (UTC) |
| `limit` | integer | 1000 | Máximo de resultados |

**Respuesta:**

```json
{
  "data": [
    {
      "id": "sighting-001",
      "device_id": "BBT-001",
      "rssi": -67,
      "timestamp": "2026-05-10T14:22:15Z",
      "scanner_id": "scanner-01",
      "distance": 2.3
    }
  ],
  "meta": { "total": 1247 }
}
```

#### Registrar detección

```
POST /sightings
```

**Request body:**

```json
{
  "device_id": "BBT-001",
  "rssi": -67,
  "scanner_id": "scanner-01"
}
```

---

### Posicionamiento (Location)

#### Calcular posición actual

```
GET /location
```

**Parámetros de consulta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `device_id` | string | ID del dispositivo a localizar |
| `algorithm` | string | `avg_rssi` (default), `knn`, `trilateration` |

**Respuesta:**

```json
{
  "device_id": "BBT-001",
  "x": 3.45,
  "y": 2.12,
  "z": 0.0,
  "floor": 1,
  "accuracy": 1.8,
  "algorithm": "trilateration",
  "timestamp": "2026-05-10T14:25:00Z"
}
```

#### Historial de posiciones

```
GET /location/history/{deviceId}
```

**Respuesta:**

```json
{
  "device_id": "BBT-001",
  "positions": [
    {
      "x": 3.45,
      "y": 2.12,
      "accuracy": 1.8,
      "timestamp": "2026-05-10T14:25:00Z"
    },
    {
      "x": 4.10,
      "y": 1.80,
      "accuracy": 2.1,
      "timestamp": "2026-05-10T14:20:00Z"
    }
  ]
}
```

---

### Analítica Temporal

#### Estadísticas de dispositivo

```
GET /analytics/stats/{deviceId}
```

**Respuesta:**

```json
{
  "device_id": "BBT-001",
  "total_sightings": 247,
  "first_seen": "2026-05-10T08:00:00Z",
  "last_seen": "2026-05-10T14:25:00Z",
  "avg_rssi": -65.2,
  "min_rssi": -85,
  "max_rssi": -58,
  "presence_hours": 6.4,
  "absence_hours": 17.6,
  "patterns": ["office-hours", "lunch-break"]
}
```

#### Patrones detectados

```
GET /analytics/patterns
```

**Respuesta:**

```json
{
  "patterns": [
    {
      "device_id": "BBT-001",
      "pattern": "office-hours",
      "confidence": 0.92,
      "schedule": "09:00-17:00 daily",
      "description": "Activo durante horas laborales"
    }
  ]
}
```

---

### Anotaciones (Annotations)

#### Listar anotaciones

```
GET /annotations?device_id={deviceId}
```

#### Crear anotación

```
POST /annotations
```

**Request body:**

```json
{
  "device_id": "BBT-001",
  "note": "Reemplazado por baliza nueva - revisar instalación",
  "category": "maintenance"
}
```

#### Eliminar anotación

```
DELETE /annotations/{annotationId}
```

---

### Configuración (ESP32)

#### Configurar WiFi

```
POST /esp32/config
```

**Request body:**

```json
{
  "device_id": "BBT-001",
  "ssid": "TuRed",
  "password": "TuClave"
}
```

#### Reiniciar ESP32

```
POST /esp32/reboot/{deviceId}
```

#### Actualización OTA

```
POST /esp32/ota
```

**Request body:**

```json
{
  "device_id": "BBT-001",
  "firmware_url": "https://firmware.balizabt.dev/v2.1.0.bin"
}
```

---

### Health & Diagnostics

#### Estado del sistema

```
GET /health
```

**Respuesta:**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": "3h 25m",
  "database": {
    "connected": true,
    "mode": "wal",
    "tables": { "devices": 8, "sightings": 1247 }
  },
  "scanner": {
    "mode": "simulation",
    "devices_tracked": 8,
    "scan_rate": "1s"
  },
  "timestamp": "2026-05-10T14:30:00Z"
}
```

#### Diagnóstico completo

```
GET /diagnostics
```

---

## SDK y Clientes

### JavaScript/Node.js

```javascript
import { BalizaBTClient } from '@balizabt/client';

const client = new BalizaBTClient({
  baseURL: 'https://api.balizabt.dev/v1',
  apiKey: 'sk_live_xxxxxxxx'
});

const devices = await client.devices.list();
const location = await client.location.get('BBT-001');
```

### Python

```python
from balizabt import BalizaBTClient

client = BalizaBTClient(api_key='sk_live_xxxxxxxx')
devices = client.devices.list(type='esp32')
```

### cURL

```bash
# Autenticar y listar dispositivos
curl -H "X-API-Key: sk_live_xxxxxxxx" \
  https://api.balizabt.dev/v1/devices
```

---

## Rate Limits

| Plan | Límite | Ventana |
|------|--------|---------|
| Free | 100 req/min | 1 minuto |
| Pro | 1,000 req/min | 1 minuto |
| Enterprise | Ilimitado | - |

Los errores de rate limit retornan `429` con header `Retry-After`.

---

## Webhooks

BalizaBT envía notificaciones a endpoints configurados para eventos en tiempo real.

**Eventos disponibles:**
- `device.detected` — Nuevo dispositivo detectado
- `device.missing` — Dispositivo fuera de rango
- `location.threshold` — Dispositivo cruzó geocerca
- `battery.low` — Tag con batería baja

**Ejemplo webhook:**

```json
{
  "event": "device.detected",
  "timestamp": "2026-05-10T14:30:00Z",
  "data": {
    "device_id": "BBT-001",
    "rssi": -67,
    "estimated_distance": 2.1
  },
  "signature": "sha256=abc123..."
}
```

---

## OpenAPI Spec

La especificación completa OpenAPI está disponible en:
```
https://api.balizabt.dev/v1/openapi.json
```

O descárgala:
```bash
curl -o openapi.json https://api.balizabt.dev/v1/openapi.json
```