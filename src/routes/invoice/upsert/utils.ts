import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import z from 'zod';
import { resolve } from '$app/paths';
import {
  multiUrlSchema,
  multiFileSchema,
} from '$lib/validations';
import { formatAmount, splitAfterChars } from '$lib/utils';
import type { Client, Company } from '$lib/server/db/schema';
import { toast } from 'svelte-sonner';

export const title = {
  singular: 'Invoice',
  plural: 'Invoices',
};

export const route = {
  list: resolve('/invoice'),
  upsert: resolve('/invoice/upsert'),
};

export const lineItemSchema = z.object({
  id: z.number().positive().optional(), // Made optional for upsert
  productId: z.number().positive().optional(),
  name: z.string().min(1),
  remarks: z.string().optional().nullable(),
  quantity: z.number().int().gt(0),
  actualPrice: z.number().min(0),
  quotedPrice: z.number().min(0),
  salePrice: z.number().min(0),
  receivedPrice: z.number().min(0),
});
const invoiceStatus = z.enum([
  'draft',
  'processing',
  'delivered',
  'delivery_acknowledged',
  'disputed',
  'paid',
]);
export type InvoiceStatus = z.infer<typeof invoiceStatus>;
export const invoiceSchema = z.object({
  id: z.number().positive().optional(), // Added and made optional for upsert
  invoiceNumber: z.number().positive(),
  companyId: z.coerce.number().positive(),
  clientId: z.coerce.number().positive(),
  locationId: z.coerce.number().positive(),
  remarks: z.string().optional().nullable(),
  receivedAmount: z.number().positive().optional().nullable(),
  dateOfDelivery: z.date(),
  dateOfInvoice: z.date(),
  lineItems: z.array(lineItemSchema),
  status: invoiceStatus.default('draft'),
  attachmentUrls: multiUrlSchema,
  attachments: multiFileSchema,
});

export const filterSchema = z.object({
  companyId: z.coerce.number().optional().nullable(),
  clientId: z.coerce.number().optional().nullable(),
  locationId: z.coerce.number().optional().nullable(),
  status: invoiceStatus.optional().nullable(),
  invoiceNumber: z.coerce.number().optional().nullable(),
  startDateOfDelivery: z.date().optional().nullable(),
  endDateOfDelivery: z.date().optional().nullable(),
  startDateOfInvoice: z.date().optional().nullable(),
  endDateOfInvoice: z.date().optional().nullable(),
});

export const statuses = [
  { value: 'draft', color: 'purple' },
  { value: 'processing', color: 'yellow' },
  { value: 'delivered', color: 'blue' },
  { value: 'delivery_acknowledged', color: 'teal' },
  { value: 'paid', color: 'green' },
  { value: 'disputed', color: 'red' },
];

export async function exportPDF(
  invoice: z.infer<typeof invoiceSchema>,
  company?: Company,
  client?: Client,
) {
  if (!company) {
    toast.error('Select company first!');
    return;
  }
  if (!client) {
    toast.error('Select client first!');
    return;
  }

  const body = invoice.lineItems.map((lineItem, index) => [
    index + 1,
    lineItem.name,
    lineItem.quantity,
    formatAmount(lineItem.salePrice),
    formatAmount(lineItem.salePrice * lineItem.quantity),
  ]);
  const invoiceNumber = `${client.invoiceNumberInitial}-${invoice.invoiceNumber}`;
  const fileName = `${invoiceNumber} ${invoice.dateOfInvoice.toDateString().replaceAll(' ', '-')} ${company.name} ${invoice.lineItems
    .sort(
      (a, b) =>
        b.salePrice * b.quantity - a.salePrice * a.quantity,
    )
    .splice(0, 2)
    .map((x) => x.name)
    .join(', ')}.pdf`;
  const total = invoice.lineItems.reduce(
    (acc, p) => acc + p.quantity * p.salePrice,
    0,
  );

  if (company.printLayout === 'B') {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });

    // --- Corporate Header (Right Aligned per Excel) ---
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setFontSize(9);
    let currentY = 20;
    const lineHeight = 5;

    // 1. Company Name (Bold only, or use dddt with empty normal text)
    doc.setFont('times', 'bold');
    doc.text(company.office, 130, currentY);
    currentY += lineHeight;

    // 2. Address (Handling potential multi-line)
    const addressLines = splitAfterChars(
      ` ${company.address}`,
      45,
    );
    addressLines.forEach((line, index) => {
      if (index === 0) {
        dddt('Add: ', line, 130, currentY);
      } else {
        // Indent subsequent address lines under the normal text of the first line
        const indent = doc.getTextWidth('Add:  ');
        doc.setFont('times', 'normal');
        doc.text(line, 130 + indent, currentY);
      }
      currentY += lineHeight;
    });

    // 3. Phone/Cell
    dddt('Cell: ', company.phone, 130, currentY);
    currentY += lineHeight;

    // 4. Email
    dddt('Email: ', company.email, 130, currentY);

    // --- Main Title ---
    doc.setFontSize(16);
    const text = 'SALES INVOICE';
    const x = 105;
    const y = 50;
    doc.setLineWidth(0.5);
    doc.text(text, x, y, { align: 'center' });
    const textWidth = doc.getTextWidth(text);
    const lineY = y + 1; // distance below text
    doc.line(x - textWidth / 2, lineY, x + textWidth / 2, lineY);

    // --- Sub-Header & Meta Data ---
    doc.setFontSize(10);

    function dddt(
      boldText: string,
      normalText: string,
      x: number,
      y: number,
      options?: Parameters<typeof doc.text>[4],
    ) {
      doc.setFont('times', 'bold');
      doc.text(boldText, x, y);

      const texWidth = doc.getTextWidth(boldText);
      doc.setFont('times', 'normal');
      doc.text(normalText, texWidth + x, y, options);
    }
    currentY = 60;
    const lineGap = 7;
    dddt('Sub: ', 'Supply Hardware', 15, currentY);
    currentY += lineGap;

    dddt('M/s: ', client.name, 15, currentY);
    currentY += lineGap;

    dddt(
      'Date: ',
      invoice.dateOfDelivery.toDateString(),
      160,
      60,
    );
    dddt('Invoice CS: ', invoiceNumber, 160, 67);

    // optional fields
    if (client.attention) {
      dddt('Att: ', client.attention, 15, currentY);
      currentY += lineGap;
    }

    if (client.email) {
      dddt('Email: ', client.email, 15, currentY);
      currentY += lineGap;
    }

    if (client.phone) {
      dddt('Tel # ', client.phone, 15, currentY);
      currentY += lineGap;
    }

    // --- Items Table (Mimicking Excel Grid) ---
    autoTable(doc, {
      startY: currentY,
      head: [
        [
          'S.NO',
          'DESCRIPTION',
          'QTY',
          'UNIT PRICE',
          'TOTAL UNIT PRICE',
        ],
      ],
      body,
      foot: [['', 'Total Amount', '', '', formatAmount(total)]],
      theme: 'grid',
      headStyles: {
        fillColor: '#31859c',
        textColor: 'white',
        halign: 'center',
      },
      styles: {
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        fontSize: 10,
        cellPadding: 3,
        minCellHeight: 10,
        font: 'times',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 80 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'right', cellWidth: 40 },
      },
      footStyles: {
        fillColor: 'white',
        textColor: 0,
        fontStyle: 'bold',
        halign: 'right',
      },
    });

    // --- Note Section ---
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('times', 'bold');
    doc.text('Note:', 15, finalY);
    doc.setFont('times', 'normal');
    doc.text(
      '1. All the prices mentioned are in PKR.',
      15,
      finalY + 5,
    );

    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    finalY += 20;
    doc.text('Received By:', 15, finalY);

    finalY += 6;
    const footerInfo = [
      'Name: ________________________________',
      '',
      'Designation: ________________________________',
      '',
      'Department: ________________________________',
      '',
      'Sign: ________________________________',
    ];
    doc.text(footerInfo, 15, finalY);

    // --- Footer / Signatures ---
    doc.setFont('times', 'bold');
    const pageHeight = doc.internal.pageSize.height;
    doc.line(15, pageHeight - 30, 65, pageHeight - 30); // Signature line
    doc.text('Accountant', 15, pageHeight - 25);
    doc.text(company.name, 15, pageHeight - 20);

    doc.save(fileName);
  }

  if (company.printLayout === 'A') {
    const doc = new jsPDF();

    // --- Header Section ---
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.setTextColor('#1155cc');
    doc.text(company.name, 15, 20);

    doc.setTextColor('black');
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    const address = [
      `PHONE NO. = ${company.phone}`,
      `EMAIL = ${company.email}`,
    ];
    if (company.address) {
      address.unshift(...splitAfterChars(company.address));
    }
    doc.text(address, 15, 24);

    if (company.logoUrl) {
      // @ts-expect-error it's working fine without providing height or width
      doc.addImage(company.logoUrl, 'PNG', 160, 12);
    }

    // --- Meta Data Table (Client Info & Date) ---
    autoTable(doc, {
      startY: 40,
      body: [
        [
          client.name,
          `Date: ${new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(invoice.dateOfDelivery)}`,
        ],
        ['Att: KJ Management', `Invoice #: ${invoiceNumber}`],
        [client.name, ''],
      ],
      theme: 'grid',
      styles: {
        font: 'times',
        fontStyle: 'bold',
        textColor: '#566a8a',
        fontSize: 14,
        cellPadding: 1,
        lineWidth: 0.8,
        lineColor: 'black',
      },
    });

    // --- Greeting ---
    let finalY = doc.lastAutoTable.finalY + 5;
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('Dear Sir,', 15, finalY);
    doc.setFont('times', 'normal');
    doc.text(
      'We have delivered the goods at your door, there is a invoice for the respective goods.',
      15,
      finalY + 5,
    );

    // --- Main Items Table ---
    autoTable(doc, {
      startY: finalY + 8,
      head: [
        ['S.No.', 'Item Description', 'Qty', 'Rate', 'Amount'],
      ],
      body,
      foot: [['', '', '', 'Total.', formatAmount(total)]],
      theme: 'grid',
      headStyles: {
        fillColor: [60, 60, 60],
        textColor: 255,
        halign: 'center',
      },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        fontStyle: 'bold',
        halign: 'right',
      },
      columnStyles: {
        0: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    });

    // --- Footer / Signatures ---
    doc.setFont('times', 'bold');
    finalY = doc.lastAutoTable.finalY + 5;
    doc.setFontSize(14);
    doc.setTextColor('#566a8a');
    doc.text('Thank you for your Business', 15, finalY, {});
    doc.setTextColor('black');

    doc.setFontSize(10);
    finalY += 10;
    doc.text('Received By:', 15, finalY);

    finalY += 10;
    const footerInfo = [
      'Name: ________________________________',
      '',
      'Designation: ________________________________',
      '',
      'Department: ________________________________',
      '',
      'Sign: ________________________________',
    ];
    doc.text(footerInfo, 15, finalY);

    doc.save(fileName);
  }
}
