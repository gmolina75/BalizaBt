import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'bluetooth_devices.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL UNIQUE,
      name TEXT,
      rssi INTEGER,
      manufacturer_data TEXT,
      service_uuids TEXT,
      local_name TEXT,
      tx_power INTEGER,
      advertisement_data TEXT,
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      seen_count INTEGER DEFAULT 1,
      is_tracked BOOLEAN DEFAULT 0,
      custom_name TEXT,
      custom_notes TEXT,
      custom_tags TEXT,
      metadata_json TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS sightings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      rssi INTEGER,
      distance_estimate REAL,
      raw_advertisement TEXT,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_devices_address ON devices(address);
    CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen DESC);
    CREATE INDEX IF NOT EXISTS idx_devices_tracked ON devices(is_tracked);
    CREATE INDEX IF NOT EXISTS idx_sightings_device ON sightings(device_id);
    CREATE INDEX IF NOT EXISTS idx_sightings_timestamp ON sightings(timestamp DESC);
  `);
}

function upsertDevice(deviceData) {
  const {
    address,
    name,
    rssi,
    manufacturerData,
    serviceUuids,
    localName,
    txPower,
    advertisementData
  } = deviceData;

  const existing = db.prepare('SELECT id, seen_count, custom_name, custom_notes, custom_tags, metadata_json FROM devices WHERE address = ?').get(address);

  if (existing) {
    const metadata = { ...JSON.parse(existing.metadata_json), lastRssi: rssi };
    db.prepare(`
      UPDATE devices SET
        name = COALESCE(?, name),
        rssi = ?,
        manufacturer_data = ?,
        service_uuids = ?,
        local_name = ?,
        tx_power = ?,
        advertisement_data = ?,
        last_seen = CURRENT_TIMESTAMP,
        seen_count = seen_count + 1,
        metadata_json = ?
      WHERE address = ?
    `).run(
      name, rssi,
      JSON.stringify(manufacturerData),
      JSON.stringify(serviceUuids),
      localName,
      txPower,
      JSON.stringify(advertisementData),
      JSON.stringify(metadata),
      address
    );
    return existing.id;
  } else {
    const metadata = { firstRssi: rssi, lastRssi: rssi };
    const result = db.prepare(`
      INSERT INTO devices (
        address, name, rssi, manufacturer_data, service_uuids,
        local_name, tx_power, advertisement_data, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      address, name, rssi,
      JSON.stringify(manufacturerData),
      JSON.stringify(serviceUuids),
      localName,
      txPower,
      JSON.stringify(advertisementData),
      JSON.stringify(metadata)
    );
    return result.lastInsertRowid;
  }
}

function recordSighting(deviceId, rssi, rawAdvertisement) {
  const distanceEstimate = estimateDistance(rssi);
  db.prepare(`
    INSERT INTO sightings (device_id, rssi, distance_estimate, raw_advertisement)
    VALUES (?, ?, ?, ?)
  `).run(deviceId, rssi, distanceEstimate, JSON.stringify(rawAdvertisement));
}

function estimateDistance(rssi, txPower = -59, attenuationN = 2.5) {
  if (rssi === 0 || rssi === null || rssi === undefined) return null;
  // Modelo de pérdida de trayectoria logarítmica:
  // d = 10^((RSSI_0 - RSSI) / (10 * n))
  // RSSI_0 = RSSI a 1 metro (txPower)
  // n = exponente de atenuación (2.5 = interior típico)
  const ratio = (txPower - rssi) / (10 * attenuationN);
  return Math.max(0, Math.pow(10, ratio));
}

function getAllDevices(filters = {}) {
  let query = 'SELECT * FROM devices WHERE 1=1';
  const params = [];

  if (filters.tracked !== undefined) {
    query += ' AND is_tracked = ?';
    params.push(filters.tracked ? 1 : 0);
  }
  if (filters.nameSearch) {
    query += ' AND (name LIKE ? OR custom_name LIKE ? OR address LIKE ?)';
    const search = `%${filters.nameSearch}%`;
    params.push(search, search, search);
  }
  if (filters.minRssi !== undefined) {
    query += ' AND rssi >= ?';
    params.push(filters.minRssi);
  }
  if (filters.since) {
    query += ' AND last_seen >= ?';
    params.push(filters.since);
  }

  query += ' ORDER BY last_seen DESC';
  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  return db.prepare(query).all(...params);
}

function getDeviceById(id) {
  return db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
}

function getDeviceByAddress(address) {
  return db.prepare('SELECT * FROM devices WHERE address = ?').get(address);
}

function updateCustomInfo(deviceId, { customName, customNotes, customTags }) {
  db.prepare(`
    UPDATE devices SET
      custom_name = COALESCE(?, custom_name),
      custom_notes = COALESCE(?, custom_notes),
      custom_tags = COALESCE(?, custom_tags)
    WHERE id = ?
  `).run(customName, customNotes, customTags, deviceId);
}

function setTracked(deviceId, tracked) {
  db.prepare('UPDATE devices SET is_tracked = ? WHERE id = ?').run(tracked ? 1 : 0, deviceId);
}

function getSightings(deviceId, limit = 100) {
  return db.prepare(`
    SELECT * FROM sightings WHERE device_id = ? ORDER BY timestamp DESC LIMIT ?
  `).all(deviceId, limit);
}

function getSightingsByDevice(deviceId, hours = 24, limit = 1000) {
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  return db.prepare(`
    SELECT * FROM sightings
    WHERE device_id = ? AND timestamp >= ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(deviceId, since, limit);
}

function getDevicePositionHistory(deviceId, hours = 24, limit = 100) {
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  return db.prepare(`
    SELECT
      s.timestamp,
      s.rssi,
      s.distance_estimate,
      s.raw_advertisement,
      d.address,
      d.name,
      d.local_name
    FROM sightings s
    JOIN devices d ON s.device_id = d.id
    WHERE s.device_id = ? AND s.timestamp >= ?
    ORDER BY s.timestamp ASC
    LIMIT ?
  `).all(deviceId, since, limit);
}

function getRecentSightings(hours = 24, limit = 1000) {
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  return db.prepare(`
    SELECT s.*, d.address, d.name, d.custom_name
    FROM sightings s
    JOIN devices d ON s.device_id = d.id
    WHERE s.timestamp >= ?
    ORDER BY s.timestamp DESC
    LIMIT ?
  `).all(since, limit);
}

function getTemporalAggregation(intervalMinutes = 5, hours = 24) {
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  // Calculate the interval bucket start using integer division on minutes
  // This is more portable than strftime manipulation
  return db.prepare(`
    SELECT
      datetime(timestamp, 'start of day') ||
      printf('%02d', CAST(strftime('%H', timestamp) AS INTEGER)) ||
      ':' ||
      printf('%02d', CAST(strftime('%M', timestamp) / ? * ? AS INTEGER)) as interval_start,
      COUNT(DISTINCT device_id) as unique_devices,
      COUNT(*) as total_sightings,
      AVG(rssi) as avg_rssi,
      MIN(rssi) as min_rssi,
      MAX(rssi) as max_rssi
    FROM sightings
    WHERE timestamp >= ?
    GROUP BY interval_start
    ORDER BY interval_start
  `).all(intervalMinutes, intervalMinutes, since);
}

function getDeviceStats() {
  return db.prepare(`
    SELECT
      COUNT(*) as total_devices,
      SUM(CASE WHEN is_tracked = 1 THEN 1 ELSE 0 END) as tracked_devices,
      COUNT(CASE WHEN datetime(last_seen) > datetime('now', '-1 hour') THEN 1 END) as active_last_hour,
      COUNT(CASE WHEN datetime(last_seen) > datetime('now', '-24 hours') THEN 1 END) as active_last_day,
      AVG(seen_count) as avg_sightings_per_device,
      MAX(seen_count) as max_sightings
    FROM devices
  `).get();
}

function exportData(format = 'json') {
  const devices = db.prepare('SELECT * FROM devices ORDER BY last_seen DESC').all();
  const sightings = db.prepare('SELECT * FROM sightings ORDER BY timestamp DESC').all();

  if (format === 'json') {
    return JSON.stringify({ devices, sightings }, null, 2);
  }
  if (format === 'csv') {
    return exportToCSV(devices, sightings);
  }
  return { devices, sightings };
}

function exportToCSV(devices, sightings) {
  const lines = [];
  lines.push('=== DEVICES ===');
  lines.push('id,address,name,rssi,seen_count,is_tracked,custom_name,custom_notes,custom_tags,first_seen,last_seen');

  devices.forEach(d => {
    const tags = d.custom_tags ? JSON.parse(d.custom_tags).join(';') : '';
    const name = (d.custom_name || d.name || '').replace(/,/g, ';');
    lines.push(`${d.id},${d.address},${name},${d.rssi},${d.seen_count},${d.is_tracked},${d.custom_name || ''},${d.custom_notes || ''},${tags},${d.first_seen},${d.last_seen}`);
  });

  lines.push('');
  lines.push('=== SIGHTINGS ===');
  lines.push('id,device_id,timestamp,rssi,distance_estimate');

  sightings.forEach(s => {
    lines.push(`${s.id},${s.device_id},${s.timestamp},${s.rssi},${s.distance_estimate}`);
  });

  return lines.join('\n');
}

function close() {
  db.close();
}

initializeSchema();

export {
  db,
  upsertDevice,
  recordSighting,
  getAllDevices,
  getDeviceById,
  getDeviceByAddress,
  updateCustomInfo,
  setTracked,
  getSightings,
  getSightingsByDevice,
  getDevicePositionHistory,
  getRecentSightings,
  getTemporalAggregation,
  getDeviceStats,
  exportData,
  exportToCSV,
  close,
  estimateDistance
};