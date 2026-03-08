# Submission Checklist

ใช้รายการนี้เพื่อตรวจสอบความพร้อมก่อน merge เข้า `develop` และก่อนส่งงานจริง

## Package Metadata

- [x] `package.json` มี `contributors` ครบ 3 คน
- [x] `package.json` มี `project.model.id` เป็น `6`
- [x] `package.json` มี `project.model.name` เป็น `Appointment Booking System`
- [x] dependency ที่จำเป็นสำหรับ NestJS + JSON DB ถูกระบุครบ

## Shared Infrastructure

- [x] มี [src/interfaces/api-response.interface.ts](../src/interfaces/api-response.interface.ts)
- [x] มี [src/filters/http-exception.filter.ts](../src/filters/http-exception.filter.ts)
- [x] [src/main.ts](../src/main.ts) register global validation pipe แล้ว
- [x] [src/main.ts](../src/main.ts) register global exception filter แล้ว
- [x] Swagger config ใน [src/main.ts](../src/main.ts) เป็นชื่อโปรเจคจริง
- [x] [.gitignore](../.gitignore) ignore `database.json` แล้ว

## Service Module

- [x] `Service` entity มี field ครบตาม spec (14 attributes)
- [x] Service DTOs มี validation decorators ครบ (create, update, patch)
- [x] Service controller มี CRUD endpoints ครบ (GET, POST, PUT, PATCH, DELETE)
- [x] Service service มี business logic สำหรับ delete และ available slots

## Appointment Module

- [x] `Appointment` entity มี field ครบตาม spec (13 attributes)
- [x] Appointment DTOs มี validation decorators ครบ (create, update, patch, cancel)
- [x] Appointment controller มี CRUD endpoints ครบ (GET, POST, PUT, PATCH, DELETE)
- [x] มี cancel / confirm endpoints
- [x] มี logic ตรวจ time slot conflict
- [x] มี logic ตรวจ status transition

## JSON Database Integration

- [x] [src/database/json-database.service.ts](../src/database/json-database.service.ts) ตั้งค่า JSON file persistence แล้ว
- [x] ใช้ `jsonfile`
- [x] `database.json` ถูกสร้างได้อัตโนมัติ
- [x] register controllers และ providers ครบ

## API Contract

- [x] ทุก endpoint ตอบกลับเป็น `ApiResponse<T>`
- [x] ใช้ HTTP status code ถูกต้อง (200, 201, 400, 404, 409)
- [x] validation error ถูกจัดรูปแบบผ่าน exception filter
- [x] ไม่มี `any` type ในงานที่ส่ง

## Documentation

- [x] [README.md](../README.md) อธิบายโปรเจคครบ
- [x] [docs/DATA_MODEL.md](DATA_MODEL.md) ครบถ้วน
- [x] [docs/UML.md](UML.md) แสดง class diagram ชัดเจน
- [x] Swagger ที่ `/api` ใช้งานได้จริง

## Final Testing

- [x] `npm install` สำเร็จ
- [x] `npm run build` ผ่าน
- [x] `npm run start:dev` รันได้
- [x] ทดสอบ CRUD ของ `Service`
- [x] ทดสอบ CRUD ของ `Appointment`
- [x] ทดสอบจองเวลาซ้ำแล้วได้ `409 Conflict`
- [x] ทดสอบยกเลิกโดยไม่มี reason แล้วได้ `400 Bad Request`
- [x] ทดสอบลบ service ที่มี active appointments แล้วได้ `400 Bad Request`
- [x] ทดสอบเปลี่ยน status ผิดลำดับแล้วได้ `400 Bad Request`

## Git and Submission

- [x] สมาชิกทุกคนมี commit ของตัวเอง
- [x] branch งานถูก merge เข้า `develop` เรียบร้อย
- [x] ตรวจ conflict หลัง merge แล้ว
- [x] repository เข้าถึงได้
- [x] พร้อมส่ง URL repository ตามข้อกำหนด
