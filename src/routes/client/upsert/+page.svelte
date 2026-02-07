<script lang="ts">
  import { clientSchema, route, title } from './utils';
  import TextField from '$lib/components/form/text-field.svelte';
  import HiddenField from '$lib/components/form/hidden-field.svelte';
  import Form from '$lib/components/form/form.svelte';
  import Heading from '$lib/components/heading.svelte';
  import { getSuperForm } from '$lib/superforms.js';

  let { data } = $props();

  let isEditing = $derived(!!data.currentClient);

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(clientSchema, data.form);
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
  <TextField {superform} field="address" />
  <TextField {superform} field="email" />
  <TextField {superform} field="phone" />
  <TextField {superform} field="attention" />
  <TextField {superform} field="invoiceNumberInitial" />
</Form>
