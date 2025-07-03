# Trang Quản lý Thiết bị (Inventory)

## Mô tả

Trang Inventory được tạo để hiển thị và quản lý tất cả thiết bị trong hệ thống. Trang được chia thành 2 phần chính:

- **Sidebar bên trái**: Danh mục các loại thiết bị (5 loại)
- **Main content bên phải**: Hiển thị bảng thiết bị tương ứng với loại được chọn

## Các loại thiết bị được hỗ trợ

1. **Laptop** - Quản lý máy tính xách tay
2. **Màn hình** - Quản lý màn hình máy tính
3. **Máy in** - Quản lý máy in
4. **Máy chiếu** - Quản lý máy chiếu
5. **Công cụ** - Quản lý các công cụ khác

## Tính năng

- Hiển thị danh sách thiết bị với pagination (trừ Tools)
- Hiển thị thông tin chi tiết: tên, serial, trạng thái, người sử dụng, phòng, hãng sản xuất
- Hiển thị avatar và thông tin người sử dụng
- Loading states và error handling
- Responsive design

## Trạng thái thiết bị

- **Đang sử dụng** (Active) - Thiết bị đang được sử dụng
- **Chờ** (Standby) - Thiết bị chờ bàn giao
- **Hỏng** (Broken) - Thiết bị bị hỏng
- **Chờ biên bản** (PendingDocumentation) - Thiết bị chờ biên bản bàn giao

## API Endpoints

- `GET /api/laptops` - Lấy danh sách laptop
- `GET /api/monitors` - Lấy danh sách màn hình
- `GET /api/printers` - Lấy danh sách máy in
- `GET /api/projectors` - Lấy danh sách máy chiếu
- `GET /api/tools` - Lấy danh sách công cụ

## Routing

Trang có thể được truy cập qua route: `/dashboard/technology/inventory`

## Requirements

- Cần có permission `technology.inventory` để truy cập
- Backend API phải chạy trên port 3001 (hoặc cấu hình VITE_API_URL)
- Cần có authentication token trong localStorage

## Setup Environment Variables

Tạo file `.env` trong thư mục `workspace-frontend`:

```env
VITE_API_URL=http://localhost:3001
```

## Files được tạo/cập nhật

1. `src/types/inventory.ts` - Type definitions cho inventory
2. `src/services/inventoryService.ts` - Service gọi API
3. `src/pages/Technology/Inventory.tsx` - Component chính
4. `src/App.tsx` - Thêm route mới

## Cách sử dụng

1. Mở trang qua menu hoặc truy cập trực tiếp `/dashboard/technology/inventory`
2. Chọn loại thiết bị từ sidebar bên trái
3. Xem danh sách thiết bị trong bảng bên phải
4. Có thể thấy thông tin chi tiết về từng thiết bị

## Lưu ý

- Tools không có pagination (hiển thị tất cả)
- Các thiết bị khác có pagination với 20 items/page
- Cần đảm bảo backend API hoạt động đúng
- Avatar sẽ fallback về initials nếu không có ảnh
