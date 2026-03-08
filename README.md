# Appointment Booking System API

REST API สำหรับจัดการบริการ (Service) และการจองนัดหมาย (Appointment) พัฒนาด้วย NestJS Framework และ TypeScript

โปรเจคนี้เป็นส่วนหนึ่งของรายวิชา OOP TypeScript Final Project — **Model Set 6: Appointment Booking System**

---

## Project Information

| รายการ | รายละเอียด |
|---|---|
| Model Set | 6 — Appointment Booking System |
| Student ID Sum | 204033336 (68011120 + 68011088 + 68011128) |
| Calculation | 204033336 mod 10 = **6** |

## Team Members

| ชื่อ-นามสกุล | GitHub Username | รหัสนักศึกษา | หน้าที่ |
|---|---|---:|---|
| สรวิศ วงค์ทิม | `bsrxwt` | 68011120 | Service module |
| ศุภกิตติ์ ตันตวาที | `paekung` | 68011088 | Shared infrastructure, integration, documentation |
| สหภูมิ รัตนาวิวัฒน์พงศ์ | `Meseal` | 68011128 | Appointment module |

---

## Technology Stack

| เทคโนโลยี | เวอร์ชัน | วัตถุประสงค์ |
|---|---|---|
| NestJS | 10.x | Backend framework |
| TypeScript | 5.1.3 | Type-safe development (strict mode) |
| TypeORM | 0.3.28 | ORM และ repository pattern |
| SQLite | better-sqlite3 12.6.2 | File-based database |
| Swagger | @nestjs/swagger 7.1.0 | API documentation (OpenAPI) |
| class-validator | 0.14.4 | Request validation |
| class-transformer | 0.5.1 | Data transformation |
| Jest | 29.5.0 | Unit testing |
| Supertest | 6.3.3 | E2E testing |
| ESLint | 8.x | Linting (strict, no `any`) |

---

## Core Data Models

ระบบประกอบด้วย 2 Core Models ที่มีความสัมพันธ์แบบ One-to-Many

### Service (14 attributes + timestamps)

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
| `createdAt` | Date | วันที่สร้าง |
| `updatedAt` | Date | วันที่แก้ไขล่าสุด |

### Appointment (13 attributes + timestamps)

เก็บข้อมูลการจองนัดหมายของลูกค้า

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID (PK) | รหัสนัดหมาย (auto-generated) |
| `serviceId` | string (FK) | รหัสบริการที่จอง |
| `serviceName` | string | ชื่อบริการ (cached) |
| `customerName` | string | ชื่อลูกค้า |
| `customerEmail` | string | อีเมลลูกค้า |
| `customerPhone` | string | เบอร์โทรลูกค้า |
| `appointmentDate` | string (YYYY-MM-DD) | วันที่นัดหมาย |
| `startTime` | string (HH:mm) | เวลาเริ่มนัดหมาย |
| `endTime` | string (HH:mm) | เวลาสิ้นสุดนัดหมาย |
| `status` | AppointmentStatus (enum) | สถานะนัดหมาย |
| `notes` | text | หมายเหตุจากลูกค้า |
| `cancellationReason` | text (nullable) | เหตุผลการยกเลิก |
| `createdAt` | Date | วันที่สร้าง |
| `updatedAt` | Date | วันที่แก้ไขล่าสุด |

### Relationship

```
Service (1) ──────── (*) Appointment
         OneToMany / ManyToOne
```

- Service หนึ่งรายการสามารถมีได้หลาย Appointment
- Appointment แต่ละรายการอ้างอิงไปยัง Service เดียว ผ่าน `serviceId`

---

## Enums

ระบบใช้ Enum 3 ตัวเพื่อควบคุมค่าที่เป็นไปได้ของ attribute ต่าง ๆ

### ServiceCategory

หมวดหมู่ของบริการ

| ค่า | ความหมาย |
|---|---|
| `HEALTH` | สุขภาพ |
| `BEAUTY` | ความงาม |
| `CONSULTING` | ที่ปรึกษา |
| `EDUCATION` | การศึกษา |
| `FITNESS` | ฟิตเนส |
| `OTHER` | อื่น ๆ |

### AppointmentStatus

สถานะของการนัดหมาย

| ค่า | ความหมาย |
|---|---|
| `PENDING` | รอดำเนินการ |
| `CONFIRMED` | ยืนยันแล้ว |
| `COMPLETED` | เสร็จสิ้น |
| `CANCELLED` | ยกเลิก |
| `NO_SHOW` | ไม่มาตามนัด |

### DayOfWeek

วันในสัปดาห์ ใช้กำหนดวันที่เปิดให้บริการ

`MONDAY` | `TUESDAY` | `WEDNESDAY` | `THURSDAY` | `FRIDAY` | `SATURDAY` | `SUNDAY`

---

## API Endpoints

### Service Endpoints

| Method | Path | Status Code | Description |
|---|---|---|---|
| `GET` | `/services` | 200 | ดึงรายการบริการทั้งหมด (รองรับ filter ด้วย `category` และ `isActive`) |
| `GET` | `/services/:id` | 200 | ดึงข้อมูลบริการตาม ID |
| `POST` | `/services` | 201 | สร้างบริการใหม่ |
| `PUT` | `/services/:id` | 200 | แก้ไขบริการทั้งหมด (full update) |
| `PATCH` | `/services/:id` | 200 | แก้ไขบริการบางส่วน (partial update) |
| `DELETE` | `/services/:id` | 200 | ลบบริการ (ต้องไม่มี appointment ที่ active อยู่) |
| `GET` | `/services/:id/available-slots?date=YYYY-MM-DD` | 200 | ดูช่วงเวลาว่างสำหรับจองในวันที่กำหนด |

### Appointment Endpoints

| Method | Path | Status Code | Description |
|---|---|---|---|
| `GET` | `/appointments` | 200 | ดึงรายการนัดหมายทั้งหมด |
| `GET` | `/appointments/:id` | 200 | ดึงข้อมูลนัดหมายตาม ID |
| `POST` | `/appointments` | 201 | สร้างการจองใหม่ (ตรวจสอบ time conflict อัตโนมัติ) |
| `PUT` | `/appointments/:id` | 200 | แก้ไขนัดหมายทั้งหมด (full update) |
| `PATCH` | `/appointments/:id` | 200 | แก้ไขนัดหมายบางส่วน (partial update) |
| `DELETE` | `/appointments/:id` | 200 | ลบนัดหมาย |
| `PATCH` | `/appointments/:id/confirm` | 200 | ยืนยันนัดหมาย (เปลี่ยนสถานะเป็น CONFIRMED) |
| `PATCH` | `/appointments/:id/cancel` | 200 | ยกเลิกนัดหมาย (ต้องระบุ `cancellationReason`) |

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

### ตัวอย่าง Success Response

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

### ตัวอย่าง Error Response

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

### Service Validation

| Field | Rule |
|---|---|
| `name` | ต้องไม่ว่าง, ไม่เกิน 200 ตัวอักษร, ห้ามมี HTML tag |
| `description` | ต้องไม่ว่าง |
| `category` | ต้องเป็นค่าจาก `ServiceCategory` enum |
| `durationMinutes` | ต้องเป็นจำนวนเต็ม, ค่า 1–1440 |
| `price` | ต้อง >= 0 |
| `providerName` | ต้องไม่ว่าง, ห้ามมี HTML tag |
| `availableDays` | ต้องมีอย่างน้อย 1 วัน, ค่าจาก `DayOfWeek` enum |
| `startTime` / `endTime` | ต้องอยู่ในรูปแบบ HH:mm, endTime ต้องมากกว่า startTime |
| `maxConcurrentBookings` | ต้อง >= 1 |
| `bufferMinutes` | ต้อง >= 0 |

### Appointment Validation

| Field | Rule |
|---|---|
| `serviceId` | ต้องเป็น UUID |
| `customerName` | ต้องไม่ว่าง, ห้ามมี HTML tag |
| `customerEmail` | ต้องเป็น email ที่ถูกต้อง |
| `customerPhone` | ต้องเป็นรูปแบบเบอร์โทรไทย (เช่น 0812345678) |
| `appointmentDate` | ต้องอยู่ในรูปแบบ YYYY-MM-DD |
| `startTime` | ต้องอยู่ในรูปแบบ HH:mm |
| `cancellationReason` | จำเป็นต้องระบุเมื่อยกเลิกนัดหมาย |

---

## Business Rules

### การสร้างนัดหมาย
- จองได้เฉพาะบริการที่มีสถานะ `isActive: true` เท่านั้น
- วันที่นัดหมายต้องไม่เป็นวันในอดีต
- วันนัดหมายต้องอยู่ในวันที่บริการเปิดให้จอง (`availableDays`)
- เวลานัดหมายต้องอยู่ในช่วงเวลาเปิดให้บริการ (`startTime` - `endTime` ของ Service)
- ระบบคำนวณ `endTime` ของ Appointment อัตโนมัติจาก `durationMinutes` ของ Service
- ตรวจสอบ time slot conflict ก่อนสร้าง — หาก slot เต็มตาม `maxConcurrentBookings` จะตอบ `409 Conflict`

### การแก้ไขนัดหมาย
- ไม่อนุญาตให้แก้ไขนัดหมายที่อยู่ในสถานะ `COMPLETED`, `CANCELLED` หรือ `NO_SHOW`
- การแก้ไขเวลาต้องผ่านการตรวจสอบ conflict เช่นเดียวกับการสร้าง

### การยกเลิกนัดหมาย
- ต้องระบุ `cancellationReason` ทุกครั้ง

### การลบบริการ
- ไม่สามารถลบ Service ที่มี Appointment ในสถานะ `PENDING` หรือ `CONFIRMED` อยู่

### Available Slots
- คำนวณช่วงเวลาว่างโดยอ้างอิงจากเวลาเปิด-ปิด, ระยะเวลา, buffer และนัดหมายที่จองแล้ว

---

## Error Handling

ระบบใช้ Global Exception Filter (`HttpExceptionFilter`) เพื่อจัดการ error ทุกประเภทให้อยู่ในรูปแบบ `ApiResponse` เดียวกัน

| HTTP Status | กรณีใช้งาน |
|---|---|
| `200` | ดำเนินการสำเร็จ |
| `201` | สร้างข้อมูลใหม่สำเร็จ |
| `400` | ข้อมูลไม่ถูกต้อง / validation failed |
| `404` | ไม่พบข้อมูลที่ร้องขอ |
| `409` | ข้อมูลขัดแย้ง (เช่น time slot เต็ม, ลบ service ที่มี active appointment) |

ระบบออกแบบให้ไม่เกิด Error 500 จาก logic ที่สามารถป้องกันได้

---

## Project Structure

```text
.
├── src/
│   ├── main.ts                          # Bootstrap application
│   ├── app.module.ts                    # Root module (TypeORM config)
│   ├── controllers/
│   │   ├── service.controller.ts        # Service HTTP handlers
│   │   └── appointment.controller.ts    # Appointment HTTP handlers
│   ├── services/
│   │   ├── service.service.ts           # Service business logic
│   │   └── appointment.service.ts       # Appointment business logic
│   ├── entities/
│   │   ├── service.entity.ts            # Service data model (TypeORM)
│   │   └── appointment.entity.ts        # Appointment data model (TypeORM)
│   ├── dto/
│   │   ├── service/
│   │   │   ├── create-service.dto.ts    # Create service request
│   │   │   ├── update-service.dto.ts    # Full update request
│   │   │   └── patch-service.dto.ts     # Partial update request
│   │   └── appointment/
│   │       ├── create-appointment.dto.ts  # Create appointment request
│   │       ├── update-appointment.dto.ts  # Full update request
│   │       ├── patch-appointment.dto.ts   # Partial update request
│   │       └── cancel-appointment.dto.ts  # Cancel request (with reason)
│   ├── enums/
│   │   ├── service-category.enum.ts     # ServiceCategory enum
│   │   ├── appointment-status.enum.ts   # AppointmentStatus enum
│   │   └── day-of-week.enum.ts          # DayOfWeek enum
│   ├── interfaces/
│   │   └── api-response.interface.ts    # Standard ApiResponse<T>
│   ├── filters/
│   │   └── http-exception.filter.ts     # Global exception filter
│   └── app.spec.ts                      # Unit tests
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
│   └── jest-e2e.json                   # E2E test config
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .eslintrc.js
└── .gitignore
```

---

## Installation

### Prerequisites

- Node.js 18 หรือใหม่กว่า
- npm

### ติดตั้ง Dependencies

```bash
npm install
```

---

## Running the Project

### Development Mode

```bash
npm run start:dev
```

Application จะทำงานที่ `http://localhost:3000`

### Build

```bash
npm run build
```

### Production Mode

```bash
npm run start:prod
```

---

## Database

- ใช้ SQLite ผ่าน `better-sqlite3`
- ไฟล์ database: `database.sqlite` (สร้างอัตโนมัติเมื่อ application start)
- ตั้งค่า TypeORM ใน `src/app.module.ts`
- ใช้ `synchronize: true` สำหรับ development (auto sync schema)
- ไฟล์ `database.sqlite` ถูก ignore ใน `.gitignore`

---

## API Documentation (Swagger)

เมื่อ application ทำงานแล้ว สามารถเข้าถึง Swagger UI ได้ที่:

```
http://localhost:3000/api
```

Swagger แสดง endpoint ทั้งหมด, request/response schema, และสามารถทดสอบ API ได้โดยตรง

---

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

---

## Linting

```bash
npm run lint
```

ESLint ถูกตั้งค่าให้บังคับ TypeScript strict mode และห้ามใช้ `any` type

---

## Documentation

| เอกสาร | ไฟล์ | รายละเอียด |
|---|---|---|
| Data Model | [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | รายละเอียด attribute ทั้งหมดของ Service และ Appointment |
| UML Diagram | [docs/UML.md](docs/UML.md) | Class diagram แสดงโครงสร้างและความสัมพันธ์ของ model |
| Submission Checklist | [docs/submission-checklist.md](docs/submission-checklist.md) | รายการตรวจสอบก่อนส่งงาน |
| Swagger API | `http://localhost:3000/api` | Interactive API documentation |

---

## Requirement Alignment

| Requirement | Status |
|---|---|
| ใช้ NestJS Framework | ตรงตาม |
| ใช้ TypeScript แบบ strict (ไม่มี `any`) | ตรงตาม |
| ใช้ JSON-based database (SQLite file-based) | ตรงตาม |
| มี Core Data Model 2 ตัว (Service, Appointment) | ตรงตาม |
| แต่ละ Model มี attribute >= 10 รายการ | ตรงตาม (Service: 14, Appointment: 13) |
| มี Enum อย่างน้อย 1 จุด | ตรงตาม (3 enums: ServiceCategory, AppointmentStatus, DayOfWeek) |
| CRUD ครบทุก Model | ตรงตาม (GET, POST, PUT, PATCH, DELETE) |
| มี Standard Response Format | ตรงตาม (`ApiResponse<T>`) |
| มี Validation ทุก endpoint | ตรงตาม (class-validator + Global ValidationPipe) |
| ใช้ HTTP Status Code ที่เหมาะสม | ตรงตาม (200, 201, 400, 404, 409) |
| ไม่เกิด Error 500 จาก logic ที่ป้องกันได้ | ตรงตาม (Global HttpExceptionFilter) |
| มี Swagger API Documentation | ตรงตาม (`/api`) |
| มี Data Model Documentation | ตรงตาม (`docs/DATA_MODEL.md`) |
| มี UML Diagram | ตรงตาม (`docs/UML.md`) |
| ไม่ใช้ `object` type โดยตรง ใช้ `interface` แทน | ตรงตาม |
| สมาชิกทุกคนอยู่ใน `package.json` contributors | ตรงตาม |
| สมาชิกทุกคนมี commit | ตรงตาม |
