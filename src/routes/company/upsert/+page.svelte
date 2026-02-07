<script lang="ts">
  import { companySchema, route, title } from './utils';
  import TextField from '$lib/components/form/text-field.svelte';
  import HiddenField from '$lib/components/form/hidden-field.svelte';
  import Form from '$lib/components/form/form.svelte';
  import Heading from '$lib/components/heading.svelte';
  import { getSuperForm } from '$lib/superforms.js';
  import RadioField from '$lib/components/form/radio-field.svelte';
  import FileField from '$lib/components/form/file-field.svelte';

  let { data } = $props();

  let isEditing = $derived(!!data.currentCompany);

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(companySchema, data.form);
</script>

<Heading
  title={(isEditing ? 'Edit ' : 'New ') + title.singular}
  link={{ route: route.list, title: `List ${title.plural}` }}
/>

<Form
  {superform}
  buttonText={(isEditing ? 'Update ' : 'Create ') + title.singular}
  enctype="multipart/form-data"
>
  {#if isEditing}
    <HiddenField {superform} field="id" />
  {/if}

  <TextField {superform} field="name" />
  <TextField {superform} field="address" />
  <TextField {superform} field="email" />
  <TextField {superform} field="phone" />
  <FileField
    {superform}
    field="logo"
    urlField="logoUrl"
    label="Logo"
    accept="image/png, image/webp, image/jpeg"
  />
  <RadioField
    {superform}
    field="printLayout"
    options={[{ value: 'A' }, { value: 'B' }]}
  />
</Form>
