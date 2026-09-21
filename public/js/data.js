/**
 * DELÍCIAS DA JANE - Configurações Iniciais do Aplicativo
 * Os dados reais de produtos, categorias, pedidos e clientes são sincronizados
 * diretamente com a planilha Google Sheets via Apps Script.
 */

// Listas vazias: dados populados 100% via Google Sheets
const INITIAL_CATEGORIES = [];
const INITIAL_PRODUCTS = [];
const INITIAL_ORDERS = [];
const INITIAL_CLIENTS = [];

const INITIAL_CONFIG = {
  nome_loja: "Delícias da Jane",
  slogan: "Chup-Chups Gourmet & Sobremesas Artesanais",
  whatsapp_loja: "37998585154",
  taxa_entrega_padrao: 5.00,
  taxa_entrega_gratis_minimo: 50.00,
  status_loja: "ABERTO",
  chave_pix: "deliciasdajane@pix.com.br",
  beneficiario_pix: "Delícias da Jane",
  admin_pin: "4321",
  sheets_url: "https://script.google.com/macros/s/AKfycbxnv3YCMdUmPfBsGTTXOBvcC3W6tOkOCGU_ltlS7cH-_l4RJRAds_14aLDI4wYcw90eeA/exec",
  sheets_auto_sync: true,
  tempo_entrega_estimado: "30-50 min",
  bairro_padrao: "Centro",
  cidade_padrao: "São Paulo - SP"
};
