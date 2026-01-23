<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { invoiceSchema } from './validations.js';

  const { data } = $props();

  const { form, errors, enhance } = superForm(data.form, {
    dataType: 'json',
    validators: zod4(invoiceSchema),
  });

  function addProduct() {
    $form.products = [
      ...$form.products,
      { id: crypto.randomUUID(), name: '', quantity: 1, unitPrice: 0 },
    ];
  }

  function removeProduct(index: number) {
    $form.products = $form.products.filter((_, i) => i !== index);
  }

  let total = $derived($form.products.reduce((acc, p) => acc + p.quantity * p.unitPrice, 0));
</script>

<h1>New Invoice</h1>

<form method="POST" use:enhance>
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

  <h2>Products</h2>
  {#each $form.products as product, i (product.id)}
    <div>
      <Label for="name-{i}">Name</Label>
      <Input id="name-{i}" name="products[{i}].name" bind:value={$form.products[i].name} />
      {#if $errors.products?.[i]?.name}
        <p class="text-red-500">{$errors.products[i].name}</p>
      {/if}

      <Label for="quantity-{i}">Quantity</Label>
      <Input
        id="quantity-{i}"
        name="products[{i}].quantity"
        type="number"
        bind:value={$form.products[i].quantity}
      />
      {#if $errors.products?.[i]?.quantity}
        <p class="text-red-500">{$errors.products[i].quantity}</p>
      {/if}

      <Label for="unitPrice-{i}">Unit Price</Label>
      <Input
        id="unitPrice-{i}"
        name="products[{i}].unitPrice"
        type="number"
        bind:value={$form.products[i].unitPrice}
      />
      {#if $errors.products?.[i]?.unitPrice}
        <p class="text-red-500">{$errors.products[i].unitPrice}</p>
      {/if}

      <Button type="button" onclick={() => removeProduct(i)}>Remove</Button>
    </div>
  {/each}

  <Button type="button" onclick={addProduct}>Add Product</Button>

  <h3>Total: {total}</h3>

  <Button type="submit">Create Invoice</Button>
</form>
