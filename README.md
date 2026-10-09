# StorageOps

Storage infrastructure management dashboard for VMware datastores, Synology NAS volumes, and VM storage.

## Features

- **Dashboard** — Capacity overview, usage charts, active alerts at a glance
- **VMware Datastores** — Track VMFS, NFS, vSAN, and vVOL datastores with capacity bars and status
- **Synology NAS** — Manage NAS volumes grouped by device, RAID type, disk health, and shares
- **Virtual Machines** — Monitor VM disk usage, provisioned vs. used storage, and snapshot inventory
- **Alerts** — Threshold-based capacity and status alerts with acknowledge/dismiss workflow

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **React 19** + Zustand (state management)
- **MongoDB** + Mongoose (data storage)
- **Tailwind CSS 4** (styling)
- **Recharts** (charts)
- **Lucide React** (icons)

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variable
MONGODB_URI=mongodb://localhost:27017/storageops

# Run development server
npm run dev
```

## Seed Data

POST `/api/seed` to populate the database with realistic sample data covering VMware datastores, Synology volumes, VMs, and alerts.

## Live Data Sync

In addition to manual CRUD and the mock seed route, the app can pull real data directly from vCenter and a Synology NAS:

- POST `/api/sync/vmware` — logs into vCenter via the vSphere REST API, fetches VMs and datastores, and upserts them into the `VirtualMachine` and `Datastore` collections (capacity/status alerts are created automatically).
- POST `/api/sync/synology` — logs into DSM via the Synology Web API, fetches storage volumes and disks, and upserts them into the `SynologyVolume` and `SynologyDisk` collections (capacity/status alerts are created automatically).

Run these on a schedule (e.g. a cron job or serverless scheduled function) to keep the dashboard up to date with live infrastructure.

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `VCENTER_HOST` | vCenter hostname (used by `/api/sync/vmware`) |
| `VCENTER_USERNAME` | vCenter login username |
| `VCENTER_PASSWORD` | vCenter login password |
| `SYNOLOGY_HOST` | Synology NAS hostname, optionally with port (used by `/api/sync/synology`) |
| `SYNOLOGY_USERNAME` | DSM login username |
| `SYNOLOGY_PASSWORD` | DSM login password |
| `SYNOLOGY_PROTOCOL` | `http` or `https` (default `https`) |

If vCenter or DSM uses a self-signed certificate, trust it via Node's `NODE_EXTRA_CA_CERTS` environment variable instead of disabling TLS verification.
