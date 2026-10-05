# Preguntas Frecuentes — BalizaBT

## 🎯 Preguntas Generales

### ¿Qué es BalizaBT?

BalizaBT es una plataforma de posicionamiento Bluetooth Low Energy (BLE) de código abierto que permite detectar la ubicación de objetos, personas y dispositivos dentro de interiores (casas, oficinas, bodegas, fábricas) con precisión de 1-3 metros, usando tags ESP32 de bajo costo ($3.50) o dispositivos BLE ya existentes (teléfonos, auriculares, wearables).

---

### ¿Cómo funciona?

1. **Beacons ESP32**: Pequeños tags BLE ($3.50) se instalan en puntos estratégicos (paredes, techos)
2. **Escáner**: Una computadora o Raspberry Pi escanea continuamente las señales BLE
3. **Posicionamiento**: El software calcula la posición usando trilateración, KNN fingerprinting o filtrado Kalman
4. **Visualización**: Los datos se almacenan en SQLite local y se visualizan en el dashboard web/CLI
5. **Análisis**: El sistema detecta patrones de movimiento, zonas de cobertura y genera alertas

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ESP32 Beacon  │    │   ESP32 Beacon  │    │   ESP32 Beacon  │
│                 │    │                 │    │                 │
│   (BBT-001)     │    │   (BBT-002)     │    │   (BBT-003)     │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Escáner BLE (Raspberry Pi)                    │
│                    (detecta señal de cada beacon)                │
└────────────────────────────────┬────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              Motor de Posicionamiento BalizaBT                   │
│              (trilateración / KNN / Kalman)                      │
└────────────────────────────────┬────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│           Dashboard Web + API REST + Analítica Temporal          │
└─────────────────────────────────────────────────────────────────┘
```

---

### ¿Es código abierto?

¡Sí! BalizaBT está bajo licencia **MIT**. Puedes:
- ✅ Usarlo gratis en proyectos personales y comerciales
- ✅ Modificar el código
- ✅ Contribuir con pull requests
- ✅ Redistribuir tu propia versión

El código está en: https://github.com/gmolina75/BalizaBT

---

### ¿Qué hardware necesito?

#### Mínimo (modo simulación)
- Cualquier computadora con Node.js v20+
- Funciona inmediatamente en **Windows, macOS, Linux**

#### Recomendado (hardware real)
| Componente | Requisito |
|-----------|-----------|
| **Computadora escáner** | Raspberry Pi 4 / PC Linux / WSL2 (Windows) |
| **Adaptador BLE** | USB Bluetooth 5.0+ (ej: CSR 4.0 dongle) |
| **Tags ESP32** | ESP32-C3 SuperMini ($3.50 c/u) |
| **Montaje** | Impresión 3D o adhesivo (incluido en docs) |

---

## 🏠 Preguntas de Uso

### ¿Para qué puedo usarlo?

| Caso de uso | Descripción |
|-------------|-------------|
| **Casa inteligente** | Ubica llaves, bolsas, mascotas, personas |
| **Bodega/almacén** | Encuentra objetos perdidos, inventario inteligente |
| **Oficina** | Desk booking, hot-desking, meeting room occupancy |
| **Fábrica** | Seguimiento de herramientas, equipos, personal |
| **Retail** | Análisis de tráfico, optimización de layout |
| **Healthcare** | Localización de equipos médicos, personal |
| **Logística** | Tracking de palets, carros de compra |
| **Educación** | Asistencia, seguridad de estudiantes |

---

### ¿Puedo usar mis auriculares AirPods?

¡Sí! BalizaBT detecta automáticamente dispositivos BLE conocidos incluyendo:
- ✅ Auriculares AirPods / AirPods Pro
- ✅ Apple Watch
- ✅ iPhone / iPad
- ✅ Samsung Galaxy / Galaxy Buds
- ✅ Fitbit
- ✅ Tile Mate / Pro
- ✅ Altavoces Bluetooth JBL / Sony
- ✅ Termómetros Xiaomi Mijia
- ✅ ESP32 personalizados

---

### ¿Cuánta precisión tiene?

| Modo | Precisión típica |
|------|-----------------|
| Simulación | 1–3 metros |
| Hardware real (calibrado) | 1–3 metros |
| Hardware real (optimizado) | < 1 metro |
| Sin calibrar | 5–10 metros |

---

## 💰 Preguntas de Precio

### ¿Realmente es gratis?

El **tier Free** es 100% gratis y funcional. Incluye CLI, SQLite, escáner y análisis. Puedes usarlo para proyectos personales, POC o producción pequeña sin costo.

---

### ¿Por qué es tan barato el hardware?

Los tags ESP32-C3 SuperMini cuestan $3.50 en plataformas como AliExpress o Amazon, comparado con $25–100 de tags de marcas como Estimote o Kontakt.io. Usamos hardware commodity (ESP32) con firmware open source, eliminando el markup de marca.

---

### ¿Hay cargos ocultos?

No. Nuestros precios son transparentes:
- **Free**: $0 (siempre)
- **Pro**: $2,999/mes (sin sorpresas)
- **Enterprise**: $9,999/mes (contrato anual)

Hardware (tags, gateways) se compra por separado. Consulta más en [PRICING.md](./PRICING.md).

---

## 🛠️ Preguntas Técnicas

### ¿Funciona en Windows?

**Sí, en modo simulación.** El escáner simulado genera datos realistas de 8 dispositivos BLE y funciona perfectamente en Windows. Para usar hardware real (tags ESP32 físicos), se recomienda:

1. **Opción A**: WSL2 + Ubuntu + adaptador USB Bluetooth pasado a través
2. **Opción B**: Raspberry Pi como gateway BLE
3. **Opción C**: Docker en Linux

---

### ¿Puedo correrlo en Docker?

¡Sí!

```bash
docker run -it --rm \
  -v $(pwd)/data:/app/data \
  -p 3000:3000 \
  balizabt/platform:latest
```

---

### ¿Cómo exporto mis datos?

Múltiples formatos disponibles:

```bash
# Exportar todo a JSON
node cli.js export --format=json --file=data.json

# Exportar a CSV
node cli.js export --format=csv --file=data.csv

# Exportar reporte PDF (Pro)
node cli.js export --format=pdf --file=report.pdf --template=detailed
```

---

### ¿Puedo integrar con Home Assistant?

¡Sí! BalizaBT Pro incluye un plugin oficial para Home Assistant:

```yaml
# configuration.yaml
balizabt:
  host: localhost
  port: 3000
  api_key: sk_live_xxxxxxxx
```

---

### ¿Qué base de datos usan?

- **Local**: SQLite con WAL mode (incluido, no requiere instalación)
- **Enterprise**: PostgreSQL + TimescaleDB para alta disponibilidad

---

## 🔒 Preguntas de Seguridad y Privacidad

### ¿Mis datos se envían a la nube?

**No.** BalizaBT es **offline-first**. Todos los datos (detecciones, posiciones, historial) se almacenan localmente en tu SQLite. El dashboard web y API son locales.

En el **tier Enterprise**, puedes optar por sincronizar datos anonimizados a la nube para backup, pero es opcional y configurable.

---

### ¿Es seguro?

Sí. Medidas de seguridad:
- ✅ Encriptación AES-256 (Enterprise)
- ✅ API keys con hashing
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Audit logging
- ✅ HTTPS/TLS para toda comunicación
- ✅ No se envían datos personales a terceros

---

## 🔄 Preguntas de Soporte

### ¿Tengo ayuda gratuita?

| Tier | Soporte |
|------|---------|
| **Free** | Comunidad vía GitHub Issues (respuesta en 3-5 días hábiles) |
| **Pro** | Tickets prioritarios (SLA 24h respuesta) |
| **Enterprise** | Soporte 24/7 dedicado (SLA 15min respuesta) + phone |

---

### ¿Ofrecen capacitación?

Sí, varias opciones:

| Servicio | Precio | Descripción |
|----------|--------|-------------|
| **Documentación** | Gratis | Guías completas, tutorials, ejemplos |
| **Comunidad** | Gratis | Discord, foro, GitHub Discussions |
| **Capacitación online** | $500 | 4 horas de training en vivo |
| **Capacitación en sitio** | $1,500/día | En tu oficina con ingeniero |
| **Certificación** | $250 | Certificado de instalador BalizaBT |

---

### ¿Puedo cancelar mi suscripción?

Sí. Puedes cancelar en cualquier momento desde tu dashboard. No hay cargos por cancelación.

---

## 🚀 Preguntas de Empezando

### ¿Cómo empiezo?

```bash
# 1 minuto para empezar
git clone https://github.com/gmolina75/BalizaBT.git
cd BalizaBT
npm install
node cli.js scan

# Ver dispositivos
node cli.js list

# Analizar patrones
node cli.js patterns
```

Ver la guía completa: **[Guía de Instalación](./INSTALL.md)**

---

### ¿Cuánto tiempo se tarda en instalar?

- **Modo simulación**: 2 minutos (solo necesitas Node.js)
- **Hardware real**: 15-30 minutos (instalar adaptador, flashear ESP32)
- **Calibración**: 1-2 horas (dependiendo del espacio)

---

### ¿Tengo una bodega de 500 m²? ¿Cuántos beacons necesito?

```
Cálculo: 1 beacon por cada 30-40 m²
500 m² ÷ 35 m² = ~15 beacons
```

| Área | Beacons recomendados | Costo hardware |
|------|---------------------|----------------|
| 100 m² | 3-5 | $10-18 |
| 200 m² | 6-8 | $21-28 |
| 500 m² | 15-20 | $53-70 |
| 1,000 m² | 30-40 | $105-140 |

Ver detalles: **[Guía de Plano y Colocación](./FLOORPLAN.md)**

---

### ¿Qué hago si no detecta dispositivos?

1. **Verifica el modo**: Asegúrate de usar `node cli.js scan`
2. **Modo simulación**: En Windows funciona por defecto (genera 8 dispositivos de ejemplo)
3. **Hardware real**: Si usas Linux/WSL2, verifica:
   ```bash
   hciconfig -a    # Verifica adaptador BLE
   sudo hciconfig hci0 up   # Activa adaptador
   ```
4. **Solución de problemas completa**: Ver **[Guía de Solución de Problemas](./TROUBLESHOOT.md)**

---

## 📞 ¿No encuentras tu respuesta?

- 📚 **Documentación**: Este índice
- 🐞 **Issues de GitHub**: https://github.com/gmolina75/BalizaBT/issues
- 💬 **Discord comunidad**: Link en README.md
- 📧 **Soporte Pro/Enterprise**: support@balizabt.dev

---

*¿Tienes una pregunta que no está aquí? Abre un issue en GitHub o únete a nuestra comunidad y pregúntanos. ¡Ayudamos encantados!*