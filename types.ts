
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string | number;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  category: string;
}

export interface GeminiExtraction {
  comercio: string;
  fecha: string;
  total: number;
  categoria: string;
  items: Array<{ descripcion: string; precio: number }>;
  confianza_extraccion: 'alta' | 'media' | 'baja';
}
