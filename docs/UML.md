# UML Diagram

เอกสารนี้สรุปโครงสร้างคลาสหลักของระบบ Appointment Booking System ในรูปแบบ Mermaid class diagram

## Class Diagram

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
        +appointments: Appointment[]
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
        +service: Service
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

    class ApiResponse {
        <<interface>>
        +boolean success
        +string message
        +T|null data
    }

    Service "1" --> "*" Appointment : has
    Service --> ServiceCategory : category
    Service --> DayOfWeek : availableDays
    Appointment --> AppointmentStatus : status
    Appointment --> Service : belongs to
```

## State Diagram — AppointmentStatus

```mermaid
stateDiagram-v2
    [*] --> PENDING : POST /appointments
    PENDING --> CONFIRMED : PATCH /confirm
    PENDING --> CANCELLED : PATCH /cancel
    CONFIRMED --> COMPLETED : (manual/admin)
    CONFIRMED --> CANCELLED : PATCH /cancel
    CONFIRMED --> NO_SHOW : (manual/admin)
    COMPLETED --> [*]
    CANCELLED --> [*]
    NO_SHOW --> [*]
```

## Notes

- `Service` เป็นข้อมูลตั้งต้นของบริการที่เปิดให้จอง
- `Appointment` อ้างอิง `Service` ผ่าน `serviceId` (ManyToOne) และ `Service` มี `appointments[]` (OneToMany)
- `AppointmentStatus` ใช้ควบคุม workflow — Terminal State (`COMPLETED`, `CANCELLED`, `NO_SHOW`) ไม่สามารถแก้ไขได้อีก
- `availableDays` ใช้ร่วมกับช่วงเวลาเปิด-ปิดบริการในการคำนวณ available slots
- `ApiResponse<T>` เป็น standard response format ที่ทุก endpoint ใช้
