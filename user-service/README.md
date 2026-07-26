# AutoCare User Service

User authentication and authorization microservice for the AutoCare platform.

## Features

- User registration with email validation
- Password hashing with BCrypt
- JWT-based authentication (24h expiry)
- Input validation with clean error responses
- Eureka service discovery registration

## API Endpoints

| Method | Path              | Description            |
|--------|-------------------|------------------------|
| POST   | `/api/auth/register` | Register a new user  |
| POST   | `/api/auth/login`    | Authenticate a user |

### Register Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

### Login Request

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Auth Response (both endpoints)

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 1,
  "name": "John Doe",
  "role": "CUSTOMER"
}
```

## Configuration

| Property              | Default                        | Description                         |
|-----------------------|--------------------------------|-------------------------------------|
| `server.port`         | 8081                           | Service port                        |
| `spring.datasource.url` | jdbc:mysql://localhost:3306/autocare_users | MySQL connection URL |
| `app.jwt.secret`      | (Base64-encoded key)           | JWT signing secret                  |
| `app.jwt.expiration-ms` | 86400000 (24h)               | JWT token expiration                |
