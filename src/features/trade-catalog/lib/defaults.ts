import type { MediaKind } from "@/generated/prisma/enums";

// Catálogos padrão do Trade Marketing — a base da "Biblioteca Nacional de
// Espaços Comerciais". Semeados por org na criação e no backfill. Dados puros:
// sem import de Prisma, para poderem rodar tanto no server quanto em scripts.

export interface MediaTypeSeed {
  kind: MediaKind;
  code: string;
  name: string;
}

export interface NegotiationTypeSeed {
  code: string;
  name: string;
}

export interface StoreSectorSeed {
  code: string;
  name: string;
}

export const DEFAULT_MEDIA_TYPES: readonly MediaTypeSeed[] = [
  // Mídia física
  { kind: "FISICA", code: "PG", name: "Ponta de Gôndola" },
  { kind: "FISICA", code: "GO", name: "Gôndola" },
  { kind: "FISICA", code: "IL", name: "Ilha Promocional" },
  { kind: "FISICA", code: "CK", name: "Checkout" },
  { kind: "FISICA", code: "CM", name: "Cross Merchandising" },
  { kind: "FISICA", code: "FR", name: "Freezer" },
  { kind: "FISICA", code: "GL", name: "Geladeira" },
  { kind: "FISICA", code: "DP", name: "Display" },
  { kind: "FISICA", code: "ST", name: "Stack" },
  { kind: "FISICA", code: "PL", name: "Pallet" },
  { kind: "FISICA", code: "TG", name: "Terminal de Gôndola" },
  { kind: "FISICA", code: "FG", name: "Faixa de Gôndola" },
  { kind: "FISICA", code: "SP", name: "Stopper" },
  { kind: "FISICA", code: "WB", name: "Wobbler" },
  { kind: "FISICA", code: "MB", name: "Móbile" },
  { kind: "FISICA", code: "BN", name: "Banner" },
  { kind: "FISICA", code: "TT", name: "Totem" },
  { kind: "FISICA", code: "AP", name: "Adesivação de Piso" },
  { kind: "FISICA", code: "AD", name: "Adesivação de Parede" },
  { kind: "FISICA", code: "CS", name: "Comunicação Suspensa" },
  { kind: "FISICA", code: "PI", name: "Painel Interno" },
  { kind: "FISICA", code: "FC", name: "Fachada" },
  { kind: "FISICA", code: "ET", name: "Estacionamento" },
  { kind: "FISICA", code: "CR", name: "Carrinhos" },
  { kind: "FISICA", code: "CE", name: "Cestas" },
  { kind: "FISICA", code: "EN", name: "Entrada" },
  { kind: "FISICA", code: "SD", name: "Saída" },
  { kind: "FISICA", code: "AC", name: "Açougue" },
  { kind: "FISICA", code: "PA", name: "Padaria" },
  { kind: "FISICA", code: "HF", name: "Hortifruti" },
  { kind: "FISICA", code: "AG", name: "Adega" },
  // Mídia digital
  { kind: "DIGITAL", code: "QR", name: "QR Code Map" },
  { kind: "DIGITAL", code: "TV", name: "TV Corporativa" },
  { kind: "DIGITAL", code: "LED", name: "Painel LED" },
  { kind: "DIGITAL", code: "TD", name: "Totem Digital" },
  { kind: "DIGITAL", code: "ED", name: "Etiqueta Digital" },
  { kind: "DIGITAL", code: "RI", name: "Rádio Interna" },
  { kind: "DIGITAL", code: "APP", name: "Aplicativo do Supermercado" },
  { kind: "DIGITAL", code: "WA", name: "WhatsApp Oficial" },
  { kind: "DIGITAL", code: "PN", name: "Push Notification" },
  { kind: "DIGITAL", code: "GEO", name: "Geolocalização" },
  { kind: "DIGITAL", code: "MAP", name: "Mapa Digital" },
  { kind: "DIGITAL", code: "CP", name: "Cupom Digital" },
  { kind: "DIGITAL", code: "CB", name: "Cashback" },
  { kind: "DIGITAL", code: "FD", name: "Programa de Fidelidade" },
  { kind: "DIGITAL", code: "RM", name: "Retail Media" },
];

// Códigos atribuídos à mão: derivar do nome colidiria ("Merchandising
// Permanente"/"Sazonal" virariam ambos MER).
export const DEFAULT_NEGOTIATION_TYPES: readonly NegotiationTypeSeed[] = [
  { code: "ALU", name: "Aluguel de espaço" },
  { code: "VTR", name: "Verba Trade" },
  { code: "BON", name: "Bonificação" },
  { code: "SOU", name: "Sell Out" },
  { code: "SIN", name: "Sell In" },
  { code: "CCO", name: "Campanha Cooperada" },
  { code: "EXC", name: "Exclusividade" },
  { code: "LAN", name: "Lançamento" },
  { code: "SAM", name: "Sampling" },
  { code: "DEM", name: "Demonstração" },
  { code: "EXP", name: "Experiência" },
  { code: "APR", name: "Ação Promocional" },
  { code: "CRM", name: "Cross Merchandising" },
  { code: "PAT", name: "Patrocínio" },
  { code: "NAM", name: "Naming" },
  { code: "LIC", name: "Licenciamento" },
  { code: "MPE", name: "Merchandising Permanente" },
  { code: "MSA", name: "Merchandising Sazonal" },
  { code: "CPA", name: "Cashback Patrocinado" },
  { code: "MDI", name: "Mídia Digital" },
  { code: "MFI", name: "Mídia Física" },
];

export const DEFAULT_STORE_SECTORS: readonly StoreSectorSeed[] = [
  { code: "MER", name: "Mercearia" },
  { code: "BEB", name: "Bebidas" },
  { code: "PER", name: "Perfumaria" },
  { code: "LMP", name: "Limpeza" },
  { code: "HFR", name: "Hortifruti" },
  { code: "ACO", name: "Açougue" },
  { code: "PEX", name: "Peixaria" },
  { code: "FRI", name: "Frios" },
  { code: "LAT", name: "Laticínios" },
  { code: "PAD", name: "Padaria" },
  { code: "CON", name: "Confeitaria" },
  { code: "ROT", name: "Rotisseria" },
  { code: "CGD", name: "Congelados" },
  { code: "MAS", name: "Massas" },
  { code: "BIS", name: "Biscoitos" },
  { code: "DOC", name: "Doces" },
  { code: "BOM", name: "Bomboniere" },
  { code: "PET", name: "Pet" },
  { code: "INF", name: "Infantil" },
  { code: "UTI", name: "Utilidades" },
  { code: "ELE", name: "Eletro" },
  { code: "BAZ", name: "Bazar" },
  { code: "PAP", name: "Papelaria" },
  { code: "ADE", name: "Adega" },
  { code: "CER", name: "Cereais" },
  { code: "LEI", name: "Leites" },
  { code: "TMP", name: "Temperos" },
  { code: "ORG", name: "Orgânicos" },
  { code: "SAU", name: "Saudáveis" },
  { code: "ENT", name: "Entrada" },
  { code: "SAI", name: "Saída" },
  { code: "CXA", name: "Caixas" },
  { code: "EST", name: "Estacionamento" },
];
