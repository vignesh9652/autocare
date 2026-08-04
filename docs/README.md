# Documentation

This folder holds shared documentation and API tooling for the AutoCare platform.

## Contents

| File | Description |
|------|-------------|
| `autocare-api.postman_collection.json` | Postman collection with ready-to-use requests for every service |
| `README.md` | This index |

## Using the Postman Collection

1. Open Postman → **Import** → select `autocare-api.postman_collection.json`.
2. Start the stack (see the root [README](../README.md)).
3. Collection requests target `http://localhost:<port>` directly, or use the
   gateway at `http://localhost:8080/api/...`.
4. After a successful login, copy the JWT from the response and set it as the
   `token` collection variable (used by `Authorization: Bearer <token>` headers).
