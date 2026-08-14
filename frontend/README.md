# AutoCare Frontend

Production-grade React SPA for the AutoCare doorstep vehicle-repair platform.
Consumes the Spring Boot microservices exclusively through the **API Gateway** (`/api/**`).

## Tech Stack

- **React 18 + Vite 5 + TypeScript** (strict)
- **Tailwind CSS 3** — custom design system (ink/brand tokens, dark mode)
- **TanStack Query** — server state, caching, retries
- **Zustand** — client state (auth session, cart, theme, toasts)
- **React Hook Form + Zod** — typed form validation
- **Framer Motion** — page/UI micro-interactions
- **Recharts** — admin analytics charts
- **Lucide React** — consistent icon set

## Run Locally

```bash
npm install
npm run dev        # http://localhost:3000 (proxies /api → :8080 gateway)
npm run build      # production build → dist/
```

## Roles & Access

| Role | Home | Routes |
|------|------|--------|
| CUSTOMER | `/dashboard` | vehicles, book-service, bookings (live tracking), payments, reviews, marketplace |
| MECHANIC | `/mechanic` | jobs, availability, recommendations, profile |
| ADMIN | `/admin` | KPIs + charts, bookings, mechanics, customers, payments, approvals |

Login: `admin@autocare.com` / `Admin@123` (admin). Customer & mechanic registration are self-service.

---

## API Endpoint Mapping

All calls go through `src/lib/api.ts` (axios instance with JWT interceptor). 401 → auto logout + redirect.

### Auth (`POST /api/auth/*`)
| Screen | Endpoint | Notes |
|--------|----------|-------|
| Login | `POST /api/auth/login` | email+password → `{token, userId, name, role}` |
| Register | `POST /api/auth/register` | role CUSTOMER; MECHANIC registrations land in PENDING |
| Mechanic apply | `POST /api/auth/register` + `POST /api/mechanics` | mechanic profile created after user registers |
| Forgot password | `POST /api/auth/forgot-password` | returns OTP (demo: echoed in response) |
| OTP verify | `POST /api/auth/verify-otp` | |
| Reset password | `POST /api/auth/reset-password` | requires valid OTP |

### Vehicles (`/api/vehicles`)
| Feature | Endpoint |
|---------|----------|
| List mine | `GET /api/vehicles` |
| Add | `POST /api/vehicles` |
| Update | `PUT /api/vehicles/{id}` |
| Delete | `DELETE /api/vehicles/{id}` |
| Photo upload | `POST /api/vehicles/{id}/image` (multipart) |

### Mechanics (`/api/mechanics`)
| Feature | Endpoint |
|---------|----------|
| Browse (public) | `GET /api/mechanics?available=&skill=&area=` |
| My profile | `GET /api/mechanics/by-user/{userId}` |
| Set availability | `PUT /api/mechanics/{id}/availability` |
| Register profile | `POST /api/mechanics` |

### Bookings (`/api/bookings`)
| Feature | Endpoint |
|---------|----------|
| Create (auto-assign) | `POST /api/bookings` |
| My bookings | `GET /api/bookings` |
| Assigned (mechanic) | `GET /api/bookings/mechanic/assigned` |
| Admin all | `GET /api/bookings/admin/all` |
| Status change | `PUT /api/bookings/{id}/status` (role-gated) |
| **Live tracking** | `GET /api/bookings/{id}/stream` — SSE status events consumed by `BookingTimeline` |

### Spare Parts & Recommendations
| Feature | Endpoint |
|---------|----------|
| Catalog | `GET /api/parts` |
| Detail | `GET /api/parts/{id}` |
| Photo upload | `POST /api/parts/{id}/image` (multipart) |
| Mechanic recommend | `POST /api/recommendations` |
| Job recommendations | `GET /api/recommendations/booking/{bookingId}` |
| Customer decision | `PUT /api/recommendations/{id}/decision` |

### Payments (`/api/payments`)
| Feature | Endpoint |
|---------|----------|
| Initiate (booking/parts) | `POST /api/payments` |
| My history | `GET /api/payments` |
| Admin all | `GET /api/payments/admin/all` |
| Simulated gateway | `POST /api/payments/webhook` (HMAC-signed, backend-to-backend) |

### Reviews (`/api/reviews`)
| Feature | Endpoint |
|---------|----------|
| Write review | `POST /api/reviews` (completed bookings only) |
| Mechanic reviews | `GET /api/reviews/mechanic/{mechanicId}` |

### Notifications (`/api/notifications` — new)
| Feature | Endpoint |
|---------|----------|
| My notifications | `GET /api/notifications?userId=` |
| Unread count | `GET /api/notifications/unread-count?userId=` |
| Mark one read | `PUT /api/notifications/{id}/read` |
| Mark all read | `PUT /api/notifications/read-all?userId=` |

Notifications are produced by RabbitMQ events (booking created/updated, payment success/failure, mechanic approval) and stored in the notification-service.

### Admin (`/api/admin`)
| Feature | Endpoint |
|---------|----------|
| Dashboard KPIs | `GET /api/admin/dashboard` |
| All bookings | `GET /api/admin/bookings` |
| All mechanics | `GET /api/admin/mechanics` |
| Pending approvals | `GET /api/admin/mechanics/pending` |
| Approve / reject | `PUT /api/admin/mechanics/{id}/approve` · `/reject` |
| All payments | `GET /api/admin/payments` |
| All users | `GET /api/users/admin/all` |

---

## Structure

```
src/
├── lib/            # api.ts (axios+interceptors), utils, query-client
├── stores/         # zustand: auth, cart, theme, toast
├── hooks/          # use-notifications (polling), etc.
├── components/
│   ├── ui/         # Button, Input, Badge, Modal, Stars, Stepper, KpiCard, Feedback…
│   └── layout/     # PublicLayout (navbar/footer), DashboardLayout (sidebar/topbar)
├── features/
│   ├── auth/       # login, register, mechanic apply, forgot/reset
│   ├── landing/    # hero, services, how-it-works, CTA
│   ├── catalog/    # mechanics, parts, detail, cart, checkout, marketplace
│   ├── booking/    # multi-step wizard + SSE live tracking timeline
│   ├── customer/   # overview, vehicles, bookings, payments, reviews
│   ├── mechanic/   # overview, jobs, availability, recommendations, profile
│   ├── admin/      # KPIs + charts, bookings, mechanics, customers, payments, approvals
│   └── notifications/
├── routes/         # ProtectedRoute (role gating)
├── types/          # DTO types matching backend entities
└── App.tsx         # route table
```
