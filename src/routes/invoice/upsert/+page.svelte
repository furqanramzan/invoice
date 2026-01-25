<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import Trash from '@lucide/svelte/icons/trash';
  import { superForm } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { invoiceSchema } from './validations.js'; // Corrected import path
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import * as Table from '$lib/components/ui/table/index.js';
  import type { Product } from '$lib/server/db/schema.js';
  import ExcelJS from 'exceljs';
  import * as RadioGroup from '$lib/components/ui/radio-group'; // Import RadioGroup components

  let { data } = $props();
  const allProducts = $derived(data.products);
  const isEditing = $derived(!!data.currentInvoice); // Determine if in editing mode
  const isDelivered = $derived(data.currentInvoice?.status === 'delivered'); // Check if invoice is delivered
  const isReturned = $derived(data.currentInvoice?.status === 'returned'); // Check if invoice is returned
  const isImmutable = $derived(isDelivered || isReturned); // Check if invoice is in an immutable state

  // svelte-ignore state_referenced_locally
  const { form, isTainted, tainted, errors, enhance, submitting } = superForm(
    data.form,
    {
      dataType: 'json',
      validators: zod4(invoiceSchema),
    },
  );

  function addProduct() {
    $form.lineItems = [
      ...$form.lineItems,
      {
        id: crypto.randomUUID(),
        name: '',
        quantity: 1,
        costPrice: 0,
        unitPrice: 0,
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
    $form.lineItems.reduce((acc, p) => acc + p.quantity * p.unitPrice, 0),
  );
  let totalCost = $derived(
    $form.lineItems.reduce((acc, p) => acc + p.quantity * p.costPrice, 0),
  );
  let totalProfit = $derived(
    totalCost === 0
      ? '0.00'
      : (((total - totalCost) / totalCost) * 100).toFixed(2),
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
    $form.lineItems[index].name = product.name;
    $form.lineItems[index].costPrice = product.costPrice;
    $form.lineItems[index].unitPrice = product.unitPrice;
    $form.lineItems[index].productId = product.id;
    searchTerm[index] = '';
    suggestions[index] = [];
    activeSuggestionIndex[index] = -1; // Reset active index
  }

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

  // Reactive block to reset search state when products array changes (e.g., product added/removed)
  $effect(() => {
    searchTerm = $form.lineItems.map(() => '');
    suggestions = $form.lineItems.map(() => []);
    activeSuggestionIndex = $form.lineItems.map(() => -1);
  });

  async function exportData() {
    if (isTainted($tainted)) {
      alert(
        'Please save the form before exporting, or try again after it saves.',
      );
      return;
    }

    // Prepare invoice data
    const invoiceData = {
      store: $form.store,
      invoiceNumber: $form.invoiceNumber,
      products: $form.lineItems.map((p) => ({
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalPrice: p.quantity * p.unitPrice,
      })),
    };

    // Calculate total
    const total = invoiceData.products.reduce(
      (sum, p) => sum + p.totalPrice,
      0,
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoice');

    // Add invoice header information (Columns C)
    worksheet.getCell('C1').value = 'Invoice #:';
    worksheet.getCell('C1').font = { bold: true };
    worksheet.getCell('D1').value = invoiceData.invoiceNumber;

    worksheet.getCell('C2').value = 'Date:';
    worksheet.getCell('C2').font = { bold: true };
    worksheet.getCell('D2').value = $form.date;

    worksheet.getCell('C3').value = 'Store:';
    worksheet.getCell('C3').font = { bold: true };
    worksheet.getCell('D3').value = invoiceData.store;

    // Add product table headers (Row 6)
    worksheet.getCell('A6').value = 'Product Name';
    worksheet.getCell('A6').font = { bold: true };
    worksheet.getCell('B6').value = 'Quantity';
    worksheet.getCell('B6').font = { bold: true };
    worksheet.getCell('C6').value = 'Unit Price';
    worksheet.getCell('C6').font = { bold: true };
    worksheet.getCell('D6').value = 'Total Price';
    worksheet.getCell('D6').font = { bold: true };

    // Add product data (starting from Row 7)
    if (invoiceData.products.length > 0) {
      invoiceData.products.forEach((p, index) => {
        const rowNum = 7 + index;
        worksheet.getCell(`A${rowNum}`).value = p.name;
        worksheet.getCell(`B${rowNum}`).value = p.quantity;
        worksheet.getCell(`C${rowNum}`).value = p.unitPrice;
        worksheet.getCell(`C${rowNum}`).numFmt = '#,##0.00';
        worksheet.getCell(`D${rowNum}`).value = p.totalPrice;
        worksheet.getCell(`D${rowNum}`).numFmt = '#,##0.00';
      });
    }

    // Add total row
    const lastRow = 6 + invoiceData.products.length;
    worksheet.getCell(`C${lastRow + 2}`).value = 'Total:';
    worksheet.getCell(`C${lastRow + 2}`).font = { bold: true };
    worksheet.getCell(`D${lastRow + 2}`).value = total;
    worksheet.getCell(`D${lastRow + 2}`).font = { bold: true };
    worksheet.getCell(`D${lastRow + 2}`).numFmt = '#,##0.00';

    // Set column widths for better readability
    worksheet.getColumn(1).width = 30; // Product Name
    worksheet.getColumn(2).width = 12; // Quantity
    worksheet.getColumn(3).width = 15; // Unit Price
    worksheet.getColumn(4).width = 15; // Total Price
    worksheet.getColumn(5).width = 12; // Column E (empty, for spacing)
    worksheet.getColumn(6).width = 12; // Column F (empty, for spacing)
    worksheet.getColumn(7).width = 20; // Column G (for store/invoice info)

    // Freeze the header row (row 6) so it stays visible when scrolling
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 6 }];

    // Write to file
    const filename = `${invoiceData.invoiceNumber}_${$form.date}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
</script>

<div class="container mx-auto space-y-4">
  <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
    {isEditing ? 'Edit Invoice' : 'New Invoice'}
  </h1>
  <form class="space-y-4" method="POST" use:enhance>
    {#if isEditing}
      <input type="hidden" name="id" bind:value={$form.id} />
    {/if}
    <div>
      <Label for="store" class="mb-1">Store</Label>
      <Input
        id="store"
        name="store"
        bind:value={$form.store}
        disabled={isImmutable}
      />
      {#if $errors.store}
        <p class="text-red-500">{$errors.store}</p>
      {/if}
    </div>

    <div>
      <Label for="invoiceNumber" class="mb-1">Invoice Number</Label>
      <Input
        id="invoiceNumber"
        name="invoiceNumber"
        bind:value={$form.invoiceNumber}
        disabled={isImmutable}
      />
      {#if $errors.invoiceNumber}
        <p class="text-red-500">{$errors.invoiceNumber}</p>
      {/if}
    </div>

    <div>
      <Label for="date" class="mb-1">Date</Label>
      <Input
        id="date"
        name="date"
        type="date"
        bind:value={$form.date}
        disabled={isImmutable}
      />
      {#if $errors.date}
        <p class="text-red-500">{$errors.date}</p>
      {/if}
    </div>

    <div>
      <Label for="status" class="mb-1">Status</Label>
      <RadioGroup.Root class="flex gap-2" bind:value={$form.status}>
        <div class="flex items-center space-x-2">
          <RadioGroup.Item value="draft" id="status-draft" />
          <Label for="status-draft">Draft</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroup.Item value="processing" id="status-processing" />
          <Label for="status-processing">Processing</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroup.Item value="delivered" id="status-delivered" />
          <Label for="status-delivered">Delivered</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroup.Item value="returned" id="status-returned" />
          <Label for="status-returned">Returned</Label>
        </div>
      </RadioGroup.Root>
      <input type="hidden" name="status" bind:value={$form.status} />
      {#if $errors.status}
        <p class="text-red-500">{$errors.status}</p>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      <Button type="button" onclick={addProduct} disabled={isImmutable}>
        <Plus />
      </Button>
      <h2 class="text-lg font-semibold">Products</h2>
    </div>
    <Table.Root class="border">
      <Table.Header>
        <Table.Row>
          <Table.Head class="p-4 text-nowrap"></Table.Head>
          <Table.Head class="p-4 text-nowrap">#</Table.Head>
          <Table.Head class="w-2/5 p-4 text-nowrap">Name</Table.Head>
          <Table.Head class="p-4 text-nowrap">Quantity</Table.Head>
          <Table.Head class="p-4 text-nowrap">Unit cost</Table.Head>
          <Table.Head class="p-4 text-nowrap">Unit price</Table.Head>
          <Table.Head class="p-4 text-nowrap">Profit</Table.Head>
          <Table.Head class="p-4 text-nowrap">Total</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each $form.lineItems as product, index (product.id)}
          <Table.Row>
            <Table.Cell class="p-4 text-nowrap">
              <Button
                variant="destructive"
                type="button"
                onclick={() => removeProduct(index)}
                disabled={isImmutable}
              >
                <Trash class="h-4 w-4" />
              </Button>
            </Table.Cell>
            <Table.Cell class="p-4 text-nowrap">
              {index + 1}
            </Table.Cell>
            <Table.Cell class="p-4 text-nowrap">
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
                    disabled={!!product.productId || isDelivered}
                  />
                  {#if $errors.lineItems?.[index]?.name}
                    <p class="text-red-500">{$errors.lineItems[index].name}</p>
                  {/if}

                  {#if suggestions[index]?.length > 0 && !isDelivered}
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
                          onmousedown={() =>
                            selectSuggestion(index, suggestion)}
                        >
                          {suggestion.name}
                          <span
                            class="text-sm text-gray-500 dark:text-zinc-400"
                          >
                            ({suggestion.costPrice}) ({suggestion.unitPrice})
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
            <Table.Cell class="p-4 text-nowrap">
              <div>
                <Input
                  id="quantity-{index}"
                  name="products[{index}].quantity"
                  type="number"
                  bind:value={$form.lineItems[index].quantity}
                  disabled={isImmutable}
                />
                {#if $errors.lineItems?.[index]?.quantity}
                  <p class="text-red-500">
                    {$errors.lineItems[index].quantity}
                  </p>
                {/if}
              </div>
            </Table.Cell>
            <Table.Cell class="p-4 text-nowrap">
              <div>
                <Input
                  id="costPrice-{index}"
                  name="products[{index}].costPrice"
                  type="number"
                  bind:value={$form.lineItems[index].costPrice}
                  disabled={isImmutable}
                />
                {#if $errors.lineItems?.[index]?.costPrice}
                  <p class="text-red-500">
                    {$errors.lineItems[index].costPrice}
                  </p>
                {/if}
              </div>
            </Table.Cell>
            <Table.Cell class="p-4 text-nowrap">
              <div>
                <Input
                  id="unitPrice-{index}"
                  name="products[{index}].unitPrice"
                  type="number"
                  bind:value={$form.lineItems[index].unitPrice}
                  disabled={isImmutable}
                />
                {#if $errors.lineItems?.[index]?.unitPrice}
                  <p class="text-red-500">
                    {$errors.lineItems[index].unitPrice}
                  </p>
                {/if}
              </div>
            </Table.Cell>
            <Table.Cell class="w-36 p-4 text-lg text-nowrap">
              {#if product.costPrice > 0}
                {(
                  ((product.unitPrice - product.costPrice) /
                    product.costPrice) *
                  100
                ).toFixed(2)}%
              {:else}
                0.00%
              {/if}
            </Table.Cell>
            <Table.Cell class="w-36 p-4 text-lg text-nowrap">
              {product.quantity * product.unitPrice}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>

    <!-- Display total and profit outside the table for better prominence -->
    <div class="flex justify-end gap-4 text-lg font-bold">
      <div>Profit: {totalProfit}%</div>
      <div>Total: {total}</div>
    </div>

    <div class="flex gap-2">
      <Button
        disabled={$submitting || isDelivered || !isTainted($tainted)}
        type="submit"
      >
        {#if $submitting}
          <Spinner />
        {/if}
        {isEditing ? 'Update Invoice' : 'Create Invoice'}
      </Button>
      <Button
        type="button"
        onclick={() => exportData()}
        disabled={isTainted($tainted)}>Export to XLSX</Button
      >
    </div>
  </form>
</div>
