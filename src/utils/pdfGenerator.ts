import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions, Content } from 'pdfmake/interfaces';

// @ts-ignore
pdfMake.vfs = pdfFonts.pdfMake.vfs;

interface ReceiptData {
  client: string;
  service: string;
  date: Date;
  value: number;
  paymentMethod: string;
}

export const generateReceipt = (data: ReceiptData) => {
  const docDefinition: TDocumentDefinitions = {
    content: [
      {
        text: 'RECIBO DE PAGAMENTO',
        style: 'header',
        alignment: 'center'
      },
      {
        text: '\n'
      },
      {
        text: `Cliente: ${data.client}`,
        style: 'subheader'
      },
      {
        text: `Serviço: ${data.service}`,
        style: 'subheader'
      },
      {
        text: `Data: ${data.date.toLocaleDateString('pt-BR')}`,
        style: 'subheader'
      },
      {
        text: `Valor: R$ ${data.value.toFixed(2)}`,
        style: 'subheader'
      },
      {
        text: `Forma de Pagamento: ${getPaymentMethodLabel(data.paymentMethod)}`,
        style: 'subheader'
      },
      {
        text: '\n'
      },
      {
        text: '_____________________________',
        alignment: 'center'
      },
      {
        text: 'Assinatura',
        alignment: 'center',
        italics: true
      }
    ] as Content[],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 14,
        margin: [0, 5, 0, 5]
      }
    },
    defaultStyle: {
      fontSize: 12
    }
  };

  pdfMake.createPdf(docDefinition).download('recibo.pdf');
};

const getPaymentMethodLabel = (method: string): string => {
  const methods: { [key: string]: string } = {
    cash: 'Dinheiro',
    credit: 'Cartão de Crédito',
    debit: 'Cartão de Débito',
    pix: 'PIX',
    transfer: 'Transferência'
  };
  return methods[method] || method;
};
