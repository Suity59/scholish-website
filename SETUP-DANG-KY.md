# Luồng đăng ký GMAT — hướng dẫn bật

Form đăng ký chạy thẳng trên site (không nhúng Notion nữa). Submit gọi
`/api/dang-ky` để ghi vào Notion và lấy QR SePay, sau đó poll `/api/trang-thai`
tới khi webhook SePay báo tiền đã về.

## Chưa bật được nếu thiếu biến môi trường

Đặt trong Vercel → Project scholish-website → Settings → Environment Variables
(chọn cả Production và Preview):

**Bắt buộc:**

| Biến | Giá trị | Lấy ở đâu |
|---|---|---|
| `NOTION_TOKEN` | `ntn_...` | notion.so/profile/integrations → New connection → Access token. Sau đó vào database "New form" bấm ••• → Connections → thêm connection vừa tạo. ✅ đã đặt xong 5/8/2026 |
| `SEPAY_WEBHOOK_API_KEY` | chuỗi ngẫu nhiên tự đặt | Tự nghĩ ra (1Password sinh giúp), dán **cùng một chuỗi** vào đây và vào bước "Bảo mật → API Key" của webhook bên SePay. SePay chỉ hiện 4 ký tự cuối sau khi lưu nên phải cất lại ngay. |

**Tuỳ chọn** — không đặt thì luồng vẫn chạy, chỉ là không có email báo:

| Biến | Giá trị |
|---|---|
| `RESEND_API_KEY` | `re_...` |
| `NOTIFY_EMAIL_TO` | `thescholish@gmail.com` |
| `NOTIFY_EMAIL_FROM` | `Scholish <dangky@namanhsuit.com>` (cần verify domain ở Resend) |

**Thông tin tài khoản nhận tiền** để mặc định trong `api/_lib.js` (MB `9899907031997`,
`MBBank`, `LE NAM ANH`) vì không phải bí mật — số tài khoản in ngay trên mã QR mà
học viên nào cũng thấy. Đổi tài khoản thì sửa trong code, hoặc đặt đè bằng biến
`SEPAY_BANK_ACC` / `SEPAY_BANK_NAME` / `SEPAY_BANK_OWNER`.

> **Nhớ:** biến môi trường chỉ nạp vào deploy MỚI. Thêm biến xong phải redeploy
> thì mới có tác dụng, deploy cũ vẫn chạy với giá trị cũ.

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
