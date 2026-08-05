const { randomBytes } = require('crypto');
const { Client } = require('@notionhq/client');

/**
 * Helper dùng chung cho luồng giữ chỗ GMAT.
 *
 * Luồng: form trên web -> /api/dang-ky (ghi Notion + sinh QR SePay)
 *        -> học viên chuyển khoản -> SePay bắn /api/sepay-webhook
 *        -> đánh dấu "Đã giữ chỗ" -> form đang poll /api/trang-thai thấy và báo xong.
 *
 * Cùng tài khoản SePay với hoc.namanhsuit.com nhưng tiền tố mã đơn khác (SCH
 * thay vì HOC) để hai hệ không giẫm chân nhau khi dò mã trong nội dung CK.
 */

/** Tiền giữ chỗ. Học phí còn lại hoàn tất trước buổi 3, xử lý ngoài web. */
const DEPOSIT_VND = 3000000;

/** Bỏ 0/O/1/I cho khỏi nhầm khi học viên phải gõ tay nội dung CK. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Mã đơn Scholish: SCH + 6 ký tự. */
function generateOrderCode() {
  const bytes = randomBytes(6);
  let suffix = '';
  for (const b of bytes) suffix += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `SCH${suffix}`;
}

/** Dò mã đơn trong nội dung CK — ngân hàng hay chèn thêm chữ quanh nó. */
const ORDER_CODE_REGEX = /SCH[A-HJ-NP-Z2-9]{6}/;

/** Ảnh VietQR động của SePay: quét ra sẵn đúng số tiền + nội dung. */
function sepayQrUrl(amountVnd, code) {
  const params = new URLSearchParams({
    acc: process.env.SEPAY_BANK_ACC || '',
    bank: process.env.SEPAY_BANK_NAME || '',
    amount: String(amountVnd),
    des: code,
  });
  return `https://qr.sepay.vn/img?${params.toString()}`;
}

const PROP = {
  ten: 'Tên của bạn',
  email: 'Email của bạn (bạn nhớ điền email chính xác nhé)',
  zalo: 'Zalo của bạn',
  khoa: 'Lựa chọn khóa học',
  thoiDiemThi: 'Thời điểm thi dự kiến',
  diemMongMuon: 'Mức điểm mong muốn của bạn',
  diemHienTai: 'Điểm Gmat hoặc điểm IELTS/TOEFL Reading hiện tại của bạn?',
  maDon: 'Mã đơn',
  trangThai: 'Trạng thái thanh toán',
  soTien: 'Số tiền',
  thoiDiemTT: 'Thời điểm thanh toán',
};

const TRANG_THAI = {
  cho: 'Chờ chuyển khoản',
  xong: 'Đã giữ chỗ',
  thieu: 'Chuyển thiếu',
};

function notionClient() {
  return new Client({ auth: process.env.NOTION_TOKEN });
}

const DATABASE_ID = '1de173e8-3d56-80ab-b9d7-c3a95ef8c2f1';

/** Tìm trang đăng ký theo mã đơn. Trả null nếu không có. */
async function findPageByCode(notion, code) {
  const res = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { property: PROP.maDon, rich_text: { equals: code } },
    page_size: 1,
  });
  return res.results[0] || null;
}

/**
 * Rate limit trong bộ nhớ instance. Serverless hay bị tái tạo instance nên đây
 * không phải hàng rào chắc chắn — chỉ để chặn bấm liên tục từ một máy.
 */
const hits = new Map();
function rateLimit(key, { max, windowMs }) {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now > rec.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (rec.count >= max) return false;
  rec.count += 1;
  return true;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return 'unknown';
}

/** Báo cho Nam Anh qua Resend. Không cấu hình thì bỏ qua, không làm hỏng luồng. */
async function notifyEmail(subject, text) {
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFY_EMAIL_TO) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_EMAIL_FROM || 'Scholish <onboarding@resend.dev>',
        to: [process.env.NOTIFY_EMAIL_TO],
        subject,
        text,
      }),
    });
  } catch (err) {
    console.error('[email] gửi thất bại:', err.message);
  }
}

module.exports = {
  DEPOSIT_VND,
  DATABASE_ID,
  PROP,
  TRANG_THAI,
  ORDER_CODE_REGEX,
  generateOrderCode,
  sepayQrUrl,
  notionClient,
  findPageByCode,
  rateLimit,
  clientIp,
  notifyEmail,
};
