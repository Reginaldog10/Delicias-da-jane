/**
 * DELÍCIAS DA JANE - Módulo Principal do Cliente (Mobile-First)
 */

const App = {
  cart: [],
  selectedCategory: "todos",
  searchTerm: "",
  currentBannerIndex: 0,
  bannerTimer: null,
  activeProductModal: null,

  init() {
    this.loadCartFromStorage();
    this.renderHeader();
    this.renderBanners();
    this.renderCategories();
    this.renderProducts();
    this.updateCartBadge();
    this.setupEventListeners();
    this.startBannerAutoPlay();
    this.applyStoreStatus();
    this.initSidebar();
  },

  // Controle da Sidebar Desktop (Expansível / Reclinável)
  initSidebar() {
    const isCollapsed = localStorage.getItem("delicias_sidebar_collapsed") === "true";
    if (isCollapsed) {
      const sidebar = document.getElementById("desktop-sidebar");
      const layout = document.getElementById("main-layout");
      const btn = document.getElementById("sidebar-toggle-btn");
      if (sidebar) sidebar.classList.add("collapsed");
      if (layout) layout.classList.add("sidebar-collapsed");
      if (btn) {
        btn.setAttribute("title", "Expandir menu");
        btn.setAttribute("aria-label", "Expandir menu");
      }
    }
  },

  toggleSidebar() {
    const sidebar = document.getElementById("desktop-sidebar");
    const layout = document.getElementById("main-layout");
    const btn = document.getElementById("sidebar-toggle-btn");
    if (!sidebar) return;

    const willCollapse = !sidebar.classList.contains("collapsed");
    sidebar.classList.toggle("collapsed", willCollapse);
    if (layout) layout.classList.toggle("sidebar-collapsed", willCollapse);

    if (btn) {
      const label = willCollapse ? "Expandir menu" : "Recolher menu";
      btn.setAttribute("title", label);
      btn.setAttribute("aria-label", label);
    }

    localStorage.setItem("delicias_sidebar_collapsed", willCollapse ? "true" : "false");
  },

  selectSidebarItem(el) {
    document.querySelectorAll(".sidebar-nav-item").forEach(btn => btn.classList.remove("active"));
    if (el) el.classList.add("active");
  },

  // Armazenamento do Carrinho
  loadCartFromStorage() {
    try {
      const saved = localStorage.getItem(SheetsService.storageKeys.carrinho);
      this.cart = saved ? JSON.parse(saved) : [];
    } catch (e) {
      this.cart = [];
    }
  },

  saveCartToStorage() {
    localStorage.setItem(SheetsService.storageKeys.carrinho, JSON.stringify(this.cart));
    this.updateCartBadge();
  },

  // Aplicação do Status da Loja (Aberto / Fechado)
  applyStoreStatus() {
    const config = SheetsService.getConfiguracoes();
    const statusDot = document.getElementById("header-status-dot");
    const statusText = document.getElementById("header-status-text");
    const bannerStatus = document.getElementById("store-status-banner");

    if (config.status_loja === "FECHADO") {
      if (statusDot) statusDot.classList.add("closed");
      if (statusText) statusText.textContent = "Fechado no momento";
      if (bannerStatus) {
        bannerStatus.classList.remove("hidden");
        bannerStatus.innerHTML = `⚠️ <strong>Loja Fechada:</strong> Estamos fora do horário de atendimento. Você pode navegar pelo cardápio e agendar seu pedido!`;
      }
    } else {
      if (statusDot) statusDot.classList.remove("closed");
      if (statusText) statusText.textContent = "Aberto agora";
      if (bannerStatus) bannerStatus.classList.add("hidden");
    }
  },

  // Renderização do Header e Nome da Loja
  renderHeader() {
    const config = SheetsService.getConfiguracoes();
    const storeNameEl = document.getElementById("header-store-name");
    if (storeNameEl) {
      storeNameEl.textContent = config.nome_loja || "Delícias da Jane";
    }
  },

  // Renderização do Carrossel de Banners
  renderBanners() {
    const track = document.getElementById("banner-track");
    const dotsContainer = document.getElementById("banner-dots");
    if (!track || !dotsContainer) return;

    const banners = [
      {
        tag: "🔥 MAIS PEDIDO",
        title: "A MELHOR SOBREMESA DA CIDADE!",
        desc: "Chup-chups gourmet artesanais super cremosos e recheados com pura Nutella.",
        cta: "Pedir Ninho c/ Nutella",
        prodId: "prod-1",
        bgClass: "slide-1",
        img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80"
      },
      {
        tag: "🎁 COMBO FAMÍLIA",
        title: "COMBO DEGUSTAÇÃO (5 UNID)",
        desc: "Experimente os 5 sabores mais vendidos com embalagem térmica grátis!",
        cta: "Garantir Combo por R$ 29,90",
        prodId: "prod-9",
        bgClass: "slide-2",
        img: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80"
      },
      {
        tag: "🍰 NOVIDADE",
        title: "BOLOS NO POTE ESPECIAIS",
        desc: "Red Velvet, Banoffee e Ninho Trufado com massa aveludada.",
        cta: "Ver Sobremesas",
        category: "Sobremesas no Pote",
        bgClass: "slide-3",
        img: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80"
      }
    ];

    track.innerHTML = banners.map((b, idx) => `
      <div class="banner-slide ${b.bgClass}">
        <div>
          <span class="banner-badge">${b.tag}</span>
          <h2 class="banner-title">${b.title}</h2>
          <p class="banner-subtitle">${b.desc}</p>
        </div>
        <button class="banner-cta-btn" onclick="App.handleBannerClick('${b.prodId || ''}', '${b.category || ''}')">
          ${b.cta} <span>→</span>
        </button>
      </div>
    `).join("");

    dotsContainer.innerHTML = banners.map((_, idx) => `
      <div class="banner-dot ${idx === 0 ? 'active' : ''}" onclick="App.goToBanner(${idx})"></div>
    `).join("");
  },

  handleBannerClick(prodId, category) {
    if (prodId) {
      this.openProductModal(prodId);
    } else if (category) {
      this.filterByCategory(category);
      const prodSection = document.getElementById("products-section");
      if (prodSection) prodSection.scrollIntoView({ behavior: 'smooth' });
    }
  },

  startBannerAutoPlay() {
    clearInterval(this.bannerTimer);
    this.bannerTimer = setInterval(() => {
      const track = document.getElementById("banner-track");
      if (!track) return;
      const totalSlides = track.children.length;
      if (totalSlides <= 1) return;
      this.currentBannerIndex = (this.currentBannerIndex + 1) % totalSlides;
      this.updateBannerSlide();
    }, 4500);
  },

  goToBanner(index) {
    this.currentBannerIndex = index;
    this.updateBannerSlide();
    this.startBannerAutoPlay();
  },

  updateBannerSlide() {
    const track = document.getElementById("banner-track");
    const dots = document.querySelectorAll(".banner-dot");
    if (!track) return;

    track.style.transform = `translateX(-${this.currentBannerIndex * 100}%)`;
    dots.forEach((d, idx) => {
      d.classList.toggle("active", idx === this.currentBannerIndex);
    });
  },

  // Renderização das Categorias Circulares
  renderCategories() {
    const container = document.getElementById("categories-carousel");
    if (!container) return;

    const categories = SheetsService.getCategorias().filter(c => c.status === "ATIVO");

    let html = `
      <div class="category-item ${this.selectedCategory === 'todos' ? 'active' : ''}" onclick="App.filterByCategory('todos')">
        <div class="category-avatar">
          <span class="category-emoji">✨</span>
        </div>
        <span class="category-name">Todos</span>
      </div>
    `;

    categories.forEach(cat => {
      const isActive = this.selectedCategory === cat.nome_categoria;
      html += `
        <div class="category-item ${isActive ? 'active' : ''}" onclick="App.filterByCategory('${cat.nome_categoria}')">
          <div class="category-avatar">
            ${cat.foto_url ? `<img src="${cat.foto_url}" alt="${cat.nome_categoria}" loading="lazy">` : `<span class="category-emoji">${cat.icone || '🍧'}</span>`}
          </div>
          <span class="category-name">${cat.nome_categoria}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  filterByCategory(catName) {
    this.selectedCategory = catName;
    this.renderCategories();
    this.renderProducts();
  },

  // Renderização do Grid de Produtos (2 Colunas Mobile)
  renderProducts() {
    const grid = document.getElementById("products-grid");
    const sectionTitle = document.getElementById("products-section-title");
    const countEl = document.getElementById("products-count");
    if (!grid) return;

    let products = SheetsService.getProdutosAtivos();
    const favorites = SheetsService.getFavoritos();

    // Filtro de Categoria
    if (this.selectedCategory !== "todos") {
      products = products.filter(p => p.categoria === this.selectedCategory);
      if (sectionTitle) sectionTitle.innerHTML = `🍧 ${this.selectedCategory}`;
    } else {
      if (sectionTitle) sectionTitle.innerHTML = `✨ Cardápio Completo`;
    }

    // Filtro de Busca
    if (this.searchTerm.trim() !== "") {
      const term = this.searchTerm.toLowerCase();
      products = products.filter(p => 
        p.nome.toLowerCase().includes(term) || 
        p.descricao.toLowerCase().includes(term) ||
        p.categoria.toLowerCase().includes(term)
      );
      if (sectionTitle) sectionTitle.innerHTML = `🔍 Resultados para "${this.searchTerm}"`;
    }

    if (countEl) {
      countEl.textContent = `${products.length} itens`;
    }

    if (products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <div style="font-size: 48px; margin-bottom: 8px;">🍦</div>
          <h3 style="font-family: var(--font-heading); color: var(--text-main); margin-bottom: 4px;">Nenhum item encontrado</h3>
          <p style="font-size: 0.85rem;">Tente buscar por outro termo ou selecione outra categoria.</p>
          <button class="banner-cta-btn" style="margin: 16px auto 0 auto;" onclick="App.resetFilters()">Ver todos os produtos</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = products.map(prod => {
      const isFav = favorites.includes(prod.id_produto);
      const isFeatured = prod.destaque === "SIM";
      const isEsgotado = (parseInt(prod.estoque) || 0) <= 0;
      const isEstoqueBaixo = !isEsgotado && (parseInt(prod.estoque) || 0) <= 3;

      return `
        <div class="product-card ${isEsgotado ? 'out-of-stock' : ''}" id="card-${prod.id_produto}">
          <div class="product-image-wrap" onclick="App.openProductModal('${prod.id_produto}')">
            <img src="${prod.foto_url}" alt="${prod.nome}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80'">
            ${isFeatured && !isEsgotado ? `<span class="badge-featured">⭐ Destaque</span>` : ''}
            ${isEsgotado ? `<span class="badge-stock-out">🚫 Esgotado</span>` : (isEstoqueBaixo ? `<span class="badge-stock-low">⚡ Restam ${prod.estoque} un.</span>` : '')}
            <button class="btn-fav ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); App.toggleFavorite('${prod.id_produto}')" title="Favoritar">
              ${isFav ? '❤️' : '🤍'}
            </button>
          </div>
          <div class="product-info">
            <div>
              <h3 class="product-title" onclick="App.openProductModal('${prod.id_produto}')">${prod.nome}</h3>
              <p class="product-desc">${prod.descricao}</p>
            </div>
            <div class="product-footer">
              <div class="product-price">
                <small>R$ </small>${parseFloat(prod.preco).toFixed(2).replace('.', ',')}
              </div>
              <button class="btn-add-cart ${isEsgotado ? 'disabled' : ''}" 
                onclick="${isEsgotado ? 'event.stopPropagation()' : `App.quickAddToCart('${prod.id_produto}')`}" 
                title="${isEsgotado ? 'Produto Esgotado' : 'Adicionar à Sacola'}"
                ${isEsgotado ? 'disabled' : ''}>
                ${isEsgotado ? '✕' : '+'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  resetFilters() {
    this.selectedCategory = "todos";
    this.searchTerm = "";
    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.value = "";
    const clearBtn = document.getElementById("search-clear-btn");
    if (clearBtn) clearBtn.style.display = "none";
    this.renderCategories();
    this.renderProducts();
  },

  // Favoritos
  toggleFavorite(idProduto) {
    SheetsService.toggleFavorito(idProduto);
    this.renderProducts();
    this.showToast("Lista de favoritos atualizada! ❤️");
  },

  // Adição Rápida ao Carrinho
  quickAddToCart(idProduto) {
    const products = SheetsService.getProdutos();
    const prod = products.find(p => p.id_produto === idProduto);
    if (!prod) return;

    const estoqueDisponivel = parseInt(prod.estoque) || 0;
    if (estoqueDisponivel <= 0) {
      this.showToast("Ops! Este produto está esgotado no momento. 🚫", "error");
      return;
    }

    const existingIndex = this.cart.findIndex(item => item.id_produto === idProduto && !item.observacao);
    if (existingIndex >= 0) {
      if (this.cart[existingIndex].quantidade >= estoqueDisponivel) {
        this.showToast(`Limite de estoque atingido (${estoqueDisponivel} un.)! ⚠️`, "error");
        return;
      }
      this.cart[existingIndex].quantidade += 1;
    } else {
      this.cart.push({
        id_produto: prod.id_produto,
        nome: prod.nome,
        preco: parseFloat(prod.preco),
        foto_url: prod.foto_url,
        categoria: prod.categoria,
        quantidade: 1,
        observacao: ""
      });
    }

    this.saveCartToStorage();
    this.animateCartBadge();
    this.showToast(`+1 ${prod.nome} na sacola! 🛍️`);
  },

  // Modal de Detalhes do Produto
  openProductModal(idProduto) {
    const products = SheetsService.getProdutos();
    const prod = products.find(p => p.id_produto === idProduto);
    if (!prod) return;

    const isEsgotado = (parseInt(prod.estoque) || 0) <= 0;

    this.activeProductModal = {
      ...prod,
      modalQty: 1,
      modalObs: "",
      isEsgotado: isEsgotado
    };

    const modal = document.getElementById("product-detail-modal");
    if (!modal) return;

    document.getElementById("modal-prod-img").src = prod.foto_url;
    document.getElementById("modal-prod-category").textContent = prod.categoria;
    document.getElementById("modal-prod-title").textContent = prod.nome;
    document.getElementById("modal-prod-desc").textContent = prod.descricao;
    document.getElementById("modal-prod-price").innerHTML = `<small>R$ </small>${parseFloat(prod.preco).toFixed(2).replace('.', ',')}`;
    document.getElementById("modal-qty-val").textContent = "1";
    document.getElementById("modal-obs-input").value = "";

    const btnConfirm = document.getElementById("modal-confirm-btn");
    const qtyActions = document.querySelector(".modal-qty-row");
    if (btnConfirm) {
      if (isEsgotado) {
        btnConfirm.textContent = "Produto Esgotado 🚫";
        btnConfirm.classList.add("disabled");
        btnConfirm.disabled = true;
      } else {
        btnConfirm.textContent = "Adicionar à Sacola";
        btnConfirm.classList.remove("disabled");
        btnConfirm.disabled = false;
      }
    }

    modal.classList.add("open");
  },

  closeProductModal() {
    const modal = document.getElementById("product-detail-modal");
    if (modal) modal.classList.remove("open");
    this.activeProductModal = null;
  },

  adjustModalQty(delta) {
    if (!this.activeProductModal || this.activeProductModal.isEsgotado) return;
    const estoqueMax = parseInt(this.activeProductModal.estoque) || 99;
    let newQty = (this.activeProductModal.modalQty || 1) + delta;
    if (newQty < 1) newQty = 1;
    if (newQty > estoqueMax) {
      this.showToast(`Quantidade máxima disponível: ${estoqueMax} un.`, "error");
      newQty = estoqueMax;
    }
    this.activeProductModal.modalQty = newQty;
    document.getElementById("modal-qty-val").textContent = newQty;
    
    const unitPrice = parseFloat(this.activeProductModal.preco);
    const totalPrice = unitPrice * newQty;
    document.getElementById("modal-prod-price").innerHTML = `<small>R$ </small>${totalPrice.toFixed(2).replace('.', ',')}`;
  },

  confirmModalAddToCart() {
    if (!this.activeProductModal || this.activeProductModal.isEsgotado) return;
    const estoqueMax = parseInt(this.activeProductModal.estoque) || 99;
    const obs = document.getElementById("modal-obs-input").value.trim();
    const qty = this.activeProductModal.modalQty || 1;

    const existingIndex = this.cart.findIndex(
      item => item.id_produto === this.activeProductModal.id_produto && item.observacao === obs
    );

    const qtyAtual = existingIndex >= 0 ? this.cart[existingIndex].quantidade : 0;
    if (qtyAtual + qty > estoqueMax) {
      this.showToast(`Estoque insuficiente! Disponível: ${estoqueMax} un.`, "error");
      return;
    }

    if (existingIndex >= 0) {
      this.cart[existingIndex].quantidade += qty;
    } else {
      this.cart.push({
        id_produto: this.activeProductModal.id_produto,
        nome: this.activeProductModal.nome,
        preco: parseFloat(this.activeProductModal.preco),
        foto_url: this.activeProductModal.foto_url,
        categoria: this.activeProductModal.categoria,
        quantidade: qty,
        observacao: obs
      });
    }

    this.saveCartToStorage();
    this.animateCartBadge();
    this.closeProductModal();
    this.showToast(`${qty}x ${this.activeProductModal.nome} na sacola! 🛍️`);
  },

  // Carrinho / Sacola de Compras Drawer
  openCartDrawer() {
    this.renderCartDrawer();
    const drawer = document.getElementById("cart-drawer-backdrop");
    if (drawer) drawer.classList.add("open");
  },

  closeCartDrawer() {
    const drawer = document.getElementById("cart-drawer-backdrop");
    if (drawer) drawer.classList.remove("open");
  },

  renderCartDrawer() {
    const body = document.getElementById("cart-drawer-body");
    const footer = document.getElementById("cart-drawer-footer");
    if (!body || !footer) return;

    if (this.cart.length === 0) {
      body.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon">🛍️</div>
          <h3 class="cart-empty-title">Sua sacola está vazia</h3>
          <p class="cart-empty-desc">Escolha seus chup-chups gourmet e sobremesas favoritas para começar o pedido!</p>
          <button class="banner-cta-btn" style="margin-top: 10px;" onclick="App.closeCartDrawer()">Explorar Cardápio</button>
        </div>
      `;
      footer.style.display = "none";
      return;
    }

    footer.style.display = "block";

    // Carregar dados salvos do cliente se houver
    const clienteSalvo = SheetsService.getClienteSalvo() || {};
    const config = SheetsService.getConfiguracoes();
    const taxaEntrega = parseFloat(config.taxa_entrega_padrao) || 5.00;

    let subtotal = 0;
    const itemsHtml = this.cart.map((item, index) => {
      const itemTotal = item.preco * item.quantidade;
      subtotal += itemTotal;
      return `
        <div class="cart-item">
          <img src="${item.foto_url}" class="cart-item-img" alt="${item.nome}">
          <div class="cart-item-details">
            <h4 class="cart-item-name">${item.nome}</h4>
            <div class="cart-item-price">R$ ${itemTotal.toFixed(2).replace('.', ',')} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">(R$ ${item.preco.toFixed(2).replace('.', ',')} un.)</span></div>
            ${item.observacao ? `<div class="cart-item-obs">Obs: ${item.observacao}</div>` : ''}
          </div>
          <div class="cart-item-actions">
            <button class="qty-btn" onclick="App.changeCartQty(${index}, -1)">-</button>
            <span class="qty-value">${item.quantidade}</span>
            <button class="qty-btn" onclick="App.changeCartQty(${index}, 1)">+</button>
          </div>
        </div>
      `;
    }).join("");

    const total = subtotal + taxaEntrega;

    body.innerHTML = `
      <div class="cart-items-list">
        ${itemsHtml}
      </div>

      <div class="checkout-section-title">📍 Dados para Entrega</div>
      <div class="form-group">
        <label class="form-label">Seu Nome *</label>
        <input type="text" id="checkout-nome" class="form-input" placeholder="Ex: Maria Oliveira" value="${clienteSalvo.nome || ''}">
      </div>

      <div class="form-group">
        <label class="form-label">Seu WhatsApp com DDD *</label>
        <input type="tel" id="checkout-whatsapp" class="form-input" placeholder="Ex: 11999998888" value="${clienteSalvo.whatsapp || ''}">
      </div>

      <div class="form-group">
        <label class="form-label">Endereço de Entrega Completo *</label>
        <input type="text" id="checkout-endereco" class="form-input" placeholder="Rua, Número, Complemento / Apto" value="${clienteSalvo.endereco || ''}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Bairro *</label>
          <input type="text" id="checkout-bairro" class="form-input" placeholder="Seu Bairro" value="${clienteSalvo.bairro || config.bairro_padrao || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Cidade</label>
          <input type="text" id="checkout-cidade" class="form-input" placeholder="Cidade" value="${clienteSalvo.cidade || config.cidade_padrao || ''}">
        </div>
      </div>

      <div class="checkout-section-title">💳 Forma de Pagamento</div>
      <div class="payment-options">
        <label class="payment-card active" onclick="App.selectPayment('Pix', this)">
          <input type="radio" name="pagamento" value="Pix" checked>
          <div class="payment-icon">⚡</div>
          <span class="payment-label">Pix</span>
        </label>
        <label class="payment-card" onclick="App.selectPayment('Cartão', this)">
          <input type="radio" name="pagamento" value="Cartão">
          <div class="payment-icon">💳</div>
          <span class="payment-label">Cartão</span>
        </label>
        <label class="payment-card" onclick="App.selectPayment('Dinheiro', this)">
          <input type="radio" name="pagamento" value="Dinheiro">
          <div class="payment-icon">💵</div>
          <span class="payment-label">Dinheiro</span>
        </label>
      </div>

      <div id="troco-field" class="form-group hidden">
        <label class="form-label">Precisa de troco para quanto?</label>
        <input type="text" id="checkout-troco" class="form-input" placeholder="Ex: Troco para R$ 50,00">
      </div>

      <div class="form-group">
        <label class="form-label">Observações Gerais do Pedido</label>
        <textarea id="checkout-obs" class="form-textarea" placeholder="Ex: Deixar na portaria, campainha não funciona..."></textarea>
      </div>
    `;

    // Atualizar Linhas de Resumo
    document.getElementById("summary-subtotal").textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    document.getElementById("summary-taxa").textContent = `R$ ${taxaEntrega.toFixed(2).replace('.', ',')}`;
    document.getElementById("summary-total").textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
  },

  selectPayment(tipo, el) {
    document.querySelectorAll(".payment-card").forEach(c => c.classList.remove("active"));
    el.classList.add("active");
    const trocoBox = document.getElementById("troco-field");
    if (trocoBox) {
      if (tipo === "Dinheiro") {
        trocoBox.classList.remove("hidden");
      } else {
        trocoBox.classList.add("hidden");
      }
    }
  },

  changeCartQty(index, delta) {
    if (!this.cart[index]) return;
    this.cart[index].quantidade += delta;
    if (this.cart[index].quantidade <= 0) {
      this.cart.splice(index, 1);
    }
    this.saveCartToStorage();
    this.renderCartDrawer();
  },

  updateCartBadge() {
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantidade, 0);
    const subtotal = this.cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);

    const badges = document.querySelectorAll(".cart-counter-badge");
    badges.forEach(b => {
      b.textContent = totalItems;
      b.style.display = totalItems > 0 ? "flex" : "none";
    });

    // Atualizar Carrinho Flutuante Desktop
    const floatingTotal = document.getElementById("desktop-floating-total");
    if (floatingTotal) {
      floatingTotal.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    }
  },

  animateCartBadge() {
    const badges = document.querySelectorAll(".cart-counter-badge");
    badges.forEach(b => {
      b.classList.add("pop");
      setTimeout(() => b.classList.remove("pop"), 300);
    });

    const floatingCart = document.getElementById("desktop-floating-cart");
    if (floatingCart) {
      floatingCart.style.transform = "translateY(-6px) scale(1.06)";
      setTimeout(() => {
        floatingCart.style.transform = "";
      }, 300);
    }
  },

  // Finalização do Pedido & Envio para o WhatsApp
  async finalizeOrder() {
    if (this.cart.length === 0) {
      this.showToast("Sua sacola está vazia!", "error");
      return;
    }

    const nome = document.getElementById("checkout-nome")?.value.trim();
    const rawWhatsapp = document.getElementById("checkout-whatsapp")?.value.trim();
    const endereco = document.getElementById("checkout-endereco")?.value.trim();
    const bairro = document.getElementById("checkout-bairro")?.value.trim();
    const cidade = document.getElementById("checkout-cidade")?.value.trim();
    const obs = document.getElementById("checkout-obs")?.value.trim();
    const troco = document.getElementById("checkout-troco")?.value.trim();

    if (!nome) {
      alert("Por favor, preencha o seu Nome.");
      document.getElementById("checkout-nome")?.focus();
      return;
    }
    if (!rawWhatsapp || rawWhatsapp.length < 9) {
      alert("Por favor, informe um WhatsApp válido com DDD.");
      document.getElementById("checkout-whatsapp")?.focus();
      return;
    }
    if (!endereco || !bairro) {
      alert("Por favor, preencha o Endereço e o Bairro para entrega.");
      document.getElementById("checkout-endereco")?.focus();
      return;
    }

    const formaPagamentoEl = document.querySelector('input[name="pagamento"]:checked');
    let formaPagamento = formaPagamentoEl ? formaPagamentoEl.value : "Pix";
    if (formaPagamento === "Dinheiro" && troco) {
      formaPagamento += ` (Troco para: ${troco})`;
    }

    const config = SheetsService.getConfiguracoes();
    const taxaEntrega = parseFloat(config.taxa_entrega_padrao) || 5.00;
    const subtotal = this.cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    const total = subtotal + taxaEntrega;

    const idPedido = "PED-" + Math.floor(1000 + Math.random() * 9000);
    const enderecoCompleto = `${endereco}, ${bairro} - ${cidade || config.cidade_padrao}`;

    const resumoItens = this.cart.map(i => `${i.quantidade}x ${i.nome}${i.observacao ? ` (Obs: ${i.observacao})` : ''}`).join(", ");

    const novoCliente = {
      id_cliente: "CLI-" + rawWhatsapp.replace(/\D/g, '').slice(-4),
      nome: nome,
      whatsapp: rawWhatsapp.replace(/\D/g, ''),
      endereco: endereco,
      bairro: bairro,
      cidade: cidade || config.cidade_padrao
    };

    const novoPedido = {
      id_pedido: idPedido,
      data_hora: new Date().toISOString(),
      id_cliente: novoCliente.id_cliente,
      nome_cliente: nome,
      whatsapp_cliente: novoCliente.whatsapp,
      resumo_itens: resumoItens,
      subtotal: subtotal,
      taxa_entrega: taxaEntrega,
      total: total,
      forma_pagamento: formaPagamento,
      status_pedido: "NOVO",
      endereco_entrega: enderecoCompleto,
      observacoes: obs
    };

    // 1. Gravar imediatamente no banco / Google Sheets e dar baixa no estoque
    await SheetsService.salvarPedido(novoPedido, novoCliente, this.cart);

    // 2. Montar mensagem formatada para o WhatsApp
    const itensMsg = this.cart.map(item => {
      const itemSub = (item.preco * item.quantidade).toFixed(2).replace('.', ',');
      return `▫️ *${item.quantidade}x* ${item.nome} - R$ ${itemSub}${item.observacao ? `\n   ↳ _Obs: ${item.observacao}_` : ''}`;
    }).join("\n");

    let zapMsg = `🍦 *NOVO PEDIDO - ${config.nome_loja.toUpperCase()}*\n`;
    zapMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    zapMsg += `🆔 *Pedido:* #${idPedido}\n`;
    zapMsg += `👤 *Cliente:* ${nome}\n`;
    zapMsg += `📱 *WhatsApp:* ${rawWhatsapp}\n`;
    zapMsg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    zapMsg += `📋 *ITENS DO PEDIDO:*\n${itensMsg}\n\n`;
    zapMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    zapMsg += `💵 *Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    zapMsg += `🛵 *Taxa de Entrega:* R$ ${taxaEntrega.toFixed(2).replace('.', ',')}\n`;
    zapMsg += `💰 *TOTAL A PAGAR:* *R$ ${total.toFixed(2).replace('.', ',')}*\n`;
    zapMsg += `💳 *Forma de Pagamento:* ${formaPagamento}\n`;
    if (formaPagamento.includes("Pix") && config.chave_pix) {
      zapMsg += `🔑 *Chave Pix:* ${config.chave_pix}\n`;
    }
    zapMsg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    zapMsg += `📍 *ENDEREÇO DE ENTREGA:*\n${enderecoCompleto}\n`;
    if (obs) {
      zapMsg += `\n📝 *Observações:* ${obs}\n`;
    }
    zapMsg += `\n⏰ *Previsão de Entrega:* ${config.tempo_entrega_estimado || '30-45 min'}\n`;
    zapMsg += `\n_Por favor, confirme o recebimento deste pedido! Obrigado pela preferência ❤️_`;

    // 3. Limpar carrinho e fechar drawer
    this.cart = [];
    this.saveCartToStorage();
    this.closeCartDrawer();

    // 4. Redirecionar para WhatsApp da loja
    const storeWhatsapp = (config.whatsapp_loja || "5511987654321").replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(zapMsg);
    const zapUrl = `https://wa.me/${storeWhatsapp}?text=${encodedMsg}`;

    this.showToast("Pedido gerado com sucesso! Abrindo WhatsApp... 🚀", "success");
    setTimeout(() => {
      window.open(zapUrl, "_blank");
    }, 600);
  },

  // Listeners de Eventos
  setupEventListeners() {
    // Busca em Tempo Real (Mobile e Desktop)
    const handleSearch = (e) => {
      this.searchTerm = e.target.value;
      const clearBtn = document.getElementById("search-clear-btn");
      if (clearBtn) {
        clearBtn.style.display = this.searchTerm ? "flex" : "none";
      }
      // Sincroniza ambos os campos
      const mobileInput = document.getElementById("search-input");
      const desktopInput = document.getElementById("desktop-search-input");
      if (mobileInput && mobileInput !== e.target) mobileInput.value = this.searchTerm;
      if (desktopInput && desktopInput !== e.target) desktopInput.value = this.searchTerm;

      this.renderProducts();
    };

    const searchInput = document.getElementById("search-input");
    const desktopSearchInput = document.getElementById("desktop-search-input");
    const clearBtn = document.getElementById("search-clear-btn");

    if (searchInput) searchInput.addEventListener("input", handleSearch);
    if (desktopSearchInput) desktopSearchInput.addEventListener("input", handleSearch);

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (desktopSearchInput) desktopSearchInput.value = "";
        this.searchTerm = "";
        clearBtn.style.display = "none";
        this.renderProducts();
      });
    }

    // Modal Backdrop click para fechar
    const modalBackdrop = document.getElementById("product-detail-modal");
    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) this.closeProductModal();
      });
    }

    const drawerBackdrop = document.getElementById("cart-drawer-backdrop");
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener("click", (e) => {
        if (e.target === drawerBackdrop) this.closeCartDrawer();
      });
    }
  },

  showAboutModal() {
    const config = SheetsService.getConfiguracoes();
    alert(`🍦 ${config.nome_loja}\n\nSomos especialistas em Chup-Chups Gourmet e Sobremesas Artesanais de alta cremosidade, feitos com ingredientes selecionados e muito carinho!\n\n📍 Atendemos na cidade com entregas rápidas via WhatsApp.`);
  },

  showToast(msg, type = "default") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type === 'success' ? 'success' : (type === 'error' ? 'error' : '')}`;
    toast.textContent = msg;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }
};

// Iniciar quando o DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => App.init());
} else {
  App.init();
}
