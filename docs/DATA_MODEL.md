# Data Model Documentation

## Overview

ระบบ Appointment Booking System ประกอบด้วยข้อมูลหลัก 2 ส่วนคือ `Service` และ `Appointment` โดยใช้ TypeORM ร่วมกับ SQLite ในการจัดเก็บข้อมูล

- `Service` ใช้เก็บรายละเอียดของบริการที่ลูกค้าสามารถจองได้
- `Appointment` ใช้เก็บข้อมูลการนัดหมายที่อ้างอิงถึงบริการ
- ความสัมพันธ์หลักคือ 1 `Service` สามารถมีได้หลาย `Appointment`

---

## Service Entity

| Field | Type | Description |
|------|------|-------------|
| `id` | `string` | UUID ของบริการ |
| `name` | `string` | ชื่อบริการ |
| `description` | `string` | รายละเอียดบริการ |
| `category` | `ServiceCategory` | หมวดหมู่ของบริการ |
| `durationMinutes` | `number` | ระยะเวลาของบริการเป็นนาที |
| `price` | `number` | ราคาของบริการ |
| `providerName` | `string` | ชื่อผู้ให้บริการ |
| `availableDays` | `DayOfWeek[]` | วันที่เปิดให้บริการ |
| `startTime` | `string` | เวลาเริ่มให้บริการรูปแบบ `HH:mm` |
| `endTime` | `string` | เวลาสิ้นสุดการให้บริการรูปแบบ `HH:mm` |
| `maxConcurrentBookings` | `number` | จำนวนการจองพร้อมกันสูงสุด |
| `bufferMinutes` | `number` | เวลาพักระหว่างการจอง |
| `isActive` | `boolean` | สถานะเปิดใช้งานบริการ |
| `createdAt` | `Date` | วันที่สร้างข้อมูล |
| `updatedAt` | `Date` | วันที่แก้ไขข้อมูลล่าสุด |

---

## Appointment Entity

| Field | Type | Description |
|------|------|-------------|
| `id` | `string` | UUID ของนัดหมาย |
| `serviceId` | `string` | อ้างอิงบริการที่ถูกจอง |
| `serviceName` | `string` | ชื่อบริการที่ถูกบันทึกไว้ในนัดหมาย |
| `customerName` | `string` | ชื่อลูกค้า |
| `customerEmail` | `string` | อีเมลลูกค้า |
| `customerPhone` | `string` | เบอร์โทรลูกค้า |
| `appointmentDate` | `string` | วันที่นัดหมายรูปแบบ `YYYY-MM-DD` |
| `startTime` | `string` | เวลาเริ่มต้นรูปแบบ `HH:mm` |
| `endTime` | `string` | เวลาสิ้นสุดรูปแบบ `HH:mm` |
| `status` | `AppointmentStatus` | สถานะของการนัดหมาย |
| `notes` | `string` | หมายเหตุเพิ่มเติมจากลูกค้า |
| `cancellationReason` | `string \| null` | เหตุผลในการยกเลิก |
| `createdAt` | `Date` | วันที่สร้างข้อมูล |
| `updatedAt` | `Date` | วันที่แก้ไขข้อมูลล่าสุด |

> หมายเหตุ: ฝั่ง `Appointment` จะถูกเติม implementation และ entity file โดยผู้รับผิดชอบของโมดูลนี้

---

## Enums

### ServiceCategory

- `HEALTH`
- `BEAUTY`
- `CONSULTING`
- `EDUCATION`
- `FITNESS`
- `OTHER`

### DayOfWeek

- `MONDAY`
- `TUESDAY`
- `WEDNESDAY`
- `THURSDAY`
- `FRIDAY`
- `SATURDAY`
- `SUNDAY`

### AppointmentStatus

- `PENDING`
- `CONFIRMED`
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`

---

## Relationships

- 1 `Service` : many `Appointment`
- `Appointment.serviceId` เป็น foreign key ที่อ้างถึง `Service.id`
- `Appointment.serviceName` เป็นข้อมูลแบบ denormalized เพื่อความสะดวกในการแสดงผล

---

## Business Rules Summary

- บริการที่ถูกปิดใช้งาน (`isActive = false`) จะไม่สามารถจองใหม่ได้
- วันที่นัดหมายต้องไม่เป็นอดีต
- เวลานัดหมายต้องอยู่ภายในช่วงเวลาเปิดให้บริการของ `Service`
- ระบบต้องตรวจสอบ time slot conflict ก่อนสร้างหรือแก้ไข `Appointment`
- การยกเลิกนัดหมายต้องมี `cancellationReason`
- ไม่สามารถแก้ไขนัดหมายที่อยู่ในสถานะสิ้นสุดแล้ว เช่น `COMPLETED`, `CANCELLED`, `NO_SHOW`
