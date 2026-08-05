const {
  DEPOSIT_VND,
  PROP,
  TRANG_THAI,
  ORDER_CODE_REGEX,
  notionClient,
  findPageByCode,
  notifyEmail,
} = require('./_lib');

/**
 * Webhook SePay — bắn khi TPBank có biến động số dư.
 *
 * Luôn trả {success:true} với giao dịch không liên quan (đơn của hoc.namanhsuit
 * đi cùng tài khoản này) để SePay khỏi retry vô ích. Chỉ trả lỗi khi auth sai
 * hoặc lỗi hệ thống thật, lúc đó retry mới có ích.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const expected = `Apikey ${process.env.SEPAY_WEBHOOK_API_KEY}`;
  if (!process.env.SEPAY_WEBHOOK_API_KEY || req.headers.authorization !== expected) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const payload = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!payload) return res.status(400).json({ error: 'bad_json' });

  // Chỉ quan tâm tiền vào.
  if (payload.transferType !== 'in') return res.status(200).json({ success: true });

  const haystack = [payload.code, payload.content, payload.description]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();
  const match = haystack.match(ORDER_CODE_REGEX);
  // Không có mã SCH — nhiều khả năng là đơn HOC của hệ e-learning, bỏ qua.
  if (!match) return res.status(200).json({ success: true });

  const code = match[0];
  const notion = notionClient();

  let page;
  try {
    page = await findPageByCode(notion, code);
  } catch (err) {
    console.error('[sepay] query Notion lỗi:', err.body || err.message);
    return res.status(500).json({ error: 'notion_error' });
  }

  if (!page) {
    console.log(`[sepay] không tìm thấy đơn ${code} (tx ${payload.id})`);
    return res.status(200).json({ success: true });
  }

  const trangThaiHienTai = page.properties[PROP.trangThai]?.select?.name;
  // SePay retry hoặc webhook trùng — đã xử lý rồi.
  if (trangThaiHienTai === TRANG_THAI.xong) {
    return res.status(200).json({ success: true });
  }

  const soTienCanThu = page.properties[PROP.soTien]?.number ?? DEPOSIT_VND;
  const thieu = Number(payload.transferAmount) < soTienCanThu;
  const ten = page.properties[PROP.ten]?.title?.[0]?.plain_text || '(không rõ tên)';

  try {
    await notion.pages.update({
      page_id: page.id,
      properties: {
        [PROP.trangThai]: {
          select: { name: thieu ? TRANG_THAI.thieu : TRANG_THAI.xong },
        },
        [PROP.thoiDiemTT]: { date: { start: new Date().toISOString() } },
        [PROP.soTien]: { number: Number(payload.transferAmount) },
      },
    });
  } catch (err) {
    console.error('[sepay] cập nhật Notion lỗi:', err.body || err.message);
    return res.status(500).json({ error: 'notion_error' });
  }

  await notifyEmail(
    thieu
      ? `Chuyển THIẾU: ${ten} (${code})`
      : `Đã giữ chỗ: ${ten} (${code})`,
    [
      `Mã đơn: ${code}`,
      `Học viên: ${ten}`,
      `Nhận được: ${Number(payload.transferAmount).toLocaleString('vi-VN')}đ`,
      `Cần thu: ${soTienCanThu.toLocaleString('vi-VN')}đ`,
      thieu ? '\n>>> Chuyển thiếu, cần xử lý tay.' : '',
    ].join('\n')
  );

  console.log(`[sepay] đơn ${code}: ${thieu ? 'chuyển thiếu' : 'đã giữ chỗ'} (tx ${payload.id})`);
  return res.status(200).json({ success: true });
};

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
