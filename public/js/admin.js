/**
 * DELÍCIAS DA JANE - Módulo do Painel Administrativo Oculto
 */

const Admin = {
  logoClickCount: 0,
  logoClickTimer: null,
  logoPressTimer: null,
  enteredPin: "",
  currentFilterStatus: "TODOS",
  editingProductId: null,

  init() {
    this.setupSecretTrigger();
    this.setupKeypad();
    this.setupAdminNavigation();
  },

  // =========================================================================
  // 1. GATILHO SECRETO (5 TOQUES RÁPIDOS OU 3 SEGUNDOS PRESSIONADO NO LOGO)
  // =========================================================================
  setupSecretTrigger() {
    const logoBtns = [
      document.getElementById("store-logo-trigger"),
      document.getElementById("desktop-logo-trigger")
    ].filter(Boolean);

    logoBtns.forEach(logoBtn => {
      // Toques Rápidos (5 cliques em até 2 segundos)
      logoBtn.addEventListener("click", () => {
        this.logoClickCount++;
        clearTimeout(this.logoClickTimer);

        if (this.logoClickCount >= 5) {
          this.logoClickCount = 0;
          this.openPinModal();
        } else {
          this.logoClickTimer = setTimeout(() => {
            this.logoClickCount = 0;
          }, 2000);
        }
      });

      // Pressionar e Segurar por 3 segundos (Long Press)
      const startPress = () => {
        this.logoPressTimer = setTimeout(() => {
          this.openPinModal();
        }, 3000);
      };

      const endPress = () => {
        clearTimeout(this.logoPressTimer);
      };

      logoBtn.addEventListener("mousedown", startPress);
      logoBtn.addEventListener("mouseup", endPress);
      logoBtn.addEventListener("mouseleave", endPress);
      logoBtn.addEventListener("touchstart", startPress, { passive: true });
      logoBtn.addEventListener("touchend", endPress);
      logoBtn.addEventListener("touchcancel", endPress);
    });
  },

  // =========================================================================
  // 2. MODAL DE PIN E AUTENTICAÇÃO
  // =========================================================================
  openPinModal() {
    this.enteredPin = "";
    this.updatePinDots();
    const modal = document.getElementById("admin-pin-modal");
    if (modal) modal.classList.add("open");
  },

  closePinModal() {
    const modal = document.getElementById("admin-pin-modal");
    if (modal) modal.classList.remove("open");
    this.enteredPin = "";
    this.updatePinDots();
  },

  setupKeypad() {
    const buttons = document.querySelectorAll(".keypad-btn[data-num]");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        const num = btn.getAttribute("data-num");
        this.handlePinInput(num);
      });
    });

    const clearBtn = document.getElementById("pin-clear-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.enteredPin = this.enteredPin.slice(0, -1);
        this.updatePinDots();
      });
    }

    const closeBtn = document.getElementById("pin-cancel-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closePinModal());
    }
  },

  handlePinInput(num) {
    if (this.enteredPin.length < 4) {
      this.enteredPin += num;
      this.updatePinDots();

      if (this.enteredPin.length === 4) {
        setTimeout(() => this.validatePin(), 150);
      }
    }
  },

  updatePinDots() {
    const dots = document.querySelectorAll(".pin-dot");
    dots.forEach((dot, index) => {
      dot.classList.toggle("filled", index < this.enteredPin.length);
    });
  },

  validatePin() {
    const config = SheetsService.getConfiguracoes();
    const correctPin = config.admin_pin || "1234";

    if (this.enteredPin === correctPin) {
      this.closePinModal();
      this.openAdminPanel();
      App.showToast("Acesso administrativo autorizado! 🔐", "success");
    } else {
      App.showToast("PIN incorreto! Tente novamente.", "error");
      const card = document.querySelector(".pin-modal-card");
      if (card) {
        card.style.transform = "translateX(10px)";
        setTimeout(() => card.style.transform = "translateX(-10px)", 100);
        setTimeout(() => card.style.transform = "translateX(0)", 200);
      }
      this.enteredPin = "";
      this.updatePinDots();
    }
  },

  quickUnlock() {
    this.closePinModal();
    this.openAdminPanel();
    App.showToast("Acesso administrativo autorizado! 🔐", "success");
  },

  // =========================================================================
  // 3. ABERTURA E NAVEGAÇÃO DO PAINEL ADMIN
  // =========================================================================
  openAdminPanel() {
    const panel = document.getElementById("admin-panel");
    if (panel) {
      panel.classList.add("active");
      document.body.style.overflow = "hidden";
      this.loadDashboardMetrics();
      this.renderOrders();
      this.renderProductsList();
      this.renderClientsList();
      this.loadSettingsForm();
    }
  },

  closeAdminPanel() {
    const panel = document.getElementById("admin-panel");
    if (panel) {
      panel.classList.remove("active");
      document.body.style.overflow = "";
      // Atualizar dados na visão do cliente
      App.renderProducts();
      App.renderCategories();
      App.renderHeader();
      App.applyStoreStatus();
    }
  },

  setupAdminNavigation() {
    const tabs = document.querySelectorAll(".admin-tab-btn");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const targetView = tab.getAttribute("data-view");
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        document.querySelectorAll(".admin-view-section").forEach(sec => {
          sec.classList.add("hidden");
        });

        const activeSec = document.getElementById(`admin-view-${targetView}`);
        if (activeSec) activeSec.classList.remove("hidden");

        if (targetView === "dashboard") this.loadDashboardMetrics();
        if (targetView === "pedidos") this.renderOrders();
        if (targetView === "produtos") this.renderProductsList();
        if (targetView === "clientes") this.renderClientsList();
        if (targetView === "config") this.loadSettingsForm();
      });
    });

    const exitBtn = document.getElementById("admin-exit-btn");
    if (exitBtn) {
      exitBtn.addEventListener("click", () => this.closeAdminPanel());
    }

    // Toggle Loja Aberta/Fechada no Dashboard
    const storeToggle = document.getElementById("admin-store-open-toggle");
    if (storeToggle) {
      storeToggle.addEventListener("change", async (e) => {
        const isOpen = e.target.checked;
        await SheetsService.salvarConfiguracoes({
          status_loja: isOpen ? "ABERTO" : "FECHADO"
        });
        App.showToast(`Cardápio ${isOpen ? 'ABERTO' : 'FECHADO'} com sucesso!`, "success");
      });
    }

    // Fechar modais ao clicar no backdrop escuro
    const prodModal = document.getElementById("admin-product-crud-modal");
    if (prodModal) {
      prodModal.addEventListener("click", (e) => {
        if (e.target === prodModal) this.closeProductCrudModal();
      });
    }
    const clientModal = document.getElementById("admin-client-crud-modal");
    if (clientModal) {
      clientModal.addEventListener("click", (e) => {
        if (e.target === clientModal) this.closeClientCrudModal();
      });
    }
  },

  // =========================================================================
  // 4. DASHBOARD & MÉTRICAS
  // =========================================================================
  loadDashboardMetrics() {
    const pedidos = SheetsService.getPedidos();
    const produtos = SheetsService.getProdutos();
    const config = SheetsService.getConfiguracoes();

    // Faturamento Total e Pedidos
    const totalPedidos = pedidos.length;
    const faturamentoTotal = pedidos
      .filter(p => p.status_pedido !== "CANCELADO")
      .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);

    const faturamentoHoje = pedidos
      .filter(p => {
        if (p.status_pedido === "CANCELADO") return false;
        const dataPed = new Date(p.data_hora).toDateString();
        const hoje = new Date().toDateString();
        return dataPed === hoje;
      })
      .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);

    const pedidosHoje = pedidos.filter(p => new Date(p.data_hora).toDateString() === new Date().toDateString()).length;

    // Atualizar UI
    document.getElementById("metric-fat-hoje").textContent = `R$ ${faturamentoHoje.toFixed(2).replace('.', ',')}`;
    document.getElementById("metric-ped-hoje").textContent = pedidosHoje;
    document.getElementById("metric-fat-total").textContent = `R$ ${faturamentoTotal.toFixed(2).replace('.', ',')}`;
    document.getElementById("metric-ped-total").textContent = totalPedidos;

    // Toggle da Loja
    const storeToggle = document.getElementById("admin-store-open-toggle");
    if (storeToggle) {
      storeToggle.checked = (config.status_loja !== "FECHADO");
    }

    // Top 3 Mais Vendidos
    const itemCounts = {};
    pedidos.forEach(p => {
      if (p.resumo_itens) {
        const partes = p.resumo_itens.split(", ");
        partes.forEach(parte => {
          const match = parte.match(/(\d+)x\s+(.+)/);
          if (match) {
            const qty = parseInt(match[1]);
            const name = match[2].replace(/\s*\(Obs:.*\)/, '').trim();
            itemCounts[name] = (itemCounts[name] || 0) + qty;
          }
        });
      }
    });

    const sortedItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const topListEl = document.getElementById("top-products-list");
    if (topListEl) {
      if (sortedItems.length === 0) {
        topListEl.innerHTML = `<div style="color:var(--admin-muted); font-size:0.85rem;">Nenhuma venda registrada ainda.</div>`;
      } else {
        topListEl.innerHTML = sortedItems.map(([name, count], idx) => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--admin-border);">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-weight:800; color:var(--primary-light); font-size:0.9rem;">#${idx + 1}</span>
              <span style="font-size:0.85rem; color:#FFFFFF;">${name}</span>
            </div>
            <span style="font-weight:700; color:#10B981; font-size:0.85rem;">${count} un. vendidas</span>
          </div>
        `).join("");
      }
    }
  },

  // =========================================================================
  // 5. GESTÃO DE PEDIDOS (KANBAN & CARDS)
  // =========================================================================
  filterOrdersByStatus(status) {
    this.currentFilterStatus = status;
    document.querySelectorAll(".order-filter-chip").forEach(chip => {
      chip.classList.toggle("active", chip.getAttribute("data-status") === status);
    });
    this.renderOrders();
  },

  renderOrders() {
    const listEl = document.getElementById("admin-orders-list");
    if (!listEl) return;

    let pedidos = SheetsService.getPedidos();

    if (this.currentFilterStatus !== "TODOS") {
      pedidos = pedidos.filter(p => p.status_pedido === this.currentFilterStatus);
    }

    if (pedidos.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:40px 20px; color:var(--admin-muted);">
          <div style="font-size:40px; margin-bottom:8px;">📋</div>
          <p>Nenhum pedido encontrado nesta categoria.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = pedidos.map(ped => {
      const dataFormatada = new Date(ped.data_hora).toLocaleString('pt-BR');
      const cleanPhone = (ped.whatsapp_cliente || '').replace(/\D/g, '');

      // Mensagem para status no WhatsApp
      const msgStatus = encodeURIComponent(`Olá ${ped.nome_cliente}! Tudo bem? Atualização do seu Pedido #${ped.id_pedido} na Delícias da Jane: Status atual: *${ped.status_pedido}* 🍧`);
      const zapLink = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${msgStatus}` : '#';

      return `
        <div class="admin-order-card">
          <div class="order-card-header">
            <div class="order-id">#${ped.id_pedido}</div>
            <span class="order-status-badge status-${ped.status_pedido.replace(/\s+/g, '_')}">${ped.status_pedido}</span>
          </div>

          <div class="order-client-info">
            <strong>👤 ${ped.nome_cliente || 'Cliente'}</strong> (${dataFormatada})<br>
            📱 ${ped.whatsapp_cliente || 'Não informado'}<br>
            📍 ${ped.endereco_entrega || 'Retirada na loja'}
          </div>

          <div class="order-items-box">
            <strong>Itens:</strong> ${ped.resumo_itens}<br>
            ${ped.observacoes ? `<div style="margin-top:4px; color:#FBBF24;"><strong>Obs:</strong> ${ped.observacoes}</div>` : ''}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:0.9rem;">
            <span>💳 ${ped.forma_pagamento}</span>
            <span style="font-family:var(--font-heading); font-weight:800; font-size:1.1rem; color:var(--primary-light);">Total: R$ ${parseFloat(ped.total).toFixed(2).replace('.', ',')}</span>
          </div>

          <div class="order-actions-row">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:0.75rem; color:var(--admin-muted);">Alterar:</span>
              <select class="order-status-select" onchange="Admin.changeOrderStatus('${ped.id_pedido}', this.value)">
                <option value="NOVO" ${ped.status_pedido === 'NOVO' ? 'selected' : ''}>NOVO</option>
                <option value="EM PREPARO" ${ped.status_pedido === 'EM PREPARO' ? 'selected' : ''}>EM PREPARO</option>
                <option value="SAIU PARA ENTREGA" ${ped.status_pedido === 'SAIU PARA ENTREGA' ? 'selected' : ''}>SAIU PARA ENTREGA</option>
                <option value="CONCLUIDO" ${ped.status_pedido === 'CONCLUIDO' ? 'selected' : ''}>CONCLUÍDO</option>
                <option value="CANCELADO" ${ped.status_pedido === 'CANCELADO' ? 'selected' : ''}>CANCELADO</option>
              </select>
            </div>

            ${cleanPhone ? `
              <a href="${zapLink}" target="_blank" class="btn-admin-whatsapp" title="Falar no WhatsApp">
                <span>💬 WhatsApp</span>
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }).join("");
  },

  async changeOrderStatus(idPedido, novoStatus) {
    await SheetsService.atualizarStatusPedido(idPedido, novoStatus);
    this.renderOrders();
    this.loadDashboardMetrics();
    App.showToast(`Pedido #${idPedido} atualizado para ${novoStatus}! 📦`, "success");
  },

  // =========================================================================
  // 6. GESTÃO DE PRODUTOS & CONTROLE DE ESTOQUE EM TEMPO REAL
  // =========================================================================
  productSearchTerm: "",
  productStockFilter: "TODOS",

  filterProducts() {
    const input = document.getElementById("admin-prod-search");
    this.productSearchTerm = input ? input.value.trim().toLowerCase() : "";
    this.renderProductsList();
  },

  filterProductsByStock(filter) {
    this.productStockFilter = filter;
    document.querySelectorAll("[data-stock-filter]").forEach(chip => {
      chip.classList.toggle("active", chip.getAttribute("data-stock-filter") === filter);
    });
    this.renderProductsList();
  },

  renderProductsList() {
    const listEl = document.getElementById("admin-products-list");
    if (!listEl) return;

    let produtos = SheetsService.getProdutos();

    // Filtro por termo de busca
    if (this.productSearchTerm) {
      produtos = produtos.filter(p => 
        p.nome.toLowerCase().includes(this.productSearchTerm) ||
        p.categoria.toLowerCase().includes(this.productSearchTerm)
      );
    }

    // Filtro por status de estoque
    if (this.productStockFilter === "ATIVOS") {
      produtos = produtos.filter(p => p.status === "ATIVO" && (parseInt(p.estoque) || 0) > 0);
    } else if (this.productStockFilter === "ESGOTADOS") {
      produtos = produtos.filter(p => (parseInt(p.estoque) || 0) <= 0);
    } else if (this.productStockFilter === "INATIVOS") {
      produtos = produtos.filter(p => p.status === "INATIVO");
    }

    if (produtos.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:40px 20px; color:var(--admin-muted);">
          <div style="font-size:36px; margin-bottom:8px;">🔍</div>
          <p>Nenhum produto encontrado com estes filtros.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = produtos.map(p => {
      const isAtivo = p.status === "ATIVO";
      const qtdEstoque = parseInt(p.estoque) || 0;
      const isEsgotado = qtdEstoque <= 0;
      const isEstoqueBaixo = !isEsgotado && qtdEstoque <= 3;

      let stockBadgeClass = "stock-ok";
      let stockBadgeText = `Estoque: ${qtdEstoque} un.`;

      if (!isAtivo) {
        stockBadgeClass = "stock-inactive";
        stockBadgeText = "Oculto no Cardápio";
      } else if (isEsgotado) {
        stockBadgeClass = "stock-empty";
        stockBadgeText = "🚫 Esgotado (0 un.)";
      } else if (isEstoqueBaixo) {
        stockBadgeClass = "stock-low";
        stockBadgeText = `⚠️ Baixo (${qtdEstoque} un.)`;
      }

      const precoFmt = (parseFloat(p.preco) || 0).toFixed(2).replace('.', ',');

      return `
        <div class="admin-product-item ${isEsgotado ? 'is-out' : ''}" data-product-id="${p.id_produto}">
          <!-- Topo do Card: Foto + Dados do Produto -->
          <div class="admin-product-top">
            <img src="${p.foto_url || 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=300&q=80'}" 
                 class="admin-product-thumb" 
                 alt="${p.nome}" 
                 onerror="this.src='https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=300&q=80'">
            
            <div class="admin-product-details">
              <div class="admin-product-name-row">
                <span class="admin-product-name">${p.nome}</span>
                ${p.destaque === 'SIM' ? '<span class="admin-featured-tag">⭐ Destaque</span>' : ''}
              </div>
              <div class="admin-product-category">${p.categoria || 'Geral'}</div>
              <div class="admin-product-meta-row">
                <div class="admin-product-price">R$ ${precoFmt}</div>
                <span class="admin-stock-badge ${stockBadgeClass}">${stockBadgeText}</span>
              </div>
            </div>
          </div>

          <!-- Barra de Ações (Adaptada Mobile & Desktop) -->
          <div class="admin-product-actions">
            <!-- Controle Rápido de Quantidade de Estoque -->
            <div class="admin-stock-control-group">
              <span class="admin-action-label">Estoque:</span>
              <div class="admin-stock-stepper" title="Ajustar estoque rapidamente">
                <button type="button" class="stock-btn" onclick="Admin.changeProductStock('${p.id_produto}', -1)">-</button>
                <input type="number" class="stock-input" value="${qtdEstoque}" min="0" 
                  onchange="Admin.setProductStock('${p.id_produto}', this.value)">
                <button type="button" class="stock-btn" onclick="Admin.changeProductStock('${p.id_produto}', 1)">+</button>
              </div>
            </div>

            <div class="admin-product-buttons-group">
              <!-- Switch de Visibilidade com Label -->
              <div class="admin-switch-wrap" title="${isAtivo ? 'Visível para clientes (Clique para ocultar)' : 'Oculto do cardápio (Clique para ativar)'}">
                <span class="admin-switch-text">${isAtivo ? 'Ativo' : 'Oculto'}</span>
                <label class="switch">
                  <input type="checkbox" ${isAtivo ? 'checked' : ''} onchange="Admin.toggleProductStock('${p.id_produto}')">
                  <span class="slider"></span>
                </label>
              </div>

              <!-- Botão Editar Destacado e Amigável ao Toque -->
              <button type="button" class="btn-admin-edit" onclick="Admin.openEditProductModal('${p.id_produto}')" title="Editar produto e estoque">
                ✏️ Editar
              </button>

              <!-- Excluir -->
              <button type="button" class="btn-admin-action delete" onclick="Admin.deleteProduct('${p.id_produto}')" title="Excluir produto">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  async changeProductStock(idProduto, delta) {
    const produtos = SheetsService.getProdutos();
    const prod = produtos.find(p => p.id_produto === idProduto || String(p.id_produto) === String(idProduto));
    if (!prod) return;

    const novoEstoque = Math.max(0, (parseInt(prod.estoque) || 0) + delta);
    await SheetsService.atualizarEstoqueProduto(prod.id_produto, novoEstoque);
    this.renderProductsList();
    App.renderProducts();

    if (novoEstoque === 0) {
      App.showToast(`${prod.nome} agora está ESGOTADO! 🚫`, "error");
    } else {
      App.showToast(`Estoque de ${prod.nome}: ${novoEstoque} un. ✅`);
    }
  },

  async setProductStock(idProduto, valor) {
    const qtd = Math.max(0, parseInt(valor) || 0);
    const updated = await SheetsService.atualizarEstoqueProduto(idProduto, qtd);
    this.renderProductsList();
    App.renderProducts();
    if (updated) {
      App.showToast(`Estoque atualizado: ${qtd} unidades.`);
    }
  },

  async toggleProductStock(idProduto) {
    const updated = await SheetsService.toggleStatusProduto(idProduto);
    if (updated) {
      App.showToast(`${updated.nome}: ${updated.status === 'ATIVO' ? 'Disponível no cardápio ✅' : 'Esgotado / Ocultado ❌'}`);
      this.renderProductsList();
      App.renderProducts();
    }
  },

  openNewProductModal() {
    this.editingProductId = null;
    const titleEl = document.getElementById("prod-modal-title");
    if (titleEl) titleEl.textContent = "Novo Produto";

    const nomeEl = document.getElementById("form-prod-nome");
    if (nomeEl) nomeEl.value = "";

    const catEl = document.getElementById("form-prod-categoria");
    if (catEl) catEl.value = "Chup-Chups Gourmet";

    const precoEl = document.getElementById("form-prod-preco");
    if (precoEl) precoEl.value = "";

    const fotoEl = document.getElementById("form-prod-foto");
    if (fotoEl) fotoEl.value = "";

    const descEl = document.getElementById("form-prod-desc");
    if (descEl) descEl.value = "";

    const destEl = document.getElementById("form-prod-destaque");
    if (destEl) destEl.value = "NAO";

    const statusEl = document.getElementById("form-prod-status");
    if (statusEl) statusEl.value = "ATIVO";

    const estoqueEl = document.getElementById("form-prod-estoque");
    if (estoqueEl) estoqueEl.value = "15";

    const modal = document.getElementById("admin-product-crud-modal");
    if (modal) modal.classList.add("open");
  },

  openEditProductModal(idProduto) {
    const produtos = SheetsService.getProdutos();
    const prod = produtos.find(p => p.id_produto === idProduto || String(p.id_produto) === String(idProduto));
    if (!prod) {
      console.warn("Produto não encontrado para edição:", idProduto);
      App.showToast("Erro: Produto não encontrado para edição.", "error");
      return;
    }

    this.editingProductId = prod.id_produto;
    const titleEl = document.getElementById("prod-modal-title");
    if (titleEl) titleEl.textContent = "Editar Produto";

    const nomeEl = document.getElementById("form-prod-nome");
    if (nomeEl) nomeEl.value = prod.nome || "";

    const catEl = document.getElementById("form-prod-categoria");
    if (catEl) {
      let found = false;
      for (let i = 0; i < catEl.options.length; i++) {
        if (catEl.options[i].value === prod.categoria) {
          catEl.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found && prod.categoria) {
        const opt = document.createElement("option");
        opt.value = prod.categoria;
        opt.textContent = prod.categoria;
        catEl.appendChild(opt);
        catEl.value = prod.categoria;
      }
    }

    const precoEl = document.getElementById("form-prod-preco");
    if (precoEl) {
      const pNum = typeof prod.preco === "number" ? prod.preco : parseFloat(String(prod.preco).replace(',', '.'));
      precoEl.value = isNaN(pNum) ? "" : pNum.toFixed(2);
    }

    const fotoEl = document.getElementById("form-prod-foto");
    if (fotoEl) fotoEl.value = prod.foto_url || "";

    const descEl = document.getElementById("form-prod-desc");
    if (descEl) descEl.value = prod.descricao || "";

    const destEl = document.getElementById("form-prod-destaque");
    if (destEl) destEl.value = prod.destaque || "NAO";

    const statusEl = document.getElementById("form-prod-status");
    if (statusEl) statusEl.value = prod.status || "ATIVO";

    const estoqueEl = document.getElementById("form-prod-estoque");
    if (estoqueEl) estoqueEl.value = prod.estoque !== undefined ? prod.estoque : 10;

    const modal = document.getElementById("admin-product-crud-modal");
    if (modal) modal.classList.add("open");
  },

  closeProductCrudModal() {
    const modal = document.getElementById("admin-product-crud-modal");
    if (modal) modal.classList.remove("open");
    this.editingProductId = null;
  },

  async saveProductForm() {
    const nomeEl = document.getElementById("form-prod-nome");
    const catEl = document.getElementById("form-prod-categoria");
    const precoEl = document.getElementById("form-prod-preco");
    const fotoEl = document.getElementById("form-prod-foto");
    const descEl = document.getElementById("form-prod-desc");
    const destaqueEl = document.getElementById("form-prod-destaque");
    const statusEl = document.getElementById("form-prod-status");
    const estoqueEl = document.getElementById("form-prod-estoque");

    const nome = nomeEl ? nomeEl.value.trim() : "";
    const categoria = catEl ? catEl.value : "Chup-Chups Gourmet";
    const precoStr = precoEl ? precoEl.value.replace(',', '.') : "";
    const preco = parseFloat(precoStr);
    const foto = fotoEl ? fotoEl.value.trim() : "";
    const desc = descEl ? descEl.value.trim() : "";
    const destaque = destaqueEl ? destaqueEl.value : "NAO";
    const status = statusEl ? statusEl.value : "ATIVO";
    const estoque = estoqueEl ? (parseInt(estoqueEl.value) || 0) : 0;

    if (!nome) {
      App.showToast("Por favor, informe o Nome do produto.", "error");
      nomeEl?.focus();
      return;
    }

    if (isNaN(preco) || preco <= 0) {
      App.showToast("Por favor, informe um Preço válido (ex: 6.50).", "error");
      precoEl?.focus();
      return;
    }

    const isEdit = Boolean(this.editingProductId);

    const produtoObj = {
      id_produto: this.editingProductId,
      nome: nome,
      categoria: categoria,
      preco: preco,
      foto_url: foto || "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
      descricao: desc,
      destaque: destaque,
      status: status,
      estoque: estoque
    };

    await SheetsService.salvarProduto(produtoObj);
    this.closeProductCrudModal();
    this.renderProductsList();
    App.renderProducts();
    App.showToast(isEdit ? "Produto atualizado com sucesso! 🍦" : "Produto cadastrado com sucesso! 🍦", "success");
  },

  async deleteProduct(idProduto) {
    if (confirm("Tem certeza que deseja excluir este produto do cardápio?")) {
      await SheetsService.excluirProduto(idProduto);
      this.renderProductsList();
      App.renderProducts();
      App.showToast("Produto excluído com sucesso!", "success");
    }
  },

  // =========================================================================
  // 7. GESTÃO DE CLIENTES & HISTÓRICO DE COMPRAS
  // =========================================================================
  clientSearchTerm: "",

  filterClients() {
    const input = document.getElementById("admin-client-search");
    this.clientSearchTerm = input ? input.value.trim().toLowerCase() : "";
    this.renderClientsList();
  },

  renderClientsList() {
    const listEl = document.getElementById("admin-clients-list");
    const countEl = document.getElementById("admin-clients-count");
    if (!listEl) return;

    let clientes = SheetsService.getClientes();
    const pedidos = SheetsService.getPedidos();

    if (this.clientSearchTerm) {
      clientes = clientes.filter(c => 
        (c.nome || "").toLowerCase().includes(this.clientSearchTerm) ||
        (c.whatsapp || "").includes(this.clientSearchTerm) ||
        (c.bairro || "").toLowerCase().includes(this.clientSearchTerm) ||
        (c.endereco || "").toLowerCase().includes(this.clientSearchTerm)
      );
    }

    if (countEl) {
      countEl.textContent = `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`;
    }

    if (clientes.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:40px 20px; color:var(--admin-muted);">
          <div style="font-size:36px; margin-bottom:8px;">👥</div>
          <p>Nenhum cliente cadastrado no momento.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = clientes.map(cli => {
      const cleanPhone = (cli.whatsapp || "").replace(/\D/g, "");
      
      // Pedidos deste cliente
      const pedidosDoCliente = pedidos.filter(p => 
        (p.whatsapp_cliente && p.whatsapp_cliente.replace(/\D/g, "") === cleanPhone) ||
        p.id_cliente === cli.id_cliente ||
        p.nome_cliente === cli.nome
      );

      const totalGasto = pedidosDoCliente.reduce((acc, p) => acc + (parseFloat(p.total) || 0), 0);
      const totalPedidos = pedidosDoCliente.length;

      const isVip = totalPedidos >= 3;
      const zapMsg = encodeURIComponent(`Olá ${cli.nome}! Tudo bem? Passando para te dar um oi da Delícias da Jane 🍧`);
      const zapLink = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${zapMsg}` : "#";

      return `
        <div class="admin-client-card">
          <div class="client-card-header">
            <div class="client-avatar">
              ${(cli.nome || "C").charAt(0).toUpperCase()}
            </div>
            <div class="client-info-main">
              <div class="client-name">
                ${cli.nome}
                ${isVip ? `<span class="badge-vip">👑 Cliente VIP</span>` : ''}
              </div>
              <div class="client-date">Cadastrado em: ${cli.data_cadastro || 'Recente'}</div>
            </div>
          </div>

          <div class="client-details-grid">
            <div class="client-detail-item">
              <span class="detail-label">📱 WhatsApp:</span>
              <span class="detail-val">${cli.whatsapp || 'Não informado'}</span>
            </div>
            <div class="client-detail-item">
              <span class="detail-label">📍 Endereço:</span>
              <span class="detail-val">${cli.endereco || 'Retirada'} ${cli.bairro ? `(${cli.bairro})` : ''}</span>
            </div>
            <div class="client-detail-item">
              <span class="detail-label">🛍️ Pedidos:</span>
              <span class="detail-val" style="color:var(--primary-light); font-weight:700;">${totalPedidos} pedido(s)</span>
            </div>
            <div class="client-detail-item">
              <span class="detail-label">💰 Total Gasto:</span>
              <span class="detail-val" style="color:#10B981; font-weight:700;">R$ ${totalGasto.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <div class="client-card-actions">
            ${cleanPhone ? `
              <a href="${zapLink}" target="_blank" class="btn-client-zap" title="Iniciar conversa no WhatsApp">
                <span>💬 WhatsApp</span>
              </a>
            ` : ''}
            <button class="btn-client-orders" onclick="Admin.viewClientOrders('${cleanPhone}')" title="Ver histórico de pedidos">
              📦 Pedidos
            </button>
            <button class="btn-client-edit" onclick="Admin.openEditClientModal('${cli.id_cliente}')" title="Editar dados do cliente">
              ✏️ Editar
            </button>
            <button class="btn-client-delete" onclick="Admin.deleteClient('${cli.id_cliente}')" title="Excluir cliente da base">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join("");
  },

  viewClientOrders(cleanPhone) {
    this.setupAdminNavigation();
    const tabPedidos = document.querySelector('[data-view="pedidos"]');
    if (tabPedidos) tabPedidos.click();
    App.showToast("Exibindo pedidos em tempo real 📋");
  },

  editingClientId: null,

  openNewClientModal() {
    this.editingClientId = null;
    document.getElementById("client-modal-title").textContent = "Novo Cliente";
    document.getElementById("form-client-nome").value = "";
    document.getElementById("form-client-whatsapp").value = "";
    document.getElementById("form-client-endereco").value = "";
    document.getElementById("form-client-bairro").value = "";
    document.getElementById("form-client-cidade").value = "São Paulo - SP";
    document.getElementById("form-client-obs").value = "";

    const modal = document.getElementById("admin-client-crud-modal");
    if (modal) modal.classList.add("open");
  },

  openEditClientModal(idCliente) {
    const clientes = SheetsService.getClientes();
    const cli = clientes.find(c => c.id_cliente === idCliente);
    if (!cli) return;

    this.editingClientId = idCliente;
    document.getElementById("client-modal-title").textContent = "Editar Cliente";
    document.getElementById("form-client-nome").value = cli.nome || "";
    document.getElementById("form-client-whatsapp").value = cli.whatsapp || "";
    document.getElementById("form-client-endereco").value = cli.endereco || "";
    document.getElementById("form-client-bairro").value = cli.bairro || "";
    document.getElementById("form-client-cidade").value = cli.cidade || "São Paulo - SP";
    document.getElementById("form-client-obs").value = cli.observacoes || "";

    const modal = document.getElementById("admin-client-crud-modal");
    if (modal) modal.classList.add("open");
  },

  closeClientCrudModal() {
    const modal = document.getElementById("admin-client-crud-modal");
    if (modal) modal.classList.remove("open");
    this.editingClientId = null;
  },

  async saveClientForm() {
    const nome = document.getElementById("form-client-nome").value.trim();
    const rawWhatsapp = document.getElementById("form-client-whatsapp").value.trim();
    const endereco = document.getElementById("form-client-endereco").value.trim();
    const bairro = document.getElementById("form-client-bairro").value.trim();
    const cidade = document.getElementById("form-client-cidade").value.trim();
    const obs = document.getElementById("form-client-obs").value.trim();

    if (!nome) {
      alert("Por favor, preencha o Nome do cliente.");
      document.getElementById("form-client-nome").focus();
      return;
    }

    if (!rawWhatsapp || rawWhatsapp.replace(/\D/g, '').length < 8) {
      alert("Por favor, informe um WhatsApp válido com DDD.");
      document.getElementById("form-client-whatsapp").focus();
      return;
    }

    const clienteObj = {
      id_cliente: this.editingClientId,
      nome: nome,
      whatsapp: rawWhatsapp.replace(/\D/g, ''),
      endereco: endereco,
      bairro: bairro,
      cidade: cidade,
      observacoes: obs
    };

    await SheetsService.salvarCliente(clienteObj);
    this.closeClientCrudModal();
    this.renderClientsList();
    App.showToast("Cliente salvo com sucesso! 👤", "success");
  },

  async deleteClient(idCliente) {
    if (confirm("Tem certeza que deseja excluir este cliente da sua base de dados?")) {
      await SheetsService.excluirCliente(idCliente);
      this.renderClientsList();
      App.showToast("Cliente removido com sucesso!", "success");
    }
  },

  // =========================================================================
  // 7. GOOGLE SHEETS SYNC & CONFIGURAÇÕES DA LOJA
  // =========================================================================
  loadSettingsForm() {
    const config = SheetsService.getConfiguracoes();
    document.getElementById("cfg-nome-loja").value = config.nome_loja || "";
    document.getElementById("cfg-whatsapp-loja").value = config.whatsapp_loja || "";
    document.getElementById("cfg-taxa-entrega").value = parseFloat(config.taxa_entrega_padrao || 5).toFixed(2);
    document.getElementById("cfg-chave-pix").value = config.chave_pix || "";
    document.getElementById("cfg-sheets-url").value = config.sheets_url || "";
    document.getElementById("cfg-admin-pin").value = config.admin_pin || "1234";
    document.getElementById("cfg-tempo-entrega").value = config.tempo_entrega_estimado || "30-45 min";
  },

  async saveGeneralSettings() {
    const nome = document.getElementById("cfg-nome-loja").value.trim();
    const zap = document.getElementById("cfg-whatsapp-loja").value.trim();
    const taxa = parseFloat(document.getElementById("cfg-taxa-entrega").value.replace(',', '.')) || 5.00;
    const pix = document.getElementById("cfg-chave-pix").value.trim();
    const sheetsUrl = document.getElementById("cfg-sheets-url").value.trim();
    const pin = document.getElementById("cfg-admin-pin").value.trim() || "1234";
    const tempo = document.getElementById("cfg-tempo-entrega").value.trim();

    await SheetsService.salvarConfiguracoes({
      nome_loja: nome,
      whatsapp_loja: zap,
      taxa_entrega_padrao: taxa,
      chave_pix: pix,
      sheets_url: sheetsUrl,
      admin_pin: pin,
      tempo_entrega_estimado: tempo
    });

    App.showToast("Configurações salvas com sucesso! ⚙️", "success");
  },

  async testSheetsSync() {
    const url = document.getElementById("cfg-sheets-url").value.trim();
    if (!url) {
      alert("Por favor, informe a URL do App da Web do Google Apps Script.");
      return;
    }

    App.showToast("Conectando e sincronizando com Google Sheets...", "default");
    try {
      await SheetsService.fetchAllFromSheets(url);
      App.showToast("Sincronização com Google Sheets realizada com sucesso! 📊", "success");
      this.loadDashboardMetrics();
      this.renderOrders();
      this.renderProductsList();
      if (typeof App !== 'undefined' && App.renderProducts) {
        App.renderProducts();
        App.renderCategories();
      }
    } catch (err) {
      alert("Erro ao conectar com Google Sheets:\n" + err.message + "\n\nVerifique se o App da Web foi implantado com acesso para 'Qualquer pessoa'.");
    }
  },

  copyAppsScriptCode() {
    const scriptCode = `// Acesse o arquivo 'google-sheets-script.js' na pasta do projeto para copiar o código completo!`;
    navigator.clipboard.writeText(scriptCode);
    App.showToast("Código do Google Apps Script copiado para a área de transferência!");
  }
};

// Inicialização robusta
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => Admin.init());
} else {
  Admin.init();
}
