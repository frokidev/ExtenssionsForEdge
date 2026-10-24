# Edge Compact Vertical Tabs

Tiện ích mở rộng (Extension) cho **Microsoft Edge** giúp hiển thị danh sách tab dạng cột icon cố định ở thanh bên (**Side Panel**), mô phỏng phong cách Vertical Tabs nhưng **hoàn toàn không tự bung rộng khi rê chuột (hover)**.

---

## 🌟 Điểm nổi bật
- **Không tự bung rộng**: Độ rộng cột icon luôn cố định, rê chuột qua không bị trượt/bung panel che màn hình.
- **Biểu tượng loa thông minh**: Hiển thị loa khi tab phát âm thanh, click vào biểu tượng loa để Mute / Unmute tức thì.
- **Tooltip nổi**: Khi hover vào icon tab sẽ hiển thị tooltip nhỏ gọn chứa tiêu đề tab và nút `×` đóng tab nhanh.
- **Thao tác nhanh**:
  - Click chuột trái: Chuyển tab (`active`).
  - Click chuột giữa: Đóng tab.
  - Click nút `+`: Mở tab mới.
- **Tối ưu hiệu năng**: Viết bằng Vanilla JavaScript và HTML/CSS thuần (Manifest V3), không tốn RAM/CPU, không cần cài đặt Node.js hay build.

---

## 🚀 Hướng dẫn cài đặt vào Microsoft Edge

1. Mở trình duyệt **Microsoft Edge**.
2. Nhập `edge://extensions` vào thanh địa chỉ và nhấn **Enter**.
3. Bật công tắc **Chế độ dành cho nhà phát triển** (*Developer mode*) ở cột bên trái.
4. Nhấn nút **Tải phần mở rộng đã giải nén** (*Load unpacked*).
5. Chọn thư mục dự án này:
   ```text
   D:\Data\Workspace
   ```
6. Extension sẽ xuất hiện trên danh sách với tên **"Edge Compact Vertical Tabs"**.

---

## ⚙️ Thiết lập để đạt trải nghiệm tốt nhất như Vertical Tabs gốc

1. **Mở thanh bên Side Panel**:
   - Nhấn vào biểu tượng Extension trên thanh công cụ (Toolbar) của Edge để mở Side Panel.
2. **Chuyển Side Panel sang bên trái (tùy chọn)**:
   - Theo mặc định của Edge, Side Panel nằm ở bên phải. Để đưa sang bên trái giống hệt Vertical Tabs:
     - Vào `edge://settings/appearance` (hoặc Cài đặt > Giao diện).
     - Cuộn đến phần **Tùy chỉnh thanh bên** (*Customize sidebar*).
     - Đổi vị trí thanh bên thành **Bên trái** (*Left*).
3. **Tắt Vertical Tabs gốc của Edge**:
   - Nhấn tổ hợp phím **`Ctrl` + `Shift` + `,`** (hoặc click chuột phải vào thanh tab > *Tắt tab dọc*) để chuyển tab gốc của Edge về dạng ngang bình thường hoặc ẩn đi.

---

## 📁 Cấu trúc mã nguồn

```text
├── manifest.json        # Khai báo quyền sidePanel & tabs (Manifest V3)
├── background.js        # Background service worker mở Side Panel khi click icon
├── sidepanel/
│   ├── sidepanel.html   # Cấu trúc HTML thanh tab & floating tooltip
│   ├── sidepanel.css    # Style Dark theme chuẩn Microsoft Edge
│   └── sidepanel.js     # Logic đồng bộ real-time tabs, mute/unmute, tooltip
└── icons/               # Bộ biểu tượng extension (16x16, 48x48, 128x128)
```
