"use client";

import { Check, Copy, Download, FilePlus2, FolderOpen, Pencil, Save, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { emptyPortfolio } from "@/lib/demos";
import { downloadFile, portfolioFromJson, portfolioToJson, slug } from "@/lib/storage";
import type { Portfolio } from "@/lib/types";
import { usePortfolio } from "@/state/portfolio";
import { ConfirmButton, Modal } from "../ui";

function exportJson(p: Portfolio) {
  const url = URL.createObjectURL(new Blob([portfolioToJson(p)], { type: "application/json" }));
  downloadFile(`stackd-${slug(p.name)}.json`, url);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function LibraryModal({ open, onClose, notify }: { open: boolean; onClose: () => void; notify: (msg: string) => void }) {
  const { portfolio, library, dirty, save, load, duplicate, rename, remove, addToLibrary, swap } = usePortfolio();
  const file = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState("");

  const onImport = async (f: File | undefined) => {
    setError("");
    if (!f) return;
    if (f.size > 500_000) return setError("That file is too large to be a STACKD portfolio.");
    const p = portfolioFromJson(await f.text());
    if (!p) return setError("That file is not a valid STACKD portfolio JSON.");
    addToLibrary(p);
    notify(`Imported "${p.name}" into your stacks`);
  };

  const commitRename = () => {
    if (editing && editing.name.trim()) rename(editing.id, editing.name);
    setEditing(null);
  };

  return (
    <Modal open={open} onClose={onClose} title="Your stacks" kicker="Saved in this browser only">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="btn-primary"
          disabled={!dirty}
          onClick={() => notify(save() ? `Saved "${portfolio.name}" to this browser` : "This browser blocked storage, so nothing was saved")}
        >
          {dirty ? <Save size={14} /> : <Check size={14} />} {dirty ? "Save current" : "Saved"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            swap(emptyPortfolio(), "Started a new stack");
            onClose();
          }}
        >
          <FilePlus2 size={14} /> New stack
        </button>
        <button type="button" className="btn-ghost" onClick={() => file.current?.click()}>
          <Upload size={14} /> Import JSON
        </button>
        <button type="button" className="btn-ghost" onClick={() => exportJson(portfolio)}>
          <Download size={14} /> Export JSON
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            void onImport(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="mt-3 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-xs text-bad">{error}</p>}

      <div className="label mb-2 mt-6 flex justify-between">
        <span>Saved stacks</span>
        <span>{library.length}</span>
      </div>
      {library.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-mute">Nothing saved yet. Press Save current to keep this stack.</div>
      ) : (
        <ul className="space-y-2">
          {library.map((p) => {
            const current = p.id === portfolio.id;
            return (
              <li key={p.id} className={`rounded-xl border p-3 ${current ? "border-cyan/50 bg-cyan/[0.05]" : "border-line bg-ink/40"}`}>
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    {editing?.id === p.id ? (
                      <input
                        autoFocus
                        className="field !py-1.5"
                        value={editing.name}
                        maxLength={48}
                        onChange={(e) => setEditing({ id: p.id, name: e.target.value })}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") {
                            e.stopPropagation();
                            setEditing(null);
                          }
                        }}
                        aria-label="Stack name"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="truncate font-display text-[13px] font-bold">{p.name}</span>
                        {current && <span className="label shrink-0 rounded border border-cyan/40 px-1.5 py-0.5 !text-[9px] !text-cyan">{dirty ? "Open · edited" : "Open"}</span>}
                      </div>
                    )}
                    <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-snow/[0.07]">
                      {p.assets.map((a) => (
                        <span key={a.id} style={{ width: `${a.bp / 100}%`, background: a.color }} />
                      ))}
                    </div>
                    <div className="mt-1.5 font-mono text-[11px] text-mute">
                      {p.assets.length} {p.assets.length === 1 ? "block" : "blocks"} · {new Date(p.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className="btn-ghost !px-2.5 !py-1.5 !text-[10px]"
                    disabled={current}
                    onClick={() => {
                      load(p.id);
                      onClose();
                    }}
                  >
                    <FolderOpen size={12} /> Load
                  </button>
                  <button type="button" className="btn-ghost !px-2.5 !py-1.5 !text-[10px]" onClick={() => duplicate(p.id)}>
                    <Copy size={12} /> Duplicate
                  </button>
                  <button type="button" className="btn-ghost !px-2.5 !py-1.5 !text-[10px]" onClick={() => setEditing({ id: p.id, name: p.name })}>
                    <Pencil size={12} /> Rename
                  </button>
                  <button type="button" className="btn-ghost !px-2.5 !py-1.5 !text-[10px]" onClick={() => exportJson(p)}>
                    <Download size={12} /> JSON
                  </button>
                  <ConfirmButton className="btn-ghost !px-2.5 !py-1.5 !text-[10px]" confirmLabel="Delete for good?" onConfirm={() => remove(p.id)}>
                    <Trash2 size={12} /> Delete
                  </ConfirmButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-[11px] leading-relaxed text-mute">Stacks are stored in this browser with localStorage. They are not uploaded or synced to other devices. Export JSON to move one elsewhere.</p>
    </Modal>
  );
}
