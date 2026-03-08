# Frontend Demo

Frontend สำหรับสาธิตการใช้งาน Appointment Booking System API แบบครอบคลุม สร้างด้วย Vite + React + Chakra UI

## Features

- Dashboard overview ของ services และ appointments
- Service management: list, filter, create, detail, full update, partial update, delete, available slots
- Appointment management: list, filter, create, detail, full update, partial status patch, confirm, cancel, delete
- API activity panel สำหรับดู request/response ล่าสุด
- เปลี่ยน API base URL ได้จากหน้าเว็บ

## Run

```bash
cd frontend
npm install
npm run dev
```

ค่าเริ่มต้นจะเรียก API ที่ `http://localhost:3000`
หากต้องการเปลี่ยนให้สร้างไฟล์ `.env` จาก `.env.example`
