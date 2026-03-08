# Appointment Booking System API

REST API สำหรับจัดการบริการ (Service) และการจองนัดหมาย (Appointment)
พัฒนาด้วย NestJS + TypeScript — **Model Set 6**

---

## Project Information

| รายการ | รายละเอียด |
|---|---|
| Model Set | 6 — Appointment Booking System |
| Student ID Sum | 204033336 (68011120 + 68011088 + 68011128) |
| Calculation | 204033336 mod 10 = **6** |

## Team Members

| ชื่อ-นามสกุล | GitHub | รหัสนักศึกษา | หน้าที่ |
|---|---|---:|---|
| สรวิศ วงค์ทิม | `bsrxwt` | 68011120 | Service module |
| ศุภกิตติ์ ตันตวาที | `paekung` | 68011088 | Shared infrastructure, integration, documentation |
| สหภูมิ รัตนาวิวัฒน์พงศ์ | `Meseal` | 68011128 | Appointment module |

---

## Quick Start

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. รัน development server
npm run start:dev
```

Application จะทำงานที่ `http://localhost:3000`
Swagger UI: `http://localhost:3000/api`

---

## Technology Stack

| เทคโนโลยี | เวอร์ชัน | วัตถุประสงค์ |
|---|---|---|
| NestJS | 10.x | Backend framework |
| TypeScript | 5.1.3 | Type-safe development (strict mode) |
| jsonfile | 6.x | JSON-based file database |
| Swagger | @nestjs/swagger 7.1.0 | API documentation (OpenAPI) |
| class-validator | 0.14.4 | Request validation |
| class-transformer | 0.5.1 | Data transformation |
| Jest | 29.5.0 | Unit testing |
| Supertest | 6.3.3 | E2E testing |
| ESLint | 8.x | Linting (strict, no `any`) |

---

## Project Structure

```text
.
├── src/
│   ├── main.ts                          # Bootstrap application
│   ├── app.module.ts                    # Root module
│   ├── database/
│   │   ├── database-schema.interface.ts # JSON database schema
│   │   └── json-database.service.ts     # JSON file persistence
│   ├── controllers/
│   │   ├── service.controller.ts        # Service HTTP handlers
│   │   └── appointment.controller.ts    # Appointment HTTP handlers
│   ├── services/
│   │   ├── service.service.ts           # Service business logic
│   │   └── appointment.service.ts       # Appointment business logic
│   ├── entities/
│   │   ├── service.entity.ts            # Service data model
│   │   └── appointment.entity.ts        # Appointment data model
│   ├── dto/
│   │   ├── service/
│   │   │   ├── create-service.dto.ts    # Create service request
│   │   │   ├── update-service.dto.ts    # Full update request (PUT)
│   │   │   └── patch-service.dto.ts     # Partial update request (PATCH)
│   │   └── appointment/
│   │       ├── create-appointment.dto.ts  # Create appointment request
│   │       ├── update-appointment.dto.ts  # Full update request (PUT)
│   │       ├── patch-appointment.dto.ts   # Partial update request (PATCH)
│   │       └── cancel-appointment.dto.ts  # Cancel request (with reason)
│   ├── enums/
│   │   ├── service-category.enum.ts     # ServiceCategory enum
│   │   ├── appointment-status.enum.ts   # AppointmentStatus enum
│   │   └── day-of-week.enum.ts          # DayOfWeek enum
│   ├── interfaces/
│   │   └── api-response.interface.ts    # Standard ApiResponse<T>
│   └── filters/
│       └── http-exception.filter.ts     # Global exception filter
├── docs/
│   ├── DATA_MODEL.md                    # Data model documentation
│   ├── UML.md                           # UML class diagram (Mermaid)
│   └── submission-checklist.md          # Pre-submission checklist
├── subjects/                            # Course requirements
│   ├── requirement.md
│   ├── models.md
│   ├── evaluation.md
│   └── submission.md
├── test/
│   ├── app.e2e-spec.ts                 # E2E tests
│   └── jest-e2e.json
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .gitignore
```

---

## Core Data Models

ระบบประกอบด้วย 2 Core Models ที่มีความสัมพันธ์แบบ One-to-Many

### Service (14 attributes)

เก็บข้อมูลบริการที่เปิดให้จองนัดหมาย

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID (PK) | รหัสบริการ (auto-generated) |
| `name` | string | ชื่อบริการ |
| `description` | text | รายละเอียดบริการ |
| `category` | ServiceCategory (enum) | หมวดหมู่บริการ |
| `durationMinutes` | number | ระยะเวลาให้บริการ (นาที) |
| `price` | decimal | ราคาบริการ |
| `providerName` | string | ชื่อผู้ให้บริการ |
| `availableDays` | DayOfWeek[] (enum array) | วันที่เปิดให้บริการ |
| `startTime` | string (HH:mm) | เวลาเปิดให้บริการ |
| `endTime` | string (HH:mm) | เวลาปิดให้บริการ |
| `maxConcurrentBookings` | number | จำนวนจองพร้อมกันสูงสุด |
| `bufferMinutes` | number | เวลาพักระหว่างนัด (นาที) |
| `isActive` | boolean | สถานะเปิด/ปิดบริการ |
| `createdAt` / `updatedAt` | Date | timestamps |

### Appointment (13 attributes)

เก็บข้อมูลการจองนัดหมายของลูกค้า

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID (PK) | รหัสนัดหมาย (auto-generated) |
| `serviceId` | string (FK) | รหัสบริการที่จอง |
| `serviceName` | string | ชื่อบริการ (denormalized cache) |
| `customerName` | string | ชื่อลูกค้า |
| `customerEmail` | string | อีเมลลูกค้า |
| `customerPhone` | string | เบอร์โทรลูกค้า |
| `appointmentDate` | string (YYYY-MM-DD) | วันที่นัดหมาย |
| `startTime` | string (HH:mm) | เวลาเริ่มนัดหมาย |
| `endTime` | string (HH:mm) | เวลาสิ้นสุด (auto-computed) |
| `status` | AppointmentStatus (enum) | สถานะนัดหมาย |
| `notes` | text | หมายเหตุจากลูกค้า |
| `cancellationReason` | text (nullable) | เหตุผลการยกเลิก |
| `createdAt` / `updatedAt` | Date | timestamps |

### Relationship

```
Service (1) ──────── (*) Appointment
         OneToMany / ManyToOne
```

---

## Enums

### ServiceCategory

`HEALTH` | `BEAUTY` | `CONSULTING` | `EDUCATION` | `FITNESS` | `OTHER`

### AppointmentStatus

| Value | Description | Terminal |
|---|---|---|
| `PENDING` | รอดำเนินการ | ไม่ |
| `CONFIRMED` | ยืนยันแล้ว | ไม่ |
| `COMPLETED` | เสร็จสิ้น | ใช่ |
| `CANCELLED` | ยกเลิก | ใช่ |
| `NO_SHOW` | ไม่มาตามนัด | ใช่ |

### DayOfWeek

`MONDAY` | `TUESDAY` | `WEDNESDAY` | `THURSDAY` | `FRIDAY` | `SATURDAY` | `SUNDAY`

---

## API Endpoints

### Service Endpoints

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` | `/services` | 200 | รายการบริการทั้งหมด (filter: `category`, `isActive`) |
| `GET` | `/services/:id` | 200 | ดูบริการตาม ID |
| `POST` | `/services` | 201 | สร้างบริการใหม่ |
| `PUT` | `/services/:id` | 200 | แก้ไขบริการ (full update) |
| `PATCH` | `/services/:id` | 200 | แก้ไขบริการบางส่วน |
| `DELETE` | `/services/:id` | 200 | ลบบริการ |
| `GET` | `/services/:id/available-slots?date=YYYY-MM-DD` | 200 | ดูช่วงเวลาว่างในวันที่กำหนด |

### Appointment Endpoints

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` | `/appointments` | 200 | รายการนัดหมายทั้งหมด |
| `GET` | `/appointments/:id` | 200 | ดูนัดหมายตาม ID |
| `POST` | `/appointments` | 201 | สร้างการจองใหม่ (ตรวจ time conflict อัตโนมัติ) |
| `PUT` | `/appointments/:id` | 200 | แก้ไขนัดหมาย (full update) |
| `PATCH` | `/appointments/:id` | 200 | แก้ไขนัดหมายบางส่วน |
| `DELETE` | `/appointments/:id` | 200 | ลบนัดหมาย |
| `PATCH` | `/appointments/:id/confirm` | 200 | ยืนยันนัดหมาย (→ CONFIRMED) |
| `PATCH` | `/appointments/:id/cancel` | 200 | ยกเลิกนัดหมาย (ต้องระบุ reason) |

---

## Standard Response Format

ทุก endpoint ใช้ response format เดียวกัน

```ts
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Thai Massage",
    "category": "HEALTH"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "errors": [
      "startTime must be in HH:mm format",
      "price must be a positive number"
    ]
  }
}
```

---

## Validation Rules

### Service

| Field | Rule |
|---|---|
| `name` | required, max 200 chars |
| `description` | required |
| `category` | must be `ServiceCategory` enum value |
| `durationMinutes` | integer, 1–1440 |
| `price` | >= 0 |
| `providerName` | required |
| `availableDays` | array of `DayOfWeek`, min 1 item |
| `startTime` / `endTime` | format HH:mm, endTime > startTime |
| `maxConcurrentBookings` | integer, >= 1 |
| `bufferMinutes` | integer, >= 0 |

### Appointment

| Field | Rule |
|---|---|
| `serviceId` | valid UUID |
| `customerName` | required |
| `customerEmail` | valid email format |
| `customerPhone` | Thai phone format (e.g. 0812345678) |
| `appointmentDate` | format YYYY-MM-DD |
| `startTime` | format HH:mm |
| `cancellationReason` | required when cancelling |

---

## Business Rules

**การสร้างนัดหมาย:**
- จองได้เฉพาะ Service ที่ `isActive: true`
- วันที่นัดหมายต้องไม่เป็นอดีต
- วันนัดหมายต้องอยู่ใน `availableDays` ของ Service
- เวลาต้องอยู่ในช่วง `startTime`–`endTime` ของ Service
- ระบบคำนวณ `endTime` อัตโนมัติจาก `durationMinutes`
- หาก slot เต็มตาม `maxConcurrentBookings` → `409 Conflict`

**การแก้ไขนัดหมาย:**
- ไม่สามารถแก้ไข Appointment ใน Terminal State (`COMPLETED`, `CANCELLED`, `NO_SHOW`)
- การแก้ไขเวลาต้องผ่านการตรวจสอบ conflict ด้วย

**การลบบริการ:**
- ไม่สามารถลบ Service ที่มี Appointment `PENDING` หรือ `CONFIRMED` อยู่ → `400`

---

## Error Handling

ระบบใช้ `HttpExceptionFilter` (Global) เพื่อจัดการ error ทุกประเภทให้อยู่ในรูปแบบ `ApiResponse`

| HTTP Status | กรณีใช้งาน |
|---|---|
| `200` | ดำเนินการสำเร็จ |
| `201` | สร้างข้อมูลใหม่สำเร็จ |
| `400` | ข้อมูลไม่ถูกต้อง / validation failed |
| `404` | ไม่พบข้อมูลที่ร้องขอ |
| `409` | ข้อมูลขัดแย้ง (time slot เต็ม, ลบ service ที่มี active appointment) |

ระบบออกแบบให้ไม่เกิด Error 500 จาก logic ที่สามารถป้องกันได้

---

## Installation & Running

### Prerequisites

- Node.js 18+
- npm

### Commands

```bash
# ติดตั้ง dependencies
npm install

# Development (watch mode)
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Lint
npm run lint
```

---

## Database

- JSON-based database ผ่าน `jsonfile`
- ไฟล์: `database.json` (สร้างอัตโนมัติเมื่อ application start)
- ใช้ file-based persistence ตาม requirement ของวิชา
- ไฟล์ `database.json` ถูก ignore ใน `.gitignore`

---

## API Documentation (Swagger)

```
http://localhost:3000/api
```

Swagger แสดง endpoint ทั้งหมด, request/response schema, และสามารถทดสอบ API ได้โดยตรง

---

## Documentation

| เอกสาร | ไฟล์ | รายละเอียด |
|---|---|---|
| Data Model | [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | รายละเอียด attribute, constraints, business rules |
| UML Diagram | [docs/UML.md](docs/UML.md) | Class diagram และ State diagram |
| Submission Checklist | [docs/submission-checklist.md](docs/submission-checklist.md) | รายการตรวจสอบก่อนส่งงาน |
| Swagger API | http://localhost:3000/api | Interactive API documentation |

---

## Requirement Alignment

| Requirement | Status |
|---|---|
| ใช้ NestJS Framework | ✅ |
| TypeScript strict mode (ไม่มี `any`) | ✅ |
| JSON-based database (file-based) | ✅ |
| Core Data Model 2 ตัว (Service, Appointment) | ✅ |
| แต่ละ Model มี attribute >= 10 (Service: 14, Appointment: 13) | ✅ |
| Enum อย่างน้อย 1 จุด (3 enums) | ✅ |
| CRUD ครบทุก Model (GET, POST, PUT, PATCH, DELETE) | ✅ |
| Standard Response Format `ApiResponse<T>` | ✅ |
| Validation ทุก endpoint (class-validator) | ✅ |
| HTTP Status Code ถูกต้อง (200, 201, 400, 404, 409) | ✅ |
| ไม่เกิด Error 500 จาก logic ที่ป้องกันได้ | ✅ |
| Swagger API Documentation | ✅ |
| Data Model Documentation | ✅ |
| UML Diagram | ✅ |
| ไม่ใช้ `object` type โดยตรง — ใช้ `interface` แทน | ✅ |
| สมาชิกทุกคนอยู่ใน `package.json` contributors | ✅ |
| สมาชิกทุกคนมี commit | ✅ |
