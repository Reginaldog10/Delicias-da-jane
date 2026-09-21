/**
 * DELÍCIAS DA JANE - Módulo de Integração com Google Sheets e Armazenamento Local
 */

const SheetsService = {
  storageKeys: {
    produtos: "delicias_jane_produtos",
    categorias: "delicias_jane_categorias",
    clientes: "delicias_jane_clientes",
    pedidos: "delicias_jane_pedidos",
    config: "delicias_jane_config",
    favoritos: "delicias_jane_favoritos",
    carrinho: "delicias_jane_carrinho",
    clienteAtivo: "delicias_jane_cliente_salvo"
  },

  // Inicializa o banco de dados local com valores padrão se estiver vazio
  init() {
    if (!localStorage.getItem(this.storageKeys.produtos)) {
      localStorage.setItem(this.storageKeys.produtos, JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem(this.storageKeys.categorias)) {
      localStorage.setItem(this.storageKeys.categorias, JSON.stringify(INITIAL_CATEGORIES));
    }
    if (!localStorage.getItem(this.storageKeys.pedidos)) {
      localStorage.setItem(this.storageKeys.pedidos, JSON.stringify(INITIAL_ORDERS));
    }
    if (!localStorage.getItem(this.storageKeys.clientes)) {
      localStorage.setItem(this.storageKeys.clientes, JSON.stringify(INITIAL_CLIENTS));
    }
    if (!localStorage.getItem(this.storageKeys.config)) {
      localStorage.setItem(this.storageKeys.config, JSON.stringify(INITIAL_CONFIG));
    } else {
      try {
        const storedCfg = JSON.parse(localStorage.getItem(this.storageKeys.config));
        if ((!storedCfg.sheets_url || !storedCfg.sheets_url.startsWith("http")) && INITIAL_CONFIG.sheets_url) {
          storedCfg.sheets_url = INITIAL_CONFIG.sheets_url;
          localStorage.setItem(this.storageKeys.config, JSON.stringify(storedCfg));
        }
      } catch (e) {}
    }
    if (!localStorage.getItem(this.storageKeys.favoritos)) {
      localStorage.setItem(this.storageKeys.favoritos, JSON.stringify([]));
    }
  },

  // Helpers de leitura
  getProdutos() {
    try {
      const data = localStorage.getItem(this.storageKeys.produtos);
      const list = (data && Array.isArray(JSON.parse(data))) ? JSON.parse(data) : INITIAL_PRODUCTS;
      return list.map(p => ({
        ...p,
        estoque: p.estoque !== undefined ? parseInt(p.estoque) : 10
      }));
    } catch (e) {
      console.error("Erro ao ler produtos:", e);
      return INITIAL_PRODUCTS;
    }
  },

  getProdutosAtivos() {
    return this.getProdutos().filter(p => p.status === "ATIVO");
  },

  getCategorias() {
    try {
      const data = localStorage.getItem(this.storageKeys.categorias);
      const list = data ? JSON.parse(data) : INITIAL_CATEGORIES;
      return Array.isArray(list) ? list : INITIAL_CATEGORIES;
    } catch (e) {
      return INITIAL_CATEGORIES;
    }
  },

  getPedidos() {
    try {
      const data = localStorage.getItem(this.storageKeys.pedidos);
      const list = data ? JSON.parse(data) : INITIAL_ORDERS;
      return Array.isArray(list) ? list : INITIAL_ORDERS;
    } catch (e) {
      return INITIAL_ORDERS;
    }
  },

  getClientes() {
    try {
      const data = localStorage.getItem(this.storageKeys.clientes);
      const list = data ? JSON.parse(data) : INITIAL_CLIENTS;
      return Array.isArray(list) ? list : INITIAL_CLIENTS;
    } catch (e) {
      return INITIAL_CLIENTS;
    }
  },

  getConfiguracoes() {
    try {
      const data = localStorage.getItem(this.storageKeys.config);
      const parsed = data ? JSON.parse(data) : {};
      const merged = { ...INITIAL_CONFIG, ...parsed };
      if ((!merged.sheets_url || !merged.sheets_url.startsWith("http")) && INITIAL_CONFIG.sheets_url) {
        merged.sheets_url = INITIAL_CONFIG.sheets_url;
      }
      return merged;
    } catch (e) {
      return INITIAL_CONFIG;
    }
  },

  getFavoritos() {
    try {
      const data = localStorage.getItem(this.storageKeys.favoritos);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  toggleFavorito(idProduto) {
    let favs = this.getFavoritos();
    if (favs.includes(idProduto)) {
      favs = favs.filter(id => id !== idProduto);
    } else {
      favs.push(idProduto);
    }
    localStorage.setItem(this.storageKeys.favoritos, JSON.stringify(favs));
    return favs;
  },

  getClienteSalvo() {
    try {
      const data = localStorage.getItem(this.storageKeys.clienteAtivo);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  salvarClienteLocal(cliente) {
    localStorage.setItem(this.storageKeys.clienteAtivo, JSON.stringify(cliente));
    
    // Atualizar base geral de clientes
    let clientes = this.getClientes();
    const idx = clientes.findIndex(c => c.whatsapp === cliente.whatsapp);
    if (idx >= 0) {
      clientes[idx] = { ...clientes[idx], ...cliente };
    } else {
      clientes.push({
        id_cliente: "CLI-" + Date.now().toString().slice(-4),
        ...cliente,
        data_cadastro: new Date().toLocaleDateString("pt-BR")
      });
    }
    localStorage.setItem(this.storageKeys.clientes, JSON.stringify(clientes));
  },

  async salvarCliente(cliente) {
    let clientes = this.getClientes();
    let isNovo = false;

    if (!cliente.id_cliente) {
      cliente.id_cliente = "CLI-" + Date.now().toString().slice(-4);
      cliente.data_cadastro = new Date().toLocaleDateString("pt-BR");
      clientes.unshift(cliente);
      isNovo = true;
    } else {
      const idx = clientes.findIndex(c => c.id_cliente === cliente.id_cliente);
      if (idx >= 0) {
        clientes[idx] = { ...clientes[idx], ...cliente };
      } else {
        clientes.unshift(cliente);
      }
    }

    localStorage.setItem(this.storageKeys.clientes, JSON.stringify(clientes));

    // Sync com Google Sheets se configurado
    this.sendPostToSheets({
      action: "salvarCliente",
      cliente: cliente
    }).catch(console.error);

    return cliente;
  },

  async excluirCliente(idCliente) {
    let clientes = this.getClientes();
    clientes = clientes.filter(c => c.id_cliente !== idCliente);
    localStorage.setItem(this.storageKeys.clientes, JSON.stringify(clientes));

    this.sendPostToSheets({
      action: "excluirCliente",
      id_cliente: idCliente
    }).catch(console.error);

    return true;
  },

  // Helpers de escrita (Produtos)
  async salvarProduto(produto) {
    let produtos = this.getProdutos();
    let isNovo = false;

    if (!produto.id_produto) {
      produto.id_produto = "PROD-" + Date.now().toString().slice(-4);
      produto.data_cadastro = new Date().toLocaleDateString("pt-BR");
      produtos.unshift(produto);
      isNovo = true;
    } else {
      const idx = produtos.findIndex(p => p.id_produto === produto.id_produto);
      if (idx >= 0) {
        produtos[idx] = { ...produtos[idx], ...produto };
      } else {
        produtos.unshift(produto);
      }
    }

    localStorage.setItem(this.storageKeys.produtos, JSON.stringify(produtos));

    // Sync com Google Sheets se configurado
    this.sendPostToSheets({
      action: "salvarProduto",
      produto: produto
    }).catch(console.error);

    return produto;
  },

  async toggleStatusProduto(idProduto) {
    let produtos = this.getProdutos();
    const prod = produtos.find(p => p.id_produto === idProduto);
    if (!prod) return null;

    prod.status = prod.status === "ATIVO" ? "INATIVO" : "ATIVO";
    localStorage.setItem(this.storageKeys.produtos, JSON.stringify(produtos));

    // Sync com Google Sheets
    this.sendPostToSheets({
      action: "toggleStatusProduto",
      id_produto: idProduto,
      status: prod.status
    }).catch(console.error);

    return prod;
  },

  async excluirProduto(idProduto) {
    let produtos = this.getProdutos();
    produtos = produtos.filter(p => p.id_produto !== idProduto);
    localStorage.setItem(this.storageKeys.produtos, JSON.stringify(produtos));

    // Sync com Google Sheets
    this.sendPostToSheets({
      action: "excluirProduto",
      id_produto: idProduto
    }).catch(console.error);

    return true;
  },

  async atualizarEstoqueProduto(idProduto, novoEstoque) {
    let produtos = this.getProdutos();
    const prod = produtos.find(p => p.id_produto === idProduto);
    if (!prod) return null;

    prod.estoque = Math.max(0, parseInt(novoEstoque) || 0);
    localStorage.setItem(this.storageKeys.produtos, JSON.stringify(produtos));

    // Sync com Google Sheets
    this.sendPostToSheets({
      action: "atualizarEstoqueProduto",
      id_produto: idProduto,
      estoque: prod.estoque
    }).catch(console.error);

    return prod;
  },

  descontarEstoqueDoPedido(itensCarrinho) {
    if (!Array.isArray(itensCarrinho) || itensCarrinho.length === 0) return;
    let produtos = this.getProdutos();

    itensCarrinho.forEach(item => {
      const prod = produtos.find(p => p.id_produto === item.id_produto);
      if (prod) {
        prod.estoque = Math.max(0, (parseInt(prod.estoque) || 0) - (parseInt(item.quantidade) || 1));
      }
    });

    localStorage.setItem(this.storageKeys.produtos, JSON.stringify(produtos));
  },

  // Helpers de escrita (Pedidos)
  async salvarPedido(pedido, cliente, itensCarrinho = []) {
    let pedidos = this.getPedidos();
    pedidos.unshift(pedido);
    localStorage.setItem(this.storageKeys.pedidos, JSON.stringify(pedidos));

    if (cliente) {
      this.salvarClienteLocal(cliente);
    }

    if (itensCarrinho && itensCarrinho.length > 0) {
      this.descontarEstoqueDoPedido(itensCarrinho);
    }

    // Sync com Google Sheets (incluindo itens para baixa de estoque na planilha)
    this.sendPostToSheets({
      action: "salvarPedido",
      pedido: pedido,
      cliente: cliente,
      itens: itensCarrinho
    }).catch(console.error);

    return pedido;
  },

  async atualizarStatusPedido(idPedido, novoStatus) {
    let pedidos = this.getPedidos();
    const pedido = pedidos.find(p => p.id_pedido === idPedido);
    if (!pedido) return null;

    pedido.status_pedido = novoStatus;
    localStorage.setItem(this.storageKeys.pedidos, JSON.stringify(pedidos));

    // Sync com Google Sheets
    this.sendPostToSheets({
      action: "atualizarStatusPedido",
      id_pedido: idPedido,
      novo_status: novoStatus
    }).catch(console.error);

    return pedido;
  },

  // Configurações
  async salvarConfiguracoes(novasConfigs) {
    const configAtual = this.getConfiguracoes();
    const mesclado = { ...configAtual, ...novasConfigs };
    localStorage.setItem(this.storageKeys.config, JSON.stringify(mesclado));

    this.sendPostToSheets({
      action: "salvarConfiguracoes",
      configuracoes: novasConfigs
    }).catch(console.error);

    return mesclado;
  },

  // Comunicação HTTP com Google Sheets (Apps Script Web App)
  async sendPostToSheets(payload) {
    const config = this.getConfiguracoes();
    let sheetsUrl = (config && config.sheets_url && config.sheets_url.startsWith("http")) 
      ? config.sheets_url.trim() 
      : ((typeof INITIAL_CONFIG !== 'undefined' && INITIAL_CONFIG.sheets_url) ? INITIAL_CONFIG.sheets_url.trim() : "");

    if (!sheetsUrl || !sheetsUrl.startsWith("http")) {
      console.warn("URL do Google Sheets não configurada para sincronização.");
      return { success: false, offline: true, message: "URL do Google Sheets não configurada." };
    }

    try {
      console.log("📤 Sincronizando alteração com Google Sheets:", payload.action, payload);
      // text/plain;charset=utf-8 evita bloqueio preflight CORS (OPTIONS) em navegadores para Google Apps Script
      const response = await fetch(sheetsUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });
      console.log("✅ Alteração enviada para o Google Sheets:", payload.action);
      return { success: true, message: "Operação enviada para o Google Sheets com sucesso!" };
    } catch (e) {
      console.warn("⚠️ Aviso ao sincronizar com Google Sheets:", e);
      return { success: false, error: e.message };
    }
  },

  async fetchAllFromSheets(sheetsUrl) {
    const targetUrl = sheetsUrl || this.getConfiguracoes().sheets_url;
    if (!targetUrl || !targetUrl.startsWith("http")) {
      throw new Error("URL do Google Sheets não informada ou inválida.");
    }

    // Persistir URL no localStorage imediatamente
    const currentCfg = this.getConfiguracoes();
    currentCfg.sheets_url = targetUrl.trim();
    localStorage.setItem(this.storageKeys.config, JSON.stringify(currentCfg));

    const urlComParam = targetUrl + (targetUrl.includes("?") ? "&" : "?") + "action=getAll&t=" + Date.now();
    let response;
    try {
      response = await fetch(urlComParam);
    } catch (netErr) {
      throw new Error("Não foi possível conectar ao Google Sheets. Verifique sua conexão com a internet ou se a URL está correta.");
    }

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw new Error(
          "Acesso Negado (Erro 403): O Google bloqueou o acesso porque o App da Web não foi configurado com permissão pública.\n\n" +
          "Como resolver em 30 segundos:\n" +
          "1. Abra seu Google Apps Script na planilha.\n" +
          "2. Clique no botão azul 'Implantar' (Deploy) -> 'Gerenciar implantações'.\n" +
          "3. Clique no ícone de lápis (Editar).\n" +
          "4. Em 'Quem tem acesso' (Who has access), mude para: 'Qualquer pessoa' (Anyone).\n" +
          "5. Em 'Versão', selecione: 'Nova versão'.\n" +
          "6. Clique em 'Implantar' (Concluir) e teste novamente!"
        );
      }
      throw new Error(`Erro na resposta do Google Sheets: HTTP ${response.status}`);
    }

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (parseErr) {
      if (text.includes("Acesso negado") || text.includes("accounts.google.com") || text.includes("drive.google.com")) {
        throw new Error(
          "Acesso Negado (Erro 403 do Google): A implantação está restrita à sua conta pessoal Google.\n\n" +
          "Para liberar o acesso:\n" +
          "1. No Apps Script, clique em Implantar -> Gerenciar implantações.\n" +
          "2. Clique em Editar (ícone de lápis).\n" +
          "3. Altere 'Quem tem acesso' para 'Qualquer pessoa' (Anyone).\n" +
          "4. Selecione 'Nova versão' e clique em 'Implantar'."
        );
      }
      throw new Error("A resposta da planilha não veio no formato JSON esperado. Verifique se o código do script foi colado e se executou a função inicializarPlanilha.");
    }

    if (result && result.success && result.data) {
      const { produtos, categorias, clientes, pedidos, configuracoes } = result.data;

      // Normalização Inteligente de Produtos (compatível com colunas em português e técnico)
      if (produtos && produtos.length > 0) {
        const normalizedProdutos = produtos.map((p, idx) => ({
          id_produto: String(p.id_produto || p.ID || p.id || ('prod-' + (idx + 1))),
          nome: p.nome || p.Nome || 'Chup-Chup Gourmet',
          categoria: p.categoria || p.Categoria || 'Chup-Chups Gourmet',
          descricao: p.descricao || p['Descrição'] || p.Descricao || '',
          preco: parseFloat(String(p.preco || p['Preço'] || p.Preco || 0).replace(',', '.')) || 6.50,
          foto_url: p.foto_url || p['URL Imagem'] || p.foto || 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80',
          status: String(p.status || p.Status || 'ATIVO').toUpperCase().includes('ATIVO') ? 'ATIVO' : 'INATIVO',
          destaque: String(p.destaque || p.Destaque || 'NAO').toUpperCase().includes('SIM') ? 'SIM' : 'NAO',
          estoque: parseInt(p.estoque !== undefined ? p.estoque : (p.Estoque !== undefined ? p.Estoque : 15)) || 0,
          data_cadastro: p.data_cadastro || p['Data Cadastro'] || new Date().toLocaleDateString('pt-BR')
        }));
        localStorage.setItem(this.storageKeys.produtos, JSON.stringify(normalizedProdutos));
      }

      // Normalização Inteligente de Categorias
      if (categorias && categorias.length > 0) {
        const normalizedCategorias = categorias.map((c, idx) => ({
          id_categoria: String(c.id_categoria || c.ID || c.id || ('cat-' + (idx + 1))),
          nome_categoria: c.nome_categoria || c.Categoria || c.nome || 'Categoria',
          ordem_exibicao: parseInt(c.ordem_exibicao) || (idx + 1),
          status: String(c.status || c.Status || 'ATIVO').toUpperCase().includes('ATIVO') ? 'ATIVO' : 'INATIVO',
          icone: c.icone || c.Icone || '🍦',
          foto_url: c.foto_url || c['URL Imagem'] || 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=300&q=80'
        }));
        localStorage.setItem(this.storageKeys.categorias, JSON.stringify(normalizedCategorias));
      }

      // Normalização Inteligente de Clientes
      if (clientes && clientes.length > 0) {
        const normalizedClientes = clientes.map((c, idx) => ({
          id_cliente: String(c.id_cliente || c.ID || c.id || ('CLI-' + (idx + 1000))),
          nome: c.nome || c.Nome || 'Cliente',
          whatsapp: String(c.whatsapp || c.WhatsApp || '').replace(/\D/g, ''),
          endereco: c.endereco || c['Endereço'] || c.Endereco || '',
          bairro: c.bairro || c.Bairro || '',
          cidade: c.cidade || c.Cidade || 'São Paulo - SP',
          complemento: c.complemento || c.Complemento || '',
          data_cadastro: c.data_cadastro || c['Data Cadastro'] || new Date().toLocaleDateString('pt-BR'),
          total_pedidos: parseInt(c.total_pedidos || c['Total de Pedidos'] || 0) || 0,
          total_gasto: parseFloat(String(c.total_gasto || c['Total Gasto'] || 0).replace(',', '.')) || 0
        }));
        localStorage.setItem(this.storageKeys.clientes, JSON.stringify(normalizedClientes));
      }

      // Normalização Inteligente de Pedidos
      if (pedidos && pedidos.length > 0) {
        const normalizedPedidos = pedidos.map((o, idx) => ({
          id_pedido: String(o.id_pedido || o['ID Pedido'] || o.ID || ('PED-' + (idx + 1000))),
          data_hora: o.data_hora || o['Data/Hora'] || new Date().toISOString(),
          id_cliente: o.id_cliente || o['ID Cliente'] || '',
          nome_cliente: o.nome_cliente || o['Nome do Cliente'] || o.nome || 'Cliente',
          whatsapp_cliente: String(o.whatsapp_cliente || o.WhatsApp || o.whatsapp || '').replace(/\D/g, ''),
          resumo_itens: o.resumo_itens || o.Itens || o.itens || '',
          subtotal: parseFloat(String(o.subtotal || o['Valor Total'] || o.total || 0).replace(',', '.')) || 0,
          taxa_entrega: parseFloat(String(o.taxa_entrega || 5).replace(',', '.')) || 5,
          total: parseFloat(String(o.total || o['Valor Total'] || 0).replace(',', '.')) || 0,
          forma_pagamento: o.forma_pagamento || o['Forma de Pagamento'] || 'Pix',
          status_pedido: String(o.status_pedido || o['Status do Pedido'] || 'NOVO').toUpperCase(),
          endereco_entrega: o.endereco_entrega || o['Endereço de Entrega'] || '',
          observacoes: o.observacoes || o['Observações'] || ''
        }));
        localStorage.setItem(this.storageKeys.pedidos, JSON.stringify(normalizedPedidos));
      }

      if (configuracoes && Object.keys(configuracoes).length > 0) {
        const configLocal = this.getConfiguracoes();
        localStorage.setItem(this.storageKeys.config, JSON.stringify({ ...configLocal, ...configuracoes }));
      }
      return result.data;
    } else {
      throw new Error(result.error || "Estrutura de dados retornada pelo Google Sheets inválida.");
    }
  }
};

// Auto-inicialização
SheetsService.init();
