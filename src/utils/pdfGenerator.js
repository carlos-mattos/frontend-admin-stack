import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Configure pdfmake with the virtual file system
if (typeof window !== 'undefined') {
  pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;
}

const getPaymentMethodLabel = (method) => {
  const methods = {
    cash: 'Dinheiro',
    credit: 'Cartão de Crédito',
    debit: 'Cartão de Débito',
    pix: 'PIX',
    transfer: 'Transferência'
  };
  return methods[method] || method;
};

export const generateReceipt = async (data) => {
  const docDefinition = {
    content: [
      { text: 'RECIBO DE PAGAMENTO', style: 'header' },
      { text: '\n' },
      {
        text: [{ text: 'Cliente: ', bold: true }, data.client]
      },
      {
        text: [{ text: 'Serviço: ', bold: true }, data.service]
      },
      {
        text: [{ text: 'Data: ', bold: true }, data.date.format('DD/MM/YYYY')]
      },
      {
        text: [{ text: 'Valor: ', bold: true }, `R$ ${data.value.toFixed(2)}`]
      },
      {
        text: [{ text: 'Forma de Pagamento: ', bold: true }, getPaymentMethodLabel(data.paymentMethod)]
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 10]
      }
    }
  };

  pdfMake.createPdf(docDefinition).download('recibo.pdf');
};

export const generateCashFlowPDF = async ({ data, startDate, endDate }) => {
  const tableBody = data.map((row) => [
    row.month,
    { text: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.inflow), alignment: 'right' },
    { text: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.outflow), alignment: 'right' },
    { text: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.balance), alignment: 'right' }
  ]);

  const docDefinition = {
    content: [
      { text: 'RELATÓRIO DE FLUXO DE CAIXA', style: 'header' },
      { text: '\n' },
      {
        text: [{ text: 'Período: ', bold: true }, `${startDate} a ${endDate}`]
      },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Mês', style: 'tableHeader' },
              { text: 'Entradas', style: 'tableHeader', alignment: 'right' },
              { text: 'Saídas', style: 'tableHeader', alignment: 'right' },
              { text: 'Saldo', style: 'tableHeader', alignment: 'right' }
            ],
            ...tableBody
          ]
        }
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: 'black'
      }
    }
  };

  pdfMake.createPdf(docDefinition).download('fluxo-de-caixa.pdf');
};
