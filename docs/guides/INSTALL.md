# Guía de Instalación — BalizaBT

## Requisitos del Sistema

### Soportados
| Componente | Versión mínima | Notas |
|-----------|---------------|-------|
| Node.js | 20 LTS o superior | v24 recomendado |
| NPM / YARN | Cualquier gestor | Incluido con Node.js |
| SQLite | Integrado (better-sqlite3) | No requiere instalación separada |
| Espacio en disco | 50 MB | Incluyendo node_modules |

### Recomendado para Producción
| Componente | Versión | Propósito |
|-----------|---------|----------|
| WSL2 + Ubuntu 22.04 | Última | Ejecución con bindings BLE reales |
| Docker | Última | Contenedorizado despliegue |
| ESP32-C3 | Cualquier variante | Tags BLE de hardware |

---

## Instalación Rápida

### Opción 1: NPM (Recomendada)

```bash
# Clonar el repositorio
git clone https://github.com/gmolina75/BalizaBT.git
cd BalizaBT

# Instalar dependencias
npm install

# Ejecutar en modo simulación (funciona en Windows)
node cli.js scan
```

### Opción 2: Instalación Global

```bash
npm install -g @gmolina75/balizabt
balizabt scan
```

### Opción 3: Docker

```bash
docker run -it --rm \
  -v $(pwd)/data:/app/data \
  -p 3000:3000 \
  ghcr.io/gmolina75/balizabt:latest
```

---

## Configuración Inicial

### 1. Inicializar Base de Datos

```bash
# Crear la base de datos SQLite
node cli.js init
```

### 2. Configurar Modo de Escáner

#### Modo Simulación (Windows/macOS sin hardware)
```bash
# Funciona inmediatamente, genera datos sintéticos realistas
node cli.js scan
```

#### Modo Hardware (Linux/WSL2 con adaptador BLE)
```bash
# Requiere: Bluetooth USB con HCI compatible
# Instalar dependencias del sistema:
sudo apt-get update
sudo apt-get install -y bluez bluez-hci python3-pip

# Instalar bindings BLE nativos
npm install --save @abandonware/blave-hci-socket

# Configurar adaptador
sudo hciconfig hci0 up

# Ejecutar escáner real
node cli.js scan --hardware
```

### 3. Configurar ESP32

Ver [`docs/specs/ESP32.md`](./specs/ESP32.md) para instrucciones detalladas.

```bash
# Configurar credenciales WiFi del ESP32
node cli.js esp32-config --ssid "TuWiFi" --password "TuPassword"

# Programar firmware
node cli.js esp32-flash
```

---

## Verificación de Instalación

```bash
# Test de salud del sistema
node cli.js health

# Verificar base de datos
node cli.js db-info

# Listar dispositivos detectados
node cli.js list
```

### Output Esperado
```
✅ Node.js: v24.21.0
✅ better-sqlite3: 11.3.0
✅ Base de datos: Conectada (WAL mode)
✅ Modo escáner: Simulación
✅ Dispositivos registrados: 8
```

---

## Estructura de Directorios

```
BalizaBT/
├── cli.js              # Entry point CLI
├── database.js         # Capa SQLite
├── scanner.js          # Escáner BLE
├── temporal.js         # Analizador temporal
├── test.js             # Tests automatizados
├── package.json        # Dependencias
├── README.md           # Documentación principal
├── bluetooth_devices.db # Base de datos (se crea al init)
├── docs/               # Documentación completa
│   ├── guides/         # Instalación, hardware, calibración
│   ├── specs/          # SDD, API, firmware ESP32
│   ├── architecture/   # Sistema, floor plan
│   ├── landing/        # Landing page, pricing, FAQ
│   ├── market/         # Competencia, GTM
│   └── presentations/  # Pitch deck, demo script
└── node_modules/       # Dependencias instaladas
```

---

## Solución de Problemas Básicos

Ver [`docs/guides/TROUBLESHOOT.md`](./TROUBLESHOOT.md) para problemas específicos.

### Problemas Comunes

**Error: `MODULE_NOT_FOUND`**
```bash
# Reinstalar dependencias
npm install
```

**Error: `better-sqlite3 failed to compile`**
```bash
# En Windows, instalar herramientas de compilación
npm install --global windows-build-tools
npm rebuild better-sqlite3
```

**Error: `Bluetooth adapter not found`**
```bash
# Usar modo simulación
node cli.js scan
# O en Linux verificar adaptador:
hciconfig -a
```

---

## Próximos Pasos

1. ✅ Instalación completada
2. 📋 Ejecutar `node cli.js scan` para ver dispositivos
3. 📋 Ejecutar `node cli.js track` para ver patrones
4. 📋 Revisar [`docs/guides/HARDWARE.md`](./HARDWARE.md) para agregar ESP32
5. 📋 Personalizar configuración en `docs/landing/PRICING.md`