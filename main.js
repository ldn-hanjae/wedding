/* 주소 복사 */
(function () {
  var fullAddress =
    "인천광역시 연수구 송도과학로 16번길 33-1 (송도 트리플스트리트 A동 메리빌리아 셀레스메리홀)";

  var btn = document.getElementById("copy-address-btn");
  if (btn) {
    btn.addEventListener("click", function () {
      navigator.clipboard
        .writeText(fullAddress)
        .then(function () {
          btn.textContent = "복사되었습니다";
          setTimeout(function () {
            btn.textContent = "주소 복사";
          }, 2000);
        })
        .catch(function () {
          btn.textContent = "복사 실패";
          setTimeout(function () {
            btn.textContent = "주소 복사";
          }, 2000);
        });
    });
  }
})();

/* 편지 이스터에그 */
(function () {
  var SECRET_LETTERS = {
    "1": {
      to: "지선에게",
      body: "안녕 지선아",
    },
  };

  var trigger = document.getElementById("letter-egg-trigger");
  var dialog = document.getElementById("letter-secret-dialog");
  if (!trigger || !dialog) return;

  var stepGesture = document.getElementById("letter-secret-step-gesture");
  var stepPass = document.getElementById("letter-secret-step-pass");
  var stepLetter = document.getElementById("letter-secret-step-letter");
  var input = document.getElementById("letter-secret-input");
  var hint = document.getElementById("letter-secret-hint");
  var gestHint = document.getElementById("letter-secret-gest-hint");
  var btnGestLeft = document.getElementById("letter-secret-gest-left");
  var btnGestRight = document.getElementById("letter-secret-gest-right");
  var elTo = document.getElementById("letter-secret-to");
  var elBody = document.getElementById("letter-secret-body");
  var btnSubmit = document.getElementById("letter-secret-submit");
  var btnCancel = document.getElementById("letter-secret-cancel");
  var btnDone = document.getElementById("letter-secret-done");
  var btnCloseX = document.getElementById("letter-secret-close-x");

  var tapCount = 0;
  var tapTimer = null;
  var lastTouchAt = 0;
  var TAP_WINDOW_MS = 500;

  var RIGHT_WAIT_MS = 2800;
  var gestureExpectLeft = true;
  var gestureDeadlineTimer = null;

  function clearGestureDeadline() {
    if (gestureDeadlineTimer) {
      window.clearTimeout(gestureDeadlineTimer);
      gestureDeadlineTimer = null;
    }
  }

  function resetGestureChallenge() {
    clearGestureDeadline();
    gestureExpectLeft = true;
    if (gestHint) gestHint.textContent = "";
  }

  function resetSteps() {
    resetGestureChallenge();
    if (stepGesture) stepGesture.removeAttribute("hidden");
    if (stepPass) stepPass.setAttribute("hidden", "");
    if (stepLetter) stepLetter.setAttribute("hidden", "");
    if (input) input.value = "";
    if (hint) hint.textContent = "";
    if (elTo) elTo.textContent = "";
    if (elBody) elBody.textContent = "";
  }

  function showPasswordStep() {
    clearGestureDeadline();
    if (stepGesture) stepGesture.setAttribute("hidden", "");
    if (stepPass) stepPass.removeAttribute("hidden");
    dialog.setAttribute("aria-labelledby", "letter-secret-heading");
    window.setTimeout(function () {
      if (input) input.focus();
    }, 0);
  }

  function openDialog() {
    resetSteps();
    dialog.setAttribute("aria-labelledby", "letter-secret-gesture-heading");
    dialog.removeAttribute("hidden");
    dialog.classList.add("is-open");
    document.body.classList.add("letter-secret-open");
    window.setTimeout(function () {
      if (btnGestLeft) btnGestLeft.focus();
    }, 0);
  }

  function closeDialog() {
    clearGestureDeadline();
    dialog.classList.remove("is-open");
    dialog.setAttribute("hidden", "");
    document.body.classList.remove("letter-secret-open");
    resetSteps();
    trigger.focus();
  }

  function registerTap() {
    if (dialog.classList.contains("is-open")) return;
    tapCount++;
    if (tapTimer) clearTimeout(tapTimer);
    tapTimer = window.setTimeout(function () {
      tapCount = 0;
      tapTimer = null;
    }, TAP_WINDOW_MS);
    if (tapCount >= 2) {
      tapCount = 0;
      if (tapTimer) {
        clearTimeout(tapTimer);
        tapTimer = null;
      }
      openDialog();
    }
  }

  trigger.addEventListener(
    "touchstart",
    function () {
      lastTouchAt = Date.now();
      registerTap();
    },
    { passive: true }
  );

  trigger.addEventListener("click", function () {
    if (Date.now() - lastTouchAt < 400) return;
    registerTap();
  });

  function onGestureWrongOrder() {
    resetGestureChallenge();
    if (gestHint) gestHint.textContent = "왼쪽(👈)부터 눌러 주세요.";
  }

  function onGestureTimeout() {
    gestureDeadlineTimer = null;
    gestureExpectLeft = true;
    if (gestHint) gestHint.textContent = "시간이 조금 지났어요. 다시 왼쪽부터 눌러 주세요.";
  }

  function onGestureLeftTap() {
    if (!stepGesture || stepGesture.hasAttribute("hidden")) return;
    if (!gestureExpectLeft) {
      if (gestHint) gestHint.textContent = "이어서 오른쪽(👉)을 눌러 주세요.";
      return;
    }
    clearGestureDeadline();
    gestureExpectLeft = false;
    if (gestHint) gestHint.textContent = "";
    gestureDeadlineTimer = window.setTimeout(onGestureTimeout, RIGHT_WAIT_MS);
  }

  function onGestureRightTap() {
    if (!stepGesture || stepGesture.hasAttribute("hidden")) return;
    if (gestureExpectLeft) {
      onGestureWrongOrder();
      return;
    }
    clearGestureDeadline();
    gestureExpectLeft = true;
    showPasswordStep();
  }

  if (btnGestLeft) {
    btnGestLeft.addEventListener("click", onGestureLeftTap);
  }
  if (btnGestRight) {
    btnGestRight.addEventListener("click", onGestureRightTap);
  }

  dialog.addEventListener("keydown", function (e) {
    if (!stepGesture || stepGesture.hasAttribute("hidden")) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onGestureLeftTap();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onGestureRightTap();
    }
  });

  function trySubmit() {
    var raw = (input && input.value) || "";
    var key = raw.trim();
    if (hint) hint.textContent = "";
    var entry = SECRET_LETTERS[key];
    if (!entry) {
      if (hint) hint.textContent = "비밀번호가 올바르지 않습니다.";
      return;
    }
    if (elTo) elTo.textContent = entry.to || "";
    if (elBody) elBody.textContent = entry.body || "";
    if (stepPass) stepPass.setAttribute("hidden", "");
    if (stepLetter) stepLetter.removeAttribute("hidden");
    dialog.setAttribute("aria-labelledby", "letter-secret-to");
  }

  if (btnSubmit) btnSubmit.addEventListener("click", trySubmit);
  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        trySubmit();
      }
    });
  }
  if (btnCancel) btnCancel.addEventListener("click", closeDialog);
  if (btnDone) btnDone.addEventListener("click", closeDialog);
  if (btnCloseX) btnCloseX.addEventListener("click", closeDialog);

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!dialog.classList.contains("is-open")) return;
    closeDialog();
  });
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
  var SWIPE_THRESHOLD = 45;

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

    var target = direction < 0 ? "-66.666%" : "0%";
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
    lightbox.removeAttribute("hidden");
    lightbox.classList.add("is-open");
    document.body.classList.add("gallery-lightbox-open");
  }

  function close() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("hidden", "");
    document.body.classList.remove("gallery-lightbox-open");
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
    touchStartX = e.changedTouches[0].clientX;
    touchDeltaX = 0;
    isSwiping = false;
    track.classList.remove("is-animating");
  }, { passive: true });

  track.addEventListener("touchmove", function (e) {
    if (isAnimating) return;
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
