/* 지도 앱 링크 — 티맵: tmap://search (모바일 앱 전용) */
(function () {
  var tmapBtn = document.getElementById("open-tmap");
  if (!tmapBtn) return;

  var tmapAppUrl =
    "tmap://search?name=" + encodeURIComponent("인천 메리빌리아 주차장");

  tmapBtn.setAttribute("href", tmapAppUrl);

  tmapBtn.addEventListener("click", function (e) {
    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      e.preventDefault();
      window.alert("티맵은 모바일 앱에서 이용하실 수 있습니다.");
    }
  });
})();

/* 편지 이스터에그: 믿음→소망→사랑 순서 클릭 */
(function () {
  var dialog = document.getElementById("letter-secret-dialog");
  if (!dialog) return;

  var supabaseClient = null;
  if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    supabaseClient = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }

  var envelope = document.getElementById("letter-envelope");
  var seal = document.getElementById("letter-seal");
  var input = document.getElementById("letter-secret-input");
  var hint = document.getElementById("letter-secret-hint");
  var elTo = document.getElementById("letter-secret-to");
  var elBody = document.getElementById("letter-secret-body");
  var btnSubmit = document.getElementById("letter-secret-submit");
  var btnCancel = document.getElementById("letter-secret-cancel");
  var btnDone = document.getElementById("letter-secret-done");
  var btnWaxClose = document.getElementById("letter-secret-wax-close");
  var btnClose = document.getElementById("letter-secret-close");
  var btnBackdrop = document.getElementById("letter-secret-backdrop");

  var SEQUENCE = ["믿음", "소망", "사랑"];
  var SEQ_TIMEOUT_MS = 4000;
  var seqIndex = 0;
  var seqTimer = null;

  function resetSequence() {
    seqIndex = 0;
    if (seqTimer) { clearTimeout(seqTimer); seqTimer = null; }
  }

  var popWords = document.querySelectorAll(".pop-word");
  popWords.forEach(function (w) {
    w.addEventListener("click", function () {
      if (dialog.classList.contains("is-open")) return;
      var text = w.textContent.trim();
      if (text !== SEQUENCE[seqIndex]) {
        resetSequence();
        if (text === SEQUENCE[0]) {
          seqIndex = 1;
          seqTimer = setTimeout(resetSequence, SEQ_TIMEOUT_MS);
        }
        return;
      }
      seqIndex++;
      if (seqTimer) clearTimeout(seqTimer);
      if (seqIndex >= SEQUENCE.length) {
        resetSequence();
        var openOnce = false;
        var triggerOpen = function () {
          if (openOnce) return;
          openOnce = true;
          w.removeEventListener("animationend", triggerOpen);
          openDialog();
        };
        w.addEventListener("animationend", triggerOpen);
        setTimeout(triggerOpen, 800);
      } else {
        seqTimer = setTimeout(resetSequence, SEQ_TIMEOUT_MS);
      }
    });
  });

  function resetEnvelope() {
    if (envelope) {
      envelope.classList.remove("is-input");
      envelope.classList.remove("is-open");
      envelope.classList.remove("is-shaking");
    }
    if (input) input.value = "";
    if (hint) hint.textContent = "";
    if (elTo) elTo.textContent = "";
    if (elBody) elBody.textContent = "";
  }

  function showInput() {
    if (!envelope) return;
    if (envelope.classList.contains("is-open")) return;
    envelope.classList.add("is-input");
    setTimeout(function () { if (input) input.focus(); }, 320);
  }

  function hideInput() {
    if (!envelope) return;
    envelope.classList.remove("is-input");
    if (input) input.value = "";
    if (hint) hint.textContent = "";
  }

  function shakeInput() {
    if (!envelope) return;
    envelope.classList.remove("is-shaking");
    void envelope.offsetWidth;
    envelope.classList.add("is-shaking");
    setTimeout(function () {
      if (envelope) envelope.classList.remove("is-shaking");
    }, 420);
  }

  function openDialog() {
    resetEnvelope();
    dialog.removeAttribute("hidden");
    dialog.classList.add("is-open");
    document.body.classList.add("letter-secret-open");
  }

  function closeDialog() {
    dialog.classList.remove("is-open");
    dialog.setAttribute("hidden", "");
    document.body.classList.remove("letter-secret-open");
    resetEnvelope();
  }

  var isSubmitting = false;

  function showLetter(entry) {
    if (elTo) elTo.textContent = entry.to_name || "";
    if (elBody) elBody.textContent = entry.body || "";
    if (envelope) {
      envelope.classList.remove("is-input");
      envelope.classList.add("is-open");
    }
    dialog.setAttribute("aria-labelledby", "letter-secret-to");
  }

  async function fetchLetterByPassword(key) {
    if (!supabaseClient) {
      return { entry: null, error: "unavailable" };
    }

    var res = await supabaseClient.rpc("get_letter", { p_password: key });
    if (res.error) {
      return { entry: null, error: "server" };
    }

    var rows = res.data || [];
    var entry = rows.length ? rows[0] : null;
    if (!entry) {
      return { entry: null, error: "wrong" };
    }

    return { entry: entry, error: null };
  }

  function getPasswordFromQuery() {
    try {
      var key = new URLSearchParams(window.location.search).get("password");
      return key ? key.trim() : "";
    } catch (e) {
      return "";
    }
  }

  function clearPasswordFromUrl() {
    try {
      var url = new URL(window.location.href);
      if (!url.searchParams.has("password")) return;
      url.searchParams.delete("password");
      var next = url.pathname + url.search + url.hash;
      window.history.replaceState(null, "", next);
    } catch (e) {
      /* ignore */
    }
  }

  function showFetchError(errorCode, key) {
    if (errorCode === "unavailable") {
      if (hint) hint.textContent = "지금은 편지를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.";
    } else if (errorCode === "server") {
      if (hint) hint.textContent = "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    } else {
      if (hint) hint.textContent = "비밀번호가 틀렸습니다";
    }
    showInput();
    if (input) input.value = key;
    shakeInput();
  }

  async function openLetterByPassword(key) {
    var trimmed = (key || "").trim();
    if (!trimmed) return;

    openDialog();

    isSubmitting = true;
    if (btnSubmit) btnSubmit.disabled = true;
    if (hint) hint.textContent = "불러오는 중…";

    try {
      var result = await fetchLetterByPassword(trimmed);
      if (result.entry) {
        clearPasswordFromUrl();
        if (hint) hint.textContent = "";
        showLetter(result.entry);
        return;
      }
      clearPasswordFromUrl();
      showFetchError(result.error, trimmed);
    } finally {
      isSubmitting = false;
      if (btnSubmit) btnSubmit.disabled = false;
    }
  }

  async function trySubmit() {
    if (isSubmitting) return;
    var raw = (input && input.value) || "";
    var key = raw.trim();
    if (hint) hint.textContent = "";
    if (!key) {
      if (hint) hint.textContent = "비밀번호를 입력해주세요.";
      shakeInput();
      return;
    }

    isSubmitting = true;
    if (btnSubmit) btnSubmit.disabled = true;
    if (hint) hint.textContent = "확인 중…";

    try {
      var result = await fetchLetterByPassword(key);
      if (result.entry) {
        if (hint) hint.textContent = "";
        showLetter(result.entry);
        return;
      }
      showFetchError(result.error, key);
    } finally {
      isSubmitting = false;
      if (btnSubmit) btnSubmit.disabled = false;
    }
  }

  if (seal) seal.addEventListener("click", showInput);
  if (btnSubmit) btnSubmit.addEventListener("click", trySubmit);
  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        trySubmit();
      }
    });
  }
  if (btnCancel) btnCancel.addEventListener("click", hideInput);
  if (btnDone) btnDone.addEventListener("click", closeDialog);
  if (btnWaxClose) btnWaxClose.addEventListener("click", closeDialog);
  if (btnClose) btnClose.addEventListener("click", closeDialog);
  if (btnBackdrop) btnBackdrop.addEventListener("click", closeDialog);

  if (envelope) {
    var letterPaper = envelope.querySelector(".letter-paper");
    envelope.addEventListener("click", function (e) {
      if (!envelope.classList.contains("is-open")) return;
      if (letterPaper && letterPaper.contains(e.target)) return;
      closeDialog();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!dialog.classList.contains("is-open")) return;
    closeDialog();
  });

  var queryPassword = getPasswordFromQuery();
  if (queryPassword) {
    openLetterByPassword(queryPassword);
  }
})();

/* 갤러리 그리드 + 스크롤 등장 */
(function () {
  var VISIBLE_COUNT = 9;
  var grid = document.getElementById("gallery-photo-grid");
  var wrap = document.getElementById("gallery-grid-wrap");
  var moreBtn = document.getElementById("gallery-more-btn");
  var allThumbs = grid ? grid.querySelectorAll("img") : [];
  var isExpanded = false;

  function getCollapsedHeight() {
    if (!allThumbs.length) return 0;
    var first = allThumbs[0];
    if (!first.offsetHeight) return 0;
    var gap = parseFloat(getComputedStyle(grid).gap) || 0;
    var rows = Math.ceil(VISIBLE_COUNT / 3);
    return first.offsetHeight * rows + gap * (rows - 1);
  }

  function applyCollapsedHeight() {
    if (!wrap || isExpanded) return;
    var h = getCollapsedHeight();
    if (h > 0) wrap.style.maxHeight = h + "px";
  }

  if (allThumbs.length > VISIBLE_COUNT) {
    allThumbs[0].addEventListener("load", applyCollapsedHeight);
    window.addEventListener("resize", applyCollapsedHeight);
  } else if (moreBtn) {
    moreBtn.classList.add("is-hidden");
    if (wrap) wrap.style.maxHeight = "none";
  }

  function expandGallery() {
    if (!wrap) return;
    isExpanded = true;
    wrap.style.maxHeight = grid.scrollHeight + "px";
    wrap.classList.add("is-expanded");
    if (moreBtn) {
      moreBtn.innerHTML = '접기 <span class="chevron">›</span>';
      moreBtn.classList.add("is-expanded");
    }
    wrap.addEventListener("transitionend", function handler() {
      wrap.style.maxHeight = "none";
      wrap.removeEventListener("transitionend", handler);
    });
  }

  function collapseGallery() {
    if (!wrap) return;
    isExpanded = false;
    wrap.classList.remove("is-expanded");
    wrap.style.maxHeight = grid.scrollHeight + "px";
    wrap.offsetHeight;
    applyCollapsedHeight();
    if (moreBtn) {
      moreBtn.innerHTML = '더보기 <span class="chevron">›</span>';
      moreBtn.classList.remove("is-expanded");
    }
    var section = wrap.closest(".gallery-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", function () {
      if (isExpanded) collapseGallery();
      else expandGallery();
    });
  }

  var revealEls = document.querySelectorAll(".reveal");
  if (!revealEls.length) return;

  function showAll() {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
    document.querySelectorAll(".gallery-photo-grid img").forEach(function (img) {
      img.classList.add("is-visible");
    });
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    showAll();
    return;
  }

  if (!("IntersectionObserver" in window)) {
    showAll();
    return;
  }

  var io = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-visible");
        if (el.getAttribute("data-reveal-stagger-grid") === "true") {
          var thumbs = el.querySelectorAll(".gallery-photo-grid img");
          Array.prototype.forEach.call(thumbs, function (img, i) {
            window.setTimeout(function () {
              img.classList.add("is-visible");
            }, 45 * Math.min(i, VISIBLE_COUNT - 1));
          });
          requestAnimationFrame(function () {
            requestAnimationFrame(applyCollapsedHeight);
          });
        }
        obs.unobserve(el);
      });
    },
    { root: null, rootMargin: "0px 0px -11% 0px", threshold: 0.06 }
  );

  revealEls.forEach(function (el) {
    io.observe(el);
  });
})();

/* 초대장 파트별 등장 + 키워드 클릭 팝 효과 */
(function () {
  var WIGGLE_ORDER_SEL = [".pop-word--faith", ".pop-word--hope", ".pop-word--love"];
  var wiggleWords = WIGGLE_ORDER_SEL.map(function (sel) {
    return document.querySelector(sel);
  }).filter(Boolean);

  var INTER_WIGGLE_GAP_MS = 1000;
  var WIGGLE_INTERVAL_MS = 10000;
  var wiggleStarted = false;

  function runWiggleCycle() {
    var delayMs = 0;
    wiggleWords.forEach(function (w, i) {
      if (i > 0) delayMs += INTER_WIGGLE_GAP_MS;
      window.setTimeout(function () {
        var part = w.closest(".invite-part");
        if (!part || !part.classList.contains("is-visible")) return;
        if (w.classList.contains("is-popping")) return;
        w.classList.remove("is-wiggling");
        void w.offsetWidth;
        w.classList.add("is-wiggling");
      }, delayMs);
    });
  }

  function startWiggleCycles() {
    if (wiggleStarted) return;
    if (!wiggleWords.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    wiggleStarted = true;
    runWiggleCycle();
    setInterval(runWiggleCycle, WIGGLE_INTERVAL_MS);
  }

  var lastWiggleWord = wiggleWords[wiggleWords.length - 1];
  var lastWigglePart = lastWiggleWord && lastWiggleWord.closest(".invite-part");

  var parts = document.querySelectorAll(".invite-part");
  if (parts.length) {
    if (!("IntersectionObserver" in window) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      parts.forEach(function (p) { p.classList.add("is-visible"); });
      startWiggleCycles();
    } else {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var part = entry.target;
          obs.unobserve(part);
          part.classList.add("is-visible");
          if (part === lastWigglePart) {
            startWiggleCycles();
          }
        });
      }, { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.3 });
      parts.forEach(function (p) { io.observe(p); });
    }
  } else {
    startWiggleCycles();
  }

  var popWords = document.querySelectorAll(".pop-word");
  popWords.forEach(function (w) {
    w.style.cursor = "pointer";
    w.addEventListener("click", function () {
      w.classList.remove("is-popping");
      void w.offsetWidth;
      w.classList.add("is-popping");
    });
    w.addEventListener("animationend", function (e) {
      if (e.animationName === "pop-word-wiggle") {
        w.classList.remove("is-wiggling");
      }
    });
  });
})();

/* 갤러리 라이트박스 (스와이프 애니메이션) */
(function () {
  var grid = document.getElementById("gallery-photo-grid");
  var lightbox = document.getElementById("gallery-lightbox");
  if (!grid || !lightbox) return;

  var thumbs = grid.querySelectorAll("img");
  var urls = Array.prototype.map.call(thumbs, function (img) {
    return img.getAttribute("src");
  });
  var count = urls.length;
  if (!count) return;

  var track = document.getElementById("gallery-lightbox-track");
  var imgPrev = document.getElementById("gallery-lightbox-img-prev");
  var imgCurr = document.getElementById("gallery-lightbox-img-curr");
  var imgNext = document.getElementById("gallery-lightbox-img-next");
  var countEl = document.getElementById("gallery-lightbox-count");
  var btnClose = lightbox.querySelector(".gallery-lightbox__close");
  var btnBackdrop = lightbox.querySelector(".gallery-lightbox__backdrop");
  var btnPrev = lightbox.querySelector(".gallery-lightbox__chev--prev");
  var btnNext = lightbox.querySelector(".gallery-lightbox__chev--next");
  var current = 0;

  var touchStartX = 0;
  var touchDeltaX = 0;
  var isSwiping = false;
  var isAnimating = false;
  var isPinching = false;
  var SWIPE_THRESHOLD = 45;
  var savedScrollY = 0;

  function wrap(i) { return ((i % count) + count) % count; }

  function loadSlides(idx) {
    current = wrap(idx);
    imgPrev.src = urls[wrap(current - 1)];
    imgCurr.src = urls[current];
    imgNext.src = urls[wrap(current + 1)];
    if (countEl) countEl.textContent = (current + 1) + " / " + count;
  }

  function resetTrack() {
    track.classList.remove("is-animating");
    track.style.transform = "translateX(-33.333%)";
  }

  function slideTo(direction) {
    if (isAnimating) return;
    isAnimating = true;
    track.classList.add("is-animating");

    var target = direction > 0 ? "-66.666%" : "0%";
    track.style.transform = "translateX(" + target + ")";

    track.addEventListener("transitionend", function handler() {
      track.removeEventListener("transitionend", handler);
      loadSlides(current + direction);
      resetTrack();
      isAnimating = false;
    });
  }

  function open(at) {
    loadSlides(at);
    resetTrack();
    savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.position = "fixed";
    document.body.style.top = "-" + savedScrollY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    lightbox.removeAttribute("hidden");
    lightbox.classList.add("is-open");
    document.body.classList.add("gallery-lightbox-open");
  }

  function close() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("hidden", "");
    document.body.classList.remove("gallery-lightbox-open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, savedScrollY);
    imgPrev.removeAttribute("src");
    imgCurr.removeAttribute("src");
    imgNext.removeAttribute("src");
  }

  Array.prototype.forEach.call(thumbs, function (thumb, i) {
    thumb.addEventListener("click", function () { open(i); });
  });

  btnClose.addEventListener("click", close);
  btnBackdrop.addEventListener("click", close);
  btnPrev.addEventListener("click", function (e) {
    e.stopPropagation();
    slideTo(-1);
  });
  btnNext.addEventListener("click", function (e) {
    e.stopPropagation();
    slideTo(1);
  });

  track.addEventListener("touchstart", function (e) {
    if (isAnimating) return;
    isPinching = e.touches.length >= 2;
    if (isPinching) return;
    touchStartX = e.changedTouches[0].clientX;
    touchDeltaX = 0;
    isSwiping = false;
    track.classList.remove("is-animating");
  }, { passive: true });

  track.addEventListener("touchmove", function (e) {
    if (isAnimating) return;
    if (e.touches.length >= 2) {
      isPinching = true;
      return;
    }
    if (isPinching) return;
    touchDeltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(touchDeltaX) > 10) isSwiping = true;
    if (isSwiping) {
      var stageWidth = track.parentElement.offsetWidth;
      var pxOffset = -stageWidth + touchDeltaX;
      track.style.transform = "translateX(" + pxOffset + "px)";
    }
  }, { passive: true });

  track.addEventListener("touchend", function () {
    if (isAnimating) return;
    if (isPinching) {
      isPinching = false;
      isSwiping = false;
      touchDeltaX = 0;
      return;
    }
    if (!isSwiping || Math.abs(touchDeltaX) < SWIPE_THRESHOLD) {
      track.classList.add("is-animating");
      resetTrack();
      track.addEventListener("transitionend", function h() {
        track.removeEventListener("transitionend", h);
        track.classList.remove("is-animating");
      });
      return;
    }
    var direction = touchDeltaX < 0 ? 1 : -1;
    isAnimating = true;
    track.classList.add("is-animating");
    var target = direction > 0 ? "-66.666%" : "0%";
    track.style.transform = "translateX(" + target + ")";
    track.addEventListener("transitionend", function handler() {
      track.removeEventListener("transitionend", handler);
      loadSlides(current + direction);
      resetTrack();
      isAnimating = false;
    });
  }, { passive: true });

  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") slideTo(-1);
    else if (e.key === "ArrowRight") slideTo(1);
  });
})();

/* 배경음악 */
(function () {
  var btn = document.getElementById("bgm-toggle");
  var audio = document.getElementById("bgm-audio");
  if (!btn || !audio) return;

  audio.loop = true;

  function setPlaying(on) {
    if (on) {
      btn.classList.add("is-playing");
      btn.setAttribute("aria-pressed", "true");
      btn.setAttribute("aria-label", "배경음악 일시정지");
    } else {
      btn.classList.remove("is-playing");
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "배경음악 재생");
    }
  }

  function tryPlay() {
    return audio.play().then(function () {
      setPlaying(true);
    });
  }

  function onFirstPointerUnlock() {
    document.removeEventListener("touchstart", onFirstPointerUnlock);
    document.removeEventListener("click", onFirstPointerUnlock);
    tryPlay().catch(function () { });
  }

  window.addEventListener("load", function () {
    tryPlay().catch(function () {
      setPlaying(false);
      document.addEventListener("touchstart", onFirstPointerUnlock, {
        passive: true,
      });
      document.addEventListener("click", onFirstPointerUnlock);
    });
  });

  btn.addEventListener("click", function () {
    if (audio.paused) {
      tryPlay().catch(function () { });
    } else {
      audio.pause();
      setPlaying(false);
    }
  });

  audio.addEventListener("ended", function () {
    audio.currentTime = 0;
    tryPlay().catch(function () { });
  });
})();

/* ── Account Toggle & Copy ── */
(function () {
  var toggles = document.querySelectorAll(".account-toggle");
  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var targetId = btn.getAttribute("data-target");
      var list = document.getElementById(targetId);
      if (!list) return;

      var isOpen = btn.classList.contains("is-open");
      if (isOpen) {
        list.style.maxHeight = list.scrollHeight + "px";
        requestAnimationFrame(function () {
          list.style.maxHeight = "0";
          list.style.opacity = "0";
        });
        btn.classList.remove("is-open");
        list.addEventListener("transitionend", function handler() {
          list.hidden = true;
          list.classList.remove("is-open");
          list.removeEventListener("transitionend", handler);
        });
      } else {
        list.hidden = false;
        list.classList.add("is-open");
        list.style.maxHeight = "0";
        requestAnimationFrame(function () {
          list.style.maxHeight = list.scrollHeight + "px";
          list.style.opacity = "1";
        });
        btn.classList.add("is-open");
      }
    });
  });

  var toast = document.createElement("div");
  toast.className = "account-copy-toast";
  toast.textContent = "복사했습니다";
  document.body.appendChild(toast);
  var toastTimer;

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
    document.body.appendChild(ta);

    var isiOS = navigator.userAgent.match(/ipad|iphone/i);
    if (isiOS) {
      var range = document.createRange();
      range.selectNodeContents(ta);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      ta.setSelectionRange(0, text.length);
    } else {
      ta.select();
    }
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  document.querySelectorAll(".account-copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-account");
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).catch(function () {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
      toast.classList.add("is-visible");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.classList.remove("is-visible");
      }, 1500);
    });
  });
})();

/* 예식까지 남은 시간 (한국시간) */
(function () {
  var root = document.getElementById("ceremony-countdown");
  var doneEl = document.getElementById("ceremony-countdown-done");
  var summaryWrap = document.getElementById("ceremony-countdown-wrap");
  if (!root || !summaryWrap) return;

  var cards = {
    days: root.querySelector('[data-flip="days"]'),
    hours: root.querySelector('[data-flip="hours"]'),
    minutes: root.querySelector('[data-flip="minutes"]'),
    seconds: root.querySelector('[data-flip="seconds"]'),
  };

  var targetMs = Date.parse("2026-06-20T16:10:00+09:00");
  var HIDE_AFTER_MS = 60 * 1000;
  var timerId = null;
  var hideTimerId = null;
  var celebrationShown = false;
  var FLIP_MS = 500;

  function hideFold(fold) {
    fold.style.visibility = "hidden";
    fold.style.transform = "";
  }

  function showFold(fold) {
    fold.style.visibility = "visible";
    fold.style.transform = "";
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatDays(n) {
    return n >= 100 ? String(n) : pad2(n);
  }

  function getHideRemainingMs() {
    return Math.max(0, targetMs + HIDE_AFTER_MS - Date.now());
  }

  function fireConfetti() {
    if (typeof confetti !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var colors = ["#5c6f5a", "#667e6b", "#f8f8f4", "#d4827e", "#c4a0a0"];

    confetti({
      particleCount: 110,
      spread: 75,
      origin: { y: 0.58 },
      colors: colors,
      disableForReducedMotion: true,
    });

    window.setTimeout(function () {
      confetti({
        particleCount: 70,
        spread: 100,
        origin: { x: 0.15, y: 0.55 },
        colors: colors,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 70,
        spread: 100,
        origin: { x: 0.85, y: 0.55 },
        colors: colors,
        disableForReducedMotion: true,
      });
    }, 180);
  }

  function hideSummaryArea() {
    summaryWrap.classList.add("is-hiding");
    window.setTimeout(function () {
      summaryWrap.hidden = true;
    }, 450);
  }

  function scheduleHide(delayMs) {
    if (hideTimerId !== null) return;
    hideTimerId = window.setTimeout(function () {
      hideSummaryArea();
      hideTimerId = null;
    }, delayMs);
  }

  function showCelebration(withConfetti) {
    if (celebrationShown) return;
    celebrationShown = true;

    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }

    var countdownRow = document.getElementById("ceremony-countdown-row");
    if (countdownRow) countdownRow.hidden = true;

    if (doneEl) {
      doneEl.hidden = false;
      window.requestAnimationFrame(function () {
        doneEl.classList.add("is-visible");
      });
    }

    if (withConfetti) fireConfetti();
    scheduleHide(getHideRemainingMs());
  }

  function setAllNums(card, value) {
    card.querySelectorAll(".flip-clock__num").forEach(function (el) {
      el.textContent = value;
    });
    card.dataset.value = value;
  }

  function flipCard(card, newValue) {
    var oldValue = card.dataset.value || newValue;
    if (oldValue === newValue) return;

    if (card.dataset.animating === "1") {
      card.dataset.pending = newValue;
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAllNums(card, newValue);
      return;
    }

    card.dataset.animating = "1";

    var upper = card.querySelector(".flip-clock__upper .flip-clock__num");
    var lower = card.querySelector(".flip-clock__lower .flip-clock__num");
    var foldUpper = card.querySelector(".flip-clock__fold--upper");
    var foldLower = card.querySelector(".flip-clock__fold--lower");
    var upperFront = foldUpper.querySelector(".flip-clock__fold-front .flip-clock__num");
    var upperBack = foldUpper.querySelector(".flip-clock__fold-back .flip-clock__num");
    var lowerFront = foldLower.querySelector(".flip-clock__fold-front .flip-clock__num");
    var lowerBack = foldLower.querySelector(".flip-clock__fold-back .flip-clock__num");

    upper.textContent = newValue;
    lower.textContent = oldValue;

    upperFront.textContent = oldValue;
    upperBack.textContent = newValue;
    lowerFront.textContent = newValue;
    lowerBack.textContent = oldValue;

    hideFold(foldUpper);
    hideFold(foldLower);
    showFold(foldUpper);
    card.classList.remove("is-flip-upper", "is-flip-lower");
    void card.offsetWidth;
    card.classList.add("is-flip-upper");

    window.setTimeout(function () {
      card.classList.remove("is-flip-upper");
      hideFold(foldUpper);

      showFold(foldLower);
      foldLower.style.transform = "rotateX(-90deg)";
      void card.offsetWidth;
      card.classList.add("is-flip-lower");

      window.setTimeout(function () {
        card.classList.remove("is-flip-lower");
        hideFold(foldLower);
        setAllNums(card, newValue);
        card.dataset.animating = "0";

        var pending = card.dataset.pending;
        if (pending && pending !== newValue) {
          card.dataset.pending = "";
          flipCard(card, pending);
        } else {
          card.dataset.pending = "";
        }
      }, FLIP_MS);
    }, FLIP_MS);
  }

  function render() {
    var now = Date.now();
    var diff = targetMs - now;

    if (now >= targetMs + HIDE_AFTER_MS) {
      summaryWrap.hidden = true;
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
      return;
    }

    if (diff <= 0) {
      showCelebration(true);
      return;
    }

    var totalSec = Math.floor(diff / 1000);
    var days = Math.floor(totalSec / 86400);
    totalSec %= 86400;
    var hours = Math.floor(totalSec / 3600);
    totalSec %= 3600;
    var mins = Math.floor(totalSec / 60);
    var secs = totalSec % 60;

    var next = {
      days: formatDays(days),
      hours: pad2(hours),
      minutes: pad2(mins),
      seconds: pad2(secs),
    };

    Object.keys(cards).forEach(function (key) {
      var card = cards[key];
      if (!card) return;

      var current = card.dataset.value;
      if (!current) {
        setAllNums(card, next[key]);
        return;
      }

      if (current !== next[key]) {
        flipCard(card, next[key]);
      }
    });
  }

  var now = Date.now();
  if (now >= targetMs + HIDE_AFTER_MS) {
    summaryWrap.hidden = true;
  } else if (now >= targetMs) {
    showCelebration(false);
  } else {
    render();
    timerId = setInterval(render, 1000);
  }
})();
