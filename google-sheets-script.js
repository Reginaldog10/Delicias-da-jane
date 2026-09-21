/**
 * ============================================================================
 * DELÍCIAS DA JANE - BACKEND GOOGLE APPS SCRIPT (VERSÃO UNIVERSAL & COMPLETA)
 * ============================================================================
 * 
 * Este script conecta o catálogo/painel administrativo "Delícias da Jane" à sua
 * planilha Google Sheets, com MAPEAMENTO DINÂMICO INTELIGENTE DE COLUNAS:
 *  - Funciona com cabeçalhos em Português ("Preço", "Estoque", "Descrição", "URL Imagem", etc.)
 *    ou formatos técnicos ("preco", "estoque", "descricao", "foto_url", etc.)
 *  - Reconhece as colunas em qualquer ordem!
 *  - Atualiza produtos, estoques, clientes e pedidos em TEMPO REAL!
 *  - Cria novos produtos e pedidos alinhando perfeitamente as colunas!
 * 
 * ----------------------------------------------------------------------------
 * COMO ATUALIZAR NA SUA PLANILHA:
 * ----------------------------------------------------------------------------
 * 1. Abra sua planilha Google Sheets.
 * 2. No menu superior, clique em: Extensões -> Apps Script.
 * 3. Selecione todo o código antigo (Ctrl + A) e apague (Delete).
 * 4. Cole todo este código novo no editor.
 * 5. Clique no ícone de disquete "Salvar projeto" (Ctrl + S).
 * 6. No canto superior direito, clique em "Implantar" (Deploy) -> "Gerenciar implantações".
 * 7. Clique no ícone de Lápis (Editar).
 * 8. Em "Versão", selecione: "Nova versão".
 * 9. Em "Quem tem acesso", confirme: "Qualquer pessoa" (Anyone).
 * 10. Clique no botão azul "Implantar" e depois em "Concluído"!
 * ============================================================================
 */

// ============================================================================
// DICIONÁRIOS DE MAPEAMENTO DINÂMICO DE COLUNAS (PORTUGUÊS / INGLÊS / TÉCNICO)
// ============================================================================
const ALIASES_PRODUTOS = {
  id_produto: ['id', 'id_produto', 'id produto', 'código', 'codigo', 'cod'],
  nome: ['nome', 'produto', 'nome do produto', 'item', 'título', 'titulo', 'nome_produto'],
  categoria: ['categoria', 'categoria_produto', 'categorias', 'depto', 'departamento'],
  preco: ['preço', 'preco', 'valor', 'preço unitário', 'preco unitario', 'valor unitario', 'valor (r$)'],
  estoque: ['estoque', 'quantidade', 'qtd', 'qtd estoque', 'quantidade em estoque', 'saldo'],
  destaque: ['destaque', 'destaque?', 'é destaque', 'em destaque'],
  status: ['status', 'ativo', 'situação', 'situacao', 'ativo?'],
  descricao: ['descrição', 'descricao', 'detalhes', 'observações', 'observacoes', 'ingredientes'],
  foto_url: ['url imagem', 'url_imagem', 'imagem', 'foto', 'foto_url', 'imagem_url', 'link imagem', 'link foto'],
  data_cadastro: ['data cadastro', 'data_cadastro', 'data', 'criado em']
};

const ALIASES_PEDIDOS = {
  id_pedido: ['id pedido', 'id_pedido', 'pedido', 'número', 'numero', 'código pedido', 'id'],
  data_hora: ['data/hora', 'data_hora', 'data', 'data e hora', 'hora', 'criado em'],
  id_cliente: ['id cliente', 'id_cliente', 'código cliente', 'cliente_id'],
  nome_cliente: ['nome do cliente', 'nome cliente', 'cliente', 'nome'],
  whatsapp_cliente: ['whatsapp', 'whats', 'celular', 'telefone', 'contato', 'fone'],
  endereco_entrega: ['endereço de entrega', 'endereco de entrega', 'endereço', 'endereco', 'local de entrega', 'entrega'],
  resumo_itens: ['itens', 'produtos', 'resumo_itens', 'pedido itens', 'lista itens', 'resumo'],
  observacoes: ['observações', 'observacoes', 'obs', 'detalhes', 'nota'],
  forma_pagamento: ['forma de pagamento', 'forma_pagamento', 'pagamento', 'método', 'tipo pagamento'],
  total: ['valor total', 'total', 'subtotal', 'valor', 'total (r$)'],
  status_pedido: ['status do pedido', 'status pedido', 'status', 'situação', 'situacao']
};

const ALIASES_CLIENTES = {
  id_cliente: ['id', 'id_cliente', 'código', 'codigo', 'id cliente'],
  nome: ['nome', 'nome_cliente', 'cliente', 'nome completo'],
  whatsapp: ['whatsapp', 'telefone', 'celular', 'whats', 'contato', 'fone'],
  endereco: ['endereço', 'endereco', 'rua', 'logradouro'],
  bairro: ['bairro', 'região', 'regiao'],
  complemento: ['complemento', 'comp', 'apto', 'casa'],
  cidade: ['cidade', 'município', 'municipio'],
  data_cadastro: ['data cadastro', 'data_cadastro', 'cadastro', 'criado em'],
  total_pedidos: ['total de pedidos', 'pedidos', 'total pedidos', 'qtd pedidos'],
  total_gasto: ['total gasto', 'valor gasto', 'total compras']
};

const ALIASES_CATEGORIAS = {
  id_categoria: ['id', 'id_categoria', 'código', 'codigo'],
  nome_categoria: ['categoria', 'nome_categoria', 'nome', 'categoria nome'],
  ordem_exibicao: ['ordem', 'ordem_exibicao', 'posição', 'posicao'],
  status: ['status', 'ativo', 'situação'],
  icone: ['icone', 'ícone', 'emoji'],
  foto_url: ['url imagem', 'foto_url', 'imagem', 'foto']
};

// ============================================================================
// 1. INICIALIZAÇÃO AUTOMÁTICA DA PLANILHA (Se criar do zero)
// ============================================================================
function inicializarPlanilha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const headerBg = "#C8102E";
  const headerFontColor = "#FFFFFF";

  // --- 1. Aba Produtos ---
  let sheetProdutos = ss.getSheetByName('Produtos') || ss.insertSheet('Produtos');
  if (sheetProdutos.getLastRow() === 0) {
    const headersProdutos = ['ID', 'Nome', 'Categoria', 'Preço', 'Estoque', 'Destaque', 'Status', 'Descrição', 'URL Imagem'];
    sheetProdutos.appendRow(headersProdutos);
    formatHeaderRow(sheetProdutos, headersProdutos.length, headerBg, headerFontColor);

    const produtosIniciais = [
      ['PROD-001', 'Chup-Chup Ninho c/ Nutella', 'Chup-Chups Gourmet', 6.50, 20, 'SIM', 'ATIVO', 'Base cremosa de Leite Ninho original com generoso recheio de Nutella pura artesanal.', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80'],
      ['PROD-002', 'Chup-Chup Morango c/ Nutella', 'Chup-Chups Gourmet', 7.00, 15, 'SIM', 'ATIVO', 'Creme de morango fresco com pedaços da fruta e recheio vulcão de Nutella.', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80'],
      ['PROD-003', 'Chup-Chup Maracujá Trufado', 'Chup-Chups Gourmet', 6.50, 12, 'SIM', 'ATIVO', 'Mousse aveludado de maracujá com ganache nobre de chocolate meio amargo.', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80'],
      ['PROD-004', 'Chup-Chup Oreo Supremo', 'Chup-Chups Gourmet', 6.50, 8, 'NAO', 'ATIVO', 'Base de baunilha especial com pedaços crocantes de biscoito Oreo e creme branco.', 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80'],
      ['PROD-005', 'Bolo no Pote Red Velvet', 'Sobremesas no Pote', 12.00, 6, 'SIM', 'ATIVO', 'Massa aveludada vermelha com recheio cremoso de cream cheese e calda de frutas.', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80'],
      ['PROD-006', 'Combo Degustação Gourmet', 'Combos & Kits', 29.90, 10, 'SIM', 'ATIVO', '5 Chup-Chups Gourmet sortidos em embalagem térmica especial.', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80']
    ];
    produtosIniciais.forEach(p => sheetProdutos.appendRow(p));
  }

  // --- 2. Aba Categorias ---
  let sheetCategorias = ss.getSheetByName('Categorias') || ss.insertSheet('Categorias');
  if (sheetCategorias.getLastRow() === 0) {
    const headersCategorias = ['ID', 'Categoria'];
    sheetCategorias.appendRow(headersCategorias);
    formatHeaderRow(sheetCategorias, headersCategorias.length, headerBg, headerFontColor);

    const categoriasIniciais = [
      ['CAT-001', 'Chup-Chups Gourmet'],
      ['CAT-002', 'Sobremesas no Pote'],
      ['CAT-003', 'Combos & Kits']
    ];
    categoriasIniciais.forEach(c => sheetCategorias.appendRow(c));
  }

  // --- 3. Aba Clientes ---
  let sheetClientes = ss.getSheetByName('Clientes') || ss.insertSheet('Clientes');
  if (sheetClientes.getLastRow() === 0) {
    const headersClientes = ['ID', 'Nome', 'WhatsApp', 'Endereço', 'Bairro', 'Complemento', 'Data Cadastro', 'Total de Pedidos', 'Total Gasto'];
    sheetClientes.appendRow(headersClientes);
    formatHeaderRow(sheetClientes, headersClientes.length, headerBg, headerFontColor);

    sheetClientes.appendRow(['CLI-9988', 'Camila Santos', '11988887777', 'Rua das Flores, 142', 'Jardim Primavera', 'Apto 34', '15/08/2026', 1, 30.00]);
    sheetClientes.appendRow(['CLI-5544', 'Lucas Oliveira', '11977776666', 'Av. Paulista, 1000', 'Bela Vista', 'Sala 4', '18/08/2026', 1, 34.90]);
  }

  // --- 4. Aba Pedidos ---
  let sheetPedidos = ss.getSheetByName('Pedidos') || ss.insertSheet('Pedidos');
  if (sheetPedidos.getLastRow() === 0) {
    const headersPedidos = ['ID Pedido', 'Data/Hora', 'ID Cliente', 'Nome do Cliente', 'WhatsApp', 'Endereço de Entrega', 'Itens', 'Observações', 'Forma de Pagamento', 'Valor Total', 'Status do Pedido'];
    sheetPedidos.appendRow(headersPedidos);
    formatHeaderRow(sheetPedidos, headersPedidos.length, headerBg, headerFontColor);
  }

  // --- 5. Aba Configuracoes ---
  let sheetConfig = ss.getSheetByName('Configuracoes') || ss.insertSheet('Configuracoes');
  if (sheetConfig.getLastRow() === 0) {
    sheetConfig.appendRow(['Nome da Loja', 'Delícias da Jane']);
    sheetConfig.appendRow(['WhatsApp de Recebimento', '5511987654321']);
    sheetConfig.appendRow(['Status do Cardápio', true]);
    sheetConfig.appendRow(['Mensagem de Cardápio Fechado', 'No momento não estamos aceitando pedidos. Volte mais tarde!']);
    sheetConfig.appendRow(['Tempo Médio de Entrega', '30 a 50 min']);
    sheetConfig.appendRow(['Taxa de Entrega Padrão', '5.00']);
  }

  return "✅ Planilha inicializada com sucesso!";
}

function formatHeaderRow(sheet, numColumns, bgHex, fontHex) {
  const range = sheet.getRange(1, 1, 1, numColumns);
  range.setBackground(bgHex);
  range.setFontColor(fontHex);
  range.setFontWeight('bold');
  range.setFontSize(10);
  sheet.setFrozenRows(1);
}

// ============================================================================
// 2. ENDPOINT GET (Consulta de Dados pelo Aplicativo)
// ============================================================================
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getAll';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'getAll') {
      const data = {
        produtos: getSheetData(ss.getSheetByName('Produtos')),
        categorias: getSheetData(ss.getSheetByName('Categorias')),
        clientes: getSheetData(ss.getSheetByName('Clientes')),
        pedidos: getSheetData(ss.getSheetByName('Pedidos')),
        configuracoes: getConfigData(ss.getSheetByName('Configuracoes'))
      };
      return createJsonResponse({ success: true, data: data });
    }

    if (action === 'getProdutos') {
      return createJsonResponse({ success: true, data: getSheetData(ss.getSheetByName('Produtos')) });
    }
    if (action === 'getCategorias') {
      return createJsonResponse({ success: true, data: getSheetData(ss.getSheetByName('Categorias')) });
    }
    if (action === 'getClientes') {
      return createJsonResponse({ success: true, data: getSheetData(ss.getSheetByName('Clientes')) });
    }
    if (action === 'getPedidos') {
      return createJsonResponse({ success: true, data: getSheetData(ss.getSheetByName('Pedidos')) });
    }
    if (action === 'getConfiguracoes') {
      return createJsonResponse({ success: true, data: getConfigData(ss.getSheetByName('Configuracoes')) });
    }

    return createJsonResponse({ success: false, message: 'Ação GET não reconhecida: ' + action });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

// ============================================================================
// 3. ENDPOINT POST (Gravação e Sincronização em Tempo Real)
// ============================================================================
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, message: 'Nenhum dado enviado na requisição POST.' });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ------------------------------------------------------------------------
    // A) SALVAR NOVO PEDIDO (com cadastro de cliente e baixa de estoque)
    // ------------------------------------------------------------------------
    if (action === 'salvarPedido') {
      const pedido = payload.pedido;
      const cliente = payload.cliente;
      const sheetPedidos = ss.getSheetByName('Pedidos');

      // 1. Cadastrar ou atualizar cliente
      if (cliente && (cliente.whatsapp || cliente.nome)) {
        upsertCliente(ss.getSheetByName('Clientes'), cliente);
      }

      // 2. Gravar pedido mapeado
      const mappedPedido = {
        id_pedido: pedido.id_pedido || ('PED-' + Date.now().toString().slice(-4)),
        data_hora: pedido.data_hora || new Date().toISOString(),
        id_cliente: (cliente && cliente.id_cliente) ? cliente.id_cliente : (pedido.id_cliente || ''),
        nome_cliente: pedido.nome_cliente || (cliente ? cliente.nome : ''),
        whatsapp_cliente: pedido.whatsapp_cliente || (cliente ? cliente.whatsapp : ''),
        endereco_entrega: pedido.endereco_entrega || (cliente ? cliente.endereco : ''),
        resumo_itens: pedido.resumo_itens || '',
        observacoes: pedido.observacoes || '',
        forma_pagamento: pedido.forma_pagamento || 'Pix',
        total: pedido.total || 0,
        status_pedido: pedido.status_pedido || 'NOVO'
      };

      appendMappedRow(sheetPedidos, mappedPedido, ALIASES_PEDIDOS);

      // 3. Baixa de estoque automática dos itens do pedido na planilha
      const sheetProdutos = ss.getSheetByName('Produtos');
      if (sheetProdutos && (payload.itens || pedido.itens)) {
        const itens = payload.itens || pedido.itens;
        if (Array.isArray(itens)) {
          itens.forEach(function(item) {
            if (item.id_produto) {
              const rIdx = findRowIndex(sheetProdutos, 'id_produto', item.id_produto, ALIASES_PRODUTOS);
              if (rIdx > 0) {
                const cEstoque = findColumnIndex(sheetProdutos, 'estoque', ALIASES_PRODUTOS);
                if (cEstoque > 0) {
                  const estoqueAtual = parseInt(sheetProdutos.getRange(rIdx, cEstoque).getValue()) || 0;
                  const novoEstoque = Math.max(0, estoqueAtual - (parseInt(item.quantidade) || 1));
                  sheetProdutos.getRange(rIdx, cEstoque).setValue(novoEstoque);
                }
              }
            }
          });
        }
      }

      return createJsonResponse({ success: true, message: 'Pedido registrado na planilha com sucesso!' });
    }

    // ------------------------------------------------------------------------
    // B) ATUALIZAR STATUS DO PEDIDO
    // ------------------------------------------------------------------------
    if (action === 'atualizarStatusPedido') {
      const sheetPedidos = ss.getSheetByName('Pedidos');
      const idPedido = payload.id_pedido;
      const novoStatus = payload.novo_status;

      const rowIndex = findRowIndex(sheetPedidos, 'id_pedido', idPedido, ALIASES_PEDIDOS);
      if (rowIndex > 0) {
        const colIndex = findColumnIndex(sheetPedidos, 'status_pedido', ALIASES_PEDIDOS);
        if (colIndex > 0) {
          sheetPedidos.getRange(rowIndex, colIndex).setValue(novoStatus);
          return createJsonResponse({ success: true, message: 'Status do pedido atualizado na planilha!' });
        }
      }
      return createJsonResponse({ success: false, message: 'Pedido não encontrado na planilha.' });
    }

    // ------------------------------------------------------------------------
    // C) SALVAR / EDITAR PRODUTO (com Estoque e Destaque)
    // ------------------------------------------------------------------------
    if (action === 'salvarProduto') {
      const sheetProdutos = ss.getSheetByName('Produtos');
      const p = payload.produto;

      let rowIndex = -1;
      if (p.id_produto) {
        rowIndex = findRowIndex(sheetProdutos, 'id_produto', p.id_produto, ALIASES_PRODUTOS);
      }
      // Se não encontrou por ID mas tem nome idêntico, busca por nome
      if (rowIndex <= 0 && p.nome) {
        rowIndex = findRowIndex(sheetProdutos, 'nome', p.nome, ALIASES_PRODUTOS);
      }

      if (rowIndex > 0) {
        // Atualiza campos existentes mapeados
        updateMappedRow(sheetProdutos, rowIndex, p, ALIASES_PRODUTOS);
        return createJsonResponse({ success: true, message: 'Produto atualizado na planilha com sucesso!', id_produto: p.id_produto });
      } else {
        // Novo produto
        if (!p.id_produto) {
          p.id_produto = 'PROD-' + Date.now().toString().slice(-4);
        }
        if (!p.data_cadastro) {
          p.data_cadastro = new Date().toLocaleDateString('pt-BR');
        }
        appendMappedRow(sheetProdutos, p, ALIASES_PRODUTOS);
        return createJsonResponse({ success: true, message: 'Novo produto cadastrado na planilha com sucesso!', id_produto: p.id_produto });
      }
    }

    // ------------------------------------------------------------------------
    // D) ATUALIZAR APENAS ESTOQUE DO PRODUTO (Ajuste rápido)
    // ------------------------------------------------------------------------
    if (action === 'atualizarEstoqueProduto') {
      const sheetProdutos = ss.getSheetByName('Produtos');
      const idProduto = payload.id_produto;
      const novoEstoque = parseInt(payload.estoque) || 0;

      let rowIndex = findRowIndex(sheetProdutos, 'id_produto', idProduto, ALIASES_PRODUTOS);
      if (rowIndex <= 0 && payload.nome) {
        rowIndex = findRowIndex(sheetProdutos, 'nome', payload.nome, ALIASES_PRODUTOS);
      }

      if (rowIndex > 0) {
        const colIndex = findColumnIndex(sheetProdutos, 'estoque', ALIASES_PRODUTOS);
        if (colIndex > 0) {
          sheetProdutos.getRange(rowIndex, colIndex).setValue(novoEstoque);
          return createJsonResponse({ success: true, message: 'Estoque do produto atualizado na planilha!', id_produto: idProduto, estoque: novoEstoque });
        }
      }
      return createJsonResponse({ success: false, message: 'Produto não encontrado para atualização de estoque.' });
    }

    // ------------------------------------------------------------------------
    // E) TOGGLE VISIBILIDADE / STATUS DO PRODUTO (ATIVO / INATIVO)
    // ------------------------------------------------------------------------
    if (action === 'toggleStatusProduto') {
      const sheetProdutos = ss.getSheetByName('Produtos');
      const idProduto = payload.id_produto;
      const novoStatus = payload.status;

      let rowIndex = findRowIndex(sheetProdutos, 'id_produto', idProduto, ALIASES_PRODUTOS);
      if (rowIndex > 0) {
        const colIndex = findColumnIndex(sheetProdutos, 'status', ALIASES_PRODUTOS);
        if (colIndex > 0) {
          sheetProdutos.getRange(rowIndex, colIndex).setValue(novoStatus);
          return createJsonResponse({ success: true, message: 'Status do produto atualizado com sucesso!' });
        }
      }
      return createJsonResponse({ success: false, message: 'Produto não encontrado.' });
    }

    // ------------------------------------------------------------------------
    // F) EXCLUIR PRODUTO
    // ------------------------------------------------------------------------
    if (action === 'excluirProduto') {
      const sheetProdutos = ss.getSheetByName('Produtos');
      const idProduto = payload.id_produto;
      const rowIndex = findRowIndex(sheetProdutos, 'id_produto', idProduto, ALIASES_PRODUTOS);
      if (rowIndex > 0) {
        sheetProdutos.deleteRow(rowIndex);
        return createJsonResponse({ success: true, message: 'Produto excluído da planilha!' });
      }
      return createJsonResponse({ success: false, message: 'Produto não encontrado para exclusão.' });
    }

    // ------------------------------------------------------------------------
    // G) SALVAR / EDITAR CLIENTE
    // ------------------------------------------------------------------------
    if (action === 'salvarCliente') {
      const sheetClientes = ss.getSheetByName('Clientes');
      upsertCliente(sheetClientes, payload.cliente);
      return createJsonResponse({ success: true, message: 'Cliente salvo com sucesso na planilha!' });
    }

    // ------------------------------------------------------------------------
    // H) EXCLUIR CLIENTE
    // ------------------------------------------------------------------------
    if (action === 'excluirCliente') {
      const sheetClientes = ss.getSheetByName('Clientes');
      const idCliente = payload.id_cliente;
      const rowIndex = findRowIndex(sheetClientes, 'id_cliente', idCliente, ALIASES_CLIENTES);
      if (rowIndex > 0) {
        sheetClientes.deleteRow(rowIndex);
        return createJsonResponse({ success: true, message: 'Cliente excluído da planilha!' });
      }
      return createJsonResponse({ success: false, message: 'Cliente não encontrado para exclusão.' });
    }

    // ------------------------------------------------------------------------
    // I) SALVAR CONFIGURAÇÕES DA LOJA
    // ------------------------------------------------------------------------
    if (action === 'salvarConfiguracoes') {
      const sheetConfig = ss.getSheetByName('Configuracoes');
      const configs = payload.configuracoes;

      if (sheetConfig && configs) {
        const data = sheetConfig.getDataRange().getValues();
        for (const [key, value] of Object.entries(configs)) {
          let found = false;
          for (let i = 0; i < data.length; i++) {
            if (String(data[i][0]).trim().toLowerCase() === String(key).trim().toLowerCase()) {
              sheetConfig.getRange(i + 1, 2).setValue(value);
              found = true;
              break;
            }
          }
          if (!found) {
            sheetConfig.appendRow([key, value]);
          }
        }
      }
      return createJsonResponse({ success: true, message: 'Configurações salvas com sucesso na planilha!' });
    }

    // ------------------------------------------------------------------------
    // J) GESTÃO DE CATEGORIAS
    // ------------------------------------------------------------------------
    if (action === 'salvarCategoria') {
      const sheetCategorias = ss.getSheetByName('Categorias');
      const cat = payload.categoria;
      const rowIndex = cat.id_categoria ? findRowIndex(sheetCategorias, 'id_categoria', cat.id_categoria, ALIASES_CATEGORIAS) : -1;

      if (rowIndex > 0) {
        updateMappedRow(sheetCategorias, rowIndex, cat, ALIASES_CATEGORIAS);
        return createJsonResponse({ success: true, message: 'Categoria atualizada na planilha!' });
      } else {
        if (!cat.id_categoria) cat.id_categoria = 'CAT-' + Date.now().toString().slice(-4);
        appendMappedRow(sheetCategorias, cat, ALIASES_CATEGORIAS);
        return createJsonResponse({ success: true, message: 'Categoria cadastrada na planilha!' });
      }
    }

    if (action === 'excluirCategoria') {
      const sheetCategorias = ss.getSheetByName('Categorias');
      const idCat = payload.id_categoria;
      const rowIndex = findRowIndex(sheetCategorias, 'id_categoria', idCat, ALIASES_CATEGORIAS);
      if (rowIndex > 0) {
        sheetCategorias.deleteRow(rowIndex);
        return createJsonResponse({ success: true, message: 'Categoria excluída!' });
      }
      return createJsonResponse({ success: false, message: 'Categoria não encontrada.' });
    }

    return createJsonResponse({ success: false, message: 'Ação POST desconhecida: ' + action });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

// ============================================================================
// 4. MOTOR DE MAPEAMENTO DINÂMICO E UTILITÁRIOS
// ============================================================================

/**
 * Normaliza qualquer string para comparação de cabeçalhos (remove acentos, espaços e caixa).
 * Exemplo: "Preço" -> "preco", "URL Imagem" -> "urlimagem", "Status do Pedido" -> "statusdopedido"
 */
function normalizeHeaderKey(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Retorna o índice 1-based da coluna na planilha procurando pelo nome lógico ou seus aliases.
 */
function findColumnIndex(sheet, logicalKey, aliasMap) {
  if (!sheet) return -1;
  const lastCol = sheet.getLastColumn();
  if (lastCol <= 0) return -1;

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const targetAliases = (aliasMap && aliasMap[logicalKey]) ? aliasMap[logicalKey] : [logicalKey];
  const normAliases = targetAliases.map(normalizeHeaderKey);

  for (let j = 0; j < headers.length; j++) {
    const normHeader = normalizeHeaderKey(headers[j]);
    if (normAliases.indexOf(normHeader) !== -1) {
      return j + 1;
    }
  }
  return -1;
}

/**
 * Encontra a linha 1-based de um registro na planilha procurando por uma coluna lógica e seu valor.
 */
function findRowIndex(sheet, logicalKey, valueToMatch, aliasMap) {
  if (!sheet || valueToMatch === undefined || valueToMatch === null) return -1;
  const colIndex = findColumnIndex(sheet, logicalKey, aliasMap);
  if (colIndex <= 0) return -1;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;

  const values = sheet.getRange(1, colIndex, lastRow, 1).getValues();
  const searchVal = String(valueToMatch).trim().toLowerCase();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === searchVal) {
      return i + 1;
    }
  }
  return -1;
}

/**
 * Atualiza uma linha existente mapeando dinamicamente cada propriedade para sua coluna real.
 */
function updateMappedRow(sheet, rowIndex, dataObj, aliasMap) {
  if (!sheet || rowIndex <= 1 || !dataObj) return;

  for (const key in dataObj) {
    if (dataObj.hasOwnProperty(key)) {
      const val = dataObj[key];
      if (val === undefined || val === null) continue;
      const colIndex = findColumnIndex(sheet, key, aliasMap);
      if (colIndex > 0) {
        sheet.getRange(rowIndex, colIndex).setValue(val);
      }
    }
  }
}

/**
 * Insere uma nova linha mapeando dinamicamente as propriedades para as colunas atuais da planilha.
 * Dessa forma, a ordem das colunas da planilha é 100% respeitada!
 */
function appendMappedRow(sheet, dataObj, aliasMap) {
  if (!sheet || !dataObj) return;
  const lastCol = sheet.getLastColumn();
  if (lastCol <= 0) return;

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const newRow = [];

  for (let j = 0; j < headers.length; j++) {
    const rawHeader = headers[j];
    const normHeader = normalizeHeaderKey(rawHeader);
    let matchedValue = '';

    for (const key in dataObj) {
      if (dataObj.hasOwnProperty(key)) {
        const val = dataObj[key];
        if (val === undefined || val === null) continue;
        const aliases = (aliasMap && aliasMap[key]) ? aliasMap[key] : [key];
        const normAliases = aliases.map(normalizeHeaderKey);
        if (normAliases.indexOf(normHeader) !== -1) {
          matchedValue = val;
          break;
        }
      }
    }
    newRow.push(matchedValue);
  }

  sheet.appendRow(newRow);
}

/**
 * Insere ou atualiza cliente por WhatsApp ou ID.
 */
function upsertCliente(sheet, cliente) {
  if (!sheet || !cliente) return;
  
  let rowIndex = -1;
  if (cliente.id_cliente) {
    rowIndex = findRowIndex(sheet, 'id_cliente', cliente.id_cliente, ALIASES_CLIENTES);
  }

  // Busca por WhatsApp se não achou por ID
  if (rowIndex <= 0 && cliente.whatsapp) {
    const cleanZap = String(cliente.whatsapp).replace(/\D/g, '');
    if (cleanZap.length >= 8) {
      const colZap = findColumnIndex(sheet, 'whatsapp', ALIASES_CLIENTES);
      if (colZap > 0 && sheet.getLastRow() > 1) {
        const zapValues = sheet.getRange(1, colZap, sheet.getLastRow(), 1).getValues();
        for (let i = 1; i < zapValues.length; i++) {
          const rowZap = String(zapValues[i][0]).replace(/\D/g, '');
          if (rowZap && (rowZap === cleanZap || rowZap.indexOf(cleanZap) !== -1 || cleanZap.indexOf(rowZap) !== -1)) {
            rowIndex = i + 1;
            break;
          }
        }
      }
    }
  }

  if (rowIndex > 0) {
    updateMappedRow(sheet, rowIndex, cliente, ALIASES_CLIENTES);
  } else {
    if (!cliente.id_cliente) {
      cliente.id_cliente = 'CLI-' + Date.now().toString().slice(-4);
    }
    if (!cliente.data_cadastro) {
      cliente.data_cadastro = new Date().toLocaleDateString('pt-BR');
    }
    appendMappedRow(sheet, cliente, ALIASES_CLIENTES);
  }
}

/**
 * Converte qualquer aba da planilha em um array de objetos JSON baseando-se no cabeçalho.
 */
function getSheetData(sheet) {
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      if (headers[j]) {
        row[headers[j]] = values[i][j];
      }
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Lê a aba de configurações e retorna como chave-valor.
 */
function getConfigData(sheet) {
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  const configs = {};
  for (let i = 0; i < values.length; i++) {
    if (values[i][0]) {
      configs[values[i][0]] = values[i][1];
    }
  }
  return configs;
}

/**
 * Cria a resposta JSON padrão compatível com requisições Web.
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
