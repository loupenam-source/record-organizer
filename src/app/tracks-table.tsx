"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import type { TrackWithRecord } from "@/lib/db";

type Filters = {
  genre: string;
  vocals: "all" | "vocals" | "instrumental";
  when: string;
  search: string;
};

export function TracksTable({ tracks }: { tracks: TrackWithRecord[] }) {
  const [filters, setFilters] = useState<Filters>({
    genre: "",
    vocals: "all",
    when: "",
    search: "",
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const t of tracks) if (t.genre) set.add(t.genre);
    return Array.from(set).sort();
  }, [tracks]);

  const whens = useMemo(() => {
    const set = new Set<string>();
    for (const t of tracks) if (t.when_to_play) set.add(t.when_to_play);
    return Array.from(set).sort();
  }, [tracks]);

  const filtered = useMemo(() => {
    return tracks.filter((t) => {
      if (filters.genre && t.genre !== filters.genre) return false;
      if (filters.vocals === "vocals" && !t.vocals) return false;
      if (filters.vocals === "instrumental" && t.vocals) return false;
      if (filters.when && t.when_to_play !== filters.when) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const haystack = `${t.artist} ${t.album} ${t.title} ${t.description ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tracks, filters]);

  const columns = useMemo<ColumnDef<TrackWithRecord>[]>(
    () => [
      {
        accessorKey: "album",
        header: "Album",
        cell: (c) => (
          <Link
            href={`/records/${c.row.original.record_id}`}
            className="hover:underline"
          >
            {c.getValue<string>()}
          </Link>
        ),
      },
      { accessorKey: "artist", header: "Artist" },
      { accessorKey: "title", header: "Track" },
      {
        accessorFn: (r) => `${r.side}${r.position}`,
        id: "sidepos",
        header: "Side",
        cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span>,
        size: 60,
      },
      {
        accessorKey: "genre",
        header: "Genre",
        cell: (c) => c.getValue<string | null>() ?? <span className="text-zinc-400">—</span>,
      },
      {
        accessorKey: "vocals",
        header: "Type",
        cell: (c) => (c.getValue<boolean>() ? "vocals" : "instrumental"),
      },
      {
        accessorKey: "when_to_play",
        header: "When",
        cell: (c) => c.getValue<string | null>() ?? <span className="text-zinc-400">—</span>,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (c) => (
          <span className="text-zinc-600 dark:text-zinc-400 italic">
            {c.getValue<string | null>() ?? ""}
          </span>
        ),
      },
      {
        accessorKey: "record_created_at",
        header: "Added",
        sortingFn: "datetime",
        cell: (c) => {
          const v = c.getValue<string>();
          return (
            <span className="text-xs text-zinc-500 whitespace-nowrap">
              {new Date(v).toLocaleDateString()}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900"
        />
        <select
          value={filters.genre}
          onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
          className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900"
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={filters.vocals}
          onChange={(e) =>
            setFilters({ ...filters, vocals: e.target.value as Filters["vocals"] })
          }
          className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900"
        >
          <option value="all">All types</option>
          <option value="vocals">Vocals</option>
          <option value="instrumental">Instrumental</option>
        </select>
        <select
          value={filters.when}
          onChange={(e) => setFilters({ ...filters, when: e.target.value })}
          className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900"
        >
          <option value="">Any time</option>
          {whens.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <span className="text-xs text-zinc-500 ml-auto">
          {filtered.length} of {tracks.length}
        </span>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-x-auto bg-white dark:bg-zinc-950">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className="px-3 py-2 text-left font-medium cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {{ asc: " ↑", desc: " ↓" }[h.column.getIsSorted() as string] ?? ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
