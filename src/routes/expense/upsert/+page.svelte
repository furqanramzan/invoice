<script lang="ts">
  import { expenseSchema, route, title } from './utils';
  import TextField from '$lib/components/form/text-field.svelte';
  import NumberField from '$lib/components/form/number-field.svelte';
  import DateField from '$lib/components/form/date-field.svelte';
  import TextAreaField from '$lib/components/form/text-area-field.svelte';
  import HiddenField from '$lib/components/form/hidden-field.svelte';
  import Form from '$lib/components/form/form.svelte';
  import Heading from '$lib/components/heading.svelte';
  import { getSuperForm } from '$lib/superforms.js';
  import MultiFileField from '$lib/components/form/multi-file-field.svelte';

  let { data } = $props();

  let isEditing = $derived(!!data.currentExpense);

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(expenseSchema, data.form, {
    dataType: 'json',
  });
</script>

<Heading
  title={(isEditing ? 'Edit ' : 'New ') + title.singular}
  link={{ route: route.list, title: `List ${title.plural}` }}
/>

<Form
  {superform}
  enctype="multipart/form-data"
  buttonText={(isEditing ? 'Update ' : 'Create ') + title.singular}
>
  {#if isEditing}
    <HiddenField {superform} field="id" />
  {/if}

  <TextField {superform} field="title" />
  <NumberField {superform} field="amount" />
  <DateField {superform} field="date" />
  <TextAreaField {superform} field="description" />
  <MultiFileField {superform} field="attachments" urlsField="attachmentUrls" />
</Form>
