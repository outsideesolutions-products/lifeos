"use client";

import { useState } from "react";
import { searchServiceApi, SearchResult } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Keyword search only (Search Service's own scope note applies here too —
 * semantic search is deferred until the Vector Database has meaningful
 * content).
 */
export function QuickSearchCard() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function handleChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    setSearching(true);
    try {
      setResults(await searchServiceApi.search(value));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search</CardTitle>
        <CardDescription>Find anything across your Constitution and memory</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search..."
        />
        {searching && <p className="text-sm text-zinc-400">Searching...</p>}
        {results && results.length === 0 && !searching && (
          <p className="text-sm text-zinc-500">No matches.</p>
        )}
        {results && results.length > 0 && (
          <ul className="flex flex-col gap-2">
            {results.slice(0, 5).map((r) => (
              <li key={`${r.objectType}-${r.objectId}`} className="text-sm">
                <span className="font-medium">{r.title}</span>{" "}
                <span className="text-zinc-500">— {r.snippet}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
