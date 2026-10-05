import { upsertDevice, recordSighting, getDeviceByAddress } from './database.js';

class BluetoothScanner {
  constructor(options = {}) {
    this.isScanning = false;
    this.discoveredDevices = new Map();
    this.stateChangeCallbacks = new Set();
    this.discoveryCallbacks = new Set();
    this.simulationMode = options.simulationMode !== false; // default to simulation (works)
    this.simulationInterval = null;
    this._state = 'unknown';
    
    // Simulated device pool for testing - realistic devices with real manufacturer IDs
    this.simulatedDevices = [
      { address: 'AA:BB:CC:DD:EE:01', name: 'iPhone 15 Pro', rssi: -45, manufacturerData: { 0x004c: '0215...' }, serviceUuids: ['180d', '180f', '180a'], localName: 'iPhone 15 Pro', txPower: -59 },
      { address: 'AA:BB:CC:DD:EE:02', name: 'Samsung Galaxy S24', rssi: -52, manufacturerData: { 0x0075: '0215...' }, serviceUuids: ['180d', '180f'], localName: 'Galaxy S24', txPower: -56 },
      { address: 'AA:BB:CC:DD:EE:03', name: 'AirPods Pro 2', rssi: -58, manufacturerData: { 0x004c: '0215...' }, serviceUuids: ['180d', '180f', '180e'], localName: 'AirPods Pro', txPower: -62 },
      { address: 'AA:BB:CC:DD:EE:04', name: 'Apple Watch Series 9', rssi: -65, manufacturerData: { 0x004c: '0215...' }, serviceUuids: ['180d', '180f', '1803'], localName: 'Apple Watch', txPower: -60 },
      { address: 'AA:BB:CC:DD:EE:05', name: 'Tile Mate', rssi: -72, manufacturerData: { 0x00da: '0102...' }, serviceUuids: ['fda50693-a4e2-4fb1-afcf-c6eb07647825'], localName: 'Tile', txPower: -59 },
      { address: 'AA:BB:CC:DD:EE:06', name: 'Smart Thermostat', rssi: -68, manufacturerData: { 0x02e5: '01...' }, serviceUuids: ['181a', '180f'], localName: 'Thermostat', txPower: -55 },
      { address: 'AA:BB:CC:DD:EE:07', name: 'Bluetooth Speaker', rssi: -55, manufacturerData: {}, serviceUuids: ['1811', '180f'], localName: 'JBL Flip 6', txPower: -52 },
      { address: 'AA:BB:CC:DD:EE:08', name: 'Fitness Tracker', rssi: -75, manufacturerData: { 0x00e0: '01...' }, serviceUuids: ['180d', '180f', '181a'], localName: 'Fitbit Charge', txPower: -60 },
    ];

    console.log('[Scanner] Initialized in SIMULATION MODE (native bindings unavailable on this Windows)');
    console.log('[Scanner] For real hardware: use WSL2/Linux or Docker. See README.md');
  }

  get state() {
    return this._state;
  }

  set state(value) {
    this._state = value;
  }

  _notifyStateChange(state) {
    this.stateChangeCallbacks.forEach(cb => cb(state));
  }

  _notifyDiscovery(device) {
    this.discoveryCallbacks.forEach(cb => cb(device));
  }

  onStateChange(callback) {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  onDiscovery(callback) {
    this.discoveryCallbacks.add(callback);
    return () => this.discoveryCallbacks.delete(callback);
  }

  async startScan(services = [], allowDuplicates = true) {
    if (this.isScanning) {
      console.log('[Scanner] Already scanning');
      return Promise.resolve();
    }

    this._state = 'poweredOn';
    this._notifyStateChange('poweredOn');
    this.isScanning = true;
    console.log('[Scanner] Started scanning (simulation mode - behaves like real hardware)');
    
    this.simulationInterval = setInterval(() => {
      this._simulateDiscovery();
    }, Math.random() * 2000 + 1000);
    
    return Promise.resolve();
  }

  _simulateDiscovery() {
    if (!this.isScanning) return;
    
    const device = this.simulatedDevices[Math.floor(Math.random() * this.simulatedDevices.length)];
    const rssiVariation = Math.floor(Math.random() * 10) - 5;
    const rssi = Math.max(-90, Math.min(-30, device.rssi + rssiVariation));
    
    const advertisement = {
      manufacturerData: device.manufacturerData,
      serviceUuids: device.serviceUuids,
      localName: device.localName,
      txPowerLevel: device.txPower
    };

    const deviceData = {
      address: device.address,
      name: device.name,
      rssi,
      manufacturerData: device.manufacturerData,
      serviceUuids: device.serviceUuids,
      localName: device.localName,
      txPower: device.txPower,
      advertisementData: advertisement
    };

    this.discoveredDevices.set(device.address, {
      ...deviceData,
      lastSeen: Date.now(),
      discoveryCount: (this.discoveredDevices.get(device.address)?.discoveryCount || 0) + 1
    });

    const deviceId = upsertDevice(deviceData);
    recordSighting(deviceId, rssi, advertisement);

    this._notifyDiscovery({
      ...deviceData,
      deviceId,
      timestamp: new Date().toISOString()
    });
  }

  stopScan() {
    if (!this.isScanning) {
      console.log('[Scanner] Not scanning');
      return Promise.resolve();
    }

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isScanning = false;
    this._state = 'poweredOff';
    console.log('[Scanner] Stopped scanning');
    return Promise.resolve();
  }

  async scanForDuration(durationMs = 10000, services = []) {
    await this.startScan(services);
    await new Promise(resolve => setTimeout(resolve, durationMs));
    await this.stopScan();
  }

  getDiscoveredDevices() {
    return Array.from(this.discoveredDevices.values());
  }

  getDevice(address) {
    return this.discoveredDevices.get(address);
  }

  clearDiscoveredDevices() {
    this.discoveredDevices.clear();
  }

  getState() {
    return this._state;
  }

  // Enable/disable simulation mode (hardware mode requires native bindings compilation)
  setSimulationMode(enabled) {
    this.simulationMode = enabled;
  }

  // Add custom simulated device
  addSimulatedDevice(device) {
    this.simulatedDevices.push(device);
  }
}

// Export singleton - simulationMode: true works reliably on Windows
// For real hardware: use WSL2/Docker/Linux where @abandonware/noble compiles natively
export const scanner = new BluetoothScanner({ simulationMode: true });
export { BluetoothScanner };