# Smart Inventory Management System (SIMS)

An enterprise-grade inventory and supply chain management platform for the garment industry with AI-powered analytics, real-time tracking, and intelligent automation. Built with Python Flask, React, TypeScript, and SQLite.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router 6, Axios, React Hook Form, Zod, Recharts, Lucide Icons, Three.js |
| **Backend** | Python 3.10+, Flask, SQLAlchemy ORM, Flask-JWT-Extended, Flask-CORS |
| **Database** | SQLite (development), MySQL-ready schema |
| **AI/ML** | Custom analytics engines for demand forecasting, inventory health scoring, reorder optimization, supplier intelligence, and conversational AI copilot |

## Features

- **Role-based Authentication** — Admin and Staff roles with JWT token management and session timeout
- **Dashboard** — Real-time analytics with revenue charts, stock-by-category pie chart, top products, and recent activities
- **Product Management** — Full CRUD with image upload, barcode generation, category management, variant tracking (size/color/SKU/barcode)
- **Raw Material Management** — Supplier-linked materials with unit tracking and low stock alerts
- **Supplier Management** — Contact management, GST tracking, purchase history
- **Purchase Orders** — Multi-item purchase orders with auto stock update, status workflow (pending/completed/cancelled), invoice generation
- **Sales Management** — Multi-item sales with variant stock deduction, payment methods, invoice generation, status workflow
- **Inventory Tracking** — Real-time stock levels, movement history, low stock alerts, manual adjustments with audit trail
- **Reports & Analytics** — 5 report types (Inventory, Sales, Purchases, Suppliers, Low Stock) with JSON preview, Excel/CSV export, chart data endpoints
- **Global Search** — Cross-entity search across products, variants, materials, suppliers, purchases, and sales
- **AI Assistant** — 6 AI modules: Inventory Health scoring, Business Insights, Demand Forecasting (30/60/90 day), Reorder Recommendations, Supplier Intelligence, and Conversational AI Copilot
- **Notification System** — Auto-generated low stock and out-of-stock alerts with read/unread tracking
- **Settings** — Company profile, inventory thresholds, AI feature toggles, notification preferences, appearance (dark/light), security session config, backup/restore
- **Audit Logs** — Complete action history with filters by module, action, user, date range
- **User Management** — Admin-restricted user CRUD with role assignment, password reset, account activation/deactivation
- **Dark Mode** — Full dark/light theme support with persistent preference

## Project Structure

```
smart-inventory/
├── client/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # Layout, Navbar, Sidebar
│   │   │   ├── ui/            # Modal, Pagination, EmptyState, LoadingSkeleton, etc.
│   │   │   └── three/         # Three.js 3D visualization components
│   │   ├── pages/
│   │   │   ├── auth/          # Login, ForgotPassword, Profile, Notifications
│   │   │   ├── dashboard/     # AdminDashboard, StaffDashboard
│   │   │   ├── products/      # ProductList, ProductForm
│   │   │   ├── variants/      # VariantList, VariantForm
│   │   │   ├── materials/     # MaterialList, MaterialForm
│   │   │   ├── suppliers/     # SupplierList, SupplierForm
│   │   │   ├── purchases/     # PurchaseList, PurchaseForm
│   │   │   ├── sales/         # SaleList, SaleForm
│   │   │   ├── inventory/     # Inventory
│   │   │   ├── reports/       # Reports
│   │   │   ├── search/        # SearchPage
│   │   │   ├── users/         # UserList, UserForm
│   │   │   ├── settings/      # Settings
│   │   │   ├── audit/         # AuditLogs
│   │   │   ├── ai/            # AiPage, AiCopilot, InventoryInsights, InventoryHealth, SupplierIntelligence
│   │   │   └── errors/        # AccessDenied
│   │   ├── services/          # API service layer (dataService, authService, auditService)
│   │   ├── context/           # AuthContext, ThemeContext
│   │   ├── hooks/             # useIdleTimer
│   │   ├── types/             # TypeScript interfaces
│   │   └── constants/         # Colors and constants
│   ├── package.json
│   └── vite.config.ts
├── server/                    # Python Flask backend
│   ├── app/
│   │   ├── routes/            # 21 route files (auth, products, purchases, sales, etc.)
│   │   ├── models/            # 15 SQLAlchemy models
│   │   ├── services/          # AI engines + business logic (10 service files)
│   │   ├── middleware/        # JWT auth decorators
│   │   └── utils/             # Shared helpers
│   ├── run.py
│   └── requirements.txt
└── README.md
```

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm 9+

### Backend Setup
```bash
cd server
python -m venv venv
venv\Scripts\activate     # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python run.py              # Starts on http://localhost:5000
```

### Frontend Setup
```bash
cd client
npm install
npm run dev                # Starts on http://localhost:5173
```

### Production Build
```bash
cd client
npm run build              # Outputs to dist/
```

## API Summary

The backend exposes 116+ RESTful endpoints across 16 URL prefixes:

| Prefix | Module | Endpoints |
|--------|--------|-----------|
| `/api/auth` | Authentication | Login, Logout, Refresh, Profile, Password, User CRUD, Password Reset |
| `/api/products` | Products | CRUD, Adjust Stock, Low Stock, All |
| `/api/product-variants` | Variants | CRUD, Barcode/QR generation/download |
| `/api/materials` | Raw Materials | CRUD, Low Stock |
| `/api/suppliers` | Suppliers | CRUD |
| `/api/purchases` | Purchase Orders | CRUD, Status Update |
| `/api/sales` | Sales | CRUD, Status Update |
| `/api/inventory` | Inventory | Stock, Movements, Low Stock, Adjust, Timeline |
| `/api/categories` | Categories | CRUD |
| `/api/dashboard` | Dashboard | Stats, Transactions, Stock by Category, Monthly Sales/Purchases, Top Products |
| `/api/reports` | Reports | Inventory, Sales, Purchases, Suppliers, Low Stock + Chart Data (3 endpoints) |
| `/api/search` | Global Search | Unified search across 6 entity types |
| `/api/notifications` | Notifications | List, Unread Count, Mark Read, Mark All Read, Generate Alerts |
| `/api/settings` | System Settings | CRUD, Profile, Password, Avatar/Logo Upload, Backup/Restore, About |
| `/api/audit-logs` | Audit Logs | List with filters, Get by ID |
| `/api/ai` | AI Assistant | Health, Insights, Forecast, Reorder, Supplier Intel, Copilot Chat |

## Google Sign-In (Continue with Google)

The login page includes a "Continue with Google" button wired through a proper OAuth 2.0 authorization-code flow.

**Frontend (already implemented):**
- `client/src/services/googleAuth.ts` builds the Google authorization URL from environment variables and verifies the OAuth `state` parameter.
- `client/src/pages/auth/GoogleOAuthCallback.tsx` (route `/oauth/google/callback`) exchanges the returned code with the backend and stores the issued tokens through `AuthContext.loginWithGoogle`.

**Configuration required:**

1. Create a Web application OAuth client ID in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add `<your-app-origin>/oauth/google/callback` to the client's **Authorized redirect URIs**.
3. Set `VITE_GOOGLE_CLIENT_ID` (and optionally `VITE_GOOGLE_REDIRECT_URI`) in `client/.env` — see `client/.env.example`. The frontend client ID is public by design; **never** put a client secret in the frontend.
4. Backend endpoint (not yet implemented): `POST /api/auth/google` accepting `{ "code": "<authorization_code>" }`. It must exchange the code for tokens via Google, find or provision a SIMS user by the Google email, and return the same payload shape as `POST /api/auth/login`: `{ access_token, refresh_token, user }`.

Until `VITE_GOOGLE_CLIENT_ID` is set, the button shows a "not configured" message and does not attempt authentication.

## Database Schema

15 tables with normalized relationships:
- `users`, `token_blocklist`, `password_reset_requests`
- `categories`, `products`, `product_variants`
- `raw_materials`, `suppliers`
- `purchases`, `purchase_items`, `sales`, `sale_items`
- `inventory_logs`, `notifications`, `audit_logs`, `system_settings`

## Key Design Decisions

- **JWT Authentication** — Access + Refresh token pattern with token blocklisting for secure logout
- **Code Splitting** — All 14 route-level page components lazy-loaded via React.lazy + Suspense
- **Database Indexes** — 15 indexes on frequently queried columns (status, dates, types)
- **N+1 Query Prevention** — Batch queries and eager loading for dashboard aggregations
- **Error Handling** — All API errors return consistent `{ error: string }` JSON responses
- **Audit Trail** — Every CRUD operation logged with user, action, module, timestamp, and IP

## Known Limitations

- SQLite used for development (MySQL-ready schema, requires connection string change)
- File storage uses local filesystem (S3/cloud storage recommended for production)
- AI copilot uses rule-based NLP (LLM integration available via provider factory pattern)
- Rate limiting not implemented on API endpoints
- Full-text search uses LIKE patterns (FTS index recommended for >100K records)
- Real-time updates require WebSocket/polling migration for true multi-user sync

## Future Enhancements

- PostgreSQL/MySQL migration for production scaling
- Cloud file storage (AWS S3, Cloudinary)
- WebSocket-based real-time notifications
- LLM integration for enhanced AI copilot
- Mobile app (React Native)
- Barcode/QR scanner integration
- Multi-warehouse support
- Purchase order approval workflow
- Email notification delivery
- CI/CD pipeline with automated testing

## License

MIT License — Smart Inventory Management System
