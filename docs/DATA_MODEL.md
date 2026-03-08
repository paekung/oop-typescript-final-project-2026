# Data Model Documentation

## Overview

ระบบ Appointment Booking System ประกอบด้วยข้อมูลหลัก 2 ส่วนคือ `Service` และ `Appointment` โดยใช้ JSON-based file storage ผ่าน `jsonfile` ในการจัดเก็บข้อมูล

- `Service` ใช้เก็บรายละเอียดของบริการที่ลูกค้าสามารถจองได้
- `Appointment` ใช้เก็บข้อมูลการนัดหมายที่อ้างอิงถึงบริการ
- ความสัมพันธ์หลักคือ 1 `Service` สามารถมีได้หลาย `Appointment`

---

## Service Entity

เก็บข้อมูลบริการที่เปิดให้จองนัดหมาย มีทั้งหมด 14 attributes

| Field | Type | Constraint | Description |
|------|------|------------|-------------|
| `id` | `string` (UUID) | PK, auto-generated | รหัสบริการ |
| `name` | `string` | max 200 chars, required | ชื่อบริการ |
| `description` | `string` | required | รายละเอียดบริการ |
| `category` | `ServiceCategory` | enum, required | หมวดหมู่ของบริการ |
| `durationMinutes` | `number` | integer, 1–1440 | ระยะเวลาของบริการเป็นนาที |
| `price` | `number` | decimal, >= 0 | ราคาของบริการ |
| `providerName` | `string` | required | ชื่อผู้ให้บริการ |
| `availableDays` | `DayOfWeek[]` | array, min 1 item | วันที่เปิดให้บริการ |
| `startTime` | `string` | format HH:mm | เวลาเริ่มให้บริการ |
| `endTime` | `string` | format HH:mm, > startTime | เวลาสิ้นสุดการให้บริการ |
| `maxConcurrentBookings` | `number` | integer, >= 1 | จำนวนการจองพร้อมกันสูงสุด |
| `bufferMinutes` | `number` | integer, >= 0 | เวลาพักระหว่างการจอง (นาที) |
| `isActive` | `boolean` | default: true | สถานะเปิดใช้งานบริการ |
| `createdAt` | `Date` | auto-generated | วันที่สร้างข้อมูล |
| `updatedAt` | `Date` | auto-updated | วันที่แก้ไขข้อมูลล่าสุด |

---

## Appointment Entity

เก็บข้อมูลการนัดหมายของลูกค้า มีทั้งหมด 13 attributes

| Field | Type | Constraint | Description |
|------|------|------------|-------------|
| `id` | `string` (UUID) | PK, auto-generated | รหัสนัดหมาย |
| `serviceId` | `string` (UUID) | FK → Service.id, required | อ้างอิงบริการที่ถูกจอง |
| `serviceName` | `string` | required | ชื่อบริการ (denormalized cache) |
| `customerName` | `string` | required | ชื่อลูกค้า |
| `customerEmail` | `string` | valid email, required | อีเมลลูกค้า |
| `customerPhone` | `string` | Thai phone format, required | เบอร์โทรลูกค้า |
| `appointmentDate` | `string` | format YYYY-MM-DD, required | วันที่นัดหมาย |
| `startTime` | `string` | format HH:mm, required | เวลาเริ่มต้น |
| `endTime` | `string` | format HH:mm, auto-computed | เวลาสิ้นสุด (คำนวณจาก durationMinutes) |
| `status` | `AppointmentStatus` | enum, default: PENDING | สถานะของการนัดหมาย |
| `notes` | `string` | optional | หมายเหตุเพิ่มเติมจากลูกค้า |
| `cancellationReason` | `string \| null` | required when cancelling | เหตุผลในการยกเลิก |
| `createdAt` | `Date` | auto-generated | วันที่สร้างข้อมูล |
| `updatedAt` | `Date` | auto-updated | วันที่แก้ไขข้อมูลล่าสุด |

---

## Enums

### ServiceCategory

หมวดหมู่ของบริการ

| Value | Description |
|-------|-------------|
| `HEALTH` | บริการด้านสุขภาพ |
| `BEAUTY` | บริการด้านความงาม |
| `CONSULTING` | บริการที่ปรึกษา |
| `EDUCATION` | บริการด้านการศึกษา |
| `FITNESS` | บริการด้านฟิตเนส |
| `OTHER` | บริการอื่น ๆ |

### DayOfWeek

วันในสัปดาห์ ใช้กำหนดวันที่ Service เปิดให้บริการ

| Value | Description |
|-------|-------------|
| `MONDAY` | วันจันทร์ |
| `TUESDAY` | วันอังคาร |
| `WEDNESDAY` | วันพุธ |
| `THURSDAY` | วันพฤหัสบดี |
| `FRIDAY` | วันศุกร์ |
| `SATURDAY` | วันเสาร์ |
| `SUNDAY` | วันอาทิตย์ |

### AppointmentStatus

สถานะของการนัดหมาย ใช้ควบคุม workflow ของ Appointment

| Value | Description | Terminal State |
|-------|-------------|---------------|
| `PENDING` | รอดำเนินการ (ค่าเริ่มต้น) | ไม่ |
| `CONFIRMED` | ยืนยันแล้ว | ไม่ |
| `COMPLETED` | เสร็จสิ้น | ใช่ |
| `CANCELLED` | ยกเลิก | ใช่ |
| `NO_SHOW` | ไม่มาตามนัด | ใช่ |

> หมายเหตุ: Appointment ที่อยู่ใน Terminal State (`COMPLETED`, `CANCELLED`, `NO_SHOW`) จะไม่สามารถแก้ไขได้อีก

---

## Relationships

```
Service (1) ────────── (*) Appointment
        OneToMany            ManyToOne
```

- 1 `Service` สามารถมีได้หลาย `Appointment`
- `Appointment.serviceId` เป็น foreign key ที่อ้างถึง `Service.id`
- `Appointment.serviceName` เป็นข้อมูลแบบ denormalized เพื่อความสะดวกในการแสดงผล โดยคัดลอกมาจาก `Service.name` ตอนสร้าง Appointment

---

## Business Rules Summary

### การสร้างนัดหมาย (POST /appointments)

- จองได้เฉพาะบริการที่มีสถานะ `isActive: true` เท่านั้น
- วันที่นัดหมายต้องไม่เป็นวันในอดีต
- วันนัดหมายต้องอยู่ใน `availableDays` ของ Service
- เวลานัดหมายต้องอยู่ภายในช่วง `startTime` - `endTime` ของ Service
- ระบบคำนวณ `endTime` ของ Appointment อัตโนมัติจาก `durationMinutes` ของ Service
- ตรวจสอบ time slot conflict — หาก slot เต็มตาม `maxConcurrentBookings` จะตอบ `409 Conflict`

### การแก้ไขนัดหมาย (PUT/PATCH /appointments/:id)

- ไม่อนุญาตให้แก้ไขนัดหมายที่อยู่ใน Terminal State
- การแก้ไขเวลาต้องผ่านการตรวจสอบ conflict เช่นเดียวกับการสร้าง

### การยกเลิกนัดหมาย (PATCH /appointments/:id/cancel)

- ต้องระบุ `cancellationReason` ทุกครั้ง

### การลบบริการ (DELETE /services/:id)

- ไม่สามารถลบ Service ที่มี Appointment ในสถานะ `PENDING` หรือ `CONFIRMED` อยู่

### Available Slots (GET /services/:id/available-slots)

- คำนวณช่วงเวลาว่างโดยอ้างอิงจากเวลาเปิด-ปิด, ระยะเวลา (`durationMinutes`), buffer และนัดหมายที่จองแล้ว
