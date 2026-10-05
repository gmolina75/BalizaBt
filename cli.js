#!/usr/bin/env node

import { scanner } from './scanner.js';
import { analyzer } from './temporal.js';
import { getAllDevices, getDeviceByAddress, updateCustomInfo, setTracked, exportData, close } from './database.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CLI {
  constructor() {
    this.commands = {
      scan: this.cmdScan.bind(this),
      list: this.cmdList.bind(this),
      device: this.cmdDevice.bind(this),
      annotate: this.cmdAnnotate.bind(this),
      track: this.cmdTrack.bind(this),
      patterns: this.cmdPatterns.bind(this),
      temporal: this.cmdTemporal.bind(this),
      export: this.cmdExport.bind(this),
      stats: this.cmdStats.bind(this),
      history: this.cmdHistory.bind(this),
      help: this.cmdHelp.bind(this)
    };
  }

  async run(args) {
    const command = args[0] || 'help';
    const handler = this.commands[command];

    if (!handler) {
      console.error(`Unknown command: ${command}`);
      this.cmdHelp();
      process.exit(1);
    }

    try {
      await handler(args.slice(1));
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  async cmdScan(args) {
    const duration = parseInt(args[0]) || 10000;
    const services = args.slice(1).filter(s => s.startsWith('0x') || s.length === 4 || s.length === 32);

    console.log(`Starting scan for ${duration}ms...`);
    if (services.length > 0) {
      console.log(`Filtering services: ${services.join(', ')}`);
    }

    scanner.onDiscovery((device) => {
      const name = device.name || device.localName || 'Unknown';
      const customName = device.customName ? ` (${device.customName})` : '';
      console.log(`  [${new Date(device.timestamp).toLocaleTimeString()}] ${device.address} | RSSI: ${device.rssi} | ${name}${customName}`);
    });

    await scanner.scanForDuration(duration, services);

    console.log('\nScan complete.');
    const devices = scanner.getDiscoveredDevices();
    console.log(`Discovered ${devices.length} unique devices.`);

    scanner.onDiscovery(() => {});
  }

  async cmdList(args) {
    const options = this._parseListOptions(args);
    const devices = getAllDevices(options);

    if (devices.length === 0) {
      console.log('No devices found.');
      return;
    }

    console.log(`\nFound ${devices.length} device(s):\n`);
    devices.forEach(d => {
      const tracked = d.is_tracked ? ' ★' : '';
      const custom = d.custom_name ? ` (${d.custom_name})` : '';
      const tags = d.custom_tags ? ` [${JSON.parse(d.custom_tags).join(', ')}]` : '';
      console.log(`  ${d.address} | RSSI: ${d.rssi} | ${d.name || 'Unknown'}${custom}${tags}${tracked}`);
      console.log(`    Seen: ${d.seen_count}x | Last: ${d.last_seen} | ID: ${d.id}`);
    });
  }

  _parseListOptions(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--tracked':
          options.tracked = true;
          break;
        case '--untracked':
          options.tracked = false;
          break;
        case '--search':
          options.nameSearch = args[++i];
          break;
        case '--min-rssi':
          options.minRssi = parseInt(args[++i]);
          break;
        case '--since':
          options.since = args[++i];
          break;
        case '--limit':
          options.limit = parseInt(args[++i]);
          break;
      }
    }
    return options;
  }

  async cmdDevice(args) {
    const identifier = args[0];
    if (!identifier) {
      console.error('Usage: baliza device <address|id>');
      return;
    }

    let device = null;
    if (/^\d+$/.test(identifier)) {
      device = await import('./database.js').then(m => m.getDeviceById(parseInt(identifier)));
    } else {
      device = getDeviceByAddress(identifier);
    }

    if (!device) {
      console.log('Device not found.');
      return;
    }

    console.log('\nDevice Details:');
    console.log(`  ID: ${device.id}`);
    console.log(`  Address: ${device.address}`);
    console.log(`  Name: ${device.name || 'Unknown'}`);
    console.log(`  Custom Name: ${device.custom_name || '(none)'}`);
    console.log(`  RSSI: ${device.rssi}`);
    console.log(`  Tracked: ${device.is_tracked ? 'Yes' : 'No'}`);
    console.log(`  Seen Count: ${device.seen_count}`);
    console.log(`  First Seen: ${device.first_seen}`);
    console.log(`  Last Seen: ${device.last_seen}`);
    console.log(`  Notes: ${device.custom_notes || '(none)'}`);
    console.log(`  Tags: ${device.custom_tags || '(none)'}`);
    console.log(`  Manufacturer Data: ${device.manufacturer_data || '(none)'}`);
    console.log(`  Service UUIDs: ${device.service_uuids || '(none)'}`);
    console.log(`  Metadata: ${device.metadata_json || '{}'}`);
  }

  async cmdAnnotate(args) {
    const identifier = args[0];
    if (!identifier) {
      console.error('Usage: baliza annotate <address|id> --name "Name" --notes "Notes" --tags "tag1,tag2"');
      return;
    }

    let device = null;
    if (/^\d+$/.test(identifier)) {
      device = await import('./database.js').then(m => m.getDeviceById(parseInt(identifier)));
    } else {
      device = getDeviceByAddress(identifier);
    }

    if (!device) {
      console.log('Device not found.');
      return;
    }

    const options = {};
    for (let i = 1; i < args.length; i++) {
      switch (args[i]) {
        case '--name':
          options.name = args[++i];
          break;
        case '--notes':
          options.notes = args[++i];
          break;
        case '--tags':
          options.tags = args[++i].split(',').map(t => t.trim());
          break;
      }
    }

    if (Object.keys(options).length === 0) {
      console.error('No annotation options provided. Use --name, --notes, or --tags');
      return;
    }

    const updated = analyzer.annotateDevice(device.id, options);
    console.log('Device annotated successfully:');
    console.log(`  Custom Name: ${updated.custom_name || '(none)'}`);
    console.log(`  Notes: ${updated.custom_notes || '(none)'}`);
    console.log(`  Tags: ${updated.custom_tags || '(none)'}`);
  }

  async cmdTrack(args) {
    const identifier = args[0];
    const action = args[1] || 'toggle';

    if (!identifier) {
      console.error('Usage: baliza track <address|id> [on|off|toggle]');
      return;
    }

    let device = null;
    if (/^\d+$/.test(identifier)) {
      device = await import('./database.js').then(m => m.getDeviceById(parseInt(identifier)));
    } else {
      device = getDeviceByAddress(identifier);
    }

    if (!device) {
      console.log('Device not found.');
      return;
    }

    let tracked;
    if (action === 'on') tracked = true;
    else if (action === 'off') tracked = false;
    else tracked = !device.is_tracked;

    analyzer.annotateDevice(device.id, { tracked });
    console.log(`Device ${tracked ? 'now tracked' : 'no longer tracked'}.`);
  }

  async cmdPatterns(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--min-occurrences':
          options.minOccurrences = parseInt(args[++i]);
          break;
        case '--hours':
          options.hours = parseInt(args[++i]);
          break;
        case '--rssi':
          options.rssiThreshold = parseInt(args[++i]);
          break;
      }
    }

    const patterns = analyzer.findPatterns(options);

    console.log('\n=== Pattern Analysis ===\n');

    console.log(`Recurring Devices (>= ${options.minOccurrences || 3} sightings): ${patterns.recurringDevices.length}`);
    patterns.recurringDevices.slice(0, 10).forEach(d => {
      console.log(`  ${d.address} | ${d.name || 'Unknown'} | Seen: ${d.seen_count}x | RSSI: ${d.rssi}`);
    });

    console.log(`\nStrong Signals (> ${options.rssiThreshold || -60} dBm): ${patterns.strongSignals.length}`);
    patterns.strongSignals.slice(0, 10).forEach(d => {
      console.log(`  ${d.address} | ${d.name || 'Unknown'} | RSSI: ${d.rssi}`);
    });

    console.log(`\nNew Devices (last ${options.hours || 24}h): ${patterns.newDevices.length}`);
    patterns.newDevices.slice(0, 10).forEach(d => {
      console.log(`  ${d.address} | ${d.name || 'Unknown'} | First: ${d.first_seen}`);
    });

    console.log('\nManufacturer Groups:');
    Object.entries(patterns.manufacturerGroups).forEach(([mfg, devs]) => {
      console.log(`  ${mfg}: ${devs.length} device(s)`);
      devs.slice(0, 3).forEach(d => console.log(`    ${d.address} | ${d.name || 'Unknown'} | RSSI: ${d.rssi}`));
    });

    console.log('\nService UUID Groups:');
    Object.entries(patterns.serviceGroups).forEach(([uuid, devs]) => {
      console.log(`  ${uuid}: ${devs.length} device(s)`);
      devs.slice(0, 3).forEach(d => console.log(`    ${d.address} | ${d.name || 'Unknown'} | RSSI: ${d.rssi}`));
    });
  }

  async cmdTemporal(args) {
    const options = { intervalMinutes: 5, hours: 24 };
    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--interval':
          options.intervalMinutes = parseInt(args[++i]);
          break;
        case '--hours':
          options.hours = parseInt(args[++i]);
          break;
      }
    }

    const data = analyzer.getTemporalMass(options);

    console.log('\n=== Temporal Mass Analysis ===');
    console.log(`Time Range: ${options.hours}h, Interval: ${options.intervalMinutes}min`);
    console.log(`Total Devices: ${data.summary.totalDevices}`);
    console.log(`Tracked: ${data.summary.trackedDevices}`);
    console.log(`Active (1h): ${data.summary.activeLastHour}`);
    console.log(`Active (24h): ${data.summary.activeLastDay}\n`);

    console.log('Timeline:');
    data.timeline.forEach(interval => {
      const time = new Date(interval.interval_start).toLocaleTimeString();
      console.log(`  ${time} | Devices: ${interval.uniqueDevices} | Sightings: ${interval.total_sightings} | Avg RSSI: ${interval.avg_rssi?.toFixed(1) || 'N/A'}`);
      if (interval.deviceDetails.length > 0) {
        interval.deviceDetails.slice(0, 5).forEach(d => {
          const tracked = d.isTracked ? ' ★' : '';
          console.log(`    ${d.address} | ${d.name || 'Unknown'} | RSSI: ${d.rssi} | Sightings: ${d.sightingCount}${tracked}`);
        });
        if (interval.deviceDetails.length > 5) {
          console.log(`    ... and ${interval.deviceDetails.length - 5} more`);
        }
      }
    });
  }

  async cmdStats(args) {
    const stats = await import('./database.js').then(m => m.getDeviceStats());

    console.log('\n=== Database Statistics ===');
    console.log(`Total Devices: ${stats.total_devices}`);
    console.log(`Tracked Devices: ${stats.tracked_devices}`);
    console.log(`Active (last hour): ${stats.active_last_hour}`);
    console.log(`Active (last day): ${stats.active_last_day}`);
    console.log(`Avg Sightings/Device: ${stats.avg_sightings_per_device?.toFixed(1) || 'N/A'}`);
    console.log(`Max Sightings: ${stats.max_sightings}`);
  }

  async cmdHistory(args) {
    const identifier = args[0];
    const hours = parseInt(args[1]) || 24;

    if (!identifier) {
      console.error('Usage: baliza history <address|id> [hours]');
      return;
    }

    let device = null;
    if (/^\d+$/.test(identifier)) {
      device = await import('./database.js').then(m => m.getDeviceById(parseInt(identifier)));
    } else {
      device = getDeviceByAddress(identifier);
    }

    if (!device) {
      console.log('Device not found.');
      return;
    }

    const history = analyzer.getDeviceHistory(device.id, hours);

    console.log(`\n=== History for ${device.address} (${device.name || 'Unknown'}) ===`);
    console.log(`Time Range: ${hours}h`);
    console.log(`Total Sightings: ${history.sightings.length}`);

    if (history.stats) {
      console.log(`\nRSSI: Min ${history.stats.rssi.min} | Max ${history.stats.rssi.max} | Avg ${history.stats.rssi.avg.toFixed(1)} | Latest ${history.stats.rssi.latest}`);
      if (history.stats.distance) {
        console.log(`Distance: Min ${history.stats.distance.min.toFixed(2)}m | Max ${history.stats.distance.max.toFixed(2)}m | Avg ${history.stats.distance.avg.toFixed(2)}m`);
      }
      if (history.stats.timeSpan) {
        console.log(`Time Span: ${history.stats.timeSpan.durationHours.toFixed(2)}h (${history.stats.timeSpan.first} to ${history.stats.timeSpan.last})`);
      }
    }

    console.log('\nRecent Sightings:');
    history.sightings.slice(0, 20).forEach(s => {
      const dist = s.distanceEstimate ? ` ~${s.distanceEstimate.toFixed(2)}m` : '';
      console.log(`  ${new Date(s.timestamp).toLocaleTimeString()} | RSSI: ${s.rssi}${dist}`);
    });
  }

  async cmdExport(args) {
    const format = args[0] || 'json';
    const data = exportData(format);

    if (format === 'json') {
      console.log(data);
    } else {
      console.log('Export format not supported:', format);
    }
  }

  cmdHelp() {
    console.log(`
BalizaBT - Bluetooth Scanner & Temporal Analyzer

Usage: baliza <command> [options]

Commands:
  scan [duration_ms] [service_uuids...]   Scan for Bluetooth devices
  list [options]                          List discovered devices
  device <address|id>                     Show device details
  annotate <address|id> [options]         Add custom info to device
  track <address|id> [on|off|toggle]      Toggle tracking for device
  patterns [options]                      Find patterns in data
  temporal [options]                      Show temporal mass analysis
  stats                                   Show database statistics
  history <address|id> [hours]            Show device sighting history
  export [json]                           Export all data
  help                                    Show this help

List Options:
  --tracked              Show only tracked devices
  --untracked            Show only untracked devices
  --search <term>        Search by name/address
  --min-rssi <value>     Minimum RSSI filter
  --since <ISO_date>     Filter by last seen date
  --limit <n>            Limit results

Annotate Options:
  --name <name>          Custom name
  --notes <text>         Custom notes
  --tags <tag1,tag2>     Comma-separated tags

Patterns Options:
  --min-occurrences <n>  Minimum sightings (default: 3)
  --hours <n>            Time window in hours (default: 24)
  --rssi <value>         RSSI threshold (default: -80)

Temporal Options:
  --interval <min>       Aggregation interval in minutes (default: 5)
  --hours <n>            Time window in hours (default: 24)

Examples:
  baliza scan 30000
  baliza list --tracked
  baliza annotate AA:BB:CC:DD:EE:FF --name "My Phone" --tags "personal,phone"
  baliza track AA:BB:CC:DD:EE:FF on
  baliza patterns --hours 48 --min-occurrences 5
  baliza temporal --interval 10 --hours 12
  baliza history AA:BB:CC:DD:EE:FF 6
`);
  }
}

const cli = new CLI();
cli.run(process.argv.slice(2));