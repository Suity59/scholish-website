// Scholish — tương tác tối thiểu theo luật design system:
// entry animation 1 lần qua IntersectionObserver, FAQ accordion, mobile nav, quiz widget.

(function () {
  // Mobile nav
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      nav.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Tất cả CTA Zalo mở cùng một danh thiếp QR; link trực tiếp và số điện thoại
  // vẫn được giữ trong popup để người dùng chọn cách liên hệ thuận tiện nhất.
  (function setupZaloConsultDialog() {
    var triggers = document.querySelectorAll('a[href="https://zalo.me/0963557153"]');
    if (!triggers.length || typeof HTMLDialogElement === 'undefined') return;

    var dialog = document.createElement('dialog');
    dialog.className = 'zalo-dialog';
    dialog.id = 'zaloConsultDialog';
    dialog.setAttribute('aria-labelledby', 'zaloDialogTitle');
    dialog.innerHTML = [
      '<div class="zalo-dialog__shell">',
      '  <button class="zalo-dialog__close" type="button" data-zalo-close aria-label="Đóng cửa sổ tư vấn">×</button>',
      '  <div class="zalo-dialog__copy">',
      '    <span class="microcaps">Tư vấn cùng Scholish</span>',
      '    <h2 id="zaloDialogTitle">Kết nối với Nam Anh qua Zalo</h2>',
      '    <p>Quét mã bằng camera hoặc ứng dụng Zalo để trao đổi trực tiếp về mục tiêu, lịch học và khóa học phù hợp với bạn.</p>',
      '    <div class="zalo-dialog__contact">',
      '      <span>Số điện thoại / Zalo</span>',
      '      <a class="num" href="tel:0963557153">096 355 71 53</a>',
      '    </div>',
      '    <a class="btn btn--primary" href="https://zalo.me/0963557153" target="_blank" rel="noopener">Mở Zalo trực tiếp</a>',
      '  </div>',
      '  <div class="zalo-dialog__qr">',
      '    <img src="assets/zalo-le-nam-anh.jpg" alt="Mã QR Zalo của Lê Nam Anh">',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(dialog);

    var closeButton = dialog.querySelector('[data-zalo-close]');
    var activeTrigger = null;

    triggers.forEach(function (trigger) {
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-controls', 'zaloConsultDialog');
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        activeTrigger = trigger;
        if (links) links.classList.remove('is-open');
        if (nav) nav.classList.remove('menu-open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.add('has-open-dialog');
        dialog.showModal();
        dialog.scrollTop = 0;
        closeButton.focus({ preventScroll: true });
      });
    });

    closeButton.addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function () {
      document.body.classList.remove('has-open-dialog');
      if (activeTrigger) activeTrigger.focus();
      activeTrigger = null;
    });
  })();

  // FAQ accordion
  document.querySelectorAll('.faq__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq__item');
      var open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  // Quiz widget (câu hỏi mẫu trên trang khóa học)
  document.querySelectorAll('[data-quiz]').forEach(function (quiz) {
    var opts = quiz.querySelectorAll('.quiz__opt');
    var result = quiz.querySelector('.quiz__result');
    opts.forEach(function (opt) {
      opt.addEventListener('click', function () {
        if (quiz.classList.contains('is-done')) return;
        quiz.classList.add('is-done');
        var correct = opt.hasAttribute('data-correct');
        opt.classList.add(correct ? 'is-correct' : 'is-wrong');
        if (!correct) {
          var right = quiz.querySelector('.quiz__opt[data-correct]');
          if (right) right.classList.add('is-correct');
        }
        quiz.classList.add(correct ? 'anim-right' : 'anim-wrong');
        opts.forEach(function (o) { o.disabled = true; });
        if (result) result.classList.add('is-open');
      });
    });
  });

  // ScholishBank: chuyển giữa cách giải, bẫy đáp án và điều cần nhớ.
  document.querySelectorAll('.bank-tabs').forEach(function (tabList) {
    var tabs = tabList.querySelectorAll('[data-bank-tab]');
    var answer = tabList.closest('.bank-explanation__answer');
    if (!answer) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (item) {
          item.setAttribute('aria-selected', item === tab ? 'true' : 'false');
        });
        answer.querySelectorAll('.bank-tab-panel').forEach(function (panel) {
          panel.hidden = panel.id !== 'bank-' + tab.getAttribute('data-bank-tab');
        });
      });
    });
  });

  // Marquee reviews: nhân đôi track để vòng lặp liền mạch, rồi bật animation.
  // Nếu reduced-motion thì giữ nguyên — CSS chuyển thành dải cuộn tay.
  // PHẢI chạy TRƯỚC avatar loader: innerHTML += thay toàn bộ node của track,
  // loader chạy sau mới bám vào node mới (cả bản gốc lẫn bản nhân đôi).
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.marquee').forEach(function (mq) {
    if (reduced) return;
    var track = mq.querySelector('.marquee__track');
    if (!track || track.children.length === 0) return;
    track.innerHTML += track.innerHTML;
    mq.classList.add('is-ready');
  });

  // Avatar thật cho feedback: phần tử [data-avatar="slug"] tự nạp assets/avatars/slug.jpg
  // nếu file tồn tại — thêm ảnh mới chỉ cần thả file vào folder, không cần sửa HTML.
  document.querySelectorAll('[data-avatar]').forEach(function (el) {
    var slug = el.getAttribute('data-avatar');
    if (!slug) return;
    var img = new Image();
    img.alt = '';
    img.onload = function () { el.textContent = ''; el.appendChild(img); };
    img.src = 'assets/avatars/' + slug + '.jpg';
  });

  // Hai lớp khai giảng gần nhất:
  // - luôn lấy tháng kế tiếp và tháng sau nữa, nên chỉ đổi khi bước sang tháng mới
  // - tháng chẵn học Thứ Tư + Chủ nhật
  // - tháng lẻ học Thứ Ba + Thứ Bảy
  // - khai giảng vào buổi học đầu tiên của tháng
  (function renderUpcomingClasses() {
    var cards = document.querySelectorAll('[data-upcoming-class]');
    if (!cards.length) return;

    var now = new Date();
    var currentYear = now.getFullYear();
    var currentMonthIndex = now.getMonth();

    try {
      var vietnamParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      }).formatToParts(now);
      vietnamParts.forEach(function (part) {
        if (part.type === 'year') currentYear = parseInt(part.value, 10);
        if (part.type === 'month') currentMonthIndex = parseInt(part.value, 10) - 1;
      });
    } catch (err) {
      // Trình duyệt cũ sẽ dùng tháng theo múi giờ của thiết bị.
    }

    var weekdayNames = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

    function pad(value) {
      return value < 10 ? '0' + value : String(value);
    }

    function classForOffset(offset) {
      var monthTotal = (currentYear * 12) + currentMonthIndex + offset;
      var year = Math.floor(monthTotal / 12);
      var monthIndex = monthTotal % 12;
      var monthNumber = monthIndex + 1;
      var evenMonth = monthNumber % 2 === 0;
      var studyDays = evenMonth ? [3, 0] : [2, 6];
      var schedule = evenMonth ? 'Thứ Tư và Chủ nhật' : 'Thứ Ba và Thứ Bảy';
      var startDay = 1;

      for (var day = 1; day <= 7; day += 1) {
        var weekday = new Date(Date.UTC(year, monthIndex, day)).getUTCDay();
        if (studyDays.indexOf(weekday) !== -1) {
          startDay = day;
          break;
        }
      }

      var startDate = new Date(Date.UTC(year, monthIndex, startDay));
      var startWeekday = weekdayNames[startDate.getUTCDay()];
      var earlyBirdDate = new Date(startDate.getTime() - (20 * 24 * 60 * 60 * 1000));
      var earlyBirdDay = earlyBirdDate.getUTCDate();
      var earlyBirdMonth = earlyBirdDate.getUTCMonth() + 1;
      var earlyBirdYear = earlyBirdDate.getUTCFullYear();
      var earlyBirdDateLabel = pad(earlyBirdDay) + '/' + pad(earlyBirdMonth) + '/' + earlyBirdYear;
      // Ưu đãi còn hiệu lực đến hết ngày Early Bird theo giờ Việt Nam (UTC+7).
      var earlyBirdDeadline = Date.UTC(earlyBirdYear, earlyBirdMonth - 1, earlyBirdDay, 16, 59, 59);

      return {
        monthLabel: monthNumber + '/' + year,
        schedule: schedule,
        dateTime: year + '-' + pad(monthNumber) + '-' + pad(startDay),
        startLabel: startWeekday + ', ' + pad(startDay) + '/' + pad(monthNumber) + '/' + year,
        earlyBirdDeadline: earlyBirdDeadline,
        earlyBirdDateTime: earlyBirdYear + '-' + pad(earlyBirdMonth) + '-' + pad(earlyBirdDay),
        earlyBirdDateLabel: earlyBirdDateLabel
      };
    }

    function setCountdownValue(container, selector, value) {
      var element = container.querySelector(selector);
      if (element) element.textContent = pad(value);
    }

    function updateCountdown(container) {
      var deadline = parseInt(container.getAttribute('data-deadline'), 10);
      var status = container.querySelector('[data-countdown-status]');
      var dateLabel = container.getAttribute('data-date-label');
      var dateTime = container.getAttribute('data-date-time');
      var remaining = deadline - Date.now();

      function updateStatus(prefix) {
        if (!status) return;
        var time = document.createElement('time');
        time.textContent = dateLabel;
        time.setAttribute('datetime', dateTime);
        status.textContent = prefix;
        status.appendChild(time);
      }

      if (!deadline || remaining <= 0) {
        container.classList.add('is-ended');
        updateStatus('Đã kết thúc ngày ');
        return true;
      }

      container.classList.remove('is-ended');
      var totalSeconds = Math.floor(remaining / 1000);
      var days = Math.floor(totalSeconds / 86400);
      var hours = Math.floor((totalSeconds % 86400) / 3600);
      var minutes = Math.floor((totalSeconds % 3600) / 60);
      var seconds = totalSeconds % 60;

      setCountdownValue(container, '[data-countdown-days]', days);
      setCountdownValue(container, '[data-countdown-hours]', hours);
      setCountdownValue(container, '[data-countdown-minutes]', minutes);
      setCountdownValue(container, '[data-countdown-seconds]', seconds);
      updateStatus('Hết hạn lúc 23:59 ngày ');
      return false;
    }

    cards.forEach(function (card, index) {
      var classInfo = classForOffset(index + 1);
      var month = card.querySelector('[data-upcoming-month]');
      var start = card.querySelector('[data-upcoming-start]');
      var schedule = card.querySelector('[data-upcoming-schedule]');
      var earlyBird = card.querySelector('[data-upcoming-early-bird]');

      if (month) month.textContent = classInfo.monthLabel;
      if (start) {
        start.textContent = classInfo.startLabel;
        start.setAttribute('datetime', classInfo.dateTime);
      }
      if (schedule) schedule.textContent = classInfo.schedule;
      if (earlyBird) {
        var earlyBirdDate = earlyBird.querySelector('[data-early-bird-date]');
        earlyBird.setAttribute('data-deadline', classInfo.earlyBirdDeadline);
        earlyBird.setAttribute('data-date-label', classInfo.earlyBirdDateLabel);
        earlyBird.setAttribute('data-date-time', classInfo.earlyBirdDateTime);
        if (earlyBirdDate) {
          earlyBirdDate.textContent = classInfo.earlyBirdDateLabel;
          earlyBirdDate.setAttribute('datetime', classInfo.earlyBirdDateTime);
        }
        updateCountdown(earlyBird);
      }
    });

    var countdownTimer = window.setInterval(function () {
      var allEnded = true;
      cards.forEach(function (card) {
        var earlyBird = card.querySelector('[data-upcoming-early-bird]');
        if (earlyBird && !updateCountdown(earlyBird)) allEnded = false;
      });
      if (allEnded) window.clearInterval(countdownTimer);
    }, 1000);
  })();

  // Số năm kinh nghiệm được tính từ năm bắt đầu và tự cập nhật theo năm tại Việt Nam.
  function updateExperienceYears(root) {
    var currentYear = new Date().getFullYear();

    try {
      var vietnamYear = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric'
      }).format(new Date());
      currentYear = parseInt(vietnamYear, 10);
    } catch (err) {
      // Trình duyệt cũ sẽ dùng năm theo múi giờ của thiết bị.
    }

    root.querySelectorAll('[data-years-since]').forEach(function (element) {
      var startYear = parseInt(element.getAttribute('data-years-since'), 10);
      if (!startYear || startYear > currentYear) return;
      element.textContent = currentYear - startYear;
    });
  }

  updateExperienceYears(document);

  // High Achievers: mở trọn bài viết ngay trên website.
  (function setupAchieverStories() {
    var dialog = document.getElementById('achieverDialog');
    var content = dialog ? dialog.querySelector('[data-achiever-content]') : null;
    var closeButton = dialog ? dialog.querySelector('[data-achiever-close]') : null;
    var triggers = document.querySelectorAll('[data-achiever-post]');
    var moreButton = document.querySelector('[data-achiever-more]');
    var extraStories = document.querySelectorAll('[data-achiever-extra]');
    var activeTrigger = null;

    if (!dialog || !content || !closeButton || !triggers.length) return;

    function openPost(trigger) {
      var templateId = trigger.getAttribute('data-achiever-post');
      var template = templateId ? document.getElementById(templateId) : null;
      if (!template) return;

      activeTrigger = trigger;
      content.textContent = '';
      content.appendChild(template.content.cloneNode(true));
      document.body.classList.add('has-open-dialog');
      dialog.showModal();
      closeButton.focus();
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        openPost(trigger);
      });
    });

    if (moreButton && extraStories.length) {
      moreButton.addEventListener('click', function () {
        var expanded = moreButton.getAttribute('aria-expanded') === 'true';
        extraStories.forEach(function (story) {
          story.hidden = expanded;
        });
        moreButton.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        moreButton.textContent = expanded ? 'Xem thêm các câu chuyện khác' : 'Thu gọn';
      });
    }

    closeButton.addEventListener('click', function () {
      dialog.close();
    });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', function () {
      document.body.classList.remove('has-open-dialog');
      content.textContent = '';
      if (activeTrigger) activeTrigger.focus();
      activeTrigger = null;
    });
  })();

  // Popup đăng ký GMAT dùng chung cho homepage và trang khóa học.
  //
  // Form chạy thẳng trên site (không nhúng Notion nữa — bộ nhúng đó kéo ~35MB JS
  // và làm sập tab trên trình duyệt in-app của Facebook). Submit gọi /api/dang-ky
  // để ghi Notion + lấy QR SePay đã điền sẵn số tiền và nội dung CK, rồi poll
  // /api/trang-thai tới khi webhook SePay xác nhận tiền về.
  (function setupGmatEnrollmentDialog() {
    var dialog = document.getElementById('gmatEnrollDialog');
    var triggers = document.querySelectorAll('[data-gmat-enroll]');
    var closeButton = dialog ? dialog.querySelector('[data-gmat-enroll-close]') : null;
    var selectedClass = dialog ? document.getElementById('gmatEnrollClass') : null;
    var form = dialog ? dialog.querySelector('[data-enroll-form]') : null;
    var activeTrigger = null;
    var pollTimer = null;

    if (!dialog || !closeButton || !triggers.length || typeof HTMLDialogElement === 'undefined') return;

    var q = function (sel) { return dialog.querySelector(sel); };
    var errorBox = q('[data-enroll-error]');
    var submitBtn = q('[data-enroll-submit]');
    var courseInput = q('[data-enroll-course]');
    var payIntro = q('[data-pay-intro]');
    var payQr = q('[data-pay-qr]');
    var payQrImg = q('[data-pay-qr-img]');
    var payInfo = q('[data-pay-info]');
    var payBank = q('[data-pay-bank]');
    var payAcc = q('[data-pay-acc]');
    var payStatus = q('[data-pay-status]');
    var payPaid = q('[data-pay-paid]');

    // Đơn đang hiện QR trên màn hình. Mã do /api/ma-don cấp lúc mở popup và
    // được nhớ trong localStorage: đóng rồi mở lại vẫn là đúng mã đó, học viên
    // lỡ quét trước rồi quay lại điền form thì tiền vẫn khớp đơn.
    var donHienTai = null;
    var dangLayMa = false;
    var STORAGE_KEY = 'scholish-ma-don';

    function money(n) { return Number(n).toLocaleString('vi-VN') + 'đ'; }

    function showError(msg) {
      if (!errorBox) return;
      errorBox.textContent = msg;
      errorBox.hidden = false;
    }
    function clearError() {
      if (errorBox) errorBox.hidden = true;
    }

    var LOI = {
      thieu_ten: 'Bạn điền giúp tên nhé.',
      email_khong_hop_le: 'Email chưa đúng định dạng, bạn kiểm tra lại giúp.',
      thieu_zalo: 'Bạn điền giúp số Zalo để Scholish liên hệ.',
      thieu_muc_diem: 'Bạn chọn giúp ít nhất một mức điểm mong muốn.',
      ratelimit: 'Bạn gửi hơi nhiều lần rồi. Đợi một chút hoặc nhắn Zalo 0963557153 nhé.',
      notion_error: 'Hệ thống đang trục trặc. Bạn nhắn Zalo 0963557153 để Scholish hỗ trợ ngay nhé.',
      server_config: 'Hệ thống đang trục trặc. Bạn nhắn Zalo 0963557153 để Scholish hỗ trợ ngay nhé.'
    };

    function stopPolling() {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }

    // Poll 4s/lần, bỏ cuộc sau 15 phút để khỏi gọi mãi khi học viên bỏ đi.
    function startPolling(code) {
      stopPolling();
      var deadline = Date.now() + 15 * 60 * 1000;
      pollTimer = setInterval(function () {
        if (Date.now() > deadline) { stopPolling(); return; }
        fetch('/api/trang-thai?code=' + encodeURIComponent(code))
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (data) {
            if (!data || !data.daThanhToan) return;
            // Tiền đã về mà trang Notion chưa có email: học viên quét trước khi
            // điền form. Giục điền nốt chứ chưa đóng màn được.
            if (!data.coThongTin) {
              if (payPaid) payPaid.hidden = false;
              if (payQr) payQr.hidden = true;
              if (payStatus) payStatus.hidden = true;
              return;
            }
            stopPolling();
            if (payPaid) payPaid.hidden = true;
            if (payStatus) {
              payStatus.hidden = false;
              payStatus.textContent = 'Đã nhận được chuyển khoản. Scholish sẽ nhắn Zalo xác nhận lớp cho bạn trong hôm nay.';
              payStatus.classList.add('is-paid');
            }
            if (payQr) payQr.hidden = true;
          })
          .catch(function () { /* mạng chập chờn thì lần poll sau thử lại */ });
      }, 4000);
    }

    function showPayment(data) {
      donHienTai = data;
      try { localStorage.setItem(STORAGE_KEY, data.code); } catch (e) {}
      if (payIntro) payIntro.hidden = true;
      if (payQrImg) payQrImg.src = data.qrUrl;
      if (payQr) payQr.hidden = false;
      if (payBank && data.bank) payBank.textContent = data.bank.name || 'MBBank';
      if (payAcc && data.bank) {
        payAcc.textContent = (data.bank.owner || '') + ' · ' + (data.bank.acc || '');
      }
      if (payInfo) payInfo.hidden = false;
      if (payStatus) {
        payStatus.classList.remove('is-paid');
        payStatus.textContent = 'Quét mã để chuyển ' + money(data.amountVnd)
          + ' tiền deposit khóa học — số tiền và nội dung "' + data.code + '" đã được điền sẵn. '
          + 'Nhớ gửi thông tin ở bước 1 để Scholish biết xếp lớp cho ai, admin sẽ liên hệ trong 24h nhé.';
        payStatus.hidden = false;
      }
      startPolling(data.code);
    }

    /** Mở popup là gọi ngay: lấy mã + QR, chưa đụng gì tới Notion. */
    function layMaVaHienQr() {
      if (donHienTai || dangLayMa) {
        if (donHienTai) startPolling(donHienTai.code);
        return;
      }
      dangLayMa = true;
      if (payIntro) { payIntro.hidden = false; payIntro.textContent = 'Đang lấy mã QR giữ chỗ cho bạn…'; }
      var maCu = null;
      try { maCu = localStorage.getItem(STORAGE_KEY); } catch (e) {}
      fetch('/api/ma-don', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: maCu || undefined })
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          dangLayMa = false;
          if (!data || !data.code) {
            if (payIntro) payIntro.textContent = 'Chưa lấy được mã QR. Bạn thử đóng rồi mở lại, hoặc nhắn Zalo 0963557153 nhé.';
            return;
          }
          showPayment(data);
        })
        .catch(function () {
          dangLayMa = false;
          if (payIntro) payIntro.textContent = 'Chưa lấy được mã QR. Bạn kiểm tra mạng rồi thử lại, hoặc nhắn Zalo 0963557153 nhé.';
        });
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        clearError();

        var fd = new FormData(form);
        var payload = {
          ten: String(fd.get('ten') || '').trim(),
          email: String(fd.get('email') || '').trim(),
          zalo: String(fd.get('zalo') || '').trim(),
          khoa: String(fd.get('khoa') || '').trim(),
          thoiDiemThi: String(fd.get('thoiDiemThi') || '').trim(),
          diemHienTai: String(fd.get('diemHienTai') || '').trim(),
          diemMongMuon: fd.getAll('diemMongMuon').map(String),
          // Mã của QR đang hiện trên màn hình — Notion phải ghi đúng nó.
          code: donHienTai ? donHienTai.code : undefined
        };

        if (!payload.ten) return showError(LOI.thieu_ten);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return showError(LOI.email_khong_hop_le);
        if (!payload.zalo) return showError(LOI.thieu_zalo);
        if (!payload.diemMongMuon.length) return showError(LOI.thieu_muc_diem);

        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang gửi...';

        fetch('/api/dang-ky', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b }; }); })
          .then(function (res) {
            if (!res.ok) throw new Error(res.body && res.body.error);
            // QR đã hiện sẵn từ lúc mở popup — chỉ khi server đổi mã (mã cũ
            // hỏng) mới phải vẽ lại, còn không thì giữ nguyên màn hình.
            if (!donHienTai || res.body.code !== donHienTai.code) showPayment(res.body);
            if (payPaid) payPaid.hidden = true;
            submitBtn.textContent = 'Đã gửi thông tin ✓';
            form.querySelector('[name="ten"]').blur();
          })
          .catch(function (err) {
            showError(LOI[err.message] || 'Không gửi được đăng ký. Bạn thử lại hoặc nhắn Zalo 0963557153 nhé.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gửi thông tin giữ chỗ';
          });
      });
    }

    triggers.forEach(function (trigger) {
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.addEventListener('click', function (event) {
        var card = trigger.closest('[data-upcoming-class]');
        var month = card ? card.querySelector('[data-upcoming-month]') : null;
        var tenLop = 'GMAT Trứng Rán · ' + (month ? month.textContent.trim() : 'sắp khai giảng');
        event.preventDefault();
        activeTrigger = trigger;
        if (selectedClass) selectedClass.textContent = 'Bạn đang giữ chỗ lớp ' + tenLop;
        if (courseInput) courseInput.value = tenLop;
        document.body.classList.add('has-open-dialog');
        dialog.showModal();
        // QR-first: có mã và QR ngay, học viên quét được luôn rồi mới điền form.
        layMaVaHienQr();
        dialog.scrollTop = 0;
        closeButton.focus({ preventScroll: true });
        window.requestAnimationFrame(function () { dialog.scrollTop = 0; });
      });
    });

    // Dừng poll ở cả ba đường đóng thay vì chỉ dựa vào sự kiện 'close', để nếu
    // một trình duyệt nào đó không phát event thì cũng không còn timer chạy ngầm.
    closeButton.addEventListener('click', function () { stopPolling(); dialog.close(); });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) { stopPolling(); dialog.close(); }
    });
    dialog.addEventListener('cancel', function () { stopPolling(); });
    dialog.addEventListener('close', function () {
      stopPolling();
      document.body.classList.remove('has-open-dialog');
      if (activeTrigger) activeTrigger.focus();
      activeTrigger = null;
    });
  })();

  // Đội ngũ giảng viên: mở hồ sơ chi tiết ngay trên homepage.
  (function setupTeacherProfiles() {
    var dialog = document.getElementById('facultyDialog');
    var content = dialog ? dialog.querySelector('[data-teacher-content]') : null;
    var closeButton = dialog ? dialog.querySelector('[data-teacher-close]') : null;
    var triggers = document.querySelectorAll('[data-teacher-profile]');
    var activeTrigger = null;

    if (!dialog || !content || !closeButton || !triggers.length) return;

    function openProfile(trigger) {
      var templateId = trigger.getAttribute('data-teacher-profile');
      var template = templateId ? document.getElementById(templateId) : null;
      if (!template) return;

      activeTrigger = trigger;
      content.textContent = '';
      content.appendChild(template.content.cloneNode(true));
      updateExperienceYears(content);
      document.body.classList.add('has-open-dialog');
      dialog.showModal();
      closeButton.focus();
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        openProfile(trigger);
      });
    });

    closeButton.addEventListener('click', function () {
      dialog.close();
    });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', function () {
      document.body.classList.remove('has-open-dialog');
      content.textContent = '';
      if (activeTrigger) activeTrigger.focus();
      activeTrigger = null;
    });
  })();

  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduced && 'IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        countObserver.unobserve(el);
        var target = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(target)) return;
        var t0 = null, dur = 900;
        function tick(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          // ease-out để số "hãm" lại ở cuối
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        // chốt an toàn: nếu rAF bị throttle (tab nền), vẫn về đúng số cuối
        setTimeout(function () { el.textContent = target; }, dur + 250);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countObserver.observe(el); });
  }

  // Entry reveal — fade + slide-up 13px, stagger nhẹ, chỉ chạy 1 lần
  var items = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var siblings = Array.prototype.filter.call(
        el.parentElement ? el.parentElement.children : [],
        function (c) { return c.classList && c.classList.contains('reveal') && !c.classList.contains('is-visible'); }
      );
      var idx = siblings.indexOf(el);
      setTimeout(function () { el.classList.add('is-visible'); }, Math.max(0, idx) * 80);
      observer.unobserve(el);
    });
  }, { threshold: 0.12 });
  items.forEach(function (el) { observer.observe(el); });
})();
