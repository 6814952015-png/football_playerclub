# Football Player Club

เว็บแอปจัดทีมฟุตบอล โดยใช้ React + Tailwind CSS สำหรับส่วนหน้า และ Node.js (Express) + MongoDB (Mongoose) สำหรับ API และฐานข้อมูล

## โครงสร้าง

- `client/` — React, Vite และ Tailwind CSS
- `server/` — Express API, Mongoose และ JWT authentication

## เริ่มต้นใช้งาน

1. ตั้งค่า MongoDB แล้วคัดลอก `server/.env.example` เป็น `server/.env` จากนั้นกำหนด `MONGO_URI` และ `JWT_SECRET` หากต้องการสร้าง admin คนแรก ให้กำหนด `ADMIN_EMAIL` เป็นอีเมลที่จะใช้สมัคร (การสมัครด้วยอีเมลนั้นจะได้รับ role `admin`)
2. ติดตั้ง dependencies (มี lockfile ให้แล้ว)

   ```powershell
   npm --prefix client install
   npm --prefix server install
   ```

3. เปิดสอง terminal จากโฟลเดอร์นี้

   ```powershell
   npm run dev:server
   npm run dev:client
   ```

เปิดหน้าเว็บที่ URL ที่ Vite แสดง (ปกติ `http://localhost:5173`) โดย frontend จะส่ง `/api` ไปที่ Express บน `http://localhost:5000` อัตโนมัติ

## คำสั่ง

```powershell
npm run build       # build frontend สำหรับ production
npm run start       # run API server
npm run test        # run backend tests
```

## API หลัก

- `GET /api/health` — ตรวจสอบสถานะ API
- `GET, POST /api/players` — ข้อมูลนักเตะ
- `POST /api/users/register`, `POST /api/users/login` — สมัครและเข้าสู่ระบบ
- `GET, PATCH /api/users/me` — ข้อมูลโปรไฟล์ (ต้องส่ง Bearer token)
- `POST /api/games` — สร้างเกม (ต้องส่ง Bearer token)

### สิทธิ์ผู้ใช้และ Admin

ผู้ใช้ใหม่ได้รับ role `player` เสมอ; role `admin` กำหนดได้เฉพาะผ่าน `ADMIN_EMAIL` ตอน bootstrap หรือโดย admin คนอื่นจากหน้า Administration เท่านั้น

- `GET /api/admin/users` — รายชื่อผู้ใช้ (admin)
- `PATCH /api/admin/users/:id` — แก้ไขชื่อ, avatar หรือ role ของผู้ใช้ (admin)
- `GET /api/players` — ดูผู้เล่นทั้งหมด (admin)
- `POST /api/players`, `PATCH /api/players/:id` — สร้าง/แก้ไขนักเตะ (admin)

### ห้องเล่นสองคน

ทุก endpoint ด้านล่างต้องส่ง `Authorization: Bearer <token>` และหนึ่งห้องรองรับได้พอดี 2 คน

บัญชีที่สมัครใหม่ทุกบัญชีจะได้รับเครดิตเริ่มต้น `$1,000` และห้องใหม่ทุกห้องมีวงเงินคงที่ `$1,000` (เกินหรือต่ำกว่านี้ไม่ได้)

- `POST /api/rooms` — สร้างห้องด้วย `{ "name": "My room" }`
- `GET /api/rooms/mine` — ดูห้องที่ผู้ใช้กำลังอยู่
- `GET /api/rooms/:code` — ดูสถานะและผู้เล่นในห้อง
- `POST /api/rooms/:code/join` — เข้าร่วมด้วย room code
- `DELETE /api/rooms/:code/leave` — ออกจากห้อง (หาก host ออก ห้องจะถูกลบ)

ทดสอบ backend ได้ด้วย:

```powershell
npm --prefix server test
```
