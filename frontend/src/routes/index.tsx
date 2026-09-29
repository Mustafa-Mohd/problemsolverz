import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import gsap from "gsap";
import {
  Activity,
  Archive,
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Database,
  Download,
  FileCode2,
  FileText,
  Hotel,
  Inbox,
  LayoutDashboard,
  Mail,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import invoiceImage from "@/assets/munnar-invoice.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReconAgent — Hotel Voucher & Invoice Reconciler" },
      { name: "description", content: "Audit hotel vouchers, reconcile invoice discrepancies, and reuse trusted decisions with Hindsight memory." },
    ],
  }),
  component: ReconAgent,
});

type View = "reconciliation" | "memory";
type Modal = "override" | "dispute" | null;
type Preset = "munnar" | "spice" | "grand";

const presets: Record<Preset, { name: string; quirk: string; trust: number }> = {
  munnar: { name: "Munnar Valley Resort", quirk: "Separate Kerala Flood Cess & breakfast split", trust: 91 },
  spice: { name: "Spice Tree Luxury Resort", quirk: "Unresolved overcharge · extra unbooked night", trust: 64 },
  grand: { name: "Grand Residency", quirk: "Clean direct match", trust: 98 },
};

const baseRows = [
  { item: "Base Room Tariff", detail: "3 nights · Deluxe", booked: "₹24,000", invoiced: "₹24,000", variance: "₹0", status: "match" },
  { item: "Meal Supplement", detail: "MAP dinner · Folio #802", booked: "₹4,500", invoiced: "₹0", variance: "−₹4,500", status: "memory" },
  { item: "Kerala Flood Cess", detail: "Ancillary tax · separately itemized", booked: "₹0", invoiced: "₹1,200", variance: "+₹1,200", status: "memory" },
  { item: "Extra Bed / Linen", detail: "Unbooked surcharge", booked: "₹0", invoiced: "₹1,800", variance: "+₹1,800", status: "issue" },
];

const vendors = [
  { name: "Munnar Valley Resort", city: "Munnar, Kerala", trust: 91, overrides: 12, disputes: 2, status: "Active", memory: "Breakfast and cess splitting is consistently accepted." },
];

function ReconAgent() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>("reconciliation");
  const [preset, setPreset] = useState<Preset>("munnar");
  const [docMode, setDocMode] = useState<"pdf" | "json">("pdf");
  const [modal, setModal] = useState<Modal>(null);
  const [note, setNote] = useState("");
  const [approved, setApproved] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState<number | null>(1);
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");

  const [reconciledData, setReconciledData] = useState<any>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  useEffect(() => {
    if (!rootRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.from("[data-enter]", { opacity: 0, y: 15, duration: 0.65, stagger: 0.065, ease: "power3.out" });
      gsap.fromTo("[data-scan]", { xPercent: -120 }, { xPercent: 680, duration: 2.8, ease: "power1.inOut", repeat: -1, repeatDelay: 2 });
    }, rootRef);
    return () => context.revert();
  }, [view]);

  const rows = useMemo(() => {
    if (preset === "grand") return baseRows.map((row) => ({ ...row, variance: "₹0", status: "match" }));
    if (preset === "spice") return baseRows.map((row, index) => index === 3 ? { ...row, item: "Extra Unbooked Night", detail: "No voucher authorization", invoiced: "₹8,600", variance: "+₹8,600", status: "issue" } : row);
    return baseRows;
  }, [preset]);

  async function handleReconcile() {
    if (!voucherFile || !invoiceFile) {
      toast.error("Please upload both voucher and invoice files.");
      return;
    }
    setIsReconciling(true);
    try {
      const formData = new FormData();
      formData.append("voucher_file", voucherFile);
      formData.append("invoice_file", invoiceFile);

      const res = await fetch("http://localhost:8000/api/reconcile", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Reconciliation failed on the server.");
      const data = await res.json();
      setReconciledData(data);
      toast.success("Reconciliation complete!");
      
      // Auto-open dispute modal if there's an issue
      if (data.overall_status === "DISCREPANCY_DETECTED") {
        setModal("dispute");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsReconciling(false);
    }
  }

  async function confirmOverride() {
    if (!reconciledData) return;
    try {
      const res = await fetch("http://localhost:8000/api/retain-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel_name: reconciledData.hotel_name,
          voucher_id: reconciledData.voucher_id,
          note: note,
        }),
      });
      if (res.ok) {
        setApproved(true);
        setModal(null);
        toast.success("Decision retained into Hindsight Bank");
        // Reload table by re-running reconciliation
        await handleReconcile();
      } else {
        toast.error("Failed to retain override.");
      }
    } catch (e) {
      toast.error("Network error while retaining override.");
    }
  }

  return (
    <div ref={rootRef} className="workspace-backdrop min-h-screen overflow-x-hidden bg-background font-body text-foreground">
      <Toaster theme="dark" position="bottom-right" toastOptions={{ className: "!border-border !bg-popover !text-popover-foreground" }} />
      <div className="flex min-h-screen">
        <ControlRail view={view} setView={setView} mobileNav={mobileNav} setMobileNav={setMobileNav} />

        <main className="min-w-0 flex-1 lg:ml-0">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/78 px-4 backdrop-blur-2xl md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button variant="ghost" className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={18} /></Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate font-display text-sm font-semibold">{view === "reconciliation" ? "Reconciliation workspace" : "Vendor memory bank"}</h1>
                  <span className="hidden items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase text-primary md:flex"><Sparkles size={9} /> Powered by Hindsight Memory</span>
                </div>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {view === "reconciliation" ? (
              <motion.div key="recon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 md:p-6">
                <section data-enter className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Audit session</p>
                    <h2 className="font-display text-2xl font-semibold md:text-3xl">Hotel voucher reconciliation</h2>
                  </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-[minmax(180px,0.78fr)_minmax(470px,1.85fr)_minmax(220px,0.92fr)]">
                  <DocumentPanel 
                    docMode={docMode} 
                    setDocMode={setDocMode}
                    setVoucherFile={setVoucherFile}
                    setInvoiceFile={setInvoiceFile}
                    handleReconcile={handleReconcile}
                    isReconciling={isReconciling}
                  />
                  <ReconciliationTable 
                    rows={rows} 
                    approved={approved} 
                    setMemoryOpen={setMemoryOpen} 
                    preset={preset} 
                    reconciledData={reconciledData}
                  />
                  <MemoryPanel 
                    memoryOpen={memoryOpen} 
                    setMemoryOpen={setMemoryOpen} 
                    preset={preset} 
                    approved={approved} 
                    setModal={setModal} 
                    setView={setView} 
                    reconciledData={reconciledData}
                  />
                </section>
              </motion.div>
            ) : (
              <MemoryBank search={search} setSearch={setSearch} setView={setView} />
            )}
          </AnimatePresence>
        </main>
      </div>
      <ActionModal modal={modal} setModal={setModal} note={note} setNote={setNote} confirmOverride={confirmOverride} reconciledData={reconciledData} />
    </div>
  );
}

function ControlRail({ view, setView, mobileNav, setMobileNav }: any) {
  const content = (
    <>
      <div className="flex items-center justify-between px-3 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-md bg-primary font-display text-base font-bold text-primary-foreground shadow-action">R</div>
          <div><div className="font-display text-sm font-bold">ReconAgent</div></div>
        </div>
      </div>
      <nav className="mt-3 space-y-1 px-2">
        <RailButton label="Reconciliation" icon={<LayoutDashboard size={15} />} active={view === "reconciliation"} onClick={() => { setView("reconciliation"); setMobileNav(false); }} />
        <RailButton label="Vendor memory bank" icon={<Database size={15} />} active={view === "memory"} onClick={() => { setView("memory"); setMobileNav(false); }} />
      </nav>
    </>
  );
  return <aside className="hidden min-h-screen w-56 shrink-0 flex-col border-r border-border bg-surface/60 backdrop-blur-2xl lg:flex">{content}</aside>;
}

function RailButton({ label, icon, active, onClick }: any) {
  return <Button variant="ghost" onClick={onClick} className={`w-full justify-start ${active ? "border-primary/25 bg-primary/10 text-foreground" : ""}`}>{icon}<span className="flex-1 text-left">{label}</span></Button>;
}

function DocumentPanel({ docMode, setDocMode, setVoucherFile, setInvoiceFile, handleReconcile, isReconciling }: any) {
  const [files, setFiles] = useState({ voucher: false, invoice: false });
  return <div data-enter className="glass-panel min-w-0 rounded-lg p-4">
    <div className="mb-4 flex items-center justify-between"><div><h3 className="font-display text-sm font-semibold">Document source</h3></div></div>
    <div className="space-y-2">
      <UploadBox title="Internal booking voucher" format=".json or .pdf" done={files.voucher} onChange={(e: any) => { setFiles((c) => ({ ...c, voucher: true })); setVoucherFile(e.target.files[0]); }} />
      <UploadBox title="Hotel tax invoice" format=".json or .pdf" done={files.invoice} onChange={(e: any) => { setFiles((c) => ({ ...c, invoice: true })); setInvoiceFile(e.target.files[0]); }} />
    </div>
    <div className="mt-4">
      <Button 
        variant="primary" 
        className="w-full" 
        disabled={!files.voucher || !files.invoice || isReconciling} 
        onClick={handleReconcile}
      >
        {isReconciling ? "Reconciling with Groq..." : "Run Reconciliation"}
      </Button>
    </div>
  </div>;
}

function UploadBox({ title, format, done, onChange }: any) {
  return <label className="group flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border bg-surface px-3 py-3 transition hover:border-primary/50 hover:bg-surface-hover"><input type="file" className="sr-only" onChange={onChange} /><span className={`grid size-8 shrink-0 place-items-center rounded-md ${done ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>{done ? <Check size={15} /> : <UploadCloud size={15} />}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{title}</span><span className="text-[9px] text-muted-foreground">{done ? "Ready for reconciliation" : format}</span></span></label>;
}

function ReconciliationTable({ rows, approved, setMemoryOpen, preset, reconciledData }: any) {
  const items = reconciledData ? reconciledData.line_items : rows;
  const hotelName = reconciledData ? reconciledData.hotel_name : presets[preset].name;
  
  return <div data-enter className="glass-panel relative min-w-0 overflow-hidden rounded-lg">
    <div data-scan className="scan-sheen pointer-events-none absolute inset-y-0 z-10 w-14 opacity-40" />
    <div className="border-b border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Hotel size={14} className="text-primary" /><h3 className="font-display text-sm font-semibold">{hotelName}</h3></div></div></div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-[10px]">
        <thead><tr className="border-b border-border text-[8px] uppercase tracking-[0.13em] text-muted-foreground"><th className="px-4 py-3 font-semibold">Line item description</th><th className="px-3 py-3 text-right font-semibold">Booked value</th><th className="px-3 py-3 text-right font-semibold">Invoiced value</th><th className="px-3 py-3 text-right font-semibold">Variance</th><th className="px-4 py-3 font-semibold">Status</th></tr></thead>
        <tbody>{items.map((row: any, index: number) => {
          const status = reconciledData ? row.status : (approved && index === 3 ? "memory" : row.status);
          const variance = reconciledData ? row.variance : row.variance;
          return <motion.tr key={index} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className={`border-b border-border/70 transition hover:bg-surface-hover ${status === "DISCREPANCY" ? "bg-warning/[0.035]" : ""}`}><td className="px-4 py-3"><span className="block text-[11px] font-semibold">{reconciledData ? row.description : row.item}</span><span className="mt-0.5 block text-[9px] text-muted-foreground">{reconciledData ? '' : row.detail}</span></td><td className="px-3 py-3 text-right font-medium tabular-nums">{reconciledData ? `₹${row.booked_amount}` : row.booked}</td><td className="px-3 py-3 text-right font-medium tabular-nums">{reconciledData ? `₹${row.invoiced_amount}` : row.invoiced}</td><td className={`px-3 py-3 text-right font-semibold tabular-nums ${variance !== 0 && variance !== "₹0" ? "text-warning" : "text-muted-foreground"}`}>{reconciledData ? `₹${row.variance}` : row.variance}</td><td className="px-4 py-3"><StatusButton status={status} provenance={reconciledData ? row.provenance : null} onClick={() => status === "AUTO_CLEARED" || status === "memory" ? setMemoryOpen(index) : null} /></td></motion.tr>;
        })}</tbody>
      </table>
    </div>
  </div>;
}

function StatusButton({ status, provenance, onClick }: any) {
  if (status === "MATCH" || status === "match") return <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[8px] font-bold uppercase text-success"><Check size={10} /> Direct match</span>;
  if (status === "AUTO_CLEARED" || status === "memory") return <button onClick={onClick} className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[8px] font-bold uppercase text-primary transition hover:bg-primary/20" title={provenance}><Sparkles size={10} /> Auto-Cleared via Hindsight</button>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-[8px] font-bold uppercase text-warning"><CircleAlert size={10} /> Discrepancy</span>;
}

function MemoryPanel({ memoryOpen, setMemoryOpen, preset, approved, setModal, setView, reconciledData }: any) {
  const memories = reconciledData?.recalled_memories || [];
  return <div data-enter className="glass-panel flex min-w-0 flex-col rounded-lg p-4">
    <div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><BrainCircuit size={15} className="text-primary" /><h3 className="font-display text-sm font-semibold">Hindsight provenance</h3></div></div></div>
    
    <div className="mt-3 space-y-2">
      {memories.length > 0 ? memories.map((mem: string, i: number) => (
        <MemoryItem key={i} id={`MEM-${i}`} title="Recalled Memory" open={memoryOpen === i} onClick={() => setMemoryOpen(memoryOpen === i ? null : i)}>
          {mem}
        </MemoryItem>
      )) : <p className="text-xs text-muted-foreground">No memories recalled.</p>}
    </div>
    
    <div className="mt-4 space-y-2 border-t border-border pt-4">
      <Button variant="primary" className="w-full justify-between" onClick={() => setModal("override")}>Approve override & retain <BrainCircuit size={14} /></Button>
      <Button variant="danger" className="w-full justify-between" onClick={() => setModal("dispute")}>Generate dispute email <Mail size={14} /></Button>
    </div>
  </div>;
}

function MemoryItem({ id, title, open, onClick, children }: any) {
  return <button onClick={onClick} className={`w-full rounded-md border p-3 text-left transition ${open ? "border-primary/35 bg-primary/10" : "border-border bg-surface hover:bg-surface-hover"}`}><div className="flex items-start justify-between gap-3"><div><span className="text-[8px] font-bold uppercase tracking-[0.13em] text-primary">Precedent #{id}</span><div className="mt-1 text-[10px] font-semibold">{title}</div></div><ChevronDown size={13} className={`mt-1 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`} /></div><AnimatePresence>{open && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-2 text-[10px] leading-relaxed text-muted-foreground">{children}</motion.p>}</AnimatePresence></button>;
}

function MemoryBank({ search, setSearch, setView }: any) {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6">
    <div data-enter className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end"><div><Button variant="ghost" className="mb-3 -ml-3" onClick={() => setView("reconciliation")}><ArrowRight className="rotate-180" size={13} /> Back to reconciliation</Button><h2 className="mt-1 font-display text-3xl font-semibold">Vendor Memory Bank</h2></div></div>
  </motion.div>;
}

function ActionModal({ modal, setModal, note, setNote, confirmOverride, reconciledData }: any) {
  return <AnimatePresence>{modal && <div className="fixed inset-0 z-[70] grid place-items-center p-4"><motion.button aria-label="Close dialog" className="absolute inset-0 bg-background/85 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} /><motion.div role="dialog" aria-modal="true" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} className="glass-panel relative z-10 w-full max-w-lg rounded-lg p-5"><div className="flex items-start justify-between"><div><h3 className="mt-1 font-display text-lg font-semibold">{modal === "override" ? "Approve discrepancy with context" : "Generated dispute email"}</h3></div><Button variant="ghost" onClick={() => setModal(null)}><X size={16} /></Button></div>{modal === "override" ? <><label className="mt-5 block text-[10px] font-semibold">Decision note<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-md border border-border bg-background/50 p-3 text-xs leading-relaxed outline-none focus:border-primary" /></label><div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" onClick={confirmOverride}>Approve & retain</Button></div></> : <><div className="mt-5 rounded-md border border-border bg-background/35 p-4 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">{reconciledData?.dispute_email || "No dispute email generated."}</div><div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => setModal(null)}>Close</Button></div></>}</motion.div></div>}</AnimatePresence>;
}