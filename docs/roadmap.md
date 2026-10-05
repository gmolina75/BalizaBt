# Hoja de Ruta del Producto — BalizaBT

## Visión

> **"Precisión de centímetro, precio de dólar: el posicionamiento BLE que cabe en tu bolsillo."**

BalizaBT busca democratizar el posicionamiento de alta precisión, reduciendo la barrera de hardware de $2500+ (soluciones tradicionales como Estimote o Kontakt) a <$10 por tag, con precisión submetral.

---

## Principios Rectores

1. **Simplicidad primero**: Instala en 15 minutos, calibra en 1 hora
2. **Offline-first**: Funciona sin internet, sin servidor central
3. **Open core**: Núcleo open-source, funcionalidades premium comerciales
4. **Multiplataforma**: Node.js + WASM para web, móvil, escritorio, servidor
5. **Hardware abierto**: ESP32-C3 firmware público, diseños de PCB liberados

---

## 1. Hoja de Ruta (Roadmap)

### V1.0 — Fundación (✅ COMPLETADO — Mayo 2026)

**Objetivo**: Sistema funcional de monitoreo BLE básico con persistencia SQLite.

| Característica | Status | Responsable |
|----------------|--------|-------------|
| Escáner BLE simulado | ✅ | devMaster |
| Base de datos SQLite WAL | ✅ | devMaster |
| CLI completa (scan, list, track) | ✅ | devMaster |
| Análisis temporal (patrones, historial) | ✅ | devMaster |
| Documentación base (SDD, ESP32, Competitive) | ✅ | devMaster |
| Landing page funcional | ✅ | devMaster |
| Pitch deck para inversores | ✅ | devMaster |
| Tests (4/4 pasando) | ✅ | devMaster |

---

### V1.5 — Precisión y Calibración (🔄 EN PROGRESO — Junio 2026)

**Objetivo**: Sistema de posicionamiento de 1-3m con calibración automática.

| Característica | Prioridad | Estimado |
|----------------|-----------|----------|
| Fingerprinting KNN | 🔴 Alta | 2 semanas |
| Calibración automática RSSI | 🔴 Alta | 3 semanas |
| Zoning y mapas de calor | 🟡 Media | 1 semana |
| Exportación CSV/JSON | 🟢 Baja | 3 días |
| Integración floor plan | 🔴 Alta | 2 semanas |
| Detección de zonas muertas | 🔴 Alta | 1 semana |
| Optimización DB índices | 🟡 Media | 2 días |
| **Entrega estimada** | | **Junio 2026** |

---

### V2.0 — Integración de Hardware Real (🟡 PLANIFICADO — Q3 2026)

**Objetivo**: Soporte completo de ESP32 reales + API REST + Web Dashboard.

| Característica | Prioridad | Estimado |
|----------------|-----------|----------|
| Bindings BLE nativos Linux/WSL2 | 🔴 Alta | 3 semanas |
| OTA firmware ESP32 | 🔴 Alta | 2 semanas |
| Monitor de batería en tiempo real | 🟡 Media | 1 semana |
| API REST GraphQL | 🔴 Alta | 2 semanas |
| Web Dashboard React | 🔴 Alta | 4 semanas |
| Autenticación JWT | 🟡 Media | 1 semana |
| Métricas de calidad de señal | 🟡 Media | 1 semana |
| **Entrega estimada** | | **Agosto 2026** |

---

### V2.5 — Multi-estación y Escalabilidad (🟢 PLANIFICADO — Q4 2026)

**Objetivo**: Red de múltiples escáneres + backend cloud + móvil.

| Característica | Prioridad | Estimado |
|----------------|-----------|----------|
| Escáneres distribuidos | 🔴 Alta | 3 semanas |
| Sincronización multi-gateway | 🔴 Alta | 2 semanas |
| App móvil React Native | 🔴 Alta | 6 semanas |
| Dashboard de red completa | 🟡 Media | 3 semanas |
| Alertas en tiempo real | 🟡 Media | 1 semana |
| Clustering de dispositivos | 🟢 Baja | 2 semanas |
| **Entrega estimada** | | **Diciembre 2026** |

---

### V3.0 — IA Predictiva y Automatización (📅 FUTURO — 2027)

**Objetivo**: IA para predecir ubicación, detección de anomalías y automatización.

| Característica | Prioridad | Estimado |
|----------------|-----------|----------|
| ML predicción de trayectorias | 🔴 Alta | 4 semanas |
| Detección de anomalías comportamentales | 🔴 Alta | 3 semanas |
| Automatización de triggers | 🟡 Media | 2 semanas |
| Integración home automation (MQTT) | 🔴 Alta | 2 semanas |
| Visión: integración cámara (opcional) | 🟢 Baja | 8 semanas |
| **Entrega estimada** | | **Marzo 2027** |

---

## 2. Evolución de Características

```
V1.0 ── V1.5 ── V2.0 ── V2.5 ── V3.0
📡    🎯     ☁️     📱     🤖
Scan    Precision   Web      Multi
    Calibrate   API       Mobile    AI
        Floorplan     Dashboard   Network
            ESP32 Real    Alerts    Automation
```

### Líneas de Mejora Continua

#### 2.1 Algoritmos de Posicionamiento

| Versión | Algoritmo | Precisión | Complejidad |
|---------|-----------|-----------|-------------|
| V1.0 | RSSI promedio | 5-10m | Baja |
| V1.5 | KNN fingerprinting | 1-3m | Media |
| V2.0 | Trilateración corregida | 1-2m | Media |
| V3.0 | Kalman filter + ML | <1m | Alta |

#### 2.2 Compatibilidad de Hardware

| Versión | ESP32 | Raspberry Pi | USB Dongle |
|---------|-------|-------------|------------|
| V1.0 | Simulado | ❌ | ❌ |
| V1.5 | Simulado | ❌ | ❌ |
| V2.0 | ✅ (C3, S3) | ✅ (Pi 4+) | ✅ (BT 5.0) |
| V3.0 | ✅ (Todo chip) | ✅ | ✅ + Thread |

#### 2.3 Escalabilidad de Base de Datos

| Versión | Storage | Dispositivos | Consultas/s |
|---------|---------|-------------|-------------|
| V1.0 | SQLite local | 10 | 100 |
| V2.0 | SQLite + Redis | 100 | 1,000 |
| V3.0 | PostgreSQL + TimescaleDB | 10,000+ | 10,000 |

---

## 3. Go-To-Market por Versión

### V1.0 — Early Adopter (Mayo 2026)

| Segmento | Estrategia |
|----------|-----------|
| Developers / makers | GitHub open source, tutoriales |
| Hackers / entusiastas | Precio $0 (open core) |
| Smart homeowners | Demo casa inteligente |

### V1.5 — Profesionales (Junio 2026)

| Segmento | Estrategia |
|----------|-----------|
| Instaladores domótica | Pack $99 (licencia + 5 tags) |
| Small business | SaaS $29/mes |
| Facility managers | Pilotos con integradores |

### V2.0 — Empresa (Agosto 2026)

| Segmento | Estrategia |
|----------|-----------|
| Retail chains | SKU-level tracking |
| Healthcare | Patient/staff tracking |
| Logistics | Warehouse asset tracking |
| **Precio** | |
| **Starter** | $0 (1 gateway, 10 tags) |
| **Pro** | $2,999/mes (5 gateways, 100 tags) |
| **Enterprise** | $9,999/mes (Ilimitado) |

---

## 4. KPIs y Métricas de Éxito

### Métricas Técnicas

| Métrica | V1.0 Target | V2.0 Target | V3.0 Target |
|---------|-------------|-------------|-------------|
| Precisión posicionamiento | 5m | 1.5m | <1m |
| Latencia localización | <100ms | <50ms | <20ms |
| Cobertura zona típica | 80% | 95% | >99% |
| Detección falsa (FP) | <5% | <1% | <0.1% |

### Métricas de Negocio

| Métrica | V1.0 | V2.0 | V3.0 |
|---------|------|------|------|
| Usuarios activos | 100 | 1,000 | 10,000 |
| Tags desplegados | 50 | 500 | 5,000 |
| Revenue recurrente | $0 | $5,000 | $50,000 |
| Customer satisfaction | N/A | 4.5/5 | 4.8/5 |

---

## 5. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| **Fallo BLE en Windows** | Alta | Alto | Simulación + WSL2 alternativa |
| **Competencia directa (Estimote)** | Media | Alto | Precio 10x menor, open source |
| **Adopción lenta** | Media | Medio | Early adopters + comunidad maker |
| **Dependencia hardware ESP32** | Baja | Medio | Soporte múltiples chipsets |
| **Regulaciones privacidad** | Media | Alto | Enfoque local, cero datos en nube |

---

## 6. Inversión y Recursos Necesarios

### Equipo Necesario (V2.0)

| Rol | Tiempo | Costo estimado |
|-----|--------|---------------|
| Firmware Engineer (ESP32) | 3 meses FT | $15,000 |
| Frontend Engineer (Web Dashboard) | 3 meses FT | $18,000 |
| DevOps Engineer | 1 mes FT | $8,000 |
| QA / Testing | 1 mes FT | $5,000 |
| **Total** | | **$46,000** |

### Hardware de Desarrollo

| Item | Cantidad | Costo unitario | Total |
|------|----------|----------------|-------|
| ESP32-C3 SuperMini | 10 | $3.50 | $35 |
| Adaptador USB BT 5.0 | 2 | $15 | $30 |
| Raspberry Pi 4 | 2 | $35 | $70 |
| **Total hardware** | | | **$135** |

---

## 7. Conclusión

BalizaBT está posicionado para liderar el segmento de positioning BLE de accesibilidad. Con una hoja de ruta clara que va desde una base funcional (V1.0) hasta un sistema empresarial con IA predictiva (V3.0), el proyecto puede:

- **V1.0**: Capturar comunidad open source y early adopters
- **V2.0**: Convertirse en solución profesional para small business
- **V3.0**: Competir directamente con soluciones enterprise de $2500+

El secreto del éxito está en mantener el **enfoque de hardware abierto + software open core**, permitiendo que la comunidad impulse la adopción mientras el modelo freemium genera revenue sostenible.