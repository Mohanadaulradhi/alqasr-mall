/* القصر مول الطبي — سكربتات الموقع */
(function () {
  "use strict";

  /* 1) قائمة الجوال */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  var overlay = document.querySelector(".nav-overlay");
  var closeBtn = document.querySelector(".nav-close");

  function closeMenu() {
    if (!nav) return;
    nav.classList.remove("open");
    if (overlay) overlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.add("open");
      if (overlay) overlay.classList.add("show");
      document.body.style.overflow = "hidden";
    });
  }
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  if (overlay) overlay.addEventListener("click", closeMenu);

  /* إغلاق القائمة عند النقر على أي رابط */
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  /* 2) ظل الترويسة عند التمرير */
  var header = document.querySelector(".header");
  var onScroll = function () {
    if (!header) return;
    header.style.boxShadow = window.scrollY > 10 ? "0 4px 18px rgba(8,48,56,0.08)" : "none";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* 3) إظهار العناصر عند التمرير */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* 3.1) شريط الشركات: تكرار البطاقات لحركة لا نهائية انسيابية */
  var companyGrid = document.querySelector(".company-grid");
  if (companyGrid && companyGrid.children.length) {
    Array.prototype.slice.call(companyGrid.children).forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      companyGrid.appendChild(clone);
    });

    /* 3.2) حركة الطابور: البطاقة في وسط الشاشة تنبثق ثم يتحرك الطابور بطاقة واحدة */
    var cards = Array.prototype.slice.call(companyGrid.children);
    var originalCount = cards.length / 2;
    var stepDistance = cards[0].offsetWidth + 20;
    var visibleCount = Math.max(1, Math.floor(window.innerWidth / stepDistance));
    var current = 0;
    var moveDuration = 700;

    companyGrid.style.transition = "transform " + moveDuration + "ms cubic-bezier(.45,0,.3,1)";

    window.addEventListener("resize", function () {
      stepDistance = cards[0].offsetWidth + 20;
      visibleCount = Math.max(1, Math.floor(window.innerWidth / stepDistance));
    });

    setInterval(function () {
      var centerIdx = (current + Math.floor(visibleCount / 2)) % originalCount;
      var card = cards[centerIdx];
      if (card) {
        card.classList.remove("pop");
        void card.offsetWidth;
        card.classList.add("pop");
      }
      current++;
      companyGrid.style.transform = "translateX(" + (current * stepDistance) + "px)";
      if (current >= originalCount) {
        setTimeout(function () {
          companyGrid.style.transition = "none";
          companyGrid.style.transform = "translateX(0px)";
          void companyGrid.offsetWidth;
          companyGrid.style.transition = "transform " + moveDuration + "ms cubic-bezier(.45,0,.3,1)";
        }, moveDuration + 50);
        current = 0;
      }
    }, 1700);
  }

  /* 4) عدّاد الإحصاءات */
  var statEls = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1500;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = Math.round(target * eased).toLocaleString("en") + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (statEls.length && "IntersectionObserver" in window) {
    var statObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statEls.forEach(function (el) { statObserver.observe(el); });
  } else {
    statEls.forEach(function (el) { el.textContent = el.getAttribute("data-count") || ""; });
  }

  /* 5) نموذج النشرة البريدية (توضيحي) */
  var newsletterForms = document.querySelectorAll(".newsletter-form");
  newsletterForms.forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector(".btn");
      var original = btn ? btn.textContent : "";
      if (btn) btn.textContent = "تم الاشتراك ✓";
      setTimeout(function () { if (btn) btn.textContent = original; }, 2600);
      form.reset();
    });
  });

  /* 6) نموذج التواصل: إرسال الرسالة فعليًا عبر واتساب المول */
  var contactForms = document.querySelectorAll("[data-contact-form]");
  contactForms.forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var lines = [];
      var fields = form.querySelectorAll("input, select, textarea");
      Array.prototype.forEach.call(fields, function (inp) {
        var val = (inp.value || "").trim();
        if (!val) return;
        var label = "";
        if (inp.id) {
          var lab = form.querySelector("label[for=\"" + inp.id + "\"]");
          if (lab) label = lab.textContent.trim();
        }
        lines.push(label ? (label + ": " + val) : val);
      });
      var msg = encodeURIComponent(lines.join("\n"));
      window.open("https://wa.me/967779900131?text=" + msg, "_blank", "noopener");
      var success = form.querySelector(".form-success");
      if (success) success.classList.add("show");
      form.reset();
      setTimeout(function () {
        if (success) success.classList.remove("show");
      }, 6000);
    });
  });

  /* 7) السنة الحالية في التذييل */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* 8) الأخبار والفعاليات من فيسبوك وانستقرام: جلب تلقائي وتحديث الشبكات */
  var newsGrids = document.querySelectorAll(".news-grid");
  if (newsGrids.length) {
    function esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
    function cleanText(text, max) {
      var t = String(text || "");
      t = t.replace(/#[\w\u0600-\u06FF]+/g, " ");
      t = t.replace(/(https?:\/\/\S+)/g, " ");
      t = t.replace(/\s+/g, " ").trim();
      if (max && t.length > max) t = t.slice(0, max) + "…";
      return t;
    }
    function detectTag(text) {
      var t = String(text || "");
      if (/(وظائف|توظيف|فرصة عمل|انضمام)/.test(t)) return "توظيف";
      if (/(ندوة|ندوات|محاضرة|symposium)/i.test(t)) return "ندوة علمية";
      if (/(تدريب|ورشة عمل|ورش|تأهيل)/.test(t)) return "تدريب";
      if (/(فعالية|فعاليات|مهرجان|جوائز|هدايا|مباريات)/.test(t)) return "فعاليات";
      if (/(مجتمع|خير|تطوع|تبرع|صحة|عيادة)/.test(t)) return "مجتمع";
      return "منشور";
    }
    function fmtDate(d) {
      try {
        return new Date(d).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch (e) {
        return "";
      }
    }
    function cardHtml(post) {
      var title = esc(post.title || "منشور جديد");
      var desc = esc(cleanText(post.message, 110));
      var tag = esc(detectTag(post.message));
      var date = fmtDate(post.date);
      var source = post.source === "facebook" ? "فيسبوك" : "انستقرام";
      var thumb = post.image
        ? '<div class="news-thumb"><img src="' + esc(post.image) + '" alt="' + title + '" loading="lazy"><span class="tag">' + tag + "</span></div>"
        : '<div class="news-thumb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17H7a5 5 0 0 1 0-10h2"/><path d="M15 7h2a5 5 0 0 1 0 10h-2"/></svg><span class="tag">' + tag + "</span></div>";
      var dateHtml = date
        ? '<span class="news-date"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' + date + " · " + source + "</span>"
        : '<span class="news-date">' + source + "</span>";
      var link = post.url
        ? '<a href="' + esc(post.url) + '" target="_blank" rel="noopener" class="dept-link">عرض المنشور<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></a>'
        : "";
      return (
        '<article class="news-card reveal">' +
        thumb +
        '<div class="news-body">' +
        dateHtml +
        "<h3>" + title + "</h3>" +
        "<p>" + desc + "</p>" +
        link +
        "</div></article>"
      );
    }
    fetch("/api/news")
      .then(function (r) {
        if (!r.ok) throw new Error("bad status");
        return r.json();
      })
      .then(function (data) {
        var posts = (data && data.posts) || [];
        if (!posts.length) return;
        var used = {};
        newsGrids.forEach(function (grid) {
          var html = "";
          posts.forEach(function (post) {
            if (used[post.id]) return;
            used[post.id] = true;
            html += cardHtml(post);
          });
          if (!html) return;
          grid.insertAdjacentHTML("afterbegin", html);
          Array.prototype.forEach.call(grid.querySelectorAll(".reveal"), function (el) {
            if (revealObserver) {
              revealObserver.observe(el);
            } else {
              el.classList.add("visible");
            }
          });
        });
      })
      .catch(function () {
        /* يبقى المحتوى الافتراضي إن تعذر الاتصال بالواجهة */
      });
  }
})();
