# PackFlow

Gate-based packaging approval workflow SaaS for private label food manufacturers.

## Quick Start (Local Dev)

### Prerequisites
- Node.js 20+
- MongoDB running locally **or** use Docker Compose

### 1. Using Docker Compose (recommended)

```bash
cp .env.example server/.env
# Fill in JWT_SECRET and AWS credentials in server/.env

docker compose up -d
```

The app will be available at:
- **Client:** http://localhost:5173
- **Server API:** http://localhost:5000/api

### 2. Manual Setup

**Install dependencies:**
```bash
npm install --prefix server
npm install --prefix client
```

**Start MongoDB locally** (or set MONGO_URI to your Atlas URI)

**Start the server:**
```bash
npm run dev --prefix server
```

**Start the client:**
```bash
npm run dev --prefix client
```

## Environment Variables

Copy `.env.example` and fill in values:

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs (min. 32 chars) |
| `JWT_EXPIRES_IN` | Token expiry (default: `7d`) |
| `AWS_REGION` | S3 region |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `S3_BUCKET_NAME` | S3 bucket for file uploads |
| `CLIENT_URL` | Frontend origin (for CORS) |

## Architecture

```
packflow/
├── client/          # React 18 + Vite + TailwindCSS
├── server/          # Node.js + Express 5 + Mongoose
└── docker-compose.yml
```

## Roles

| Role | Capabilities |
|------|-------------|
| **owner** | Create/edit projects, submit gates, dispatch Gate 4 |
| **reviewer** | Approve or reject gates 1–3 |
| **client** | Read-only view + Gate 4 acknowledgment |
| **admin** | All actions + user management |

## Gate Workflow

```
Gate 0 (Draft)  →  Gate 1 (Internal Review)  →  Gate 2 (Regulatory)
→  Gate 3 (Packaging Design)  →  Gate 4 (Client Approval)  →  Locked
```

- Gate 0 → 1: Owner submits with all mandatory fields
- Gates 1–3: Reviewer approves or rejects
- Gate 3 → 4: At least one file must be uploaded
- Gate 4: Owner dispatches to client → client acknowledges

## Verification Steps

1. Register an owner + reviewer user
2. Owner creates a project → Gate 0 fields validated
3. Submit → Gate 1 becomes active
4. Reviewer approves Gate 1 → Gate 2 becomes active
5. Reject Gate 2 → project stays at Gate 2 with rejection reason
6. Upload file → version increments (V1 → V2)
7. Role guards tested server-side
8. Audit log entries present for every action
