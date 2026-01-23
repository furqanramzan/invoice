<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import Trash from '@lucide/svelte/icons/trash';
  import Circle from '@lucide/svelte/icons/circle';
  import { superForm } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { invoiceSchema } from './validations.js';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import * as Table from '$lib/components/ui/table/index.js';

  const { data } = $props();
  const allProducts = $derived(data.products);

  const { form, errors, enhance, submitting } = superForm(data.form, {
    dataType: 'json',
    validators: zod4(invoiceSchema),
  });

  function addProduct() {
    $form.products = [
      ...$form.products,
      {
        id: crypto.randomUUID(),
        name: '',
        quantity: 1,
        costPrice: 0,
        unitPrice: 0,
      },
    ];
    setTimeout(() => document.getElementById(`name-${$form.products.length - 1}`)?.focus(), 50);
  }

  function removeProduct(index: number) {
    $form.products = $form.products.filter((_, i) => i !== index);
  }

  let total = $derived($form.products.reduce((acc, p) => acc + p.quantity * p.unitPrice, 0));

  let searchTerm: string[] = $state($form.products.map(() => ''));
  let suggestions: any[][] = $state($form.products.map(() => []));
  let activeSuggestionIndex: number[] = $state($form.products.map(() => -1)); // -1 means no suggestion is active

  function handleInput(index: number, value: string) {
    searchTerm[index] = value;
    if (value.length > 0) {
      suggestions[index] = allProducts.filter((p) =>
        p.name.toLowerCase().includes(value.toLowerCase()),
      );
      activeSuggestionIndex[index] = -1; // Reset active index when input changes
    } else {
      suggestions[index] = [];
    }
  }

  function selectSuggestion(index: number, product: any) {
    $form.products[index].name = product.name;
    $form.products[index].costPrice = product.costPrice;
    $form.products[index].unitPrice = product.unitPrice;
    $form.products[index].productId = product.id;
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
        activeSuggestionIndex[index] = Math.max(activeSuggestionIndex[index] - 1, 0);
        break;
      case 'Enter':
        event.preventDefault(); // Prevent form submission
        if (activeSuggestionIndex[index] !== -1) {
          selectSuggestion(index, suggestions[index][activeSuggestionIndex[index]]);
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
    searchTerm = $form.products.map(() => '');
    suggestions = $form.products.map(() => []);
    activeSuggestionIndex = $form.products.map(() => -1);
  });
</script>

<div class="container mx-auto space-y-4">
  <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">New Invoice</h1>
  <form class="space-y-4" method="POST" use:enhance>
    <div>
      <Label for="store">Store</Label>
      <Input id="store" name="store" bind:value={$form.store} />
      {#if $errors.store}
        <p class="text-red-500">{$errors.store}</p>
      {/if}
    </div>

    <div>
      <Label for="invoiceNumber">Invoice Number</Label>
      <Input id="invoiceNumber" name="invoiceNumber" bind:value={$form.invoiceNumber} />
      {#if $errors.invoiceNumber}
        <p class="text-red-500">{$errors.invoiceNumber}</p>
      {/if}
    </div>

    <!-- <div> -->
    <!--   <Label for="date">Date</Label> -->
    <!--   <Input id="date" name="date" type="date" bind:value={$form.date} /> -->
    <!--   {#if $errors.date} -->
    <!--     <p class="text-red-500">{$errors.date}</p> -->
    <!--   {/if} -->
    <!-- </div> -->

    <div class="flex items-center gap-2">
      <Button type="button" onclick={addProduct}><Plus /></Button>
      <h2>Products</h2>
    </div>
    <Table.Root class="border">
      <Table.Header>
        <Table.Row>
          <Table.Head></Table.Head>
          <Table.Head class="w-2/5">Name</Table.Head>
          <Table.Head>Quantity</Table.Head>
          <Table.Head>Unit cost</Table.Head>
          <Table.Head>Unit price</Table.Head>
          <Table.Head>Total</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each $form.products as product, i (product.id)}
          <Table.Row>
            <Table.Cell>
              <Button variant="destructive" type="button" onclick={() => removeProduct(i)}>
                <Trash />
              </Button>
            </Table.Cell>
            <Table.Cell>
              <div class="product-item">
                <div class="relative">
                  <Input
                    id="name-{i}"
                    name="products[{i}].name"
                    bind:value={$form.products[i].name}
                    oninput={(e) => handleInput(i, (e.target as HTMLInputElement).value)}
                    onfocus={(e) => handleInput(i, (e.target as HTMLInputElement).value)}
                    onkeydown={(e) => handleKeydown(i, e)}
                    onblur={() => (suggestions = [])}
                    autocomplete="off"
                    disabled={!!product.productId}
                  />
                  {#if $errors.products?.[i]?.name}
                    <p class="text-red-500">{$errors.products[i].name}</p>
                  {/if}

                  {#if suggestions[i]?.length > 0}
                    <ul
                      class="
    absolute z-10 max-h-48 w-full overflow-y-auto rounded-md border
    border-gray-300 bg-white shadow-lg
    dark:border-zinc-700 dark:bg-zinc-900
  "
                    >
                      {#each suggestions[i] as suggestion, sIndex}
                        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                        <li
                          class="
        cursor-pointer px-4 py-2
        text-gray-900 hover:bg-gray-100
        dark:text-zinc-100 dark:hover:bg-zinc-800
      "
                          class:bg-gray-200={sIndex === activeSuggestionIndex[i]}
                          class:dark:bg-zinc-800={sIndex === activeSuggestionIndex[i]}
                          onmousedown={() => selectSuggestion(i, suggestion)}
                        >
                          {suggestion.name}
                          <span class="text-sm text-gray-500 dark:text-zinc-400">
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
                  name="products[{i}].productId"
                  bind:value={$form.products[i].productId}
                />
              </div>
            </Table.Cell>
            <Table.Cell>
              <div>
                <Input
                  id="quantity-{i}"
                  name="products[{i}].quantity"
                  type="number"
                  bind:value={$form.products[i].quantity}
                />
                {#if $errors.products?.[i]?.quantity}
                  <p class="text-red-500">{$errors.products[i].quantity}</p>
                {/if}
              </div>
            </Table.Cell>
            <Table.Cell>
              <div>
                <Input
                  id="costPrice-{i}"
                  name="products[{i}].costPrice"
                  type="number"
                  bind:value={$form.products[i].costPrice}
                />
                {#if $errors.products?.[i]?.costPrice}
                  <p class="text-red-500">{$errors.products[i].costPrice}</p>
                {/if}
              </div>
            </Table.Cell>
            <Table.Cell>
              <div>
                <Input
                  id="unitPrice-{i}"
                  name="products[{i}].unitPrice"
                  type="number"
                  bind:value={$form.products[i].unitPrice}
                />
                {#if $errors.products?.[i]?.unitPrice}
                  <p class="text-red-500">{$errors.products[i].unitPrice}</p>
                {/if}
              </div>
            </Table.Cell>
            <Table.Cell class="w-36 text-lg">
              {product.quantity * product.unitPrice}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.Cell colspan={5} class="text-end">Total</Table.Cell>
          <Table.Cell>$2,500.00</Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table.Root>

    <Button disabled={$submitting} type="submit">
      {#if $submitting}
        <Spinner />
      {/if}
      Create Invoice</Button
    >
  </form>
</div>
