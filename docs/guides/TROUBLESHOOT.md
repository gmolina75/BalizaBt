# Guía de Solución de Problemas — BalizaBT

## Introducción

Esta guía ayuda a diagnosticar y resolver problemas comunes en BalizaBT. Usa los comandos de diagnóstico integrados para identificar problemas rápidamente.

```bash
# Herramienta de diagnóstico integral
node cli.js diagnose
```

---

## 1. Problemas de Conexión BLE

### Síntoma: No se detectan dispositivos

```bash
# Verificar estado del escáner
node cli.js scan --dry-run

# Output esperado:
# ✅ Modo: Simulación
# 📡 Adaptador: virtual
# 🔍 Escaneando... (0 dispositivos en 5s)
```

### Causas y Soluciones

| Causa | Diagnóstico | Solución |
|-------|-------------|----------|
| **Adaptador BLE no disponible** | `hciconfig` vacío | Conectar adaptador USB Bluetooth 5.0+ |
| **Drivers obsoletos** | `lsusb` no muestra adaptador | Actualizar drivers del fabricante |
| **Modo simulación activado** | Verificado en dry-run | Funciona normal (genera datos sintéticos) |
| **Permisos insuficientes** | `EACCES: permission denied` | `sudo setcap cap_net_raw+eip $(which node)` |

### Comprobar adaptador (Linux/WSL2)

```bash
# Listar adaptadores
hciconfig -a

# Activar adaptador
sudo hciconfig hci0 up

# Verificar estado BLE
btmon
```

---

## 2. Problemas de Base de Datos

### Síntoma: Error de escritura o lectura

```bash
# Verificar integridad de DB
node cli.js db-verify

# Output esperado:
# ✅ Base de datos: bluetooth_devices.db
# ✅ Modo WAL: Activo
# ✅ Integridad: OK (0 errores)
# ✅ Tablas: devices (8), sightings (1247)
```

### Causas y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `SQLITE_READONLY` | Permisos de archivo | `chmod 666 bluetooth_devices.db` |
| `SQLITE_CORRUPT` | Cierre inesperado | `node cli.js db-repair` |
| `SQLITE_FULL` | Disco lleno | Limpiar espacio o vacuum DB |
| `database is locked` | Concurrencia | Activar `busy_timeout` (ya configurado) |

### Recuperación de DB corrupta

```bash
# Reparar base de datos
node cli.js db-repair

# Recuperar desde backup (si existe)
node cli.js db-restore --backup="backups/db_20260501.db"

# Exportar datos antes de reparar
node cli.js export --file="recovery_export.json"
```

---

## 3. Problemas de Precisión de Posicionamiento

### Síntoma: Posición inexacta (> 5m de error)

```bash
# Diagnostico de precisión
node cli.js precision-check --samples=100
```

### Causas y Soluciones

| Causa | Síntoma | Solución |
|-------|---------|----------|
| **Multipath (reflexión)** | RSSI salta ±10dB | Añadir beacon, reducir TX power |
| **Obstáculos** | RSSI bajo consistente | Reubicar beacon, añadir reforzado |
| **Drift de temperatura** | Error progresivo | Recalibrar (ver CALIBRATION.md) |
| **Firmas estancadas** | Posición "pegada" | Recolectar fingerprints nuevas |
| **Beacons desincronizados** | Latencia >100ms | Calibrar intervalos (ver CALIBRATION.md §2) |

### Zona muerta

```bash
# Detectar zonas muertas
node cli.js zone-dead-zones --grid-size=1

# Output:
# 🔴 Zona muerta detectada: (3.5, 2.0) - Sin cobertura de 3+ beacons
# 💡 Solución: Instalar beacon refuerzo BBT-010 en (3.5, 2.0)
```

---

## 4. Problemas de ESP32

### Síntoma: ESP32 no aparece en escáner

```bash
# Verificar tags registrados
node cli.js esp32-list

# Forzar reset
node cli.js esp32-reset --id="BBT-001"

# Medir señal directamente
node cli.js rssi-test --id="BBT-001" --duration=10
```

### Códigos de Error ESP32

| Código | Significado | Causa | Solución |
|--------|-------------|-------|----------|
| `BTS-001` | No advertising | Firmware no cargado | Flashear firmware (ver HARDWARE.md §3) |
| `BTS-002` | Advertising pero sin datos | Configuración invalida | Reconfigurar service UUID |
| `BTS-003` | Señal débil (< -90dBm) | Batería baja o mala ubicación | Reemplazar batería, reubicar |
| `BTS-004` | Heartbeat perdido | Fuera de rango | Verificar cobertura, añadir beacon |
| `BTS-005` | Firmware desactualizado | Versión antigua | Actualizar vía OTA |

### Reinicio de emergencia

```bash
# Hard reset ESP32
node cli.js esp32-reset --id="BBT-001" --hard

# Reflashear firmware completo
node cli.js esp32-flash --id="BBT-001" --erase-first
```

---

## 5. Problemas de Rendimiento

### Síntoma: Aplicación lenta o memoria alta

```bash
# Diagnóstico de rendimiento
node cli.js profile --duration=30

# Output:
# CPU: 12% (promedio)
# Memoria: 45MB / 128MB
# DB queries: 23/s
# RSSI samples: 142/s
```

### Optimización

| Problema | Solución |
|----------|----------|
| DB lento | Activar índices, vacuum periódico |
| Memoria alta | Reducir buffer de escáner |
| CPU alta (>80%) | Reducir frecuencia de escaneo |
| Delay en localización | Aumentar número de beacons de cobertura |

```bash
# Activar vacuum automático
node cli.js configure --auto-vacuum="24h"

# Optimizar índices DB
node cli.js db-optimize

# Ajustar buffer de escáner
node cli.js configure --scan-buffer=500
```

---

## 6. Problemas en Windows

### Modo simulación vs. Hardware

| Característica | Modo simulación | Modo hardware (WSL2) |
|----------------|-----------------|----------------------|
| Compatibilidad | ✅ Windows/macOS/Linux | ⚠️ Requiere WSL2 + Linux |
| Dispositivos reales | ❌ Solo simulados | ✅ Hardware real |
| Precisión | ✅ Datos realistas | ✅ Precisión física |
| Latencia | Baja | Dependiente USB passthrough |

### Ejecutar con WSL2 (Windows)

```powershell
# 1. Instalar WSL2 + Ubuntu
wsl --install -d Ubuntu-22.04

# 2. Dentro de WSL2:
sudo apt update && sudo apt install bluetooth bluez
sudo setcap cap_net_raw+eip $(which node)

# 3. Passthrough adaptador USB
# En Windows: dispositivos Bluetooth > compartir con WSL2
```

---

## 7. Tabla de Diagnóstico Rápido

```
node cli.js diagnose --quick
```

| Componente | Estado | Recomendación |
|-----------|--------|---------------|
| Node.js | ✅ v24.21.0 | OK |
| better-sqlite3 | ✅ 11.3.0 | OK |
| Base de datos | ✅ Conectada | OK |
| Escáner | ✅ Modo simulación | Funciona |
| Dispositivos | ✅ 8 registrados | OK |
| ESP32 tags | ✅ 3 activos | OK |
| Firmware | ✅ v1.2.0 | OK |
| Precisión | ⚠️ 2.1m | Calibrar (ver CALIBRATION.md) |
| Cobertura | ✅ 98% | OK |
| **ESTADO GLOBAL** | ✅ **Listo** | **Operativo** |

---

## 8. Recuperación de Emergencia

### Protocolo de Fallo Total

```bash
# 1. Parar escáner
node cli.js stop

# 2. Verificar hardware
node cli.js diagnose --hardware

# 3. Respaldar datos
node cli.js export --all --file="emergency_backup.json"

# 4. Reiniciar sistema
node cli.js reset --confirm

# 5. Restaurar datos
node cli.js import --file="emergency_backup.json"

# 6. Re-calibrar
node cli.js calibrate-auto --quick
```

### Contacto de Soporte

- 📧 Email: soporte@balizabt.dev
- 🐞 GitHub Issues: https://github.com/gmolina75/BalizaBT/issues
- 📱 Discord: BalizaBT Community (enlace en README)

### Información para Reportar

Cuando reportes un problema, incluye:
```
node cli.js diagnose --full --output=diagnostic.json
```

Y adjunta el archivo con tu reporte de issue.