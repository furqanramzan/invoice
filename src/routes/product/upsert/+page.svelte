<script lang="ts">
  import { productSchema, route, title } from './utils';
  import TextField from '$lib/components/text-field.svelte';
  import NumberField from '$lib/components/number-field.svelte';
  import HiddenField from '$lib/components/hidden-field.svelte';
  import Form from '$lib/components/form.svelte';
  import Heading from '$lib/components/heading.svelte';
  import { getSuperForm } from '$lib/superforms.js';

  let { data } = $props();

  let isEditing = $derived(!!data.currentProduct);

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(productSchema, data.form);
</script>

<Heading
  title={(isEditing ? 'Edit ' : 'New ') + title.singular}
  link={{ route: route.list, title: `List ${title.plural}` }}
/>

<Form
  {superform}
  buttonText={(isEditing ? 'Update ' : 'Create ') + title.singular}
>
  {#if isEditing}
    <HiddenField {superform} field="id" />
  {/if}

  <TextField {superform} field="name" />
  <NumberField {superform} field="costPrice" />
  <NumberField {superform} field="unitPrice" />
</Form>
