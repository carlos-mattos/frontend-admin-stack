export const PaymentMethod = {
  CASH: 'cash',
  CREDIT: 'credit',
  DEBIT: 'debit',
  PIX: 'pix',
  TRANSFER: 'transfer'
};

export const PaymentMethodLabel = {
  [PaymentMethod.CASH]: 'Dinheiro',
  [PaymentMethod.CREDIT]: 'Cartão de Crédito',
  [PaymentMethod.DEBIT]: 'Cartão de Débito',
  [PaymentMethod.PIX]: 'PIX',
  [PaymentMethod.TRANSFER]: 'Transferência'
}; 