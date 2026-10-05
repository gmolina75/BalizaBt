import {
  getAllDevices,
  getRecentSightings,
  getTemporalAggregation,
  getDeviceStats,
  getSightings,
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
    const recentSightings = getRecentSightings(hours);
    const stats = getDeviceStats();

    const deviceMap = new Map(devices.map(d => [d.id, d]));

    const enrichedAggregations = aggregations.map(interval => {
      const intervalSightings = recentSightings.filter(s =>
        s.timestamp >= interval.interval_start &&
        s.timestamp < new Date(new Date(interval.interval_start).getTime() + intervalMinutes * 60 * 1000).toISOString()
      );

      const uniqueAddresses = [...new Set(intervalSightings.map(s => s.address))];
      const deviceDetails = uniqueAddresses.map(addr => {
        const d = devices.find(d => d.address === addr);
        return d ? {
          id: d.id,
          address: d.address,
          name: d.name,
          customName: d.custom_name,
          rssi: d.rssi,
          isTracked: d.is_tracked,
          tags: d.custom_tags ? JSON.parse(d.custom_tags) : [],
          notes: d.custom_notes,
          sightingCount: intervalSightings.filter(s => s.address === addr).length
        } : null;
      }).filter(Boolean);

      return {
        ...interval,
        deviceDetails,
        uniqueDevices: deviceDetails.length
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

    const sightings = getSightings(deviceId, 500);
    const filteredSightings = sightings.filter(s => {
      const sightingTime = new Date(s.timestamp).getTime();
      const cutoff = Date.now() - hours * 3600 * 1000;
      return sightingTime >= cutoff;
    });

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
      sightings: filteredSightings.map(s => ({
        timestamp: s.timestamp,
        rssi: s.rssi,
        distanceEstimate: s.distance_estimate,
        raw: s.raw_advertisement ? JSON.parse(s.raw_advertisement) : null
      })),
      stats: this._calculateDeviceStats(filteredSightings)
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
      strongSignals: devices.filter(d => d.rssi > -60).map(d => ({
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
      }))
    };

    return patterns;
  }

  _groupByManufacturer(devices) {
    const groups = new Map();
    devices.forEach(d => {
      if (d.manufacturer_data) {
        try {
          const mfg = JSON.parse(d.manufacturer_data);
          if (mfg && typeof mfg === 'object') {
            const keys = Object.keys(mfg);
            if (keys.length > 0) {
              const key = keys[0];
              if (!groups.has(key)) groups.set(key, []);
              groups.get(key).push({
                address: d.address,
                name: d.name,
                customName: d.custom_name,
                rssi: d.rssi,
                isTracked: d.is_tracked
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