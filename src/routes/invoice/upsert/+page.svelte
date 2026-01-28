<script lang="ts">
  import jsPDF from 'jspdf';
  import autoTable from 'jspdf-autotable';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash from '@lucide/svelte/icons/trash';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { invoiceSchema } from './utils.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import type { Product } from '$lib/server/db/schema.js';
  import * as RadioGroup from '$lib/components/ui/radio-group';
  import { route, title } from './utils.js';
  import Heading from '$lib/components/heading.svelte';
  import { getSuperForm } from '$lib/superforms.js';
  import HiddenField from '$lib/components/hidden-field.svelte';
  import TextField from '$lib/components/text-field.svelte';
  import { formatAmount, formatCents } from '$lib/utils.js';

  let { data } = $props();
  const allProducts = $derived(data.products);
  const isEditing = $derived(!!data.currentInvoice);
  const isDelivered = $derived(data.currentInvoice?.status === 'delivered');
  const isReturned = $derived(data.currentInvoice?.status === 'returned');
  const isImmutable = $derived(isDelivered || isReturned);

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(invoiceSchema, data.form, {
    dataType: 'json',
  });
  const { form, isTainted, tainted, errors, enhance, submitting } = superform;

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
    $form.lineItems[index].costPrice = product.costPrice / 100;
    $form.lineItems[index].unitPrice = product.unitPrice / 100;
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
      date: $form.date,
      products: $form.lineItems.map((p) => ({
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalPrice: p.quantity * p.unitPrice,
      })),
    };

    const total = invoiceData.products.reduce(
      (sum, p) => sum + p.totalPrice,
      0,
    );

    const doc = new jsPDF();

    doc.setFontSize(12);

    doc.setFont('helvetica', 'bold');
    doc.text(`${title.singular} #:`, 120, 20);
    doc.setFont('helvetica', 'normal');
    doc.text(String(invoiceData.invoiceNumber), 160, 20);

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 120, 28);
    doc.setFont('helvetica', 'normal');
    doc.text(String(invoiceData.date), 160, 28);

    doc.setFont('helvetica', 'bold');
    doc.text('Store:', 120, 36);
    doc.setFont('helvetica', 'normal');
    doc.text(String(invoiceData.store), 160, 36);

    autoTable(doc, {
      startY: 50,
      margin: { left: 15, right: 15 },
      tableWidth: 'auto',
      head: [['Product Name', 'Quantity', 'Unit Price', 'Total Price']],
      body: invoiceData.products.map((p) => [
        p.name,
        p.quantity,
        formatAmount(p.unitPrice),
        formatAmount(p.totalPrice),
      ]),
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 'auto' }, // Product Name
        1: { cellWidth: 25, halign: 'right' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 130, finalY);
    doc.text(formatAmount(total), 190, finalY, { align: 'right' });

    const filename = `${invoiceData.invoiceNumber}_${invoiceData.date}.pdf`;
    doc.save(filename);
  }
</script>

<Heading
  title={(isEditing ? 'Edit ' : 'New ') + title.singular}
  link={{ route: route.list, title: `List ${title.plural}` }}
/>

<form class="space-y-4" method="POST" use:enhance>
  {#if isEditing}
    <HiddenField {superform} field="id" />
  {/if}

  <TextField {superform} disabled={isImmutable} field="store" />
  <TextField
    disabled={isImmutable}
    {superform}
    field="invoiceNumber"
    label="{title.singular} Number"
  />

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
                        onmousedown={() => selectSuggestion(index, suggestion)}
                      >
                        {suggestion.name}
                        <span class="text-sm text-gray-500 dark:text-zinc-400">
                          ({formatCents(suggestion.costPrice)}) ({formatCents(
                            suggestion.unitPrice,
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
                ((product.unitPrice - product.costPrice) / product.costPrice) *
                100
              ).toFixed(2)}%
            {:else}
              0.00%
            {/if}
          </Table.Cell>
          <Table.Cell class="w-36 p-4 text-lg text-nowrap">
            {(product.quantity * product.unitPrice).toLocaleString('en-US', {
              style: 'currency',
              currency: 'PKR',
            })}
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>

  <!-- Display total and profit outside the table for better prominence -->
  <div class="flex justify-end gap-4 text-lg font-bold">
    <div>Profit: {totalProfit}%</div>
    <div>
      Total: {total.toLocaleString('en-US', {
        style: 'currency',
        currency: 'PKR',
      })}
    </div>
  </div>

  <div class="flex gap-2">
    <Button
      disabled={$submitting || isDelivered || !isTainted($tainted)}
      type="submit"
    >
      {isEditing ? `Update ${title.singular}` : `Create ${title.singular}`}
    </Button>
    <Button
      type="button"
      onclick={() => exportData()}
      disabled={isTainted($tainted)}>Export to PDF</Button
    >
  </div>
</form>
