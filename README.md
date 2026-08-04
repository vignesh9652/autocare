# AutoCare - Microservices Platform

A Spring Boot microservices platform for managing vehicle repair bookings, built with Java 21, Spring Boot 3.3.0, and Spring Cloud 2023.0.6.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           API Gateway (:8080)                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Spring Cloud Gateway — routes to services via Eureka discovery│ │
│  └────────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────────────┐
       │                    │                            │
       ▼                    ▼                            ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│ User Service │    │Vehicle Svc   │    │  Mechanic Svc    │
│   (:8081)    │    │  (:8082)     │    │    (:8083)       │
├──────────────┤    ├──────────────┤    ├──────────────────┤
│ Auth/JWT     │    │ Vehicle CRUD │    │ Mechanic Profiles│
│ Registration │    │ Ownership    │    │ Availability     │
│ Login        │    │ Validation   │    │ Ratings          │
└──────┬───────┘    └──────┬───────┘    └────────┬─────────┘
       │                   │                     │
       └───────────────────┼─────────────────────┘
                           │
                           ▼
            ┌───────────────────────────────┐
            │        Booking Service        │
            │          (:8084)              │
            ├───────────────────────────────┤
            │ Creates bookings, publishes   │
            │ events to RabbitMQ, validates │
            │ vehicle/mechanic via discovery│
            └──┬────────────┬───────────────┬──────┘
               │            │               │
               ▼            ▼               ▼
   ┌──────────────────┐  ┌────────────────────┐  ┌────────────────────┐
   │Notification Svc  │  │ Spare Parts Service│  │   Payment Service  │
   │    (:8085)       │  │     (:8087)        │  │     (:8086)        │
   ├──────────────────┤  ├────────────────────┤  ├────────────────────┤
   │ Consumes         │  │ Parts catalog,     │  │ Payment initiation │
   │ RabbitMQ events, │  │ recommendations,   │  │ webhook processing,│
   │ logs/tracks      │  │ stock management,  │  │ publishes events to│
   │ notifications    │  │ ordering workflow  │  │ autocare.events    │
   └──────────────────┘  └────────────────────┘  └────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Eureka     │
                    │   Registry   │
                    │   (:8761)    │
                    └──────────────┘
```

### Services Overview

| Service | Port | Description | Tech Stack |
|---------|------|-------------|------------|
| **Eureka Server** | 8761 | Service registry & discovery | Spring Cloud Netflix |
| **API Gateway** | 8080 | Single entry point, routes to services | Spring Cloud Gateway |
| **User Service** | 8081 | User registration, login, JWT auth | Spring Security, MySQL |
| **Vehicle Service** | 8082 | Vehicle CRUD, ownership validation | Spring Data JPA, MySQL |
| **Mechanic Service** | 8083 | Mechanic profiles, availability, ratings | Spring Data JPA, MySQL |
| **Booking Service** | 8084 | Booking creation, status workflow, RabbitMQ events | Spring Data JPA, MySQL, RabbitMQ |
| **Notification Service** | 8085 | Consumes RabbitMQ events, simulates notifications | Spring AMQP, RabbitMQ |
| **Payment Service** | 8086 | Payment initiation, gateway webhooks, payment status events | Spring Data JPA, MySQL, RabbitMQ |
| **Spare Parts Service** | 8087 | Parts catalog, recommendations, stock management, ordering | Spring Data JPA, MySQL |
| **Review Service** | 8088 | Reviews & ratings for mechanics and services | Spring Data JPA, MySQL |
| **Admin Service** | 8089 | Aggregated dashboard across all services | WebClient, Spring Boot |

### Infrastructure

| Component | Purpose |
|-----------|---------|
| **MySQL 8.0** | Primary database (one database per service) |
| **RabbitMQ 3.12** | Message broker for async event-driven communication |
| **Eureka** | Service registry for inter-service discovery |

---

## Quick Start

### Prerequisites

- **Java 21** ([Eclipse Temurin](https://adoptium.net/) recommended)
- **Maven 3.9+**
- **Docker Desktop** (for containerized MySQL + RabbitMQ)
- **MySQL 8.0** (if running services locally without Docker)

### 1. Start Infrastructure

```bash
# Start MySQL and RabbitMQ via Docker
docker compose -f docker/docker-compose.yml up -d mysql rabbitmq

# Verify they're healthy:
docker ps --filter "name=autocare-mysql" --filter "name=autocare-rabbitmq"

# RabbitMQ Management UI: http://localhost:15672 (guest/guest)
```

### 2. Build All Services

```bash
# Build ALL services with one command (aggregator POM):
mvn clean package -DskipTests -f backend/pom.xml

# Or use the helper script (also builds the frontend):
./scripts/build-all.sh

# Or build just a single service:
cd backend/booking-service && mvn clean package -DskipTests -q
```

### 3. Start All Services (Local)

Open **11 separate terminal windows** and run in order:

```bash
# Terminal 1: Eureka Server (port 8761)
cd backend/eureka-server && mvn spring-boot:run

# Terminal 2: User Service (port 8081) — wait for Eureka
cd backend/user-service && mvn spring-boot:run

# Terminal 3: Vehicle Service (port 8082)
cd backend/vehicle-service && mvn spring-boot:run

# Terminal 4: Mechanic Service (port 8083)
cd backend/mechanic-service && mvn spring-boot:run

# Terminal 5: Booking Service (port 8084)
cd backend/booking-service && mvn spring-boot:run

# Terminal 6: Notification Service (port 8085)
cd backend/notification-service && mvn spring-boot:run

# Terminal 7: Spare Parts Service (port 8087)
cd backend/spareparts-service && mvn spring-boot:run

# Terminal 8: Payment Service (port 8086)
cd backend/payment-service && mvn spring-boot:run

# Terminal 9: Review Service (port 8088)
cd backend/review-service && mvn spring-boot:run

# Terminal 10: Admin Service (port 8089)
cd backend/admin-service && mvn spring-boot:run

# Terminal 11: API Gateway (port 8080)
cd backend/api-gateway && mvn spring-boot:run
```

> 💡 **Tip:** You can also use `mvn spring-boot:run -q` for quieter logs.

### 4. Verify Everything is Running

```bash
# Check Eureka dashboard
open http://localhost:8761

# Check health of each service
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health
curl http://localhost:8083/actuator/health
curl http://localhost:8084/actuator/health
curl http://localhost:8085/actuator/health
curl http://localhost:8086/actuator/health
curl http://localhost:8087/actuator/health
```

All should return `{"status":"UP"}`.

### 5. Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000 (proxies /api to the gateway)
```

---

## Docker: Run EVERYTHING in Containers

All Docker orchestration lives in [`docker/`](docker/). One command to build and start all containers:

```bash
# Build images & start all services (first run: ~5-10 min)
docker compose -f docker/docker-compose.yml up --build

# Or use the helper scripts:
./scripts/dev-up.sh        # start everything detached
./scripts/dev-down.sh      # stop everything

# Follow logs of a specific service:
docker compose -f docker/docker-compose.yml logs -f booking-service

# Check status of all containers:
docker compose -f docker/docker-compose.yml ps

# Stop and delete MySQL data:
docker compose -f docker/docker-compose.yml down -v
```

### Docker Architecture

| Container Name | Host:Port | Internal |
|---------------|-----------|----------|
| `autocare-mysql` | `localhost:3307` | `mysql:3306` |
| `autocare-rabbitmq` | `localhost:5672,15672` | `rabbitmq:5672` |
| `autocare-eureka` | `localhost:8761` | `eureka-server:8761` |
| `autocare-user` | `localhost:8081` | — |
| `autocare-vehicle` | `localhost:8082` | — |
| `autocare-mechanic` | `localhost:8083` | — |
| `autocare-booking` | `localhost:8084` | — |
| `autocare-notification` | `localhost:8085` | — |
| `autocare-spareparts` | `localhost:8087` | — |
| `autocare-payment` | `localhost:8086` | — |
| `autocare-gateway` | `localhost:8080` | — |
| `autocare-frontend` | `localhost:3000` | `nginx:80` |

> **Note:** Inside Docker, services connect to MySQL at `mysql:3306`, RabbitMQ at `rabbitmq:5672`, and Eureka at `http://eureka-server:8761/eureka`. The frontend nginx proxies `/api` to the `api-gateway` container.

---

## API Endpoints

### User Service (`http://localhost:8081` or `/api/auth` via Gateway)

```bash
# Register
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","phone":"1234567890"}'

# Login (save the returned token)
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Vehicle Service (requires `Authorization: Bearer <token>`)

```bash
# Create a vehicle
curl -X POST http://localhost:8082/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"make":"Toyota","model":"Camry","year":2022,"registrationNumber":"ABC123","vehicleType":"SEDAN"}'

# List my vehicles
curl http://localhost:8082/api/vehicles -H "Authorization: Bearer <token>"
```

### Mechanic Service (requires token)

```bash
# Create a mechanic profile
curl -X POST http://localhost:8083/api/mechanics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"John Doe","phone":"9876543210","email":"mechanic@example.com","skills":["Oil Change","Brake Repair"],"serviceArea":"Downtown"}'

# Search available mechanics (public)
curl "http://localhost:8083/api/mechanics?available=true&skill=Oil+Change&area=Downtown"
```

### Booking Service (requires token)

```bash
# Create a booking (auto-assigns a mechanic via service discovery)
curl -X POST http://localhost:8084/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "vehicleId": 1,
    "serviceType": "Oil Change",
    "scheduledAt": "2026-08-01T10:00:00",
    "address": "123 Main St",
    "preferredSkill": "Oil Change",
    "serviceArea": "Downtown"
  }'

# List my bookings
curl http://localhost:8084/api/bookings -H "Authorization: Bearer <token>"

# Update booking status (valid: PENDING→ACCEPTED→IN_PROGRESS→COMPLETED)
curl -X PUT http://localhost:8084/api/bookings/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"status":"ACCEPTED"}'
```

### Spare Parts Service (public catalog browse, requires token for modifications)

```bash
# Browse catalog (public — no token required)
curl "http://localhost:8087/api/parts"
curl "http://localhost:8087/api/parts?category=BRAKES"
curl "http://localhost:8087/api/parts?search=brake"

# Get part details (public — includes tutorial & installation steps)
curl http://localhost:8087/api/parts/1

# Add a new part (requires token)
curl -X POST http://localhost:8087/api/parts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name":"Brake Pad Set",
    "description":"High-quality ceramic brake pads",
    "compatibleVehicleModels":["Toyota Camry 2020-2023","Honda Accord 2021-2023"],
    "price":89.99,
    "stockQuantity":50,
    "category":"BRAKES",
    "tutorialVideoUrl":"https://youtube.com/watch?v=example",
    "installationSteps":"1. Remove old pads\n2. Install new pads\n3. Test brakes"
  }'

# Mechanic recommends a part for a booking (requires token)
curl -X POST http://localhost:8087/api/recommendations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "bookingId":1,
    "sparePartId":1,
    "quantity":2,
    "reason":"Brake pads are worn and need replacement"
  }'

# View recommendations for a booking (requires token)
curl http://localhost:8087/api/recommendations/booking/1 \
  -H "Authorization: Bearer <token>"

# Customer approves or rejects a recommendation (requires token)
curl -X PUT http://localhost:8087/api/recommendations/1/decision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"status":"APPROVED"}'
```
(On approval, stock is decremented atomically; on insufficient stock, a 409 is returned.)

### Payment Service (requires token; webhook endpoint is public)

```bash
# Initiate a payment for a booking or approved spare-part recommendation
curl -X POST http://localhost:8086/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "referenceType": "BOOKING",
    "referenceId": 1,
    "amount": 1500.00,
    "paymentMethod": "UPI"
  }'

# List my transactions
curl http://localhost:8086/api/payments -H "Authorization: Bearer <token>"

# Get transaction status
curl http://localhost:8086/api/payments/1 -H "Authorization: Bearer <token>"

# Simulate a gateway webhook callback (public - verified via HMAC signature)
curl -X POST http://localhost:8086/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "gatewayTransactionId": "<from create response>",
    "status": "SUCCESS",
    "signature": "<base64 hmac>"
  }'
```

The webhook updates the transaction status and publishes `payment.success` / `payment.failed` to the `autocare.events` exchange. Webhook processing is **idempotent** — duplicate callbacks return `200` without re-publishing events. With the mock gateway, the expected signature is `MockGatewayService.computeSignature(gatewayTransactionId, status)` (HMAC-SHA256 of `gatewayTransactionId + "." + status` using `app.webhook.secret`).

### Gateway (single entry point)

All services are also accessible through the API Gateway at `http://localhost:8080`:

```bash
curl http://localhost:8080/api/auth/login ...
curl http://localhost:8080/api/vehicles ...
curl http://localhost:8080/api/mechanics ...
curl http://localhost:8080/api/bookings ...
curl http://localhost:8080/api/payments ...
curl http://localhost:8080/api/parts ...
curl http://localhost:8080/api/recommendations ...
```

---

## Status Workflow

```
                    ┌──────────┐
                    │ PENDING  │
                    └────┬─────┘
                    │         │
               ┌────▼─┐  ┌───▼──────┐
               │ACCEPTED│  │ CANCELLED │
               └────▲──┘  └──────────┘
                    │
               ┌────▼────────┐
               │ IN_PROGRESS │
               └────▲────────┘
                    │
               ┌────▼──────┐
               │ COMPLETED │
               └───────────┘
```

Valid transitions:
- `PENDING` → `ACCEPTED` | `CANCELLED`
- `ACCEPTED` → `IN_PROGRESS` | `CANCELLED`
- `IN_PROGRESS` → `COMPLETED`
- `COMPLETED` / `CANCELLED` → terminal (no further transitions)

---

## RabbitMQ Events

Services publish events to the `autocare.events` topic exchange:

| Event | Routing Key | Published When | Consumed By |
|-------|-------------|----------------|-------------|
| `BookingCreatedEvent` | `booking.created` | POST `/api/bookings` | notification-service |
| `BookingCompletedEvent` | `booking.completed` | Status → `COMPLETED` | notification-service |
| `PaymentSuccessEvent` | `payment.success` | Webhook → `SUCCESS` | notification-service |
| `PaymentFailedEvent` | `payment.failed` | Webhook → `FAILED` | notification-service |

**View events in the RabbitMQ Management UI:**
1. Open [http://localhost:15672](http://localhost:15672) (guest/guest)
2. Go to **Queues** → **notification.queue** → **Get Messages**
3. Or go to **Exchanges** → **autocare.events** → **Bindings**

---

## JWT Authentication

All services share a common JWT secret for token validation:

- **Secret:** Base64-encoded HMAC-SHA key (configured in each `application.yml` → `app.jwt.secret`)
- **Token includes:** `userId` (subject), `email`, `role`, issued/expiry timestamps
- **Expiration:** 24 hours (configurable via `app.jwt.expiration-ms`)
- **Header format:** `Authorization: Bearer <token>`

---

## Project Structure

```
autocare/
├── backend/                   # All Java microservices
│   ├── pom.xml                # Aggregator POM — builds every service at once
│   ├── eureka-server/         # Service registry (port 8761)
│   ├── api-gateway/           # API Gateway (port 8080)
│   ├── user-service/          # User auth service (port 8081)
│   ├── vehicle-service/       # Vehicle management (port 8082)
│   ├── mechanic-service/      # Mechanic profiles (port 8083)
│   ├── booking-service/       # Booking management (port 8084)
│   ├── notification-service/  # Event consumer (port 8085)
│   ├── payment-service/       # Payment processing (port 8086)
│   ├── spareparts-service/    # Spare parts catalog & recommendations (port 8087)
│   ├── review-service/        # Reviews & ratings (port 8088)
│   └── admin-service/         # Admin aggregation dashboard (port 8089)
│
├── frontend/                  # React 18 + Vite + TypeScript SPA (port 3000)
├── docker/                    # Docker orchestration
│   ├── docker-compose.yml     # Orchestrates all containers
│   └── init.sql               # Database initialization script
├── docs/                      # Documentation & Postman collection
├── scripts/                   # Helper scripts (build-all, dev-up, dev-down)
├── .github/                   # CI/CD workflows
├── README.md                  # This file
└── LICENSE
```

---

## Configuration Reference

### Environment Variables (Docker)

Each service accepts these environment variable overrides in Docker:

| Variable | Example | Description |
|----------|---------|-------------|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://mysql:3306/booking_db` | MySQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | `root` | MySQL user |
| `SPRING_DATASOURCE_PASSWORD` | `Vignesh@2004` | MySQL password |
| `SPRING_RABBITMQ_HOST` | `rabbitmq` | RabbitMQ hostname |
| `SPRING_RABBITMQ_PORT` | `5672` | RabbitMQ port |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | `http://eureka-server:8761/eureka` | Eureka URL |
| `EUREKA_INSTANCE_HOSTNAME` | `eureka-server` | Eureka self-hostname |
| `EUREKA_INSTANCE_PREFER_IP_ADDRESS` | `true` | Register with IP |
| `APP_JWT_SECRET` | `5a3f8c92...` | JWT signing secret |
| `APP_JWT_EXPIRATION_MS` | `86400000` | JWT token expiry |
| `APP_WEBHOOK_SECRET` | `autocare-webhook-secret` | Payment gateway webhook signing secret |

---

## Healthchecks

All services expose Spring Boot Actuator health endpoints:

```
GET /actuator/health
```

Docker Compose uses `curl` polling against these endpoints to determine container readiness. You can verify the health of any service:

```bash
curl http://localhost:<port>/actuator/health
# → {"status":"UP"}
```

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Service can't connect to MySQL | MySQL not running | `docker compose -f docker/docker-compose.yml up -d mysql` |
| Service can't register with Eureka | Eureka not started yet | Wait — Spring retries automatically |
| Booking creation fails with "No available mechanic found" | No mechanics in the database | Create a mechanic first via `/api/mechanics` |
| RabbitMQ events not appearing | RabbitMQ not running | `docker compose -f docker/docker-compose.yml up -d rabbitmq` |
| Port conflict on 3306 | Local MySQL is running | Stop local MySQL, or change Docker port mapping |
| eureka-server: `Connection refused` | Eureka not healthy yet | Spring Boot's Eureka client retries; wait ~30s |
