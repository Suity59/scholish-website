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
  // - tháng lẻ học Thứ Ba + Thứ Năm
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
      var studyDays = evenMonth ? [3, 0] : [2, 4];
      var schedule = evenMonth ? 'Thứ Tư và Chủ nhật' : 'Thứ Ba và Thứ Năm';
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
      var earlyBirdDate = new Date(startDate.getTime() - (15 * 24 * 60 * 60 * 1000));
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
        moreButton.textContent = expanded ? 'Xem thêm câu chuyện' : 'Thu gọn';
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
