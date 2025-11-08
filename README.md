# LivelyHealthCheck ⚡

A modern, real-time URL health monitoring dashboard with performance metrics.

## Features

- 🚀 **Real-time Monitoring**: Monitor multiple URLs simultaneously with customizable check intervals
- 📊 **Performance Metrics**: Track response times and status codes
- 🎨 **Beautiful UI**: Modern React interface with Tailwind CSS
- ⚡ **SSR Support**: Server-Side Rendering with Next.js for optimal performance
- 🔄 **Auto-refresh**: Dashboard updates automatically every 5 seconds
- 📈 **History Tracking**: View detailed check history for each monitored URL

## Tech Stack

- **Backend**: Express.js with custom health check service
- **Frontend**: Next.js (React with SSR)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios & node-fetch

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Get all health checks
```
GET /api/healthchecks
```

### Get specific health check with history
```
GET /api/healthchecks/:id
```

### Create new health check
```
POST /api/healthchecks
Content-Type: application/json

{
  "url": "https://example.com",
  "name": "My Website",
  "interval": 60000
}
```

### Delete health check
```
DELETE /api/healthchecks/:id
```

## Configuration

- **Check Interval**: 5 seconds to 10 minutes (5000ms - 600000ms)
- **History Limit**: Last 50 checks per URL
- **Request Timeout**: 10 seconds
- **Auto-refresh**: Every 5 seconds

## Usage

1. Add a new URL to monitor using the form
2. Set a custom name (optional) and check interval
3. View real-time status updates on the dashboard
4. Click "Details" to see complete check history
5. Delete monitors when no longer needed

## License

ISC