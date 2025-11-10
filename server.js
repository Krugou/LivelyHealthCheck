const express = require('express');
const next = require('next');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// In-memory storage for health checks
const healthChecks = new Map();
const healthCheckResults = new Map();

// File path for persistence
const DATA_FILE = path.join(__dirname, 'healthchecks-data.json');

// Load data from file if exists
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.healthChecks) {
        Object.entries(data.healthChecks).forEach(([id, check]) => {
          healthChecks.set(id, check);
        });
      }
      if (data.healthCheckResults) {
        Object.entries(data.healthCheckResults).forEach(([id, results]) => {
          healthCheckResults.set(id, results);
        });
      }
    } catch (e) {
      console.error('Failed to load health check data:', e);
    }
  }
}

// Save data to file
function saveData() {
  const data = {
    healthChecks: Object.fromEntries(healthChecks),
    healthCheckResults: Object.fromEntries(healthCheckResults),
  };
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save health check data:', e);
  }
}

// Load data on startup
loadData();




// Health check service
class HealthCheckService {
  constructor() {
    this.intervals = new Map();
  }

  async checkUrl(url) {
    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        method: 'GET',
        timeout: 10000,
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        url,
        status: response.ok ? 'online' : 'offline',
        statusCode: response.status,
        responseTime,
        timestamp: new Date().toISOString(),
        error: null,
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        url,
        status: 'offline',
        statusCode: null,
        responseTime,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  startMonitoring(id, url, interval) {
    // Clear existing interval if any
    this.stopMonitoring(id);

    // Initial check
    this.checkUrl(url).then(result => {
      const results = healthCheckResults.get(id) || [];
      results.push(result);
      // Keep only last 50 results
      if (results.length > 50) results.shift();
      healthCheckResults.set(id, results);
      saveData();
    });

    // Set up interval
    const intervalId = setInterval(async () => {
      const result = await this.checkUrl(url);
      const results = healthCheckResults.get(id) || [];
      results.push(result);
      // Keep only last 50 results
      if (results.length > 50) results.shift();
      healthCheckResults.set(id, results);
      saveData();
    }, interval);

    this.intervals.set(id, intervalId);
  }

  stopMonitoring(id) {
    const intervalId = this.intervals.get(id);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(id);
    }
  }

  stopAll() {
    this.intervals.forEach((intervalId) => clearInterval(intervalId));
    this.intervals.clear();
  }
}

const healthCheckService = new HealthCheckService();

// Resume monitoring for all loaded health checks after startup
const restoredCount = healthChecks.size;
if (restoredCount > 0) {
  console.log(`Restoring ${restoredCount} health check(s) from disk...`);
  for (const [id, check] of healthChecks.entries()) {
    healthCheckService.startMonitoring(id, check.url, check.interval);
  }
} else {
  console.log('No saved health checks to restore.');
}
app.prepare().then(() => {
  const server = express();

  server.use(express.json());

  // Test endpoint for health checks (always returns 200)
  server.get('/api/ping', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes

  // Get all health checks
  server.get('/api/healthchecks', (req, res) => {
    const checks = Array.from(healthChecks.entries()).map(([id, check]) => {
      const results = healthCheckResults.get(id) || [];
      const latestResult = results[results.length - 1];

      return {
        id,
        ...check,
        latestStatus: latestResult?.status || 'pending',
        latestResponseTime: latestResult?.responseTime || null,
        lastChecked: latestResult?.timestamp || null,
      };
    });

    res.json({ checks });
  });

  // Get specific health check with history
  server.get('/api/healthchecks/:id', (req, res) => {
    const { id } = req.params;
    const check = healthChecks.get(id);

    if (!check) {
      return res.status(404).json({ error: 'Health check not found' });
    }

    const results = healthCheckResults.get(id) || [];

    res.json({
      id,
      ...check,
      results,
    });
  });

  // Create new health check (JSON body)
  server.post('/api/healthchecks', (req, res) => {
    const { url, interval = 60000, name } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Validate interval (min 5 seconds, max 1 hour)
    const intervalMs = parseInt(interval);
    if (isNaN(intervalMs) || intervalMs < 5000 || intervalMs > 3600000) {
      return res.status(400).json({
        error: 'Interval must be between 5000ms (5s) and 3600000ms (1h)'
      });
    }

    const id = `hc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const check = {
      url,
      interval: intervalMs,
      name: name || url,
      createdAt: new Date().toISOString(),
    };

    healthChecks.set(id, check);
    saveData();
    healthCheckService.startMonitoring(id, url, intervalMs);

    res.status(201).json({ id, ...check });
  });

  // Delete health check
  server.delete('/api/healthchecks/:id', (req, res) => {
    const { id } = req.params;

    if (!healthChecks.has(id)) {
      return res.status(404).json({ error: 'Health check not found' });
    }

    healthCheckService.stopMonitoring(id);
    healthChecks.delete(id);
    healthCheckResults.delete(id);
    saveData();

    res.json({ message: 'Health check deleted' });
  });

  // Handle all other routes with Next.js
  server.get('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3020;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });

  // Cleanup on exit
  process.on('SIGTERM', () => {
    healthCheckService.stopAll();
    saveData();
    process.exit(0);
  });

  // Also save on SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    healthCheckService.stopAll();
    saveData();
    process.exit(0);
  });
});
