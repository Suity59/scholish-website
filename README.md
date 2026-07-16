# Scholish Website

Website tĩnh (HTML/CSS/JS thuần) cho trung tâm học online Scholish — visual theo design system **Editorial Warm Clean** (`04_Resources/Design System — Marketing`), cấu trúc section theo tham chiếu **magoosh.com**.

## Cấu trúc

| File | Nội dung |
|---|---|
| `index.html` | Trang chủ kiểu Magoosh: hero + exam picker, rating strip, mission + stat cards, lớp sắp khai giảng (anchor), wall of love, features, sứ mệnh 50%, FAQ, liên hệ |
| `gmat.html` | Trang khóa GMAT kiểu Magoosh product: hero + widget câu Quant mẫu, compare "Scholish vs lớp luyện đề", features 6 ô, lộ trình 12 tuần, thông tin lớp + feedback, guarantee band, FAQ |
| `sat.html` | Trang khóa SAT cùng template: widget câu Math mẫu, compare, features (có báo cáo phụ huynh), lộ trình 10 tuần |
| `tu-duy-phan-bien.html` | Khóa Tư duy phản biện: widget bóc lập luận mẫu, dành cho ai, nội dung 8 buổi, guarantee, FAQ |
| `css/style.css` | Toàn bộ style — token màu/chữ theo design system |
| `js/main.js` | Reveal animation, FAQ accordion, mobile nav, quiz widget |
| `fonts/` | SVN-Recoleta (600/700) + SVN-Gilroy (400/500/600/700) |

## Data thật đã dùng (từ Facebook Scholish + Notion, 16/07/2026)

- SĐT/Zalo: **096 355 71 53** (mọi CTA → `zalo.me/0963557153`); email **thescholish@gmail.com**
- **100% khuyên học · 38 đánh giá** trên Facebook (rating strip mọi trang; view đăng nhập là 38)
- Sĩ số lớp **dưới 8 học viên**; **early bird giảm 10%**; tên lớp **GMAT Trứng Rán**
- 50% lợi nhuận cho hoạt động xã hội (mission gốc)
- **Feedback = trích nguyên văn review Facebook**: Chí Nguyễn, Hồ Đại Nam, Dương Tùng Bách, Vi Đặng, Hải Đăng (+ bài đăng kết quả của Dũng)
- **High achievers** (section "Bảng vàng" ở index + gmat, nguồn Notion DB "Post gần nhất"): GMAT 750, 720, 710×2 (1 bạn ôn xuyên Tết), 645 Focus top 10% toàn cầu (Dũng), +210 điểm sau lớp Trứng Rán, admission + học bổng cao

## Avatar review (assets/avatars/)

Phần tử `[data-avatar="slug"]` tự nạp `assets/avatars/<slug>.jpg` nếu file tồn tại (main.js) — **thêm ảnh chỉ cần thả file đúng tên, không sửa HTML**. Đang có: `hai-dang.jpg` (lấy từ Facebook). Còn thiếu: `chi-nguyen.jpg`, `ho-dai-nam.jpg`, `duong-tung-bach.jpg`, `vi-dang.jpg` — Facebook chặn quét hàng loạt, cần bổ sung tay (screenshot/crop từ review).

## ⚠️ Placeholder còn lại (comment `<!-- TODO -->` trong code)

1. **Ngày khai giảng + lịch học + học phí** — đang ghi "Tháng 8/2026 — chốt qua Zalo" (index + 3 trang khóa)
2. **4 file avatar** còn thiếu như trên
3. **USP "GMAT top 5% + học bổng Hà Lan"** (trang GMAT + compare) — của Nam Anh; bỏ nếu không muốn gắn thành tích cá nhân

## Chạy thử

Preview server đã khai báo trong `.claude/launch.json` của vault Business (name: `scholish`, port 8092), hoặc:

```bash
cd ~/projects/scholish-website && python3 -m http.server 8092
```

## Luật design system phải giữ khi sửa

- Nền trang `#F3EDE9`, chữ không bao giờ `#000`
- **Đúng 1 thẻ có shadow `6px 6px 0 #000`/trang**: index = card "Lớp sắp khai giảng"; trang khóa = widget câu hỏi mẫu ở hero
- CTA mint `#79D287` chữ mực, pill, KHÔNG shadow, tối đa 2/viewport
- Underline coral 1–2 keyword heading/trang; highlight vàng = vai trò spotlight
- Card thường: radius 16px + hairline; heading SVN-Recoleta 600/700; body line-height 1.6
