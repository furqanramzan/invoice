<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';

  import {
    Button,
    buttonVariants,
  } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import {
    exportPDF,
    invoiceSchema,
    statuses,
  } from './utils.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import type { Product } from '$lib/server/db/schema.js';
  import { route, title } from './utils.js';
  import Heading from '$lib/components/heading.svelte';
  import { getSuperForm } from '$lib/superforms.js';
  import HiddenField from '$lib/components/form/hidden-field.svelte';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import {
    formatAmount,
    formatCents,
    randomInt,
  } from '$lib/utils.js';
  import DateField from '$lib/components/form/date-field.svelte';
  import NumberField from '$lib/components/form/number-field.svelte';
  import MultiFileField from '$lib/components/form/multi-file-field.svelte';
  import SelectField from '$lib/components/form/select-field.svelte';
  import { NotebookPen, Pencil, Trash } from '@lucide/svelte';
  import TextAreaField from '$lib/components/form/text-area-field.svelte';
  import TextField from '$lib/components/form/text-field.svelte';

  let { data } = $props();
  const allProducts = $derived(data.products);
  const isEditing = $derived(!!data.currentInvoice);

  let productNameDialog = $state(false);

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(invoiceSchema, data.form, {
    dataType: 'json',
  });
  const {
    form,
    isTainted,
    tainted,
    errors,
    enhance,
    submitting,
  } = superform;

  let locations = $derived(
    data.locations.filter((x) => x.clientId === $form.clientId),
  );

  let draggedItemIndex = $state<number | null>(null);

  function handleDragStart(event: DragEvent, index: number) {
    draggedItemIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (
      draggedItemIndex !== null &&
      draggedItemIndex !== index
    ) {
      // Add a visual indicator for drag-over target
      const targetRow = event.currentTarget as HTMLElement;
      targetRow.classList.add('drag-over');
    }
  }

  function handleDragLeave(event: DragEvent) {
    (event.currentTarget as HTMLElement).classList.remove(
      'drag-over',
    );
  }

  function handleDrop(event: DragEvent, index: number) {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove(
      'drag-over',
    );
    if (draggedItemIndex === null) return;

    const draggedIndex = draggedItemIndex;
    const droppedIndex = index;

    if (draggedIndex === droppedIndex) {
      draggedItemIndex = null;
      return;
    }

    const newLineItems = [...$form.lineItems];
    const [removed] = newLineItems.splice(draggedIndex, 1);
    newLineItems.splice(droppedIndex, 0, removed);
    $form.lineItems = newLineItems;
    draggedItemIndex = null;
  }

  function handleDragEnd() {
    draggedItemIndex = null;
    // Remove drag-over class from all rows in case dragEnd fires without drop
    document
      .querySelectorAll('.drag-over')
      .forEach((el) => el.classList.remove('drag-over'));
  }

  function addLineItem() {
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
  }

  function removeLineItem(index: number) {
    $form.lineItems = $form.lineItems.filter(
      (_, i) => i !== index,
    );
  }

  let total = $derived(
    $form.lineItems.reduce(
      (acc, p) => acc + p.quantity * p.salePrice,
      0,
    ),
  );
  let quotedPrice = $derived(
    $form.lineItems.reduce(
      (acc, p) => acc + p.quantity * p.quotedPrice,
      0,
    ),
  );
  let totalQuotedProfit = $derived(
    quotedPrice === 0
      ? 0
      : Math.floor(((total - quotedPrice) / quotedPrice) * 100),
  );
  let actualPrice = $derived(
    $form.lineItems.reduce(
      (acc, p) => acc + p.quantity * p.actualPrice,
      0,
    ),
  );
  let totalActualProfit = $derived(
    actualPrice === 0
      ? 0
      : Math.floor(((total - actualPrice) / actualPrice) * 100),
  );
  let salePrice = $derived(
    $form.lineItems.reduce(
      (acc, p) => acc + p.quantity * p.salePrice,
      0,
    ),
  );
  let company = $derived(
    data.companies.find((x) => x.id === $form.companyId),
  );
  let client = $derived(
    data.clients.find((x) => x.id === $form.clientId),
  );
  let invoiceNumber = $derived(
    (data.invoiceNumbers.find(
      (x) => x.companyId === $form.companyId,
    )?.invoiceNumber || 0) + 1,
  );

  let searchTerm: string[] = $state(
    $form.lineItems.map(() => ''),
  );
  let suggestions: Product[][] = $state(
    $form.lineItems.map(() => []),
  );
  let activeSuggestionIndex: number[] = $state(
    $form.lineItems.map(() => -1),
  ); // -1 means no suggestion is active

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
    $form.lineItems[index].quotedPrice =
      product.quotedPrice / 100;
    $form.lineItems[index].actualPrice =
      product.actualPrice / 100;
    $form.lineItems[index].salePrice = product.salePrice / 100;
    $form.lineItems[index].productId = product.id;
    searchTerm[index] = '';
    suggestions[index] = [];
    activeSuggestionIndex[index] = -1;
    productNameDialog = false;

    setTimeout(
      () =>
        document
          .getElementById(
            `lineItems[${$form.lineItems.length - 1}].quantity`,
          )
          ?.focus(),
      50,
    );
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
    await exportPDF($form, company, client);
  }
</script>

<Heading
  title={(isEditing ? 'Edit ' : 'New ') + title.singular}
  link={{
    route: route.list,
    title: `List ${title.plural}`,
  }}
/>

<form
  enctype="multipart/form-data"
  class="space-y-4"
  method="POST"
  use:enhance
>
  {#if isEditing}
    <HiddenField {superform} field="id" />
  {/if}

  <div
    class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
  >
    <SelectField
      {superform}
      field="companyId"
      label="Company"
      options={data.companies.map((x) => ({
        label: x.name,
        value: x.id,
      }))}
      onchange={() => {
        if (isEditing) {
          return;
        }
        $form.invoiceNumber = invoiceNumber;
      }}
    />
    <SelectField
      {superform}
      field="clientId"
      label="Client"
      options={data.clients.map((x) => ({
        label: x.name,
        value: x.id,
      }))}
    />
    <SelectField
      {superform}
      field="locationId"
      label="Location"
      options={locations
        .filter((x) => x.clientId === $form.clientId)
        .map((x) => ({ value: x.id, label: x.address }))}
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
    <SelectField {superform} field="status" options={statuses} />
    <TextAreaField {superform} label="Remarks" field="remarks" />
  </div>
  <div
    class="grid grid-cols-1 gap-2 text-lg font-bold md:grid-cols-3"
  >
    <div>
      Actual Price: {formatAmount(actualPrice)}
    </div>
    <div>
      Quoted Price: {formatAmount(quotedPrice)}
    </div>
    <div>
      Sale Price: {formatAmount(salePrice)}
    </div>
    <div>Actual Profit: {totalActualProfit}%</div>
    <div>Quoted Profit: {totalQuotedProfit}%</div>
  </div>

  <div class="mb-1 flex items-center gap-2">
    <Dialog.Root bind:open={productNameDialog}>
      <Dialog.Trigger
        type="button"
        class={buttonVariants({
          size: 'icon-sm',
        })}
        onclick={addLineItem}
      >
        <Plus class="h-4 w-4" />
      </Dialog.Trigger>
      <Dialog.Content class="sm:max-w-xl">
        {@const index = $form.lineItems.length - 1}
        <Dialog.Header>
          <Dialog.Title>Product # {index + 1}</Dialog.Title>
        </Dialog.Header>
        <div class="relative">
          <Input
            id="product-name-{index}"
            name="products[{index}].name"
            bind:value={$form.lineItems[index].name}
            oninput={(e) =>
              handleInput(
                index,
                (e.target as HTMLInputElement).value,
              )}
            onfocus={(e) =>
              handleInput(
                index,
                (e.target as HTMLInputElement).value,
              )}
            onkeydown={(e) => handleKeydown(index, e)}
            onblur={() => (suggestions = [])}
            autocomplete="off"
          />
          {#if $errors.lineItems?.[index]?.name}
            <p class="text-red-500">
              {$errors.lineItems[index].name}
            </p>
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
                  onmousedown={() =>
                    selectSuggestion(index, suggestion)}
                >
                  {suggestion.name}
                  <span
                    class="text-sm text-gray-500 dark:text-zinc-400"
                  >
                    ({formatCents(suggestion.actualPrice)}) ({formatCents(
                      suggestion.salePrice,
                    )})
                  </span>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </Dialog.Content>
    </Dialog.Root>
    <h2 class="text-lg font-semibold">Products</h2>
  </div>
  <p>Drag and drop to reorder.</p>
  <Table.Root class="max-w-full border">
    <Table.Header>
      <Table.Row>
        <Table.Head class="py-4"></Table.Head>
        <Table.Head class="py-4">#</Table.Head>
        <Table.Head class="w-2/5 py-4">Name</Table.Head>
        <Table.Head class="py-4">Quantity</Table.Head>
        <Table.Head class="py-4">Actual cost</Table.Head>
        <Table.Head class="py-4">Quoted cost</Table.Head>
        <Table.Head class="py-4">Sale price</Table.Head>
        <Table.Head class="py-4">Received amount</Table.Head>
        <Table.Head class="py-4">Profit</Table.Head>
        <Table.Head class="py-4">Total</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each $form.lineItems as lineItem, index (index)}
        <Table.Row
          draggable="true"
          ondragstart={(event) => handleDragStart(event, index)}
          ondragover={(event) => handleDragOver(event, index)}
          ondragleave={handleDragLeave}
          ondrop={(event) => handleDrop(event, index)}
          ondragend={handleDragEnd}
        >
          <Table.Cell class="py-2">
            <Button
              variant="destructive"
              size="icon-sm"
              type="button"
              onclick={() => removeLineItem(index)}
            >
              <Trash class="h-4 w-4" />
            </Button>
            <Dialog.Root>
              <Dialog.Trigger
                type="button"
                class={buttonVariants({
                  variant: 'outline',
                  size: 'icon-sm',
                })}
              >
                {#if lineItem.remarks}
                  <NotebookPen class="h-4 w-4" />
                {:else}
                  <Pencil class="h-4 w-4" />
                {/if}
              </Dialog.Trigger>
              <Dialog.Content class="sm:max-w-xl">
                <Dialog.Header>
                  <Dialog.Title>{lineItem.name}</Dialog.Title>
                </Dialog.Header>
                <div class="grid gap-4">
                  <TextAreaField
                    {superform}
                    label="Remarks"
                    field="lineItems[{index}].remarks"
                  />
                </div>
              </Dialog.Content>
            </Dialog.Root>
          </Table.Cell>
          <Table.Cell class="py-2">
            {index + 1}
          </Table.Cell>
          <Table.Cell class="py-2">
            <TextField
              hideLabel
              {superform}
              field="lineItems[{index}].name"
              disabled={Boolean(lineItem.productId)}
            />
            <input
              type="hidden"
              name="lineItem[{index}].productId"
              bind:value={$form.lineItems[index].productId}
            />
          </Table.Cell>
          <Table.Cell class="py-2">
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
          <Table.Cell class="py-2">
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
          <Table.Cell class="py-2">
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
          <Table.Cell class="py-2">
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
          <Table.Cell class="py-2">
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
                    totalReceived +
                    (lineItem.receivedPrice || 0),
                  0,
                );
                if (!$form.receivedAmount) {
                  $form.receivedAmount =
                    data.currentInvoice?.receivedAmount;
                }
              }}
            />
          </Table.Cell>
          <Table.Cell class="w-16 py-2">
            {#if lineItem.quotedPrice > 0}
              {Math.floor(
                ((lineItem.salePrice - lineItem.actualPrice) /
                  lineItem.actualPrice) *
                  100,
              )}%
            {:else}
              0.00%
            {/if}
          </Table.Cell>
          <Table.Cell class="w-36 py-2">
            {formatAmount(
              lineItem.quantity * lineItem.salePrice,
            )}
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>

  <MultiFileField
    {superform}
    field="attachments"
    urlsField="attachmentUrls"
  />

  <div class="flex gap-2">
    <Button
      disabled={$submitting || !isTainted($tainted)}
      type="submit"
    >
      {isEditing
        ? `Update ${title.singular}`
        : `Create ${title.singular}`}
    </Button>
    <Button type="button" onclick={() => exportData()}>
      Export to PDF
    </Button>
  </div>
</form>
