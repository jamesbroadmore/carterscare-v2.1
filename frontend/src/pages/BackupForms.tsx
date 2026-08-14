import { useMemo } from "react";
import { Download, Printer, FileText, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { COMPLIANCE_DISCLAIMER } from "@/lib/compliance-gates";

const FORMS = [
  ["Recipient intake and consent", "Recipient identity, consent, emergency contacts and privacy collection notice."],
  ["Service agreement", "Services, responsibilities, funding, cancellation and review details."],
  ["Care and support plan summary", "Goals, preferences, risks, communication and escalation summary."],
  ["Risk assessment", "Hazards, controls, review date and responsible person."],
  ["Incident report", "Incident details, immediate action, notification and follow-up."],
  ["Medication and health information", "Health information record for authorised use only."],
  ["Worker onboarding checklist", "Identity, screening, training, policy acknowledgements and induction."],
  ["Shift record and sign-off", "Date, times, supports delivered, notes and worker/recipient signatures."],
  ["Cancellation and no-show record", "Notice, reason, contact attempts and outcome."],
  ["Feedback and complaint form", "Feedback, complaint details, response owner and resolution."],
  ["Privacy breach register", "Breach assessment, containment, notification and review."],
  ["Invoice and timesheet backup record", "Approved shift, funding, rate, evidence and invoice review."],
] as const;

function downloadForm(title: string, description: string) {
  const date = new Date().toLocaleDateString("en-AU");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font:14px Arial;max-width:760px;margin:40px auto;color:#1e293b}h1{font-size:24px}h2{margin-top:28px;border-bottom:1px solid #cbd5e1;padding-bottom:8px}.field{border-bottom:1px solid #94a3b8;height:34px;margin:10px 0}.notice{background:#f1f5f9;padding:14px;font-size:12px}.sign{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:40px}</style></head><body><h1>${title}</h1><p>${description}</p><p><strong>Template version:</strong> 1.0 &nbsp; <strong>Prepared:</strong> ${date}</p><div class="notice">${COMPLIANCE_DISCLAIMER} Retain and store according to the organisation's approved retention schedule and access controls.</div><h2>Record details</h2><p>Recipient/staff name:</p><div class="field"></div><p>Identifier / reference:</p><div class="field"></div><p>Date and review date:</p><div class="field"></div><h2>Details</h2><div class="field"></div><div class="field"></div><div class="field"></div><div class="field"></div><h2>Approval and signatures</h2><div class="sign"><div>Signature: ____________________<br><br>Name: ________________________</div><div>Date: _______________________<br><br>Witness/reviewer: ______________</div></div></body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function BackupForms() {
  const prepared = useMemo(() => new Date().toLocaleDateString("en-AU"), []);
  return (
    <AppLayout title="Hard-copy backup forms">
      <div className="space-y-6">
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <div className="flex gap-3"><ShieldCheck className="h-5 w-5 text-sky-700 mt-0.5" /><div><h2 className="font-semibold text-sky-950">Controlled operational templates</h2><p className="mt-1 text-sm leading-6 text-sky-900">Download or print a backup copy when systems are unavailable. These forms do not replace provider policies, NDIS requirements, Aged Care obligations or legal advice.</p><p className="mt-2 text-xs text-sky-800">Template set version 1.0 · Prepared {prepared} · Review owner: Compliance lead</p></div></div>
        </section>
        <div className="grid gap-4 md:grid-cols-2">
          {FORMS.map(([title, description]) => <article key={title} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><FileText className="h-5 w-5" /></div><div className="min-w-0 flex-1"><h3 className="font-semibold text-card-foreground">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p><div className="mt-4 flex gap-2"><button onClick={() => downloadForm(title, description)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"><Download className="h-4 w-4" /> Download</button><button onClick={() => { downloadForm(title, description); window.setTimeout(() => window.print(), 0); }} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground"><Printer className="h-4 w-4" /> Print</button></div></div></div></article>)}
        </div>
      </div>
    </AppLayout>
  );
}
