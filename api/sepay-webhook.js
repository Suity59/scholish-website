const {
  DEPOSIT_VND,
  DATABASE_ID,
  PROP,
  TRANG_THAI,
  ORDER_CODE_REGEX,
  notionClient,
  findPageByCode,
  safeEqual,
  notifyEmail,
} = require('./_lib');

/**
 * Webhook SePay — bắn khi tài khoản nhận tiền (MBBank) có biến động số dư.
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
  if (!process.env.SEPAY_WEBHOOK_API_KEY || !safeEqual(req.headers.authorization || '', expected)) {
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

  // Mã SCH hợp lệ mà chưa có trang: học viên quét QR (hiện sẵn từ lúc mở
  // popup) rồi chuyển tiền trước khi kịp điền form. Dựng trang tạm để tiền
  // không rơi vào hư không — form gửi sau sẽ điền thẳng vào trang này.
  if (!page) {
    const soTien = Number(payload.transferAmount);
    const duTam = soTien >= DEPOSIT_VND;
    try {
      await notion.pages.create({
        parent: { database_id: DATABASE_ID },
        properties: {
          [PROP.ten]: { title: [{ text: { content: '(Chưa có thông tin)' } }] },
          [PROP.maDon]: { rich_text: [{ text: { content: code } }] },
          [PROP.trangThai]: {
            select: { name: duTam ? TRANG_THAI.xong : TRANG_THAI.thieu },
          },
          [PROP.soTien]: { number: DEPOSIT_VND },
          [PROP.daNhan]: { number: soTien },
          [PROP.maGiaoDich]: { rich_text: [{ text: { content: String(payload.id) } }] },
          [PROP.thoiDiemTT]: { date: { start: new Date().toISOString() } },
        },
      });
    } catch (err) {
      console.error('[sepay] tạo page tạm lỗi:', err.body || err.message);
      return res.status(500).json({ error: 'notion_error' });
    }

    await notifyEmail(`Tiền về nhưng CHƯA có thông tin: ${code}`, [
      `Mã đơn: ${code}`,
      `Nhận: ${soTien.toLocaleString('vi-VN')}đ / ${DEPOSIT_VND.toLocaleString('vi-VN')}đ`,
      `Giao dịch SePay: ${payload.id}`,
      '',
      'Học viên quét QR trước khi điền form. Nếu popup còn mở thì họ điền xong là',
      'thông tin tự đắp vào đúng trang này.',
      '>>> Họ đóng tab mất rồi thì tra sao kê để biết ai chuyển, rồi liên hệ tay.',
    ].join('\n'));

    console.log(`[sepay] đơn ${code}: tạo page tạm, chờ học viên điền form (tx ${payload.id})`);
    return res.status(200).json({ success: true });
  }

  // Danh sách giao dịch đã cộng vào đơn này. SePay gửi lại tối đa 7 lần khi
  // server báo lỗi, nên phải chặn theo id giao dịch — nếu không mỗi lần gửi lại
  // là cộng thêm một lần nữa vào tổng.
  const txCu = (page.properties[PROP.maGiaoDich]?.rich_text || [])
    .map((t) => t.plain_text ?? t.text?.content ?? '')
    .join('')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const txId = String(payload.id);
  if (txCu.includes(txId)) {
    console.log(`[sepay] giao dịch ${txId} đã cộng vào ${code} rồi, bỏ qua`);
    return res.status(200).json({ success: true });
  }

  const soTienCanThu = page.properties[PROP.soTien]?.number ?? DEPOSIT_VND;
  const daNhanTruoc = page.properties[PROP.daNhan]?.number ?? 0;
  const daNhan = daNhanTruoc + Number(payload.transferAmount);
  const du = daNhan >= soTienCanThu;
  const ten = page.properties[PROP.ten]?.title?.[0]?.plain_text || '(không rõ tên)';

  try {
    await notion.pages.update({
      page_id: page.id,
      properties: {
        [PROP.trangThai]: {
          select: { name: du ? TRANG_THAI.xong : TRANG_THAI.thieu },
        },
        [PROP.daNhan]: { number: daNhan },
        [PROP.maGiaoDich]: {
          rich_text: [{ text: { content: [...txCu, txId].join(', ').slice(0, 1900) } }],
        },
        [PROP.thoiDiemTT]: { date: { start: new Date().toISOString() } },
      },
    });
  } catch (err) {
    console.error('[sepay] cập nhật Notion lỗi:', err.body || err.message);
    return res.status(500).json({ error: 'notion_error' });
  }

  const lanNay = Number(payload.transferAmount).toLocaleString('vi-VN');
  await notifyEmail(
    du ? `Đã giữ chỗ: ${ten} (${code})` : `Chuyển THIẾU: ${ten} (${code})`,
    [
      `Mã đơn: ${code}`,
      `Học viên: ${ten}`,
      `Lần này nhận: ${lanNay}đ`,
      `Tổng đã nhận: ${daNhan.toLocaleString('vi-VN')}đ / ${soTienCanThu.toLocaleString('vi-VN')}đ`,
      du ? '' : `\n>>> Còn thiếu ${(soTienCanThu - daNhan).toLocaleString('vi-VN')}đ.`,
    ].join('\n')
  );

  console.log(
    `[sepay] đơn ${code}: +${lanNay}đ, tổng ${daNhan}/${soTienCanThu} — ` +
      `${du ? 'đã giữ chỗ' : 'còn thiếu'} (tx ${txId})`
  );
  return res.status(200).json({ success: true });
};

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
