<script lang="ts">
  import { productSchema, route, title } from './utils';
  import TextField from '$lib/components/form/text-field.svelte';
  import NumberField from '$lib/components/form/number-field.svelte';
  import HiddenField from '$lib/components/form/hidden-field.svelte';
  import SelectField from '$lib/components/form/select-field.svelte';
  import Form from '$lib/components/form/form.svelte';
  import Heading from '$lib/components/heading.svelte';
  import { getSuperForm } from '$lib/superforms.js';

  let { data } = $props();

  let isEditing = $derived(!!data.currentProduct);

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(productSchema, data.form);
</script>

<Heading
  title={(isEditing ? 'Edit ' : 'New ') + title.singular}
  link={{
    route: route.list,
    title: `List ${title.plural}`,
  }}
/>

<Form
  {superform}
  buttonText={(isEditing ? 'Update ' : 'Create ') +
    title.singular}
>
  {#if isEditing}
    <HiddenField {superform} field="id" />
  {/if}

  <SelectField
    {superform}
    field="companyId"
    label="Company"
    options={data.companies.map((x) => ({
      label: x.name,
      value: x.id,
    }))}
  />

  <TextField {superform} field="name" />
  <NumberField {superform} field="actualPrice" />
  <NumberField {superform} field="quotedPrice" />
  <NumberField {superform} field="salePrice" />
</Form>
