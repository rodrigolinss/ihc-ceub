// ===== DETRAN GO — protótipo navegável =====
(function () {
  "use strict";

  const body = document.body;
  const screens = document.querySelectorAll(".screen");
  const navItems = document.querySelectorAll(".bottom-nav__item");

  // ---- Toast ----
  let toastTimer;
  const toastEl = document.getElementById("toast");
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2800);
  }

  // ---- Navegação entre telas ----
  const titles = {
    home: "Início",
    wallet: "Carteira",
    alerts: "Alertas",
    parking: "Estacionar",
    fines: "Multas",
  };
  function showScreen(name) {
    let found = false;
    screens.forEach((s) => {
      const active = s.dataset.screen === name;
      s.classList.toggle("active", active);
      if (active) found = true;
    });
    if (!found) return;

    navItems.forEach((item) =>
      item.classList.toggle("is-active", item.dataset.goto === name)
    );

    if (titles[name]) document.title = "DETRAN GO · " + titles[name];

    const container = document.querySelector(".screen-container");
    if (container) container.scrollTop = 0;
  }

  // ---- Login / Logout ----
  function login() {
    body.classList.remove("is-logged-out");
    body.classList.add("is-logged-in");
    showScreen("home");
  }
  function logout() {
    body.classList.remove("is-logged-in");
    body.classList.add("is-logged-out");
    showScreen("login");
    document.title = "DETRAN GO";
    toast("Você saiu com segurança.");
  }

  // ---- Máscara de CPF ----
  const cpf = document.getElementById("login-cpf");
  if (cpf) {
    cpf.addEventListener("input", () => {
      let v = cpf.value.replace(/\D/g, "").slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
      v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
      cpf.value = v;
    });
  }

  // ---- Formulário de login (aceita qualquer entrada, inclusive vazia) ----
  const form = document.getElementById("login-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector(".login-button");
      if (btn && btn.classList.contains("is-loading")) return;
      if (btn) {
        btn.classList.add("is-loading");
        btn.dataset.label = btn.textContent;
        btn.textContent = "Entrando…";
      }
      setTimeout(() => {
        if (btn) {
          btn.classList.remove("is-loading");
          btn.textContent = btn.dataset.label || "Entrar";
        }
        login();
      }, 650);
    });
  }

  // ====================================================
  //  ESTACIONAMENTO AO VIVO (feature de destaque)
  // ====================================================
  let parkingTimer = null;

  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function fmt(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  function activateParking() {
    const card = document.getElementById("parking-status");
    if (!card) return;

    const sel = document.querySelector(".time-option--selected");
    const time = sel ? sel.dataset.time : "1h";
    const price = sel ? sel.dataset.price : "R$ 2,50";
    let remaining = (time === "2h" ? 120 : 60) * 60; // segundos

    let warned = false;
    function render() {
      card.innerHTML =
        '<span class="status-card__label">ESTACIONAMENTO ATIVO</span>' +
        '<h2 style="color:#1f8a4c">Fiat Palio · ABC-1D34</h2>' +
        '<div class="parking-timer"><span class="parking-timer__value" id="parking-clock">' +
        fmt(remaining) +
        "</span><span class=\"parking-timer__label\">restante · " +
        time +
        " · " +
        price +
        "</span></div>" +
        '<div class="parking-bar"><span style="width:100%"></span></div>' +
        '<div class="status-actions"><button class="secondary-button" type="button" style="flex:1" data-action="extend-parking">+1h</button>' +
        '<button class="primary-button" type="button" style="flex:1;background:#c0392b" data-action="end-parking">Encerrar</button></div>';
    }
    render();
    card.classList.add("status-card--active");
    toast(`Estacionamento ativado: ${time} — ${price}.`);

    const totalStart = remaining;
    clearInterval(parkingTimer);
    parkingTimer = setInterval(() => {
      remaining--;
      const clock = document.getElementById("parking-clock");
      const bar = card.querySelector(".parking-bar span");
      if (clock) clock.textContent = fmt(remaining);
      if (bar) bar.style.width = (remaining / totalStart) * 100 + "%";
      if (!warned && remaining <= 600) {
        warned = true;
        toast("⏰ Faltam 10 minutos para o fim do estacionamento.");
      }
      if (remaining <= 0) {
        endParking();
        toast("Estacionamento encerrado. Tempo esgotado.");
      }
    }, 1000);
  }

  function extendParking() {
    toast("+1 hora adicionada ao estacionamento.");
    const clock = document.getElementById("parking-clock");
    if (clock) {
      // adiciona 3600s ao relógio atual
      const parts = clock.textContent.split(":").map(Number);
      let sec = parts.length === 3
        ? parts[0] * 3600 + parts[1] * 60 + parts[2]
        : parts[0] * 60 + parts[1];
      sec += 3600;
      clock.textContent = fmt(sec);
    }
  }

  function endParking() {
    clearInterval(parkingTimer);
    parkingTimer = null;
    const card = document.getElementById("parking-status");
    if (!card) return;
    card.classList.remove("status-card--active");
    card.innerHTML =
      '<span class="status-card__label">STATUS ATUAL</span>' +
      "<h2>Nenhum crédito ativo</h2>" +
      '<div class="status-actions">' +
      '<button class="secondary-button" type="button" style="flex:1" data-action="toast" data-msg="Abrindo compra de créditos…">🛒 Comprar</button>' +
      '<button class="primary-button" type="button" style="flex:1" data-action="activate-parking">📍 Ativar Agora</button>' +
      "</div>";
  }

  // ====================================================
  //  MULTAS — pagamento com total dinâmico
  // ====================================================
  function brl(n) {
    return "R$ " + n.toFixed(2).replace(".", ",");
  }
  function recalcFines() {
    const cards = document.querySelectorAll("#fines-list .alert-card[data-amount]");
    let total = 0;
    cards.forEach((c) => (total += parseFloat(c.dataset.amount) || 0));
    const totalEl = document.getElementById("fines-total");
    if (totalEl) totalEl.textContent = brl(total);
    const empty = document.getElementById("fines-empty");
    if (empty) empty.hidden = cards.length > 0;
    return cards.length;
  }
  function removeFine(card) {
    if (!card) return;
    card.style.transition = "opacity .3s ease, transform .3s ease";
    card.style.opacity = "0";
    card.style.transform = "translateX(40px)";
    setTimeout(() => {
      card.remove();
      recalcFines();
    }, 300);
  }

  // ---- Badge de alertas ----
  function updateAlertsBadge() {
    const visible = document.querySelectorAll(
      "#screen-alerts .alert-card[data-tag]"
    ).length;
    const badge = document.getElementById("alerts-badge");
    if (badge) {
      badge.textContent = visible;
      badge.hidden = visible === 0;
    }
  }

  // ---- Filtro de alertas ----
  function filterAlerts(filter) {
    document.querySelectorAll("#screen-alerts .alert-card[data-tag]").forEach((card) => {
      const show = filter === "all" || card.dataset.tag === filter;
      card.style.display = show ? "" : "none";
    });
  }

  // ====================================================
  //  Delegação de eventos
  // ====================================================
  document.addEventListener("click", (e) => {
    const target = e.target.closest(
      "[data-goto], [data-action], [data-time], [data-filter]"
    );
    if (!target) return;

    if (target.dataset.goto) {
      e.preventDefault();
      showScreen(target.dataset.goto);
      return;
    }

    if (target.dataset.filter) {
      e.preventDefault();
      document
        .querySelectorAll(".tab-pill")
        .forEach((t) => t.classList.toggle("is-active", t === target));
      filterAlerts(target.dataset.filter);
      return;
    }

    if (target.dataset.time) {
      e.preventDefault();
      document
        .querySelectorAll(".time-option")
        .forEach((t) => t.classList.toggle("time-option--selected", t === target));
      return;
    }

    const action = target.dataset.action;
    if (!action) return;
    e.preventDefault();

    switch (action) {
      case "logout":
        logout();
        break;
      case "toggle-password": {
        const pwd = document.getElementById("login-password");
        if (pwd) {
          pwd.type = pwd.type === "password" ? "text" : "password";
          target.classList.toggle("is-on", pwd.type === "text");
        }
        break;
      }
      case "forgot":
        toast("Enviamos instruções de recuperação para seu e-mail.");
        break;
      case "signup":
        toast("Cadastro disponível em breve.");
        break;
      case "login-alt":
        login();
        break;
      case "activate-parking":
        activateParking();
        break;
      case "extend-parking":
        extendParking();
        break;
      case "end-parking":
        endParking();
        toast("Estacionamento encerrado.");
        break;
      case "pay-all": {
        const n = document.querySelectorAll("#fines-list .alert-card[data-amount]").length;
        if (n === 0) {
          toast("Não há débitos em aberto.");
          break;
        }
        document
          .querySelectorAll("#fines-list .alert-card[data-amount]")
          .forEach((c) => removeFine(c));
        toast("Todos os débitos foram quitados! 🎉");
        break;
      }
      case "pay-fine": {
        const card = target.closest(".alert-card");
        toast("Pagamento confirmado. Multa quitada!");
        removeFine(card);
        break;
      }
      case "toast":
        toast(target.dataset.msg || "Ação realizada.");
        break;
    }
  });

  // ---- Busca de alertas ----
  const search = document.getElementById("alert-search");
  if (search) {
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      document.querySelectorAll("#screen-alerts .alert-card[data-tag]").forEach((card) => {
        const match = card.textContent.toLowerCase().includes(q);
        card.style.display = match ? "" : "none";
      });
    });
  }

  // ---- Suporte a teclado para elementos role="button" ----
  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches('[role="button"]')) {
      e.preventDefault();
      e.target.click();
    }
  });

  // ---- Inicialização ----
  recalcFines();
  updateAlertsBadge();
})();
