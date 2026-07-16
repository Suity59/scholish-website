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
