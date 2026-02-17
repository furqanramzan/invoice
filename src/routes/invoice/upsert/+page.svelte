<script lang="ts">
  import jsPDF from 'jspdf';
  import autoTable from 'jspdf-autotable';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash from '@lucide/svelte/icons/trash';
  import Eye from '@lucide/svelte/icons/eye';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { invoiceSchema, statuses } from './utils.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import type { Product } from '$lib/server/db/schema.js';
  import { route, title } from './utils.js';
  import Heading from '$lib/components/heading.svelte';
  import { getSuperForm } from '$lib/superforms.js';
  import HiddenField from '$lib/components/form/hidden-field.svelte';
  import {
    formatAmount,
    formatCents,
    randomInt,
    splitAfterChars,
  } from '$lib/utils.js';
  import DateField from '$lib/components/form/date-field.svelte';
  import RadioField from '$lib/components/form/radio-field.svelte';
  import NumberField from '$lib/components/form/number-field.svelte';
  import MultiFileField from '$lib/components/form/multi-file-field.svelte';
  import { toast } from 'svelte-sonner';
  import SelectField from '$lib/components/form/select-field.svelte';

  let { data } = $props();
  const allProducts = $derived(data.products);
  const isEditing = $derived(!!data.currentInvoice);

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(invoiceSchema, data.form, {
    dataType: 'json',
    onUpdate() {
      $form.images = undefined;
    },
  });
  const { form, isTainted, tainted, errors, enhance, submitting } = superform;

  let locations = $derived(
    data.locations.filter((x) => x.clientId === $form.clientId),
  );

  function addProduct() {
    $form.lineItems = [
      ...$form.lineItems,
      {
        id: randomInt(),
        name: '',
        quantity: 1,
        quotedPrice: 0,
        salePrice: 0,
        actualPrice: 0,
        receivedPrice: 0,
      },
    ];
    setTimeout(
      () =>
        document.getElementById(`name-${$form.lineItems.length - 1}`)?.focus(),
      50,
    );
  }

  function removeProduct(index: number) {
    $form.lineItems = $form.lineItems.filter((_, i) => i !== index);
  }

  let total = $derived(
    $form.lineItems.reduce((acc, p) => acc + p.quantity * p.salePrice, 0),
  );
  let quotedPrice = $derived(
    $form.lineItems.reduce((acc, p) => acc + p.quantity * p.quotedPrice, 0),
  );
  let salePrice = $derived(
    $form.lineItems.reduce((acc, p) => acc + p.quantity * p.salePrice, 0),
  );
  let actualPrice = $derived(
    $form.lineItems.reduce((acc, p) => acc + p.quantity * p.actualPrice, 0),
  );
  let totalProfit = $derived(
    actualPrice === 0
      ? '0.00'
      : (((total - actualPrice) / actualPrice) * 100).toFixed(2),
  );
  let company = $derived(data.companies.find((x) => x.id === $form.companyId));
  let client = $derived(data.clients.find((x) => x.id === $form.clientId));
  let invoiceNumber = $derived(
    (data.invoiceNumbers.find((x) => x.companyId === $form.companyId)
      ?.invoiceNumber || 0) + 1,
  );

  let searchTerm: string[] = $state($form.lineItems.map(() => ''));
  let suggestions: Product[][] = $state($form.lineItems.map(() => []));
  let activeSuggestionIndex: number[] = $state($form.lineItems.map(() => -1)); // -1 means no suggestion is active

  function handleInput(index: number, value: string) {
    searchTerm[index] = value;
    if (value.length > 0) {
      suggestions[index] = allProducts.filter((p) =>
        p.name.toLowerCase().includes(value.toLowerCase()),
      );
      activeSuggestionIndex[index] = -1; // Reset active index when input changes
    } else {
      suggestions[index] = allProducts;
    }
    activeSuggestionIndex[index] = -1; // Reset active index when input changes
  }

  function selectSuggestion(index: number, product: Product) {
    $form.lineItems[index].id = product.id;
    $form.lineItems[index].name = product.name;
    $form.lineItems[index].quotedPrice = product.quotedPrice / 100;
    $form.lineItems[index].actualPrice = product.actualPrice / 100;
    $form.lineItems[index].salePrice = product.salePrice / 100;
    $form.lineItems[index].productId = product.id;
    searchTerm[index] = '';
    suggestions[index] = [];
    activeSuggestionIndex[index] = -1; // Reset active index
  }

  // Reactive block to reset search state when products array changes (e.g., product added/removed)
  $effect(() => {
    searchTerm = $form.lineItems.map(() => '');
    suggestions = $form.lineItems.map(() => []);
    activeSuggestionIndex = $form.lineItems.map(() => -1);
  });

  function handleKeydown(index: number, event: KeyboardEvent) {
    if (suggestions[index].length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault(); // Prevent cursor movement
        activeSuggestionIndex[index] = Math.min(
          activeSuggestionIndex[index] + 1,
          suggestions[index].length - 1,
        );
        break;
      case 'ArrowUp':
        event.preventDefault(); // Prevent cursor movement
        activeSuggestionIndex[index] = Math.max(
          activeSuggestionIndex[index] - 1,
          0,
        );
        break;
      case 'Enter':
        event.preventDefault(); // Prevent form submission
        if (activeSuggestionIndex[index] !== -1) {
          selectSuggestion(
            index,
            suggestions[index][activeSuggestionIndex[index]],
          );
        }
        break;
      case 'Escape':
        event.preventDefault();
        suggestions[index] = []; // Close suggestions
        activeSuggestionIndex[index] = -1;
        break;
    }
  }

  async function exportData() {
    if (isTainted($tainted)) {
      alert(
        'Please save the form before exporting, or try again after it saves.',
      );
      return;
    }
    if (!company) {
      toast.error('Select company first!');
      return;
    }
    if (!client) {
      toast.error('Select client first!');
      return;
    }

    const body = $form.lineItems.map((lineItem, index) => [
      index + 1,
      lineItem.name,
      lineItem.quantity,
      formatAmount(lineItem.salePrice),
      formatAmount(lineItem.salePrice * lineItem.quantity),
    ]);
    const invoiceNumber = `${client.invoiceNumberInitial}-${$form.invoiceNumber}`;
    const fileName = `${invoiceNumber} ${$form.dateOfInvoice.toDateString().replaceAll(' ', '-')} ${company.name} ${$form.lineItems
      .sort((a, b) => b.salePrice * b.quantity - a.salePrice * a.quantity)
      .splice(0, 2)
      .map((x) => x.name)
      .join(', ')}.pdf`;

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
      const addressLines = splitAfterChars(` ${company.address}`, 45);
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

      dddt('Date: ', $form.dateOfDelivery.toDateString(), 160, 60);
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
          ['S.NO', 'DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL UNIT PRICE'],
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
      doc.text('1. All the prices mentioned are in PKR.', 15, finalY + 5);

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
            }).format($form.dateOfDelivery)}`,
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
        head: [['S.No.', 'Item Description', 'Qty', 'Rate', 'Amount']],
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
</script>

<Heading
  title={(isEditing ? 'Edit ' : 'New ') + title.singular}
  link={{ route: route.list, title: `List ${title.plural}` }}
/>

<form enctype="multipart/form-data" class="space-y-4" method="POST" use:enhance>
  {#if isEditing}
    <HiddenField {superform} field="id" />
  {/if}

  <div class="grid grid-cols-2">
    <div class="space-y-4">
      <RadioField
        {superform}
        field="companyId"
        label="Company"
        options={data.companies.map((x) => ({ label: x.name, value: x.id }))}
        onchange={() => {
          if (isEditing) {
            return;
          }
          $form.invoiceNumber = invoiceNumber;
        }}
      />
      <RadioField
        {superform}
        field="clientId"
        label="Client"
        options={data.clients.map((x) => ({ label: x.name, value: x.id }))}
      />
      <SelectField
        {superform}
        field="locationId"
        label="Location"
        options={locations.map((x) => ({ value: x.id, label: x.address }))}
      />
      <NumberField
        {superform}
        field="invoiceNumber"
        label="{title.singular} Number"
      />
      <DateField {superform} field="dateOfDelivery" />
      <DateField {superform} field="dateOfInvoice" />
      <NumberField
        {superform}
        disabled={$form.lineItems.some((x) => x.receivedPrice)}
        field="receivedAmount"
      />
      <RadioField {superform} field="status" options={statuses} />
    </div>
    <div class="flex flex-col items-end gap-4 text-lg font-bold">
      <div>
        Actual Price: {formatAmount(actualPrice)}
      </div>
      <div>
        Quoted Price: {formatAmount(quotedPrice)}
      </div>
      <div>
        Sale Price: {formatAmount(salePrice)}
      </div>
      <div>Profit: {totalProfit}%</div>
    </div>
  </div>

  <div class="flex items-center gap-2">
    <Button type="button" onclick={addProduct}>
      <Plus />
    </Button>
    <h2 class="text-lg font-semibold">Products</h2>
  </div>
  <Table.Root class="border">
    <Table.Header>
      <Table.Row>
        <Table.Head class="py-4 text-nowrap"></Table.Head>
        <Table.Head class="py-4 text-nowrap">#</Table.Head>
        <Table.Head class="w-2/5 py-4 text-nowrap">Name</Table.Head>
        <Table.Head class="py-4 text-nowrap">Quantity</Table.Head>
        <Table.Head class="py-4 text-nowrap">Actual cost</Table.Head>
        <Table.Head class="py-4 text-nowrap">Quoted cost</Table.Head>
        <Table.Head class="py-4 text-nowrap">Sale price</Table.Head>
        <Table.Head class="py-4 text-nowrap">Received amount</Table.Head>
        <Table.Head class="py-4 text-nowrap">Profit</Table.Head>
        <Table.Head class="py-4 text-nowrap">Total</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each $form.lineItems as product, index (product.id)}
        <Table.Row>
          <Table.Cell class="py-4 text-nowrap">
            <Button
              variant="destructive"
              type="button"
              onclick={() => removeProduct(index)}
            >
              <Trash class="h-4 w-4" />
            </Button>
          </Table.Cell>
          <Table.Cell class="py-4 text-nowrap">
            {index + 1}
          </Table.Cell>
          <Table.Cell class="py-4 text-nowrap">
            <div class="product-item">
              <div class="relative">
                <Input
                  id="name-{index}"
                  name="products[{index}].name"
                  bind:value={$form.lineItems[index].name}
                  oninput={(e) =>
                    handleInput(index, (e.target as HTMLInputElement).value)}
                  onfocus={(e) =>
                    handleInput(index, (e.target as HTMLInputElement).value)}
                  onkeydown={(e) => handleKeydown(index, e)}
                  onblur={() => (suggestions = [])}
                  autocomplete="off"
                  disabled={!!product.productId}
                />
                {#if $errors.lineItems?.[index]?.name}
                  <p class="text-red-500">{$errors.lineItems[index].name}</p>
                {/if}

                {#if suggestions[index]?.length > 0}
                  <ul
                    class="
    absolute z-10 max-h-48 w-full overflow-y-auto rounded-md border
    border-gray-300 bg-white shadow-lg
    dark:border-zinc-700 dark:bg-zinc-900
  "
                  >
                    {#each suggestions[index] as suggestion, sIndex (sIndex)}
                      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                      <li
                        class="
        cursor-pointer px-4 py-2
        text-gray-900 hover:bg-gray-100
        dark:text-zinc-100 dark:hover:bg-zinc-800
      "
                        class:bg-gray-200={sIndex ===
                          activeSuggestionIndex[index]}
                        class:dark:bg-zinc-800={sIndex ===
                          activeSuggestionIndex[index]}
                        onmousedown={() => selectSuggestion(index, suggestion)}
                      >
                        {suggestion.name}
                        <span class="text-sm text-gray-500 dark:text-zinc-400">
                          ({formatCents(suggestion.actualPrice)}) ({formatCents(
                            suggestion.salePrice,
                          )})
                        </span>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </div>
              <!-- productId is hidden but part of the form submission -->
              <input
                type="hidden"
                name="products[{index}].productId"
                bind:value={$form.lineItems[index].productId}
              />
            </div>
          </Table.Cell>
          <Table.Cell class="py-4 text-nowrap">
            <NumberField
              {superform}
              field="lineItems[{index}].quantity"
              hideLabel
              onchange={() => {
                if (!$form.lineItems[index].quantity) {
                  $form.lineItems[index].quantity = 1;
                }
              }}
            />
          </Table.Cell>
          <Table.Cell class="py-4 text-nowrap">
            <NumberField
              {superform}
              field="lineItems[{index}].actualPrice"
              hideLabel
              onblur={() => {
                if (!$form.lineItems[index].quotedPrice) {
                  $form.lineItems[index].quotedPrice =
                    $form.lineItems[index].actualPrice;
                }
                if (!$form.lineItems[index].actualPrice) {
                  $form.lineItems[index].actualPrice = 0;
                }
              }}
            />
          </Table.Cell>
          <Table.Cell class="py-4 text-nowrap">
            <NumberField
              {superform}
              field="lineItems[{index}].quotedPrice"
              hideLabel
              onblur={() => {
                if (!$form.lineItems[index].quotedPrice) {
                  $form.lineItems[index].quotedPrice = 0;
                }
              }}
            />
          </Table.Cell>
          <Table.Cell class="py-4 text-nowrap">
            <NumberField
              {superform}
              field="lineItems[{index}].salePrice"
              hideLabel
              onblur={() => {
                if (!$form.lineItems[index].salePrice) {
                  $form.lineItems[index].salePrice = 0;
                }
              }}
            />
          </Table.Cell>
          <Table.Cell class="py-4 text-nowrap">
            <NumberField
              {superform}
              field="lineItems[{index}].receivedPrice"
              hideLabel
              onblur={() => {
                if (!$form.lineItems[index].receivedPrice) {
                  $form.lineItems[index].receivedPrice = 0;
                }
                $form.receivedAmount = $form.lineItems.reduce(
                  (totalReceived, lineItem) =>
                    totalReceived + (lineItem.receivedPrice || 0),
                  0,
                );
                if (!$form.receivedAmount) {
                  $form.receivedAmount = data.currentInvoice?.receivedAmount;
                }
              }}
            />
          </Table.Cell>
          <Table.Cell class="w-36 py-4 text-lg text-nowrap">
            {#if product.quotedPrice > 0}
              {(
                ((product.salePrice - product.actualPrice) /
                  product.actualPrice) *
                100
              ).toFixed(2)}%
            {:else}
              0.00%
            {/if}
          </Table.Cell>
          <Table.Cell class="w-36 py-4 text-lg text-nowrap">
            {(product.quantity * product.salePrice).toLocaleString('en-US', {
              style: 'currency',
              currency: 'PKR',
            })}
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>

  <div class="flex items-center gap-2">
    <h2 class="text-lg font-semibold">Attachments</h2>
    <MultiFileField {superform} field="images" hideLabel={true} />
  </div>
  {#if $form.files?.length}
    <Table.Root class="border">
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-16 p-4 text-nowrap"></Table.Head>
          <Table.Head class="w-10 p-4 text-nowrap">#</Table.Head>
          <Table.Head class=" p-4 text-nowrap">Name</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each $form.files as file, index (file.url)}
          {#if !file.deleted}
            <Table.Row>
              <Table.Cell class="space-x-2 p-4 text-nowrap">
                <Button
                  href={file.url}
                  target="_blank"
                  variant="outline"
                  size="icon"
                >
                  <Eye class="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  type="button"
                  onclick={() => {
                    if (!$form.files || !$form.files[index]) {
                      return;
                    }
                    $form.files[index].deleted = true;
                    $form.files = $form.files;
                  }}
                >
                  <Trash class="h-4 w-4" />
                </Button>
              </Table.Cell>
              <Table.Cell class="p-4 text-nowrap">
                {index + 1}
              </Table.Cell>
              <Table.Cell class="p-4 text-nowrap">
                {file.name}
              </Table.Cell>
            </Table.Row>
          {/if}
        {/each}
      </Table.Body>
    </Table.Root>
  {/if}

  <div class="flex gap-2">
    <Button disabled={$submitting || !isTainted($tainted)} type="submit">
      {isEditing ? `Update ${title.singular}` : `Create ${title.singular}`}
    </Button>
    <Button
      type="button"
      onclick={() => exportData()}
      disabled={isTainted($tainted)}>Export to PDF</Button
    >
  </div>
</form>
