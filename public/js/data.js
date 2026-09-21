/**
 * DELÍCIAS DA JANE - Dados Iniciais & Modelos de Dados
 */

const INITIAL_CATEGORIES = [
  {
    id_categoria: "cat-1",
    nome_categoria: "Chup-Chups Gourmet",
    ordem_exibicao: 1,
    status: "ATIVO",
    icone: "🍦",
    foto_url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=300&q=80"
  },
  {
    id_categoria: "cat-2",
    nome_categoria: "Sobremesas no Pote",
    ordem_exibicao: 2,
    status: "ATIVO",
    icone: "🍰",
    foto_url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=300&q=80"
  },
  {
    id_categoria: "cat-3",
    nome_categoria: "Combos & Kits",
    ordem_exibicao: 3,
    status: "ATIVO",
    icone: "🎁",
    foto_url: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=300&q=80"
  },
  {
    id_categoria: "cat-4",
    nome_categoria: "Linha Fit & Zero",
    ordem_exibicao: 4,
    status: "ATIVO",
    icone: "🍓",
    foto_url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=300&q=80"
  },
  {
    id_categoria: "cat-5",
    nome_categoria: "Bebidas Refrescantes",
    ordem_exibicao: 5,
    status: "ATIVO",
    icone: "🥤",
    foto_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80"
  }
];

const INITIAL_PRODUCTS = [
  {
    id_produto: "prod-1",
    nome: "Chup-Chup Ninho com Nutella",
    categoria: "Chup-Chups Gourmet",
    descricao: "Base cremosa de Leite Ninho original com generoso recheio de Nutella pura artesanal.",
    preco: 6.50,
    foto_url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
    status: "ATIVO",
    destaque: "SIM",
    estoque: 20,
    data_cadastro: "2026-08-01"
  },
  {
    id_produto: "prod-2",
    nome: "Chup-Chup Morango com Nutella",
    categoria: "Chup-Chups Gourmet",
    descricao: "Creme de morango fresco com pedaços da fruta e recheio vulcão de Nutella.",
    preco: 7.00,
    foto_url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80",
    status: "ATIVO",
    destaque: "SIM",
    estoque: 15,
    data_cadastro: "2026-08-02"
  },
  {
    id_produto: "prod-3",
    nome: "Chup-Chup Maracujá Trufado",
    categoria: "Chup-Chups Gourmet",
    descricao: "Mousse aveludado de maracujá com ganache nobre de chocolate meio amargo.",
    preco: 6.50,
    foto_url: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80",
    status: "ATIVO",
    destaque: "SIM",
    estoque: 12,
    data_cadastro: "2026-08-03"
  },
  {
    id_produto: "prod-4",
    nome: "Chup-Chup Oreo Supremo",
    categoria: "Chup-Chups Gourmet",
    descricao: "Base de baunilha especial com pedaços crocantes de biscoito Oreo e creme branco.",
    preco: 6.50,
    foto_url: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80",
    status: "ATIVO",
    destaque: "NAO",
    estoque: 8,
    data_cadastro: "2026-08-04"
  },
  {
    id_produto: "prod-5",
    nome: "Chup-Chup Paçoca Cremosa",
    categoria: "Chup-Chups Gourmet",
    descricao: "Sabor marcante de paçoquinha legítima com calda aveludada de doce de leite artesanal.",
    preco: 6.00,
    foto_url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80",
    status: "ATIVO",
    destaque: "NAO",
    estoque: 10,
    data_cadastro: "2026-08-05"
  },
  {
    id_produto: "prod-6",
    nome: "Chup-Chup Torta de Limão",
    categoria: "Chup-Chups Gourmet",
    descricao: "Creme suave de limão siciliano com pedacinhos de biscoito amanteigado triturado.",
    preco: 6.00,
    foto_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    status: "ATIVO",
    destaque: "NAO",
    estoque: 3,
    data_cadastro: "2026-08-06"
  },
  {
    id_produto: "prod-7",
    nome: "Bolo no Pote Red Velvet",
    categoria: "Sobremesas no Pote",
    descricao: "Massa aveludada vermelha com recheio cremoso de cream cheese e calda de frutas vermelhas.",
    preco: 12.00,
    foto_url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80",
    status: "ATIVO",
    destaque: "SIM",
    estoque: 6,
    data_cadastro: "2026-08-07"
  },
  {
    id_produto: "prod-8",
    nome: "Banoffee no Pote Especial",
    categoria: "Sobremesas no Pote",
    descricao: "Camadas de biscoito amanteigado, doce de leite caseiro, banana fresca e chantilly suave com canela.",
    preco: 13.50,
    foto_url: "https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=600&q=80",
    status: "ATIVO",
    destaque: "NAO",
    estoque: 5,
    data_cadastro: "2026-08-08"
  },
  {
    id_produto: "prod-9",
    nome: "Combo Degustação Gourmet (5 unid.)",
    categoria: "Combos & Kits",
    descricao: "1 Ninho c/ Nutella, 1 Morango c/ Nutella, 1 Maracujá Trufado, 1 Oreo e 1 Paçoca. Acompanha embalagem térmica!",
    preco: 29.90,
    foto_url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
    status: "ATIVO",
    destaque: "SIM",
    estoque: 10,
    data_cadastro: "2026-08-09"
  },
  {
    id_produto: "prod-10",
    nome: "Chup-Chup Fit Whey & Frutas Vermelhas",
    categoria: "Linha Fit & Zero",
    descricao: "Sem adição de açúcar, feito com Whey Protein isolado, leite vegetal e calda natural de frutas vermelhas.",
    preco: 8.50,
    foto_url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80",
    status: "ATIVO",
    destaque: "NAO",
    estoque: 0,
    data_cadastro: "2026-08-10"
  },
  {
    id_produto: "prod-11",
    nome: "Suco Natural de Laranja com Morango 500ml",
    categoria: "Bebidas Refrescantes",
    descricao: "Suco 100% natural espremido na hora, super gelado e sem conservantes.",
    preco: 8.00,
    foto_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
    status: "ATIVO",
    destaque: "NAO",
    estoque: 14,
    data_cadastro: "2026-08-11"
  }
];

const INITIAL_CONFIG = {
  nome_loja: "Delícias da Jane",
  slogan: "Chup-Chups Gourmet & Sobremesas Artesanais",
  whatsapp_loja: "5511987654321",
  taxa_entrega_padrao: 5.00,
  status_loja: "ABERTO",
  chave_pix: "deliciasdajane@pix.com.br",
  admin_pin: "1234",
  sheets_url: "https://script.google.com/macros/s/AKfycbxnv3YCMdUmPfBsGTTXOBvcC3W6tOkOCGU_ltlS7cH-_l4RJRAds_14aLDI4wYcw90eeA/exec",
  sheets_auto_sync: true,
  tempo_entrega_estimado: "30-45 min",
  bairro_padrao: "Centro",
  cidade_padrao: "São Paulo - SP"
};

const INITIAL_ORDERS = [
  {
    id_pedido: "PED-1082",
    data_hora: "2026-08-19T21:40:00",
    id_cliente: "CLI-9988",
    nome_cliente: "Camila Santos",
    whatsapp_cliente: "11988887777",
    resumo_itens: "2x Chup-Chup Ninho com Nutella, 1x Bolo no Pote Red Velvet",
    subtotal: 25.00,
    taxa_entrega: 5.00,
    total: 30.00,
    forma_pagamento: "Pix",
    status_pedido: "EM PREPARO",
    endereco_entrega: "Rua das Flores, 142 - Apto 34, Jardim Primavera",
    observacoes: "Favor caprichar na colherzinha!"
  },
  {
    id_pedido: "PED-1081",
    data_hora: "2026-08-19T21:15:00",
    id_cliente: "CLI-5544",
    nome_cliente: "Lucas Oliveira",
    whatsapp_cliente: "11977776666",
    resumo_itens: "1x Combo Degustação Gourmet (5 unid.)",
    subtotal: 29.90,
    taxa_entrega: 5.00,
    total: 34.90,
    forma_pagamento: "Cartão de Crédito (na entrega)",
    status_pedido: "SAIU PARA ENTREGA",
    endereco_entrega: "Av. Paulista, 1000 - Bela Vista",
    observacoes: "Interfone 101"
  },
  {
    id_pedido: "PED-1080",
    data_hora: "2026-08-19T20:30:00",
    id_cliente: "CLI-3322",
    nome_cliente: "Mariana Costa",
    whatsapp_cliente: "11966665555",
    resumo_itens: "3x Chup-Chup Morango com Nutella, 2x Maracujá Trufado",
    subtotal: 34.00,
    taxa_entrega: 5.00,
    total: 39.00,
    forma_pagamento: "Dinheiro (Troco para R$ 50)",
    status_pedido: "CONCLUIDO",
    endereco_entrega: "Rua Augusta, 520 - Consolação",
    observacoes: ""
  }
];

const INITIAL_CLIENTS = [
  {
    id_cliente: "CLI-9988",
    nome: "Camila Santos",
    whatsapp: "11988887777",
    endereco: "Rua das Flores, 142 - Apto 34",
    bairro: "Jardim Primavera",
    cidade: "São Paulo",
    data_cadastro: "15/08/2026"
  },
  {
    id_cliente: "CLI-5544",
    nome: "Lucas Oliveira",
    whatsapp: "11977776666",
    endereco: "Av. Paulista, 1000",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    data_cadastro: "18/08/2026"
  }
];
