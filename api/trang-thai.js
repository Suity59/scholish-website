const {
  PROP,
  TRANG_THAI,
  ORDER_CODE_REGEX,
  notionClient,
  findPageByCode,
  rateLimit,
  clientIp,
} = require('./_lib');

/**
 * Form đang mở QR sẽ poll endpoint này vài giây một lần để biết tiền đã về chưa.
 * Chỉ trả đúng trạng thái, không trả thông tin cá nhân — mã đơn có thể lọt ra
 * ngoài (nằm trong nội dung CK) nên không dùng nó làm khóa đọc dữ liệu.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const code = String(req.query.code || '').toUpperCase();
  if (!ORDER_CODE_REGEX.test(code) || code.length !== 9) {
    return res.status(400).json({ error: 'ma_don_khong_hop_le' });
  }

  // Poll 3s/lần trong 15 phút là 300 request — cho dư một chút.
  if (!rateLimit(`trangthai:${clientIp(req)}`, { max: 400, windowMs: 60 * 60 * 1000 })) {
    return res.status(429).json({ error: 'ratelimit' });
  }

  try {
    const page = await findPageByCode(notionClient(), code);
    // 404 là chuyện BÌNH THƯỜNG ở luồng QR-first: mã được cấp lúc mở popup,
    // trang Notion chỉ ra đời khi học viên gửi form hoặc khi tiền về. Popup cứ
    // poll tiếp chứ đừng coi là lỗi.
    if (!page) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({
        code,
        trangThai: TRANG_THAI.cho,
        daThanhToan: false,
        coThongTin: false,
      });
    }

    const trangThai = page.properties[PROP.trangThai]?.select?.name || TRANG_THAI.cho;
    // Trang do webhook dựng tạm chưa có email — popup dựa vào đây để biết còn
    // phải xin thông tin học viên hay đã xong xuôi.
    const coThongTin = !!page.properties[PROP.email]?.email;
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      code,
      trangThai,
      daThanhToan: trangThai === TRANG_THAI.xong,
      coThongTin,
    });
  } catch (err) {
    console.error('[trang-thai] lỗi:', err.body || err.message);
    return res.status(502).json({ error: 'notion_error' });
  }
};
