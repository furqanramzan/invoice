<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';

  import {
    Button,
    buttonVariants,
  } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { purchaseSchema, route, title } from './utils.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import type { Product } from '$lib/server/db/schema.js';
  import Heading from '$lib/components/heading.svelte';
  import { getSuperForm } from '$lib/superforms.js';
  import HiddenField from '$lib/components/form/hidden-field.svelte';
  import { formatAmount, randomInt } from '$lib/utils.js';
  import DateField from '$lib/components/form/date-field.svelte';
  import NumberField from '$lib/components/form/number-field.svelte';
  import SelectField from '$lib/components/form/select-field.svelte';
  import { Trash } from '@lucide/svelte';
  import TextAreaField from '$lib/components/form/text-area-field.svelte';
  import TextField from '$lib/components/form/text-field.svelte';

  let { data } = $props();
  const isEditing = $derived(!!data.currentPurchase);

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(purchaseSchema, data.form, {
    dataType: 'json',
  });
  const { form, errors, enhance, submitting } = superform;

  let companyProducts = $derived(
    (data.products as Product[]).filter(
      (x) => x.companyId === $form.companyId,
    ),
  );

  let filteredSuppliers = $derived(
    (data.suppliers as Array<{ companyId: number; name: string; id: number }>).filter(
      (x) => x.companyId === $form.companyId,
    ),
  );

  function addItem() {
    $form.items = [
      ...$form.items,
      { productId: 0, name: '', quantity: 1, unitPrice: 0 },
    ];
  }

  function removeItem(index: number) {
    $form.items = $form.items.filter(
      (_: { productId: number; name: string; quantity: number; unitPrice: number }, i: number) => i !== index,
    );
  }

  let total = $derived(
    $form.items.reduce(
      (acc: number, item: { productId: number; name: string; quantity: number; unitPrice: number }) =>
        acc + item.quantity * item.unitPrice,
      0,
    ),
  );

  let searchTerm: string[] = $state($form.items.map(() => ''));
  let suggestions: Product[][] = $state(
    $form.items.map(() => []),
  );
  let activeSuggestionIndex: number[] = $state(
    $form.items.map(() => -1),
  );

  function handleInput(index: number, value: string) {
    searchTerm[index] = value;
    if (value.length > 0) {
      suggestions[index] = companyProducts.filter((p) =>
        p.name.toLowerCase().includes(value.toLowerCase()),
      );
    } else {
      suggestions[index] = companyProducts;
    }
    activeSuggestionIndex[index] = -1;
  }

  function selectSuggestion(index: number, product: Product) {
    $form.items[index].productId = product.id;
    $form.items[index].name = product.name;
    $form.items[index].unitPrice = product.salePrice / 100;
    searchTerm[index] = '';
    suggestions[index] = [];
    activeSuggestionIndex[index] = -1;
  }

  $effect(() => {
    searchTerm = $form.items.map(() => '');
    suggestions = $form.items.map(() => []);
    activeSuggestionIndex = $form.items.map(() => -1);
  });

  function handleKeydown(index: number, event: KeyboardEvent) {
    if (suggestions[index].length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        activeSuggestionIndex[index] = Math.min(
          activeSuggestionIndex[index] + 1,
          suggestions[index].length - 1,
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        activeSuggestionIndex[index] = Math.max(
          activeSuggestionIndex[index] - 1,
          0,
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (activeSuggestionIndex[index] !== -1) {
          selectSuggestion(
            index,
            suggestions[index][activeSuggestionIndex[index]],
          );
        }
        break;
      case 'Escape':
        event.preventDefault();
        suggestions[index] = [];
        activeSuggestionIndex[index] = -1;
        break;
    }
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
  class="space-y-4"
  method="POST"
  use:enhance
  data-enctype="multipart/form-data"
>
  {#if isEditing}
    <HiddenField {superform} field="id" />
  {/if}

  <div
    class="grid grid-cols-1 gap-4 md:grid-cols-2"
  >
    <SelectField
      {superform}
      field="companyId"
      label="Company"
      options={data.companies.map((x: { name: string; id: number }) => ({
        label: x.name,
        value: x.id,
      }))}
    />
    <SelectField
      {superform}
      field="supplierId"
      label="Supplier"
      options={filteredSuppliers.map((x: { name: string; id: number }) => ({
        label: x.name,
        value: x.id,
      }))}
    />
    <NumberField
      {superform}
      field="purchaseNumber"
      label="Purchase #"
    />
    <DateField {superform} field="date" />
    <TextAreaField {superform} label="Notes" field="notes" />
  </div>

  <div class="flex items-center gap-2">
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onclick={addItem}
    >
      <Plus class="h-4 w-4" />
    </Button>
    <h2 class="text-lg font-semibold">Items</h2>
  </div>

  <Table.Root class="max-w-full border">
    <Table.Header>
      <Table.Row>
        <Table.Head class="py-4">#</Table.Head>
        <Table.Head class="w-2/5 py-4">Product</Table.Head>
        <Table.Head class="py-4">Quantity</Table.Head>
        <Table.Head class="py-4">Unit Price</Table.Head>
        <Table.Head class="py-4">Total</Table.Head>
        <Table.Head class="py-4"></Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each $form.items as item, index (index)}
        <Table.Row>
          <Table.Cell class="py-2">{index + 1}</Table.Cell>
          <Table.Cell class="py-2">
            <div class="relative">
              <Input
                name="items[{index}].name"
                bind:value={$form.items[index].name}
                placeholder="Search product..."
                autocomplete="off"
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
                onblur={() => {
                  setTimeout(
                    () => (suggestions[index] = []),
                    200,
                  );
                }}
              />
              <input
                type="hidden"
                name="items[{index}].productId"
                bind:value={$form.items[index].productId}
              />
              {#if $errors.items?.[index]?.name}
                <p class="text-red-500 text-xs">
                  {$errors.items[index].name}
                </p>
              {/if}
              {#if suggestions[index]?.length > 0}
                <ul
                  class="absolute z-10 max-h-48 w-full overflow-y-auto rounded-md border border-input bg-background shadow-lg"
                >
                  {#each suggestions[index] as suggestion, sIndex (sIndex)}
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <li
                      class="cursor-pointer px-4 py-2 hover:bg-accent hover:text-accent-foreground"
                      class:bg-accent={sIndex ===
                        activeSuggestionIndex[index]}
                      class:text-accent-foreground={sIndex ===
                        activeSuggestionIndex[index]}
                      onmousedown={() =>
                        selectSuggestion(index, suggestion)}
                    >
                      {suggestion.name}
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>
          </Table.Cell>
          <Table.Cell class="py-2">
            <NumberField
              {superform}
              field="items[{index}].quantity"
              hideLabel
            />
          </Table.Cell>
          <Table.Cell class="py-2">
            <NumberField
              {superform}
              field="items[{index}].unitPrice"
              hideLabel
            />
          </Table.Cell>
          <Table.Cell class="py-2">
            {formatAmount(item.quantity * item.unitPrice)}
          </Table.Cell>
          <Table.Cell class="py-2">
            <Button
              variant="destructive"
              size="icon-sm"
              type="button"
              onclick={() => removeItem(index)}
            >
              <Trash class="h-4 w-4" />
            </Button>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>

  <div class="text-right text-lg font-bold">
    Total: {formatAmount(total)}
  </div>

  <Button disabled={$submitting} type="submit">
    {isEditing
      ? `Update ${title.singular}`
      : `Create ${title.singular}`}
  </Button>
</form>
