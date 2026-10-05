import { scanner } from './scanner.js';
import { analyzer } from './temporal.js';
import { upsertDevice, recordSighting, getAllDevices, getDeviceByAddress, getDeviceStats, close, exportData } from './database.js';

async function runTests() {
  console.log('=== Running BalizaBT Tests ===\n');

  let testDeviceId = null;

  // Test 1: Database operations
  console.log('Test 1: Database operations');
  try {
    const testDevice = {
      address: 'AA:BB:CC:DD:EE:FF',
      name: 'Test Device',
      rssi: -65,
      manufacturerData: { 0x004c: Buffer.from([0x02, 0x15]).toString('hex') },
      serviceUuids: ['180d', '180f'],
      localName: 'Test Device',
      txPower: -59,
      advertisementData: { localName: 'Test Device' }
    };

    testDeviceId = upsertDevice(testDevice);
    console.log(`  Inserted device with ID: ${testDeviceId}`);

    const id2 = upsertDevice({ ...testDevice, rssi: -70 });
    console.log(`  Updated device, returned ID: ${id2}`);
    console.log(`  IDs match: ${testDeviceId === id2}`);

    recordSighting(testDeviceId, -65, testDevice.advertisementData);
    recordSighting(testDeviceId, -70, testDevice.advertisementData);
    console.log('  Recorded sightings');

    const devices = getAllDevices();
    console.log(`  Total devices: ${devices.length}`);

    const device = getDeviceByAddress('AA:BB:CC:DD:EE:FF');
    console.log(`  Retrieved device: ${device.name} (seen ${device.seen_count}x)`);

    const stats = getDeviceStats();
    console.log(`  Stats: ${stats.total_devices} devices, ${stats.tracked_devices} tracked`);

    console.log('  ✓ Database tests passed\n');
  } catch (e) {
    console.error('  ✗ Database test failed:', e.message, '\n');
    process.exit(1);
  }

  // Test 2: Temporal analyzer
  console.log('Test 2: Temporal analyzer');
  try {
    const temporalData = analyzer.getTemporalMass({ hours: 1, intervalMinutes: 1 });
    console.log(`  Temporal mass summary: ${temporalData.summary.totalDevices} devices`);
    console.log(`  Timeline intervals: ${temporalData.timeline.length}`);

    const patterns = analyzer.findPatterns({ hours: 1 });
    console.log(`  Patterns found: ${patterns.recurringDevices.length} recurring, ${patterns.newDevices.length} new`);

    const history = analyzer.getDeviceHistory(testDeviceId, 1);
    console.log(`  Device history: ${history.sightings.length} sightings`);

    analyzer.annotateDevice(testDeviceId, {
      name: 'My Test Device',
      notes: 'This is a test',
      tags: ['test', 'demo']
    });
    console.log('  Annotated device');

    const updated = getDeviceByAddress('AA:BB:CC:DD:EE:FF');
    console.log(`  Custom name: ${updated.custom_name}`);
    console.log(`  Tags: ${updated.custom_tags}`);

    console.log('  ✓ Temporal analyzer tests passed\n');
  } catch (e) {
    console.error('  ✗ Temporal analyzer test failed:', e.message, '\n');
    process.exit(1);
  }

  // Test 3: Scanner initialization (without hardware)
  console.log('Test 3: Scanner initialization');
  try {
    const state = scanner.getState();
    console.log(`  Bluetooth state: ${state}`);
    console.log('  ✓ Scanner initialized (hardware not tested)\n');
  } catch (e) {
    console.error('  ✗ Scanner test failed:', e.message, '\n');
    process.exit(1);
  }

  // Test 4: Export
  console.log('Test 4: Data export');
  try {
    const exported = JSON.parse(exportData('json'));
    console.log(`  Exported ${exported.devices.length} devices and ${exported.sightings.length} sightings`);
    console.log('  ✓ Export test passed\n');
  } catch (e) {
    console.error('  ✗ Export test failed:', e.message, '\n');
    process.exit(1);
  }

  console.log('=== All Tests Passed ===');
  close();
}

runTests().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});