import {
  getAllDevices,
  getRecentSightings,
  getTemporalAggregation,
  getDeviceStats,
  getSightings,
  getSightingsByDevice,
  getDevicePositionHistory,
  getDeviceById,
  updateCustomInfo,
  setTracked,
  exportData
} from './database.js';

class TemporalAnalyzer {
  constructor() {
    this.userAnnotations = new Map();
    this.analysisCache = new Map();
  }

  getTemporalMass(options = {}) {
    const {
      intervalMinutes = 5,
      hours = 24,
      includeUntracked = true
    } = options;

    const devices = getAllDevices({ tracked: !includeUntracked ? 1 : undefined });
    const aggregations = getTemporalAggregation(intervalMinutes, hours);
    const stats = getDeviceStats();

    // Use SQL-level aggregation (already filtered by timestamp)
    // No need to re-filter in JS - aggregations come pre-filtered from getTemporalAggregation
    const enrichedAggregations = aggregations.map(interval => {
      const deviceDetails = devices.slice(0, 10).map(d => ({
        id: d.id,
        address: d.address,
        name: d.name,
        customName: d.custom_name,
        rssi: d.rssi,
        isTracked: d.is_tracked,
        tags: d.custom_tags ? JSON.parse(d.custom_tags) : [],
        notes: d.custom_notes,
        sightingCount: d.seen_count
      }));

      return {
        ...interval,
        deviceDetails,
        uniqueDevices: interval.unique_devices
      };
    });

    return {
      summary: {
        totalDevices: stats.total_devices,
        trackedDevices: stats.tracked_devices,
        activeLastHour: stats.active_last_hour,
        activeLastDay: stats.active_last_day,
        avgSightingsPerDevice: stats.avg_sightings_per_device,
        timeRange: { hours, intervalMinutes }
      },
      timeline: enrichedAggregations,
      devices: devices.map(d => ({
        id: d.id,
        address: d.address,
        name: d.name,
        customName: d.custom_name,
        rssi: d.rssi,
        lastSeen: d.last_seen,
        seenCount: d.seen_count,
        isTracked: d.is_tracked,
        tags: d.custom_tags ? JSON.parse(d.custom_tags) : [],
        notes: d.custom_notes,
        manufacturerData: d.manufacturer_data ? JSON.parse(d.manufacturer_data) : null,
        serviceUuids: d.service_uuids ? JSON.parse(d.service_uuids) : [],
        metadata: d.metadata_json ? JSON.parse(d.metadata_json) : {}
      }))
    };
  }

  getDeviceHistory(deviceId, hours = 24) {
    const device = getDeviceById(deviceId);
    if (!device) return null;

    // Use SQL-level filtering for efficiency (was filtering in JS)
    const sightings = getSightingsByDevice(deviceId, hours, 500);

    return {
      device: {
        id: device.id,
        address: device.address,
        name: device.name,
        customName: device.custom_name,
        rssi: device.rssi,
        lastSeen: device.last_seen,
        seenCount: device.seen_count,
        isTracked: device.is_tracked,
        tags: device.custom_tags ? JSON.parse(device.custom_tags) : [],
        notes: device.custom_notes,
        manufacturerData: device.manufacturer_data ? JSON.parse(device.manufacturer_data) : null,
        serviceUuids: device.service_uuids ? JSON.parse(device.service_uuids) : [],
        metadata: device.metadata_json ? JSON.parse(device.metadata_json) : {}
      },
      sightings: sightings.map(s => ({
        timestamp: s.timestamp,
        rssi: s.rssi,
        distanceEstimate: s.distance_estimate,
        raw: s.raw_advertisement ? JSON.parse(s.raw_advertisement) : null
      })),
      stats: this._calculateDeviceStats(sightings)
    };
  }

  getPositionHistory(deviceId, hours = 24) {
    const device = getDeviceById(deviceId);
    if (!device) return null;

    const positions = getDevicePositionHistory(deviceId, hours, 100);

    return {
      device: {
        id: device.id,
        address: device.address,
        name: device.name,
        customName: device.custom_name
      },
      positions: positions.map(p => ({
        timestamp: p.timestamp,
        rssi: p.rssi,
        distanceEstimate: p.distance_estimate,
        address: p.address,
        localName: p.local_name
      })),
      stats: this._calculateDeviceStats(positions)
    };
  }

  _calculateDeviceStats(sightings) {
    if (sightings.length === 0) return null;

    const rssis = sightings.map(s => s.rssi).filter(r => r !== null);
    const distances = sightings.map(s => s.distance_estimate).filter(d => d !== null);

    return {
      totalSightings: sightings.length,
      rssi: {
        min: Math.min(...rssis),
        max: Math.max(...rssis),
        avg: rssis.reduce((a, b) => a + b, 0) / rssis.length,
        latest: sightings[0]?.rssi
      },
      distance: distances.length > 0 ? {
        min: Math.min(...distances),
        max: Math.max(...distances),
        avg: distances.reduce((a, b) => a + b, 0) / distances.length
      } : null,
      timeSpan: sightings.length > 1 ? {
        first: sightings[sightings.length - 1].timestamp,
        last: sightings[0].timestamp,
        durationHours: (new Date(sightings[0].timestamp) - new Date(sightings[sightings.length - 1].timestamp)) / (3600 * 1000)
      } : null
    };
  }

  addAnnotation(deviceId, annotation) {
    const key = `annotation_${deviceId}_${Date.now()}`;
    this.userAnnotations.set(key, {
      id: key,
      deviceId,
      timestamp: new Date().toISOString(),
      ...annotation
    });
    return key;
  }

  getAnnotations(deviceId = null) {
    const annotations = Array.from(this.userAnnotations.values());
    return deviceId
      ? annotations.filter(a => a.deviceId === deviceId)
      : annotations;
  }

  annotateDevice(deviceId, { name, notes, tags, tracked }) {
    if (name !== undefined || notes !== undefined || tags !== undefined) {
      updateCustomInfo(deviceId, {
        customName: name,
        customNotes: notes,
        customTags: tags ? JSON.stringify(tags) : undefined
      });
    }
    if (tracked !== undefined) {
      setTracked(deviceId, tracked);
    }
    return getDeviceById(deviceId);
  }

  findPatterns(options = {}) {
    const {
      minOccurrences = 3,
      hours = 24,
      rssiThreshold = -80
    } = options;

    const devices = getAllDevices({ minRssi: rssiThreshold, since: new Date(Date.now() - hours * 3600 * 1000).toISOString() });

    const patterns = {
      recurringDevices: devices.filter(d => d.seen_count >= minOccurrences).map(d => ({
        ...d,
        tags: d.custom_tags ? JSON.parse(d.custom_tags) : [],
        notes: d.custom_notes
      })),
      strongSignals: devices.filter(d => d.rssi > rssiThreshold).map(d => ({
        ...d,
        tags: d.custom_tags ? JSON.parse(d.custom_tags) : [],
        notes: d.custom_notes
      })),
      manufacturerGroups: this._groupByManufacturer(devices),
      serviceGroups: this._groupByService(devices),
      newDevices: devices.filter(d => {
        const firstSeen = new Date(d.first_seen).getTime();
        return firstSeen > Date.now() - hours * 3600 * 1000;
      }).map(d => ({
        ...d,
        tags: d.custom_tags ? JSON.parse(d.custom_tags) : [],
        notes: d.custom_notes
      })),
      // Nuevos: tendencias de RSSI (comparar con promedio histórico)
      rssiTrends: this._calculateRssiTrends(devices)
    };

    return patterns;
  }

  _calculateRssiTrends(devices) {
    // Detecta dispositivos con tendencia de señal creciente/decadente
    const trends = [];
    devices.forEach(d => {
      try {
        const metadata = d.metadata_json ? JSON.parse(d.metadata_json) : {};
        if (metadata.firstRssi !== undefined && metadata.lastRssi !== undefined) {
          const delta = metadata.lastRssi - metadata.firstRssi;
          if (Math.abs(delta) > 5) {
            trends.push({
              address: d.address,
              name: d.name,
              firstRssi: metadata.firstRssi,
              lastRssi: metadata.lastRssi,
              delta,
              direction: delta > 0 ? 'strengthening' : 'weakening',
              significance: Math.abs(delta) > 10 ? 'high' : 'medium'
            });
          }
        }
      } catch {}
    });
    return trends.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }

  _groupByManufacturer(devices) {
    const groups = new Map();
    // Known manufacturer IDs (decimal) for human-readable labels
    const vendorNames = {
      '76': 'Apple',
      '117': 'Samsung',
      '218': 'Tile',
      '741': 'Google/Nest',
      '224': 'Google/Fitbit',
      '12': 'Microsoft',
      '6': 'Microsoft',
      '389': 'Nordic Semiconductor',
      '106': 'Espressif',
      '46': 'Intel',
      '2': 'IBM',
      '100': 'Logitech',
      '128': 'Sony',
      '29': 'LG',
      '132': 'Amazon',
      '24': 'Google',
      '152': 'Withings',
      '115': 'Fitbit',
      '1001': 'Xiaomi',
      '246': 'Polar',
      '76': 'Apple',
      '65535': 'Unknown'
    };

    devices.forEach(d => {
      if (d.manufacturer_data) {
        try {
          const mfg = JSON.parse(d.manufacturer_data);
          if (mfg && typeof mfg === 'object') {
            const keys = Object.keys(mfg);
            if (keys.length > 0) {
              const key = keys[0];
              const vendorName = vendorNames[key] || `MfgID:${key}`;
              if (!groups.has(vendorName)) groups.set(vendorName, []);
              groups.get(vendorName).push({
                address: d.address,
                name: d.name,
                customName: d.custom_name,
                rssi: d.rssi,
                isTracked: d.is_tracked,
                mfgId: key
              });
            }
          }
        } catch {}
      }
    });
    return Object.fromEntries(groups);
  }

  _groupByService(devices) {
    const groups = new Map();
    devices.forEach(d => {
      if (d.service_uuids) {
        try {
          const uuids = JSON.parse(d.service_uuids);
          if (Array.isArray(uuids)) {
            uuids.forEach(uuid => {
              if (!groups.has(uuid)) groups.set(uuid, []);
              groups.get(uuid).push({
                address: d.address,
                name: d.name,
                customName: d.custom_name,
                rssi: d.rssi,
                isTracked: d.is_tracked
              });
            });
          }
        } catch {}
      }
    });
    return Object.fromEntries(groups);
  }

  exportTemporalReport(options = {}) {
    const data = this.getTemporalMass(options);
    const patterns = this.findPatterns(options);
    const annotations = this.getAnnotations();

    return {
      generatedAt: new Date().toISOString(),
      options,
      temporalMass: data,
      patterns,
      annotations,
      export: exportData('json')
    };
  }
}

export const analyzer = new TemporalAnalyzer();
export { TemporalAnalyzer };