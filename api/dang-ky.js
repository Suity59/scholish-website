const {
  DEPOSIT_VND,
  BANK,
  DATABASE_ID,
  PROP,
  TRANG_THAI,
  generateOrderCode,
  sepayQrUrl,
  notionClient,
  rateLimit,
  clientIp,
  notifyEmail,
} = require('./_lib');

/** Các mức điểm hợp lệ — khớp option multi_select trong Notion. */
const MUC_DIEM = ['550-600', '600-650', '>700'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!process.env.NOTION_TOKEN) {
    console.error('[dang-ky] thiếu NOTION_TOKEN');
    return res.status(500).json({ error: 'server_config' });
  }

  // Học viên có thể sửa thông tin rồi gửi lại vài lần trước khi chuyển khoản.
  if (!rateLimit(`dangky:${clientIp(req)}`, { max: 12, windowMs: 60 * 60 * 1000 })) {
    return res.status(429).json({ error: 'ratelimit' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!body) return res.status(400).json({ error: 'bad_json' });

  const ten = text(body.ten, 120);
  const email = text(body.email, 160).toLowerCase();
  const zalo = text(body.zalo, 40);
  const khoa = text(body.khoa, 120);
  const thoiDiemThi = text(body.thoiDiemThi, 120);
  const diemHienTai = text(body.diemHienTai, 200);
  const diemMongMuon = Array.isArray(body.diemMongMuon)
    ? body.diemMongMuon.filter((d) => MUC_DIEM.includes(d))
    : [];

  if (!ten) return res.status(400).json({ error: 'thieu_ten' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'email_khong_hop_le' });
  if (!zalo) return res.status(400).json({ error: 'thieu_zalo' });
  if (!diemMongMuon.length) return res.status(400).json({ error: 'thieu_muc_diem' });

  const code = generateOrderCode();
  const notion = notionClient();

  try {
    await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        [PROP.ten]: { title: [{ text: { content: ten } }] },
        [PROP.email]: { email },
        [PROP.zalo]: { phone_number: zalo },
        [PROP.khoa]: { rich_text: [{ text: { content: khoa || 'GMAT Trứng Rán' } }] },
        [PROP.thoiDiemThi]: { rich_text: [{ text: { content: thoiDiemThi } }] },
        [PROP.diemMongMuon]: { multi_select: diemMongMuon.map((name) => ({ name })) },
        [PROP.diemHienTai]: { rich_text: [{ text: { content: diemHienTai } }] },
        [PROP.maDon]: { rich_text: [{ text: { content: code } }] },
        [PROP.trangThai]: { select: { name: TRANG_THAI.cho } },
        [PROP.soTien]: { number: DEPOSIT_VND },
        [PROP.daNhan]: { number: 0 },
      },
    });
  } catch (err) {
    console.error('[dang-ky] tạo page Notion lỗi:', err.body || err.message);
    return res.status(502).json({ error: 'notion_error' });
  }

  // Báo ngay khi có người điền form, chưa cần đợi chuyển khoản — nhiều bạn
  // điền xong mới đi hỏi thêm, Nam Anh chủ động nhắn Zalo được sớm.
  await notifyEmail(
    `Đăng ký mới: ${ten} · ${khoa || 'GMAT Trứng Rán'} (${code})`,
    [
      `Tên: ${ten}`,
      `Email: ${email}`,
      `Zalo: ${zalo}`,
      `Khóa: ${khoa || 'GMAT Trứng Rán'}`,
      `Thời điểm thi: ${thoiDiemThi || '—'}`,
      `Mục tiêu: ${diemMongMuon.join(', ')}`,
      `Điểm hiện tại: ${diemHienTai || '—'}`,
      '',
      `Mã đơn: ${code} — chờ chuyển khoản ${DEPOSIT_VND.toLocaleString('vi-VN')}đ`,
    ].join('\n')
  );

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
