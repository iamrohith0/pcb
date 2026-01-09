# PCBxpress ERP Backend

Spring Boot 3.x + Java 17 backend scaffold that mirrors the current frontend service layout.

## Getting started
- Run the API: `./mvnw spring-boot:run` (defaults to port `8080`, context path `/api`).
- Health check: `GET http://localhost:8080/api/health`.

## What is implemented
- **RFQ module**: In-memory CRUD at `/api/sales/rfqs` with seeded sample data, next-number generation, CSV export, and quotation conversion stub.
- **Auth stub**: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` return a demo user/token.
- **Module placeholders**: Stub controllers exist for inventory, procurement, production, quality, engineering (cam jobs/outputs), logistics, warehouse, maintenance, traceability, reports, dashboard, admin/settings (users/roles/permissions, plants, masters, lot-numbering), and integrations (SMTP/barcodes). They currently return placeholder responses so the frontend sees endpoints instead of 404s.

## Next steps
- Replace stub controllers with real domain logic, entities, and repositories.
- Wire authentication/authorization once the security model is defined.
- Gradually migrate mock/frontend data contracts into typed DTOs and services per module.
