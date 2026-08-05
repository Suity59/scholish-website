# Luồng đăng ký GMAT — hướng dẫn bật

Form đăng ký chạy thẳng trên site (không nhúng Notion nữa). Submit gọi
`/api/dang-ky` để ghi vào Notion và lấy QR SePay, sau đó poll `/api/trang-thai`
tới khi webhook SePay báo tiền đã về.

## Chưa bật được nếu thiếu biến môi trường

Đặt trong Vercel → Project scholish-website → Settings → Environment Variables
(chọn cả Production và Preview):

| Biến | Giá trị | Lấy ở đâu |
|---|---|---|
| `NOTION_TOKEN` | `ntn_...` | notion.so/profile/integrations → New internal integration → copy token, rồi vào database "New form" bấm ••• → Connections → thêm integration vừa tạo |
| `SEPAY_BANK_ACC` | `9899907031997` | Tài khoản MB dùng chung với `hoc.namanhsuit.com` |
| `SEPAY_BANK_NAME` | `MBBank` | Viết liền, đúng như hoc đang dùng |
| `SEPAY_BANK_OWNER` | `LE NAM ANH` | Chỉ là chữ hiện dưới mã QR, sửa cho khớp tên chủ tài khoản MB |
| `SEPAY_WEBHOOK_API_KEY` | chuỗi bí mật tự đặt | Dán đúng chuỗi này vào cấu hình webhook bên SePay |
| `RESEND_API_KEY` | `re_...` | Tuỳ chọn — không có thì bỏ qua email báo |
| `NOTIFY_EMAIL_TO` | `thescholish@gmail.com` | Tuỳ chọn |
| `NOTIFY_EMAIL_FROM` | `Scholish <dangky@namanhsuit.com>` | Tuỳ chọn, cần verify domain ở Resend |

## Webhook SePay

Thêm webhook thứ hai trong dashboard SePay (giữ nguyên cái đang trỏ về
`hoc.namanhsuit.com`):

- URL: `https://scholish.namanhsuit.com/api/sepay-webhook`
- Header: `Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>`

Hai hệ thu về **cùng một tài khoản MB `9899907031997`** nhưng khác tiền tố mã
đơn — `HOC` cho hoc.namanhsuit.com, `SCH` cho Scholish. Mỗi endpoint bỏ qua
giao dịch không mang tiền tố của mình, nên cùng nhận mọi giao dịch cũng không
giẫm chân. Tiền hai hệ nằm chung một tài khoản, phân biệt bằng mã đơn trong
nội dung chuyển khoản.

**Nếu SePay không cho cấu hình nhiều webhook:** cách thay thế là để webhook của
`hoc` chuyển tiếp giao dịch có mã `SCH` sang endpoint này.

## Số tiền

Đang đặt cứng **3.000.000đ tiền giữ chỗ** (`DEPOSIT_VND` trong `api/_lib.js`).
Học phí còn lại hoàn tất trước buổi 3, xử lý ngoài web.

## Kiểm tra sau khi bật

1. Mở web, bấm "Giữ chỗ lớp này", điền form → phải hiện QR kèm mã `SCH######`.
2. Vào Notion database "New form" → phải thấy dòng mới, `Trạng thái thanh toán`
   = "Chờ chuyển khoản".
3. Chuyển thật 3.000.000đ theo QR → sau vài giây trang tự đổi sang "Đã nhận
   được chuyển khoản", Notion đổi sang "Đã giữ chỗ".

Nếu bước 3 không đổi trạng thái, xem log webhook ở Vercel → Logs, lọc `[sepay]`.
