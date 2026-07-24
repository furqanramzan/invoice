<script lang="ts">
  import * as Table from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import Trash from '@lucide/svelte/icons/trash';
  import Pencil from '@lucide/svelte/icons/pencil';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Pagination } from '$lib/components/ui/pagination';
  import { formatCents, formatDate } from '$lib/utils';
  import {
    exportPDF,
    filterSchema,
    invoiceSchema,
    route,
    statuses,
    title,
  } from './upsert/utils.js';
  import Heading from '$lib/components/heading.svelte';
  import ActionForm from '$lib/components/form/action-form.svelte';
  import { titleCase } from 'text-case';
  import { getSuperForm } from '$lib/superforms.js';
  import { emptySchema } from '$lib/validations.js';
  import Form from '$lib/components/form/form.svelte';
  import SelectField from '$lib/components/form/select-field.svelte';
  import NumberField from '$lib/components/form/number-field.svelte';
  import DateField from '$lib/components/form/date-field.svelte';
  import Tooltip from '$lib/components/tooltip.svelte';
  import { trpc } from '$lib/trpc.js';
  import { toast } from 'svelte-sonner';
  import { validate } from '$lib/validate.js';
  import { Printer } from '@lucide/svelte';

  const { data } = $props();

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(filterSchema, data.form);
  const { form } = superform;

  let filteredClients = $derived(
    $form.companyId
      ? data.clients.filter((x) => x.companyId === $form.companyId)
      : data.clients,
  );

  // svelte-ignore state_referenced_locally
  const deleteSuperform = getSuperForm(
    emptySchema,
    data.deleteForm,
  );

  async function exportData(id: number) {
    const response = await trpc().invoice.item.query({ id });

    const data = await validate(response, invoiceSchema);
    if (!data.validated) {
      toast.error('Error fetching invoice!');
      return;
    }

    await exportPDF(
      data.data,
      response.company,
      response.client,
    );
  }
</script>

<Heading
  title={title.plural}
  link={{
    route: route.upsert,
    title: `Add ${title.singular}`,
  }}
/>

<Form
  {superform}
  method="get"
  class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3"
>
  <SelectField
    {superform}
    field="companyId"
    label="Company"
    options={data.companies.map((c) => ({
      label: c.name,
      value: c.id,
    }))}
  />
  <SelectField
    {superform}
    field="clientId"
    label="Client"
    options={filteredClients.map((cl) => ({
      label: cl.name,
      value: cl.id,
    }))}
  />
  <SelectField
    {superform}
    field="locationId"
    label="Location"
    options={data.locations
      .filter((x) => x.clientId === $form.clientId)
      .map((l) => ({ label: l.address, value: l.id }))}
  />
  <DateField {superform} field="startDateOfDelivery" />
  <DateField {superform} field="endDateOfDelivery" />
  <DateField {superform} field="startDateOfInvoice" />
  <DateField {superform} field="endDateOfInvoice" />
  <SelectField
    allowClear
    {superform}
    field="status"
    options={statuses}
  />
  <NumberField
    {superform}
    field="invoiceNumber"
    label="{title.singular} Number"
  />

  {#snippet afterButton()}
    <Button
      href={route.list}
      type="submit"
      disabled={!$form.companyId &&
        !$form.clientId &&
        !$form.locationId &&
        !$form.invoiceNumber &&
        !$form.status &&
        !$form.startDateOfDelivery &&
        !$form.endDateOfDelivery &&
        !$form.startDateOfInvoice &&
        !$form.endDateOfInvoice}
    >
      Clear Filters
    </Button>
  {/snippet}
</Form>

{#if data.invoices.length === 0}
  <p>No invoices!</p>
{:else}
  <Table.Root class="border">
    <Table.Header>
      <Table.Row>
        <Table.Head class="p-4 text-nowrap">Company</Table.Head>
        <Table.Head class="p-4 text-nowrap">Client</Table.Head>
        <Table.Head class="p-4 text-nowrap">Location</Table.Head>
        <Table.Head class="p-4 text-nowrap">Status</Table.Head>
        <Table.Head class="p-4 text-nowrap">Invoice #</Table.Head
        >
        <Table.Head class="p-4 text-nowrap"
          >Delivery Date</Table.Head
        >
        <Table.Head class="p-4 text-nowrap"
          >Invoice Date</Table.Head
        >
        <Table.Head class="p-4 text-nowrap"
          >Actual Price</Table.Head
        >
        <Table.Head class="p-4 text-nowrap"
          >Quoted Price</Table.Head
        >
        <Table.Head class="p-4 text-nowrap"
          >Sale Price</Table.Head
        >
        <Table.Head class="p-4 text-nowrap">Received</Table.Head>
        <Table.Head class="p-4 text-nowrap">Actions</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each data.invoices as invoice (invoice.id)}
        <Table.Row>
          <Table.Cell class="p-4 text-nowrap">
            {invoice.company?.name}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {invoice.client?.name}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {invoice.location?.address}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {#if invoice.status === 'draft'}
              <Badge class="bg-purple-500"
                >{titleCase(invoice.status)}</Badge
              >
            {:else if invoice.status === 'processing'}
              <Badge class="bg-yellow-500"
                >{titleCase(invoice.status)}</Badge
              >
            {:else if invoice.status === 'delivered'}
              <Badge class="bg-blue-500"
                >{titleCase(invoice.status)}</Badge
              >
            {:else if invoice.status === 'delivery_acknowledged'}
              <Badge class="bg-teal-500">Acknowledged</Badge>
            {:else if invoice.status === 'disputed'}
              <Badge class="bg-red-500"
                >{titleCase(invoice.status)}</Badge
              >
            {:else if invoice.status === 'paid'}
              <Badge class="bg-green-500"
                >{titleCase(invoice.status)}</Badge
              >
            {/if}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {invoice.invoiceNumber}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatDate(invoice.dateOfDelivery)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatDate(invoice.dateOfInvoice)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatCents(invoice.actualPrice)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatCents(invoice.quotedPrice)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatCents(invoice.salePrice)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {invoice.receivedAmount
              ? formatCents(invoice.receivedAmount)
              : '-'}
          </Table.Cell>
          <Table.Cell
            class="flex shrink-0 space-x-2 p-4 text-nowrap"
          >
            <Tooltip text="Export to PDF">
              <Button
                size="icon"
                variant="success"
                onclick={() => exportData(invoice.id)}
              >
                <Printer class="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip text="Edit">
              <Button
                href={route.upsert + `?id=${invoice.id}`}
                variant="outline"
                size="icon"
              >
                <Pencil class="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip text="Delete">
              <ActionForm
                field="id"
                action="?/delete"
                value={invoice.id}
                superform={deleteSuperform}
              >
                <Trash class="h-4 w-4" />
              </ActionForm>
            </Tooltip>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>

  {#if data.totalPages > 1}
    <Pagination
      currentPage={data.currentPage}
      totalPages={data.totalPages}
    />
  {/if}
{/if}
