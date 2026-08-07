const {
  DEPOSIT_VND,
  BANK,
  ORDER_CODE_REGEX,
  generateOrderCode,
  sepayQrUrl,
  rateLimit,
  clientIp,
} = require('./_lib');

/**
 * Cấp mã đơn + QR NGAY khi học viên mở popup — chưa ghi gì lên Notion.
 *
 * QR chỉ cần số tiền và nội dung chuyển khoản, không cần biết người quét là ai,
 * nên không có lý do gì bắt điền hết form mới cho thấy. Trang Notion được tạo
 * lúc học viên bấm gửi thông tin (/api/dang-ky, mang theo đúng mã này), hoặc do
 * webhook dựng tạm nếu tiền về trước — nhờ vậy mở popup rồi đóng luôn không để
 * lại rác trong bảng đăng ký.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  // Mã là thứ rẻ (không đụng Notion), nhưng vẫn chặn bấm phá từ một máy.
  if (!rateLimit(`madon:${clientIp(req)}`, { max: 20, windowMs: 60 * 60 * 1000 })) {
    return res.status(429).json({ error: 'ratelimit' });
  }

  // Popup gửi lại mã đã lưu trong localStorage: đóng rồi mở lại vẫn ra đúng QR
  // cũ, để học viên quét trước rồi quay lại điền form thì tiền vẫn khớp đơn.
  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  const codeCu = String((body && body.code) || '').trim().toUpperCase();
  const code =
    ORDER_CODE_REGEX.test(codeCu) && codeCu.length === 9 ? codeCu : generateOrderCode();

  return res.status(200).json({
    code,
    amountVnd: DEPOSIT_VND,
    qrUrl: sepayQrUrl(DEPOSIT_VND, code),
    bank: { name: BANK.name, acc: BANK.acc, owner: BANK.owner },
  });
};

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
