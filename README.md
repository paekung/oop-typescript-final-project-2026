# Appointment Booking System API

## 📌 Project Overview

โปรเจคนี้เป็น **NestJS Backend REST API** สำหรับระบบจองบริการและนัดหมาย

ระบบรองรับการจัดการข้อมูลหลัก 2 ส่วน:

* **Service** — ข้อมูลบริการ เช่น ชื่อบริการ หมวดหมู่ ราคา ระยะเวลา และเวลาที่เปิดให้จอง
* **Appointment** — ข้อมูลการนัดหมายของลูกค้า เช่น วันที่ เวลา สถานะการจอง และหมายเหตุ

โปรเจคนี้ถูกพัฒนาตามโจทย์ Model Set 6 ของรายวิชา OOP TypeScript Final Project โดยเน้น:

* การออกแบบ REST API ด้วย NestJS
* การใช้ TypeScript แบบ strict และ type-safe
* การจัดการ validation, exception handling และ Swagger documentation
* การออกแบบ business logic สำหรับการจองเวลาและตรวจสอบเงื่อนไขของระบบ

---

## 👥 Team Structure

ทีมพัฒนา:

* สรวิศ วงค์ทิม — `bsrxwt`
* ศุภกิตติ์ ตันตวาที — `paekung`
* สหภูมิ รัตนาวิวัฒน์พงศ์ — `Meseal`

---

## 🛠 Technology Stack

* **Framework:** NestJS
* **Language:** TypeScript
* **API Style:** REST API
* **Database:** JSON-based (file-based หรือ in-memory)
* **API Documentation:** Swagger (OpenAPI)
* **Linting:** ESLint (TypeScript ESLint)

---

## 📁 Project Structure

```text
.
├── subjects/
│   ├── evaluation.md
│   ├── models.md
│   ├── requirement.md
│   └── submission.md
├── src/
│   ├── app.module.ts
│   ├── controllers/
│   │   └── service.controller.ts
│   ├── dto/
│   │   └── service/
│   ├── entities/
│   │   └── service.entity.ts
│   ├── enums/
│   │   ├── day-of-week.enum.ts
│   │   └── service-category.enum.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interfaces/
│   │   └── api-response.interface.ts
│   ├── services/
│   │   └── service.service.ts
│   └── main.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

> 📌 หมายเหตุ: 
* ในสถานะปัจจุบัน ฝั่ง `Service` ถูกสร้างแล้ว และฝั่ง `Appointment` จะถูกเพิ่มเข้ามาในโครงสร้างเดียวกัน
* โฟลเดอร์ `filters/` และ `interfaces/` ใช้สำหรับ shared infrastructure ของทั้งระบบ
* เอกสารเชิงลึกเพิ่มเติมจะถูกจัดเก็บในโฟลเดอร์ `docs/`

---

## 🚀 Getting Started

### 1. Install Dependencies

โปรเจคนี้ใช้ NestJS, TypeORM, SQLite, class-validator และ Swagger

```bash
npm install
```

### 2. Run Development Server

เมื่อรันครั้งแรก ระบบจะสร้างไฟล์ `database.sqlite` อัตโนมัติจากการตั้งค่า TypeORM

```bash
npm run start:dev
```

### 3. Build for Production

```bash
npm run build
```

### 4. API Documentation (Swagger)

เมื่อรันโปรเจคแล้ว สามารถเข้าดู Swagger ได้ที่:

```text
http://localhost:3000/api
```

### 5. Default Application URL

```text
http://localhost:3000
```

---

## 🧩 Model Sets

แต่ละกลุ่มต้องเลือก **Model Set 1 ชุด** จาก 10 ชุดที่มีให้

**วิธีการเลือก Model Set:**
1. นำ Student ID ของสมาชิกทุกคนในกลุ่มมารวมกัน (`sumStudentId`)
2. นำผลรวม mod 10
3. ค่าที่ได้ (0-9) จะเป็น Model Set ID ที่กลุ่มได้รับ

**ตัวอย่าง:** 
- สมาชิก 3 คน มี Student ID: 64123456, 64123457, 64123458
- `sumStudentId` = 64123456 + 64123457 + 64123458 = 192370371
- 192370371 mod 10 = 1 → **Model Set ID: "1"** (Blog / Content Platform)

> 📌 **เมื่อได้ Model Set แล้ว ห้ามเปลี่ยน** เว้นแต่ได้รับอนุญาตจากอาจารย์

**หลังจากเลือก Model Set แล้ว ให้บันทึกใน `package.json`:**
```json
{
  "project": {
    "model": {
      "id": "1",
      "name": "Blog / Content Platform"
    },
    "sumStudentId": 192370371
  }
}
```

**รายละเอียด Model Sets ทั้งหมด:** → [`subjects/models.md`](subjects/models.md)

---

## 📐 Project Requirements (Summary)

### Data Model
* ต้องเลือกใช้ **Model Set 1 ชุด** จาก 10 ชุดที่มีให้ (ดูรายละเอียดใน [`subjects/models.md`](subjects/models.md))
* แต่ละ Model Set มี **Core Data Model 2 Models**
* ต้องบันทึก Model Set ที่เลือกไว้ใน `package.json` (key `project`)
* ใช้ TypeScript data type ให้ครบถ้วน
* ต้องมีการใช้งาน **Enum อย่างน้อย 1 จุด**
* ❌ **ห้ามใช้ `any` type ในทุกกรณี**

### API Design
* ทุก Model ต้องรองรับ **CRUD Operation ครบถ้วน**
* ใช้ HTTP Method ให้ถูกต้องตามหลัก REST API:
  * `GET /resources` - ดึงข้อมูลทั้งหมด
  * `GET /resources/{id}` - ดึงข้อมูลตาม ID
  * `POST /resources` - สร้างข้อมูลใหม่
  * `PUT /resources/{id}` - อัปเดตข้อมูลทั้งหมด
  * `PATCH /resources/{id}` - อัปเดตข้อมูลบางส่วน
  * `DELETE /resources/{id}` - ลบข้อมูล
* URL path ต้องตั้งชื่อให้สื่อความหมาย

### Standard Response Format

ทุก API ต้องใช้ Response Format แบบเดียวกัน:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}
```

### Validation & Error Handling
* ทุก API ต้องมีการ **validate ข้อมูล**
* ใช้ **HTTP Status Code** ที่เหมาะสม:
  * `200` - OK (GET, PUT, PATCH สำเร็จ)
  * `201` - Created (POST สำเร็จ)
  * `400` - Bad Request (Validation error)
  * `403` - Forbidden (ไม่มีสิทธิ์)
  * `404` - Not Found (ไม่พบข้อมูล)
  * `500` - Internal Server Error (Server error)
* ⚠️ **ไม่ควรเกิด Error 500 จาก logic ที่สามารถป้องกันได้**
* หากพบ Error 500 มากกว่า 5 จุด อาจมีผลต่อการให้คะแนน

---

## 📄 Documentation

เอกสารรายละเอียดของโจทย์และข้อกำหนดทั้งหมดถูกจัดเก็บไว้ในโฟลเดอร์ `subjects/`

### เอกสารโจทย์ (Project Specification)

* 📘 **Project Requirement** — ขอบเขตและข้อกำหนดของโปรเจค
  → [`subjects/requirement.md`](subjects/requirement.md)
* 🧩 **Model Sets** — รายละเอียด Model Sets ทั้ง 10 ชุด
  → [`subjects/models.md`](subjects/models.md)
* 📦 **Submission Guideline** — รูปแบบและขั้นตอนการส่งงาน
  → [`subjects/submission.md`](subjects/submission.md)
* 🧮 **Evaluation Criteria** — เกณฑ์การให้คะแนนและการประเมินผล
  → [`subjects/evaluation.md`](subjects/evaluation.md)

### เอกสารทางเทคนิค (ต้องจัดทำ)

* 🔌 **API Specification (Swagger)** — เอกสาร API ทุก Endpoint
* 🧱 **Data Model Documentation** — เอกสารอธิบาย Data Model
* 📊 **UML Diagram** — แผนภาพ UML ของ Data Model

---

## 👥 Team & Contributors

รายชื่อสมาชิกในกลุ่มต้องถูกระบุไว้ใน key `contributors` ภายในไฟล์ `package.json` โดยมีรูปแบบดังนี้:

```json
"contributors": [
  {
    "fullname": "ชื่อ-นามสกุล",
    "username": "github-username",
    "studentId": "รหัสนักศึกษา"
  }
]
```

---

## 🤖 AI Usage Policy

* อนุญาตให้ใช้ AI (เช่น ChatGPT) ช่วยในการพัฒนาโปรเจค
* นักศึกษาต้องสามารถอธิบายโค้ดและแนวคิดของระบบได้ด้วยตนเอง
* หากไม่สามารถอธิบายได้ อาจมีผลต่อการประเมินคะแนน

---

## ✅ Submission

* ส่งงานเป็น **GitHub Repository URL** ในนามของ **Team Lead**
* Repository ต้องสามารถเข้าถึงได้

---

## 📝 Important Notes

* โค้ดต้องอ่านง่าย เป็นระบบ และดูแลรักษาได้
* ทุก request และ response ต้องกำหนด interface แบบ narrow type
* ใช้ TypeScript strict mode (`strict: true` ใน tsconfig.json)
* ESLint จะตรวจสอบและป้องกันการใช้ `any` type อัตโนมัติ

---

📌 *This repository is intended for educational purposes only.*
