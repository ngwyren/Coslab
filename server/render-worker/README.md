# Render AI cho COSLAB (Cloudflare Worker)

Trang web chụp nhanh mẫu 3D trên máy người dùng rồi gửi ảnh lên Worker này. Worker gọi
mô hình tạo ảnh của Google để đánh sáng studio và khử nhiễu, rồi trả ảnh về. Khóa API nằm
trong Worker, không bao giờ xuất hiện trên trang web.

Khi chưa cài Worker, trang vẫn chạy bình thường: nút **AI** bị ẩn và render chạy trên máy người dùng.

## Cài đặt (khoảng 10 phút, không cần cài phần mềm)

1. **Lấy khóa API của Google**
   - Mở https://aistudio.google.com/apikey, đăng nhập và tạo một khóa.
   - Tạo ảnh là tính năng trả phí theo từng ảnh: xem giá hiện hành ở trang giá của Gemini API
     và bật thanh toán nếu Google yêu cầu.
   - Nên đặt hạn mức chi tiêu cho khóa này (xem phần Rủi ro bên dưới).

2. **Tạo Worker**
   - Đăng ký tài khoản miễn phí tại https://dash.cloudflare.com.
   - Vào mục Workers, tạo một Worker mới (ví dụ tên `coslab-render`).
   - Mở trình sửa code của Worker, xóa code mẫu, dán toàn bộ nội dung file `worker.js`
     trong thư mục này, rồi bấm Deploy.

3. **Đặt khóa vào Worker**
   - Trong phần Settings của Worker, mục Variables and Secrets, thêm một **Secret**
     tên `GEMINI_API_KEY` với giá trị là khóa ở bước 1.
   - Không dán khóa vào code, không gửi khóa cho ai, không commit khóa lên GitHub.

4. **Nối trang web với Worker**
   - Chép địa chỉ Worker (dạng `https://coslab-render.<tên-bạn>.workers.dev`).
   - Mở `js/core/config.js`, điền địa chỉ đó vào `renderApi`, và tăng số `?v=` của
     `config.js` trong `index.html`. Push lên `main`.

Sau đó hộp Render có thêm mức **AI** và mở sẵn ở mức này.

## Tùy chọn

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `GEMINI_MODEL` | `gemini-nano-banana-2.1` | Mô hình tạo ảnh. Đổi sang mô hình rẻ hơn hoặc mới hơn tại đây. |
| `ALLOWED_ORIGINS` | `https://ngwyren.github.io` | Các trang được phép gọi, cách nhau bằng dấu phẩy. Thêm `http://localhost:8080` khi thử trên máy. |

## Rủi ro cần biết

- **Chi phí:** mỗi lần bấm render AI là một lần gọi tính tiền. Worker chỉ nhận yêu cầu từ
  trang trong `ALLOWED_ORIGINS`, nhưng người rành kỹ thuật vẫn giả mạo được nguồn gọi.
  Hãy đặt hạn mức chi tiêu ở phía Google, và cân nhắc bật Rate Limiting của Cloudflare cho Worker.
- **Độ chính xác:** AI vẽ lại ảnh nên chữ, logo hoặc màu Pantone có thể lệch nhẹ. Bản in
  và file xuất (PNG, PDF, SVG) vẫn lấy từ thiết kế gốc, không qua AI.
- **Chưa thử với API thật:** `worker.js` được viết theo tài liệu Interactions API của Google
  (tháng 11/2026) và chưa chạy với khóa thật. Nếu lần đầu báo lỗi, xem log của Worker.
