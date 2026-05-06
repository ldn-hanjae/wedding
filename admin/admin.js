(function () {
  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    document.body.innerHTML =
      '<p style="padding:2rem;color:#b35a52;">Supabase 설정을 불러오지 못했습니다.</p>';
    return;
  }

  var client = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY,
    { auth: { persistSession: true, autoRefreshToken: true } }
  );

  var loginSection = document.getElementById("admin-login-section");
  var lettersSection = document.getElementById("admin-letters-section");
  var userBox = document.getElementById("admin-user");
  var userEmailEl = document.getElementById("admin-user-email");
  var logoutBtn = document.getElementById("admin-logout-btn");

  var loginForm = document.getElementById("admin-login-form");
  var loginEmail = document.getElementById("admin-email");
  var loginPassword = document.getElementById("admin-password");
  var loginSubmit = document.getElementById("admin-login-submit");
  var loginError = document.getElementById("admin-login-error");

  var lettersList = document.getElementById("admin-letters-list");
  var lettersStatus = document.getElementById("admin-letters-status");
  var lettersCount = document.getElementById("admin-letters-count");
  var newBtn = document.getElementById("admin-new-letter-btn");

  var editor = document.getElementById("admin-editor");
  var editorTitle = document.getElementById("admin-editor-title");
  var editorForm = document.getElementById("admin-editor-form");
  var editorPassword = document.getElementById("admin-editor-password");
  var editorTo = document.getElementById("admin-editor-to");
  var editorBody = document.getElementById("admin-editor-body");
  var editorCancel = document.getElementById("admin-editor-cancel");
  var editorSave = document.getElementById("admin-editor-save");
  var editorBackdrop = document.getElementById("admin-editor-backdrop");
  var editorError = document.getElementById("admin-editor-error");

  var toast = document.getElementById("admin-toast");
  var toastTimer = null;

  var editingId = null;

  function show(el) { el.removeAttribute("hidden"); }
  function hide(el) { el.setAttribute("hidden", ""); }

  function showToast(msg) {
    toast.textContent = msg;
    toast.removeAttribute("hidden");
    requestAnimationFrame(function () {
      toast.classList.add("is-visible");
    });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("is-visible");
      setTimeout(function () { toast.setAttribute("hidden", ""); }, 250);
    }, 1800);
  }

  function showError(el, msg) {
    el.textContent = msg;
    show(el);
  }

  function clearError(el) {
    el.textContent = "";
    hide(el);
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    return (
      d.getFullYear() +
      "." + pad(d.getMonth() + 1) +
      "." + pad(d.getDate()) +
      " " + pad(d.getHours()) +
      ":" + pad(d.getMinutes())
    );
  }

  function renderLetters(rows) {
    lettersList.innerHTML = "";
    lettersCount.textContent = String(rows.length);

    if (!rows.length) {
      lettersStatus.textContent = "";
      hide(lettersStatus);
      var empty = document.createElement("li");
      empty.className = "admin-empty";
      empty.textContent = "아직 작성한 편지가 없어요. ＋ 새 편지로 시작해보세요.";
      lettersList.appendChild(empty);
      return;
    }

    hide(lettersStatus);

    rows.forEach(function (row) {
      var li = document.createElement("li");
      li.className = "admin-letter-item";

      var topRow = document.createElement("div");
      topRow.className = "admin-letter-row";

      var meta = document.createElement("div");
      meta.className = "admin-letter-meta";

      var toEl = document.createElement("div");
      toEl.className = "admin-letter-to";
      toEl.textContent = row.to_name;

      var pwEl = document.createElement("div");
      pwEl.className = "admin-letter-pw";
      var pwLabel = document.createElement("span");
      pwLabel.textContent = "비밀번호:";
      var pwVal = document.createElement("span");
      pwVal.className = "admin-letter-pw-value";
      pwVal.textContent = row.password;
      pwEl.appendChild(pwLabel);
      pwEl.appendChild(pwVal);

      var dateEl = document.createElement("div");
      dateEl.className = "admin-letter-date";
      dateEl.textContent = "작성: " + formatDate(row.created_at);
      if (row.updated_at && row.updated_at !== row.created_at) {
        dateEl.textContent += " · 수정: " + formatDate(row.updated_at);
      }

      meta.appendChild(toEl);
      meta.appendChild(pwEl);
      meta.appendChild(dateEl);

      var actions = document.createElement("div");
      actions.className = "admin-letter-actions";

      var editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "admin-icon-btn";
      editBtn.textContent = "수정";
      editBtn.addEventListener("click", function () { openEditor(row); });

      var copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "admin-icon-btn";
      copyBtn.textContent = "비번 복사";
      copyBtn.addEventListener("click", function () {
        copyToClipboard(row.password).then(function () {
          showToast("비밀번호를 복사했습니다");
        });
      });

      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "admin-icon-btn admin-icon-btn--danger";
      delBtn.textContent = "삭제";
      delBtn.addEventListener("click", function () {
        if (!confirm('"' + row.to_name + '" 편지를 삭제할까요? 되돌릴 수 없습니다.')) return;
        deleteLetter(row.id);
      });

      actions.appendChild(editBtn);
      actions.appendChild(copyBtn);
      actions.appendChild(delBtn);

      topRow.appendChild(meta);
      topRow.appendChild(actions);

      var preview = document.createElement("div");
      preview.className = "admin-letter-body-preview";
      preview.textContent = row.body;

      li.appendChild(topRow);
      li.appendChild(preview);
      lettersList.appendChild(li);
    });
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopy(text);
      });
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    return new Promise(function (resolve) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) { /* noop */ }
      document.body.removeChild(ta);
      resolve();
    });
  }

  async function loadLetters() {
    show(lettersStatus);
    lettersStatus.textContent = "불러오는 중…";
    var res = await client
      .from("letters")
      .select("id, password, to_name, body, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (res.error) {
      lettersStatus.textContent = "불러오지 못했습니다: " + res.error.message;
      return;
    }
    renderLetters(res.data || []);
  }

  function openEditor(row) {
    clearError(editorError);
    if (row) {
      editingId = row.id;
      editorTitle.textContent = "편지 수정";
      editorPassword.value = row.password;
      editorTo.value = row.to_name;
      editorBody.value = row.body;
    } else {
      editingId = null;
      editorTitle.textContent = "새 편지";
      editorForm.reset();
    }
    show(editor);
    setTimeout(function () { editorPassword.focus(); }, 0);
  }

  function closeEditor() {
    hide(editor);
    editingId = null;
    editorForm.reset();
    clearError(editorError);
  }

  async function saveLetter(e) {
    e.preventDefault();
    clearError(editorError);

    var payload = {
      password: editorPassword.value.trim(),
      to_name: editorTo.value.trim(),
      body: editorBody.value,
    };

    if (!payload.password || !payload.to_name || !payload.body.trim()) {
      showError(editorError, "모든 항목을 입력해주세요.");
      return;
    }

    editorSave.disabled = true;

    var res;
    if (editingId) {
      res = await client.from("letters").update(payload).eq("id", editingId);
    } else {
      res = await client.from("letters").insert(payload);
    }

    editorSave.disabled = false;

    if (res.error) {
      var msg = res.error.message || "저장에 실패했습니다.";
      if (res.error.code === "23505") {
        msg = "이미 사용 중인 비밀번호입니다. 다른 값을 사용해주세요.";
      }
      showError(editorError, msg);
      return;
    }

    closeEditor();
    showToast(editingId ? "편지를 수정했습니다" : "편지를 저장했습니다");
    await loadLetters();
  }

  async function deleteLetter(id) {
    var res = await client.from("letters").delete().eq("id", id);
    if (res.error) {
      alert("삭제 실패: " + res.error.message);
      return;
    }
    showToast("삭제했습니다");
    await loadLetters();
  }

  async function handleLogin(e) {
    e.preventDefault();
    clearError(loginError);
    loginSubmit.disabled = true;

    var res = await client.auth.signInWithPassword({
      email: loginEmail.value.trim(),
      password: loginPassword.value,
    });

    loginSubmit.disabled = false;

    if (res.error) {
      showError(loginError, "로그인 실패: " + res.error.message);
      return;
    }
    showAuthenticated(res.data.user);
  }

  async function handleLogout() {
    await client.auth.signOut();
    showUnauthenticated();
  }

  function showAuthenticated(user) {
    hide(loginSection);
    show(lettersSection);
    show(userBox);
    userEmailEl.textContent = user && user.email ? user.email : "";
    loadLetters();
  }

  function showUnauthenticated() {
    show(loginSection);
    hide(lettersSection);
    hide(userBox);
    lettersList.innerHTML = "";
    lettersCount.textContent = "0";
    loginEmail.value = "";
    loginPassword.value = "";
    clearError(loginError);
  }

  loginForm.addEventListener("submit", handleLogin);
  logoutBtn.addEventListener("click", handleLogout);
  newBtn.addEventListener("click", function () { openEditor(null); });
  editorForm.addEventListener("submit", saveLetter);
  editorCancel.addEventListener("click", closeEditor);
  editorBackdrop.addEventListener("click", closeEditor);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !editor.hasAttribute("hidden")) {
      closeEditor();
    }
  });

  client.auth.getSession().then(function (res) {
    var session = res && res.data && res.data.session;
    if (session && session.user) {
      showAuthenticated(session.user);
    } else {
      showUnauthenticated();
    }
  });

  client.auth.onAuthStateChange(function (event, session) {
    if (event === "SIGNED_OUT" || !session) {
      showUnauthenticated();
    }
  });
})();
