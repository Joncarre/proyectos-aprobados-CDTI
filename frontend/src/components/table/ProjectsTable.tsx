import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import type { SortField } from '@cdti/shared';
import { useExportUrl, useProjects } from '../../api/queries';
import { cn } from '../../lib/cn';
import { formatInt, formatMoney, formatPct } from '../../lib/format';
import { useFiltersStore } from '../../state/filters';
import { Card } from '../ui/Card';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Skeleton } from '../ui/Skeleton';

const EXPORT_FORMATS = [
  { fmt: 'csv', label: 'CSV', hint: 'Excel español (separador ;)' },
  { fmt: 'json', label: 'JSON', hint: 'Datos estructurados' },
  { fmt: 'xml', label: 'XML', hint: 'Intercambio entre sistemas' },
] as const;

function ExportMenu() {
  const exportUrl = useExportUrl();
  const urlFor = (fmt: string): string =>
    `${exportUrl}${exportUrl.includes('?') ? '&' : '?'}fmt=${fmt}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
        >
          <Download className="size-3.5" /> Exportar <ChevronDown className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent matchTriggerWidth={false}>
        {EXPORT_FORMATS.map(({ fmt, label, hint }) => (
          <a
            key={fmt}
            href={urlFor(fmt)}
            download
            className="block rounded-md px-2 py-1.5 transition-colors hover:bg-surface-2"
          >
            <span className="block text-xs font-medium">{label}</span>
            <span className="block text-[0.65rem] text-ink-faint">{hint}</span>
          </a>
        ))}
      </PopoverContent>
    </Popover>
  );
}

interface Column {
  key: string;
  label: string;
  sort?: SortField;
  align?: 'right';
  width?: string;
}

const COLUMNS: Column[] = [
  { key: 'fecha', label: 'Fecha', sort: 'fecha', width: 'w-20' },
  { key: 'empresa', label: 'Empresa', sort: 'empresa' },
  { key: 'titulo', label: 'Título' },
  { key: 'provincia', label: 'Provincia', width: 'w-32' },
  { key: 'instrumento', label: 'Instrumento', width: 'w-56' },
  { key: 'presupuesto', label: 'Presupuesto', sort: 'presupuesto', align: 'right', width: 'w-28' },
  { key: 'aportacion', label: 'Aportación', sort: 'aportacion', align: 'right', width: 'w-28' },
  { key: 'pct', label: '% CDTI', sort: 'pct', align: 'right', width: 'w-24' },
];

const PAGE_SIZES = [25, 50, 100] as const;

const formatDate = (iso: string): string => {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year?.slice(2)}`;
};

export function ProjectsTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sort, setSort] = useState<SortField>('fecha');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // Back to page 1 whenever the global filters change
  const filters = useFiltersStore((state) => state.filters);
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { data, isPending, isPlaceholderData } = useProjects(page, pageSize, sort, order);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggleSort = (field: SortField): void => {
    if (sort === field) {
      setOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setOrder('desc');
    }
    setPage(1);
  };

  return (
    <Card
      title="Detalle de proyectos"
      subtitle={`${formatInt(total)} resultados con los filtros activos`}
      controls={<ExportMenu />}
      isPending={false}
      isUpdating={isPlaceholderData}
      className="overflow-hidden"
    >
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[60rem] border-collapse text-xs">
          <thead>
            <tr className="border-b border-line bg-surface-2/60 text-left">
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-3.5 py-2.5 font-medium text-ink-soft select-none',
                    column.width,
                    column.align === 'right' && 'text-right',
                  )}
                >
                  {column.sort ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.sort!)}
                      className={cn(
                        'inline-flex items-center gap-1 transition-colors hover:text-ink',
                        sort === column.sort && 'text-ink',
                      )}
                    >
                      {column.label}
                      {sort === column.sort &&
                        (order === 'asc' ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        ))}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isPending
              ? Array.from({ length: 8 }, (_, index) => (
                  <tr key={index} className="border-b border-line">
                    <td colSpan={COLUMNS.length} className="px-3 py-2">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              : (data?.items ?? []).map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-line transition-[background-color] duration-500 hover:bg-accent-soft hover:duration-100"
                  >
                    <td className="px-3.5 py-2.5 font-mono whitespace-nowrap">
                      {formatDate(item.fechaAprobacion)}
                    </td>
                    <td
                      className="max-w-24 truncate px-3.5 py-2.5 font-medium"
                      title={item.razonSocial}
                    >
                      {item.razonSocial}
                    </td>
                    <td
                      className="max-w-44 truncate px-3.5 py-2.5 text-ink-soft"
                      title={item.titulo}
                    >
                      {item.titulo}
                    </td>
                    <td
                      className="max-w-32 truncate px-3.5 py-2.5 text-ink-soft"
                      title={`${item.provincia} · ${item.ccaa}`}
                    >
                      {item.provincia}
                    </td>
                    <td
                      className="max-w-56 truncate px-3.5 py-2.5 text-ink-soft"
                      title={item.instrumento ?? undefined}
                    >
                      {item.instrumento ?? '—'}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono whitespace-nowrap">
                      {item.presupuesto !== null ? formatMoney(item.presupuesto) : '—'}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono whitespace-nowrap">
                      {item.aportacionCdti !== null ? formatMoney(item.aportacionCdti) : '—'}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono">
                      {formatPct(item.porcentajeAportacion)}
                    </td>
                  </tr>
                ))}
            {!isPending && (data?.items.length ?? 0) === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-ink-faint">
                  Ningún proyecto cumple los filtros activos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-ink-soft">
          Filas por página
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-md border border-line bg-surface px-1.5 py-1 text-xs outline-none hover:border-line-strong"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-soft">
            Página {formatInt(page)} de {formatInt(totalPages)}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            aria-label="Página anterior"
            className="rounded-md border border-line p-1 text-ink-soft transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
            aria-label="Página siguiente"
            className="rounded-md border border-line p-1 text-ink-soft transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </footer>
    </Card>
  );
}
