import fs from 'fs/promises';
import path from 'path';
import ExcelJS, { type Row } from 'exceljs';
import { initForm, sendMessage, validateAction } from '$lib/superforms.js';
import { importSchema } from './utils.js';

export async function load() {
  const form = await initForm(importSchema);

  return { form };
}

export const actions = {
  async default(event) {
    const form = await validateAction(event, importSchema);
    if (!form.valid) return form.error;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await form.data.logo.arrayBuffer());

    const sheet = workbook.getWorksheet('RR');

    if (!sheet) {
      return { form };
    }

    interface Invoice {
      location?: string;
      invoiceNumber: number;
      dateOfDelivery: Date;
      dateOfInvoice: Date;
      lineItems: LineItem[];
      receivedAmount?: number;
    }

    interface LineItem {
      name: string;
      quantity: number;
      actualPrice: number;
      salePrice: number;
      quotedPrice: number;
    }
    const invoices: Array<Invoice> = [];
    let currentInvoice: Invoice | undefined;

    for (let rowIndex = 3; rowIndex <= sheet.actualRowCount; rowIndex++) {
      const row = sheet.getRow(rowIndex);

      function getCell(cellNumber: number, providedRow?: Row) {
        if (!providedRow) {
          providedRow = row;
        }
        return (
          (
            providedRow.getCell(cellNumber).value as unknown as {
              result: string;
            }
          )?.result ||
          (providedRow.getCell(cellNumber).value as unknown as string)
        );
      }

      const invoiceNumber = Number(getCell(5));
      if (invoiceNumber) {
        let location = String(getCell(3) || '');
        let dateOfDelivery = new Date(getCell(6) || getCell(7));
        let dateOfInvoice = new Date(getCell(7) || getCell(6));
        if (!location || !isNaN(dateOfDelivery.getTime())) {
          for (
            let previouRowIndex = rowIndex - 1;
            previouRowIndex > 0;
            previouRowIndex--
          ) {
            const previousRow = sheet.getRow(previouRowIndex);
            const hasInvoiceNumber = Boolean(getCell(5));
            if (hasInvoiceNumber) {
              break;
            }

            if (!location) {
              location = String(getCell(3, previousRow) || '');
            }
            if (!dateOfDelivery) {
              dateOfDelivery = new Date(
                getCell(6, previousRow) || getCell(7, previousRow),
              );
              dateOfInvoice = new Date(
                getCell(7, previousRow) || getCell(6, previousRow),
              );
            }
            if (location && !isNaN(dateOfDelivery.getTime())) {
              break;
            }
          }
        }
        if (isNaN(dateOfDelivery.getTime())) {
          const preDateOfDelivery = invoices.at(
            invoices.length - 1,
          )?.dateOfDelivery;
          const preDateOfInvoice = invoices.at(
            invoices.length - 1,
          )?.dateOfInvoice;
          if (preDateOfDelivery && preDateOfInvoice) {
            dateOfDelivery = preDateOfDelivery;
            dateOfInvoice = preDateOfInvoice;
          }
        }
        currentInvoice = {
          location,
          invoiceNumber,
          dateOfDelivery,
          dateOfInvoice,
          lineItems: [],
        };
        invoices.push(currentInvoice);
      }

      const name = String(getCell(8) || '');
      if (currentInvoice && name) {
        let quantity = Number(getCell(9));
        let actualPrice = Number(getCell(10));
        let salePrice = Number(getCell(14));
        if (!actualPrice) {
          actualPrice = Number(getCell(11));
        }
        if (!salePrice) {
          salePrice = Number(getCell(15));
        }
        if (!actualPrice && !salePrice) {
          continue;
        }
        if (!quantity) {
          quantity = 1;
        }
        if (salePrice && !actualPrice) {
          actualPrice = salePrice * 0.6;
        }
        if (actualPrice && !salePrice) {
          salePrice = actualPrice * 1.4;
        }
        const quotedPrice = Number(getCell(2)) || actualPrice;
        currentInvoice.lineItems.push({
          name,
          quantity,
          actualPrice,
          salePrice,
          quotedPrice,
        });
      }

      const receivedAmount = Number(getCell(21));
      if (currentInvoice && receivedAmount) {
        currentInvoice.receivedAmount = receivedAmount;
      }
    }

    const filePath = path.resolve(process.cwd(), 'invoices.json');
    await fs.writeFile(filePath, JSON.stringify(invoices, null, 2), 'utf-8');

    console.log('Done done');

    return sendMessage(form, 'File imported!');
  },
};
