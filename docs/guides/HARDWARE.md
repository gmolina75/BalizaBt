# Guía de Hardware — BalizaBT

## Visión General

BalizaBT admite dos mundos de hardware: dispositivos BLE existentes (teléfonos, wearables, AirPods) y tags ESP32 personalizados. Esta guía cubre cómo integrar, programar y gestionar tags hardware.

---

## 1. Compatibilidad de Dispositivos BLE

### Lista Blanca Verificada

| Tipo | Fabricante | Modelo | RSSI típico | Batería | Compatible |
|------|-----------|--------|------------|---------|-----------|
| Teléfono | Apple | iPhone 12+ | -60 a -85 dBm | N/A | ✅ |
| Teléfono | Samsung | Galaxy S21+ | -55 a -90 dBm | N/A | ✅ |
| Auriculares | Apple | AirPods Pro | -65 a -88 dBm | 5hr carga | ✅ |
| Reloj | Apple | Watch Series 6+ | -62 a -87 dBm | 18hr | ✅ |
| Tracker | Tile | Mate/Pro | -58 a -92 dBm | 1yr | ✅ |
| Termómetro | Xiaomi | Mijia | -68 a -95 dBm | 12mo | ✅ |
| Altavoz | JBL | Flip 6 | -60 a -88 dBm | 12hr | ✅ |
| Wearable | Fitbit | Charge 5 | -63 a -90 dBm | 7day | ✅ |
| Tag | ESP32 | Custom (ver §2) | Configurable | AJUSTABLE | ✅ |

---

## 2. Tags ESP32

### Hardware Recomendado

| Componente | Modelo | Precio ~USD |
|-----------|--------|------------|
| Microcontrolador | ESP32-C3 SuperMini | $3.50 |
| ESP32 clásico | ESP32 DevKit v1 | $4.20 |
| Batería | CR2032 220mAh | $2.50 |
| Carcasa | IP67 encapsulado | $1.80 |
| **TOTAL estimado** | | **$8-12** |

### Características ESP32-C3

- **Chip**: ESP32-C3 (64-bit RISC-V, 160MHz)
- **BLE**: 2.4GHz, TX power hasta +6dBm
- **Consumo**: 3.3V, 3.5mA RX, 12mA TX (ideal para batería)
- **GPIO**: 22 pines (3 para tag)
- **Flash**: 4MB integrado

---

## 3. Programación del Firmware

### Herramientas Requeridas

```bash
# 1. Instalar Arduino CLI
curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh

# 2. Instalar core ESP32
arduino-cli core update-index
arduino-cli core install esp32:esp32

# 3. Compilar y flashear
arduino-cli sketch build --fqbn esp32:esp32:esp32-c3 firmware_baliza.ino
arduino-cli image upload -p /dev/ttyUSB0 --fqbn esp32:esp32:esp32-c3 build/
```

### Firmware Base (baliza_ble.ino)

```cpp
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

#define SERVICE_UUID        "19b10000-e29b-41d4-733f-000000000000"
#define CHARACTERISTIC_UUID "19b10001-e29b-41d4-733f-000000000000"
#define DEVICE_ID           "BBT-001"

void setup() {
  Serial.begin(115200);
  BLEDevice::init(DEVICE_ID);
  BLEServer *pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService(SERVICE_UUID);
  BLECharacteristic *pChar = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pService->start();
  BLEAdvertising *pAdv = BLEDevice::getAdvertising();
  pAdv->addServiceUUID(SERVICE_UUID);
  pAdv->setScanResponse(true);
  pAdv->setMinPreferred(0x06);
  pAdv->start();
}

void loop() {
  delay(5000); // Transmitir cada 5s
}
```

### Configuración vía CLI

```bash
# Configurar WiFi del ESP32
node cli.js esp32-config --ssid="TuRed" --password="TuClave"

# Ver tags registrados
node cli.js esp32-list

# Forzar heartbeat de un tag
node cli.js esp32-ping --id="BBT-001"

# Actualizar firmware OTA
node cli.js esp32-ota --file=firmware_baliza_v2.bin
```

---

## 4. Gestión de Batería

### Estimación de Vida de Batería (ESP32-C3)

| Configuración | TX Power | Intervalo | Corriente avg | Batería 220mAh | Duración estimada |
|--------------|----------|-----------|--------------|----------------|------------------|
| Estándar | 0dBm | 1s | 1.2mA | 220mAh | 69 días |
| Ahorro | -6dBm | 10s | 0.25mA | 220mAh | 350 días |
| Ultra bajo | -12dBm | 30s | 0.08mA | 220mAh | 1000 días |

### Configuración de Potencia

```cpp
// En el firmware:
// Alta potencia (corto alcance)
BLEDevice::setTxPower(ESP_PWR_LVL_N0);

// Bajo consumo (largo alcance batería)
BLEDevice::setTxPower(ESP_PWR_LVL_N12);
```

### Indicadores de Batería

Los tags ESP32 transmiten nivel de batería en el ADV payload:

| Nivel | Voltaje | Estado |
|-------|---------|--------|
| 3.3V+ | 100% | ✅ Óptimo |
| 3.0-3.3V | 75% | ✅ Bueno |
| 2.7-3.0V | 50% | ⚠️ ADVERTENCIA |
| 2.5-2.7V | 25% | ⚠️ Reemplazar |
| <2.5V | CRÍTICO | 🔴 Inmediato |

---

## 5. Ubicación Física y Montaje

Ver [`docs/specs/FLOORPLAN.md`](./specs/FLOORPLAN.md) para planos detallados.

### Buenas Prácticas de Instalación

1. **Altura**: 1.2-1.5m del suelo (optimiza RSSI)
2. **Antenas**: Orientar alejamiento de metal
3. **Ambiente**: Evitar interferencia WiFi 2.4GHz
4. **Cobertura**: Un beacon por 30-40 m² interior
5. **Redundancia**: Mínimo 3 beacons por zona (triangulación)

### Puntos de Instalación Típicos (Casa 200m²)

| Área | Beacons | Modelo |
|------|---------|--------|
| Entrada | 2 | ESP32-C3 |
| Salón | 2 | ESP32-C3 |
| Cocina | 1 | ESP32-C3 |
| Dormitorio principal | 2 | ESP32-C3 |
| Pasillo | 2 | ESP32-C3 |
| **TOTAL** | **9** | **$27-36 USD** |

---

## 6. Calibración de Hardware

Ver [`docs/guides/CALIBRATION.md`](./CALIBRATION.md) para el proceso completo.

### Comandos de Diagnóstico

```bash
# Medir RSSI de un beacon específico
node cli.js calibrate-rssi --id="BBT-001" --duration=30

# Escanear potencia de señal
node cli.js scan --verbose

# Forzar reinicio de tag
node cli.js esp32-reset --id="BBT-001"
```

---

## 7. Mantenimiento

### Checklist Mensual

- [ ] Verificar baterías (node cli.js battery-report)
- [ ] Revisar firmware (node cli.js firmware-check)
- [ ] Optimizar ubicación si precisión < 3m
- [ ] Limpiar base de datos (node cli.js db-vacuum)

### Reemplazo de Tags

```bash
# Registrar tag nuevo
node cli.js device-add --id="BBT-NEW" --type="tag" --label="Alacena norte"

# Transferir historial del tag viejo
node cli.js device-replace --old="BBT-OLD" --new="BBT-NEW"

# Desactivar tag viejo
node cli.js device-deactivate --id="BBT-OLD"
```