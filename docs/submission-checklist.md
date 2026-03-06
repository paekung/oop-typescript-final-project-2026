# Submission Checklist

ใช้รายการนี้เพื่อตรวจสอบความพร้อมก่อน merge เข้า `develop` และก่อนส่งงานจริง

## Package Metadata

- [ ] `package.json` มี `contributors` ครบ 3 คน
- [ ] `package.json` มี `project.model.id` เป็น `6`
- [ ] `package.json` มี `project.model.name` เป็น `Appointment Booking System`
- [ ] dependency ที่จำเป็นสำหรับ NestJS + TypeORM + SQLite ถูกระบุครบ

## Shared Infrastructure

- [ ] มี [src/interfaces/api-response.interface.ts](../src/interfaces/api-response.interface.ts)
- [ ] มี [src/filters/http-exception.filter.ts](../src/filters/http-exception.filter.ts)
- [ ] [src/main.ts](../src/main.ts) register global validation pipe แล้ว
- [ ] [src/main.ts](../src/main.ts) register global exception filter แล้ว
- [ ] Swagger config ใน [src/main.ts](../src/main.ts) เป็นชื่อโปรเจคจริง
- [ ] [.gitignore](../.gitignore) ignore `database.sqlite` แล้ว

## Service Module

- [ ] `Service` entity มี field ครบตาม spec
- [ ] Service DTOs มี validation decorators ครบ
- [ ] Service controller มี CRUD endpoints ครบ
- [ ] Service service มี business logic สำหรับ delete และ available slots

## Appointment Module

- [ ] `Appointment` entity มี field ครบตาม spec
- [ ] Appointment DTOs มี validation decorators ครบ
- [ ] Appointment controller มี CRUD endpoints ครบ
- [ ] มี cancel / confirm endpoints
- [ ] มี logic ตรวจ time slot conflict
- [ ] มี logic ตรวจ status transition

## TypeORM Integration

- [ ] [src/app.module.ts](../src/app.module.ts) ตั้งค่า `TypeOrmModule.forRoot()` แล้ว
- [ ] ใช้ `better-sqlite3`
- [ ] `database.sqlite` ถูกสร้างได้อัตโนมัติ
- [ ] register entities, controllers และ providers ครบ

## API Contract

- [ ] ทุก endpoint ตอบกลับเป็น `ApiResponse<T>`
- [ ] ใช้ HTTP status code ถูกต้อง
- [ ] validation error ถูกจัดรูปแบบผ่าน exception filter
- [ ] ไม่มี `any` type ในงานที่ส่ง

## Documentation

- [ ] [README.md](../README.md) อธิบายโปรเจคครบ
- [ ] [docs/DATA_MODEL.md](DATA_MODEL.md) ครบถ้วน
- [ ] [docs/UML.md](UML.md) แสดง class diagram ชัดเจน
- [ ] Swagger ที่ `/api` ใช้งานได้จริง

## Final Testing

- [ ] `npm install` สำเร็จ
- [ ] `npm run build` ผ่าน
- [ ] `npm run start:dev` รันได้
- [ ] ทดสอบ CRUD ของ `Service`
- [ ] ทดสอบ CRUD ของ `Appointment`
- [ ] ทดสอบจองเวลาซ้ำแล้วได้ `409 Conflict`
- [ ] ทดสอบยกเลิกโดยไม่มี reason แล้วได้ `400 Bad Request`
- [ ] ทดสอบลบ service ที่มี active appointments แล้วได้ `400 Bad Request`
- [ ] ทดสอบเปลี่ยน status ผิดลำดับแล้วได้ `400 Bad Request`

## Git and Submission

- [ ] สมาชิกทุกคนมี commit ของตัวเอง
- [ ] branch งานถูก merge เข้า `develop` เรียบร้อย
- [ ] ตรวจ conflict หลัง merge แล้ว
- [ ] repository เข้าถึงได้
- [ ] พร้อมส่ง URL repository ตามข้อกำหนด
