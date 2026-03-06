# UML Diagram

เอกสารนี้สรุปโครงสร้างคลาสหลักของระบบ Appointment Booking System ในรูปแบบ Mermaid class diagram

```mermaid
classDiagram
    class Service {
        +string id
        +string name
        +string description
        +ServiceCategory category
        +number durationMinutes
        +number price
        +string providerName
        +DayOfWeek[] availableDays
        +string startTime
        +string endTime
        +number maxConcurrentBookings
        +number bufferMinutes
        +boolean isActive
        +Date createdAt
        +Date updatedAt
    }

    class Appointment {
        +string id
        +string serviceId
        +string serviceName
        +string customerName
        +string customerEmail
        +string customerPhone
        +string appointmentDate
        +string startTime
        +string endTime
        +AppointmentStatus status
        +string notes
        +string|null cancellationReason
        +Date createdAt
        +Date updatedAt
    }

    class ServiceCategory {
        <<enumeration>>
        HEALTH
        BEAUTY
        CONSULTING
        EDUCATION
        FITNESS
        OTHER
    }

    class DayOfWeek {
        <<enumeration>>
        MONDAY
        TUESDAY
        WEDNESDAY
        THURSDAY
        FRIDAY
        SATURDAY
        SUNDAY
    }

    class AppointmentStatus {
        <<enumeration>>
        PENDING
        CONFIRMED
        COMPLETED
        CANCELLED
        NO_SHOW
    }

    Service "1" --> "*" Appointment : has
    Service --> ServiceCategory
    Service --> DayOfWeek
    Appointment --> AppointmentStatus
```

## Notes

- `Service` เป็นข้อมูลตั้งต้นของบริการที่เปิดให้จอง
- `Appointment` อ้างอิง `Service` ผ่าน `serviceId`
- `AppointmentStatus` ใช้ควบคุมการเปลี่ยนสถานะของการนัดหมาย
- `availableDays` ใช้ร่วมกับช่วงเวลาเปิด-ปิดบริการในการคำนวณ slot ที่ว่าง
