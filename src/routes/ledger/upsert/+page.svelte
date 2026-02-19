<script lang="ts">
  import { compareLedgerSchema, title, route } from './utils';
  import Heading from '$lib/components/heading.svelte';
  import { getSuperForm } from '$lib/superforms.js';
  import FileField from '$lib/components/form/file-field.svelte';
  import DateField from '$lib/components/form/date-field.svelte';
  import Form from '$lib/components/form/form.svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(compareLedgerSchema, data.form);
</script>

<Heading
  title={title.singular}
  link={{ route: route.list, title: `List ${title.plural}` }}
/>

<Form {superform} buttonText="Compare Ledger" enctype="multipart/form-data">
  <DateField {superform} field="startDate" />
  <DateField {superform} field="endDate" />
  <FileField
    {superform}
    field="file"
    urlField="name"
    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  />
</Form>
