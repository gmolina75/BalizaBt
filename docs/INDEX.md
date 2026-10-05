# 📚 BalizaBT — Índice de Documentación

> **La documentación definitiva para construir, instalar y escalar una red de posicionamiento BLE de alta precisión.**

---

## 📁 Estructura de Documentación

```
docs/
├── INDEX.md                          # Este archivo — navegue por toda la documentación
├── specs/
│   ├── SDD.md                       # Documento de Diseño de Software (arquitectura detallada)
│   ├── ESP32.md                     # Especificación del firmware ESP32
│   ├── FLOORPLAN.md                 # Guía de plano y colocación de balizas
│   └── API.md                       # Documentación de la API
├── market/
│   ├── COMPETITIVE.md               # Análisis competitivo y investigación de mercado
│   ├── GTM.md                       # Estrategia de llegada al mercado
│   ├── FEATURES.md                  # Características del producto
│   ├── PRICING.md                   # Modelo de precios y monetización
│   └── FAQ.md                       # Preguntas frecuentes
├── guides/
│   ├── INSTALL.md                   # Guía de instalación paso a paso
│   ├── HARDWARE.md                  # Guía de hardware y ESP32
│   ├── CALIBRATION.md              # Guía de calibración de precisión
│   └── TROUBLESHOOT.md              # Solución de problemas
├── architecture/
│   ├── SYSTEM.md                    # Arquitectura del sistema completo
│   └── TECH_DEEP_DIVE.md            # Análisis técnico profundo
├── presentations/
│   ├── PITCH_DECK.md               # Deck para inversores
│   └── DEMO_SCRIPT.md              # Guion de demostración
├── landing/
│   └── INDEX.html                  # Página de aterrizaje
└── roadmap.md                      # Hoja de ruta del producto
```

---

## 🗺️ Ruta de Aprendizaje Sugerida

### Para desarrolladores (nuevos usuarios)

1. **[README.md](README.md)** — Introducción rápida
2. **[Guía de Instalación](guides/INSTALL.md)** — Setup del sistema
3. **[SDD](specs/SDD.md)** — Entiende la arquitectura
4. **[Guía de Solución de Problemas](guides/TROUBLESHOOT.md)** — Diagnostico errores

### Para instaladores y técnicos

1. **[Guía de Hardware](guides/HARDWARE.md)** — ESP32, baterías, hardware
2. **[Guía de Calibración](guides/CALIBRATION.md)** — Calibrar para precisión
3. **[Guía de Plano](specs/FLOORPLAN.md)** — Colocación de balizas
4. **[Preguntas Frecuentes](market/FAQ.md)** — Troubleshooting avanzado

### Para inversores y ventas

1. **[Pitch Deck](presentations/PITCH_DECK.md)** — Resumen ejecutivo
2. **[Análisis Competitivo](market/COMPETITIVE.md)** — Ventajas competitivas
3. **[Go-To-Market](market/GTM.md)** — Estrategia de ventas
4. **[Pricing](market/PRICING.md)** — Modelos de monetización
5. **[Hoja de Ruta](roadmap.md)** — Futuro del producto

### Para usuarios avanzados

1. **[API](specs/API.md)** — Integración y desarrollo
2. **[Guion de Demo](presentations/DEMO_SCRIPT.md)** — Presentar a clientes
3. **[Deep Dive Técnico](architecture/TECH_DEEP_DIVE.md)** — Arquitectura interna
4. **[Características](market/FEATURES.md)** — Funcionalidades completas

---

## 🔥 Puntos de Entrada Rápidos

### 🚀 Iniciar rápido

```bash
# 1. Instalar
git clone https://github.com/gmolina75/BalizaBT.git && cd BalizaBT
npm install

# 2. Escanear dispositivos
node cli.js scan

# 3. Ver lista de dispositivos
node cli.js list

# 4. Analizar patrones
node cli.js patterns

# 5. Ver estadísticas
node cli.js stats
```

Ver detalles en: **[Guía de Instalación](guides/INSTALL.md)**

### 💰 Modelo de Negocio

| Plan | Precio | Características | Target |
|------|--------|-----------------|--------|
| **Free** | $0 | Open source, 1 gateway, simulación | Developers, makers |
| **Pro** | $2,999/mes | 5 gateways, 100 tags, API, dashboard | PYMES |
| **Enterprise** | $9,999/mes | Ilimitado, soporte 24/7, integración personalizada | Empresas |

Ver detalles en: **[Pricing](market/PRICING.md)**

### 📡 Hardware compatible

| Tipo | Modelo | Precio unitario |
|------|--------|----------------|
| Tag ESP32-C3 | SuperMini | $3.50 |
| Tag ESP32 clásico | DevKit v1 | $4.20 |
| Smartphone | iOS/Android | N/A |
| Wearables | Apple Watch, Galaxy Watch | N/A |
| Trackers | Tile, Fitbit | N/A |

Ver detalles en: **[Guía de Hardware](guides/HARDWARE.md)**

---

## 📊 Comparación con Competencia

| Característica | **BalizaBT** | Estimote | Kontakt | Gimbal | Radius |
|----------------|------------|----------|---------|--------|--------|
| **Precio por tag** | $3.50 | $25-40 | $30-50 | $25-40 | $50-100 |
| Código abierto | ✅ | ❌ | ❌ | ❌ | ❌ |
| Precisión | 1-3m | 1-10m | 1-3m | 1-10m | 1-3m |
| Modo offline | ✅ | ❌ | ❌ | ❌ | Parcial |
| Documentación | ✅ Completa | Fragmentada | Paga | Limitada | Fragmentada |

Ver análisis completo en: **[Análisis Competitivo](market/COMPETITIVE.md)**

---

## 🚦 Hoja de Ruta Rápida

| Versión | Fecha | Hito principal |
|---------|-------|---------------|
| **V1.0** | ✅ Mayo 2026 | Funcional completo, open source |
| **V1.5** | 🔄 Junio 2026 | Calibración KNN, fingerprinting |
| **V2.0** | 🟡 Agosto 2026 | ESP32 real, API REST, web dashboard |
| **V2.5** | 🟢 Diciembre 2026 | App móvil, red multi-gateway |
| **V3.0** | 📅 2027 | IA predictiva, automatización |

Ver detalles en: **[Hoja de Ruta](roadmap.md)**

---

## 🤝 Contribuir

¿Quieres contribuir al proyecto?

1. **[Guía de Instalación](guides/INSTALL.md)** — Empieza aquí
2. Fork y haz tu pull request en [GitHub](https://github.com/gmolina75/BalizaBT)
3. Revisa los [issues abiertos](https://github.com/gmolina75/BalizaBT/issues)
4. Únete a la comunidad en Discord (link en README)

---

## 📞 Soporte

- 📧 Email: soporte@balizabt.dev
- 🐞 GitHub Issues: https://github.com/gmolina75/BalizaBT/issues
- 📱 Discord: BalizaBT Community
- 📖 Documentación: Este índice

---

## 📄 Licencia

MIT License — ver [LICENSE](LICENSE) en el repositorio principal.

---

*Documentación generada por devMaster • Última actualización: Mayo 2026*