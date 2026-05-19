import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, getDay } from "date-fns";
import { Loader2, Printer } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  isAdmin: boolean;
  onStatusChange: (status: string) => void;
}

function dayLabel(dateStr: string): string {
  const d = getDay(parseISO(dateStr));
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d];
}

function fmt12h(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")}${ampm}`;
}

// Parse service info from description: "Service Type | 9:00am - 11:00am"
function parseLineItem(item: any): { serviceType: string; timeRange: string } {
  const desc: string = item.description || "";
  const pipeIdx = desc.indexOf("|");
  if (pipeIdx > -1) {
    return {
      serviceType: desc.slice(0, pipeIdx).trim(),
      timeRange: desc.slice(pipeIdx + 1).trim(),
    };
  }
  return { serviceType: desc, timeRange: "" };
}

function groupByDate(items: any[]): Map<string, any[]> {
  const map = new Map<string, any[]>();
  for (const item of items) {
    const d = item.service_date || "";
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(item);
  }
  return map;
}

export function ViewInvoiceDialog({ open, onClose, invoiceId, isAdmin, onStatusChange }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice-detail", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ["invoice-line-items", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_line_items")
        .select("*, client:client_id(first_name, last_name, plan_manager, address, suburb, state, postcode)")
        .eq("invoice_id", invoiceId)
        .order("service_date");
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("invoices").update({ status }).eq("id", invoiceId);
      if (error) throw error;
    },
    onSuccess: (_: any, status: string) => {
      toast.success(`Invoice marked as ${status}`);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-detail", invoiceId] });
      onStatusChange(status);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Derive client info from first line item that has a client
  const clientData = (lineItems as any[]).find((i: any) => i.client)?.client;
  const clientName = clientData ? `${clientData.first_name} ${clientData.last_name}` : "";
  const planManager = clientData?.plan_manager || "";
  const clientAddr = clientData
    ? [clientData.address, clientData.suburb, clientData.state, clientData.postcode]
        .filter(Boolean)
        .join(", ")
    : "";

  function buildPrintRowsHtml(grouped: Map<string, any[]>): string {
    let html = "";
    let first = true;
    grouped.forEach((items, date) => {
      if (!first) html += `<tr class="spacer"><td colspan="4" style="padding:5px 0;border:none;"></td></tr>`;
      first = false;
      for (const item of items) {
        const { serviceType, timeRange } = parseLineItem(item);
        const dateLabel = date ? format(parseISO(date), "dd/MM/yy") : "";
        const dow = date ? dayLabel(date) : "";
        const hrsNum = Number(item.hours);
        const hrsStr = hrsNum % 1 === 0 ? `${hrsNum}hrs` : `${hrsNum.toFixed(1)}hrs`;
        html += `<tr>
          <td style="padding:5px 8px;border-bottom:1px solid #e8e8e8;">
            <strong>${dateLabel}</strong>
            <span style="margin-left:8px;color:#555;">${dow}</span>
            <span style="margin-left:12px;">${serviceType}</span>
            ${timeRange ? `<span style="margin-left:12px;color:#555;">${timeRange}</span>` : ""}
          </td>
          <td style="padding:5px 8px;text-align:right;border-bottom:1px solid #e8e8e8;">${hrsStr}</td>
          <td style="padding:5px 8px;text-align:right;border-bottom:1px solid #e8e8e8;">$${Number(item.rate).toFixed(0)}</td>
          <td style="padding:5px 8px;text-align:right;border-bottom:1px solid #e8e8e8;">$${Number(item.amount).toFixed(2)}</td>
        </tr>`;
      }
    });
    return html;
  }

  const handlePrint = () => {
    if (!invoice) return;
    const win = window.open("", "_blank");
    if (!win) return;

    const grouped = groupByDate(lineItems as any[]);
    const rowsHtml = buildPrintRowsHtml(grouped);
    const invoiceDate = invoice.invoice_date
      ? format(parseISO(invoice.invoice_date), "dd/MM/yyyy")
      : format(new Date(), "dd/MM/yyyy");
    const total = Number(invoice.total || 0).toFixed(2);

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size:11pt; color:#000; padding:32px 40px; }
    @media print { body { padding:16px 24px; } @page { margin:16mm; size:A4; } }
    .outer { width:100%; border-collapse:collapse; margin-bottom:20px; }
    .outer td { vertical-align:top; }
    .company { font-size:14pt; font-weight:bold; margin-bottom:4px; }
    .bill-to { margin-top:14px; }
    .divider { border:none; border-top:1px solid #ccc; margin:14px 0; }
    table.lines { width:100%; border-collapse:collapse; }
    table.lines thead tr { border-bottom:2px solid #000; }
    table.lines th { padding:6px 8px; font-size:10pt; }
    table.lines th:first-child { text-align:left; }
    table.lines th:not(:first-child) { text-align:right; }
    .total-wrap { float:right; width:260px; margin-top:10px; }
    .total-row { border-top:2px solid #000; font-weight:bold; font-size:12pt; }
    .total-row td { padding:8px 8px 0; }
    .total-row td:last-child { text-align:right; }
    .clear { clear:both; }
    .footer { margin-top:28px; border-top:1px solid #ccc; padding-top:14px; font-size:10pt; line-height:1.9; }
    .gst-note { margin-top:10px; font-style:italic; font-size:9pt; color:#555; }
  </style>
</head>
<body>
  <table class="outer">
    <tr>
      <td style="width:55%;">
        <div class="company">Carters Care Group</div>
        <div>Disability &amp; Aged Care</div>
        <div>PO Box 1118</div>
        <div>Osborne Park WA 6916</div>
        <div>1300 00 27 23</div>
        <div class="bill-to">
          <div><strong>Bill To:</strong></div>
          ${planManager ? `<div>${planManager}</div>` : ""}
          ${clientName ? `<div>C/O ${clientName}</div>` : ""}
          ${clientAddr ? `<div style="color:#555;font-size:10pt;">${clientAddr}</div>` : ""}
        </div>
      </td>
      <td style="text-align:right;">
        <div><strong>Services:</strong></div>
        <div>Domestic Assistance</div>
        <div>Personal Care</div>
        <div>Community Support</div>
        <div style="margin-top:14px;">
          <div><strong>Invoice No:</strong> ${invoice.invoice_number}</div>
          <div><strong>Date:</strong> ${invoiceDate}</div>
        </div>
      </td>
    </tr>
  </table>
  <hr class="divider"/>
  <table class="lines">
    <thead>
      <tr>
        <th>Date / Service</th>
        <th style="text-align:right;">Hrs</th>
        <th style="text-align:right;">Rate</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="total-wrap">
    <table style="width:100%;border-collapse:collapse;">
      <tr class="total-row">
        <td>Total (GST-free)</td>
        <td>$${total}</td>
      </tr>
    </table>
  </div>
  <div class="clear"></div>
  <div class="footer">
    <div>Invoice to be paid within 5 business days to:</div>
    <div style="margin-top:6px;"><strong>Bendigo Bank Account</strong></div>
    <div>Carters Care Group</div>
    <div>BSB: 633 000</div>
    <div>Account: 209 045 806</div>
    <div class="gst-note">Please note: all services are gst-free</div>
  </div>
</body>
</html>`);
    win.document.close();
    win.print();
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) return null;

  const grouped = groupByDate(lineItems as any[]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-background pb-2 z-10">
          <div>
            <p className="text-sm font-semibold text-foreground">{invoice.invoice_number}</p>
            <p className="text-xs text-muted-foreground">
              {invoice.invoice_date ? format(parseISO(invoice.invoice_date), "dd MMM yyyy") : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {isAdmin && invoice.status === "draft" && (
              <button
                onClick={() => statusMutation.mutate("submitted")}
                disabled={statusMutation.isPending}
                className="h-8 px-3 rounded-lg border text-xs font-medium text-foreground bg-card hover:bg-secondary transition-colors"
              >
                Mark Submitted
              </button>
            )}
            {isAdmin && invoice.status === "submitted" && (
              <>
                <button
                  onClick={() => statusMutation.mutate("approved")}
                  disabled={statusMutation.isPending}
                  className="h-8 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => statusMutation.mutate("rejected")}
                  disabled={statusMutation.isPending}
                  className="h-8 px-3 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  Reject
                </button>
              </>
            )}
            {isAdmin && invoice.status === "approved" && (
              <button
                onClick={() => statusMutation.mutate("paid")}
                disabled={statusMutation.isPending}
                className="h-8 px-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                Mark Paid
              </button>
            )}
            <button
              onClick={handlePrint}
              className="h-8 px-3 rounded-lg border bg-card text-xs font-medium text-foreground flex items-center gap-1.5 hover:bg-secondary transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </button>
          </div>
        </div>

        {/* Invoice preview card */}
        <div ref={printRef} className="rounded-lg border bg-white text-gray-900 p-6 space-y-4 text-[13px]">
          {/* Header: 2-col */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-0.5 leading-relaxed">
              <p className="font-bold text-[15px]">Carters Care Group</p>
              <p>Disability &amp; Aged Care</p>
              <p>PO Box 1118</p>
              <p>Osborne Park WA 6916</p>
              <p>1300 00 27 23</p>
              <div className="mt-3">
                <p className="font-semibold">Bill To:</p>
                {planManager && <p>{planManager}</p>}
                {clientName && <p>C/O {clientName}</p>}
                {clientAddr && <p className="text-gray-500 text-xs">{clientAddr}</p>}
              </div>
            </div>
            <div className="text-right leading-relaxed shrink-0">
              <p className="font-semibold">Services:</p>
              <p>Domestic Assistance</p>
              <p>Personal Care</p>
              <p>Community Support</p>
              <div className="mt-3 space-y-0.5">
                <p><span className="font-semibold">Invoice No: </span>{invoice.invoice_number}</p>
                <p><span className="font-semibold">Date: </span>
                  {invoice.invoice_date
                    ? format(parseISO(invoice.invoice_date), "dd/MM/yyyy")
                    : format(new Date(), "dd/MM/yyyy")}
                </p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  invoice.status === "paid"      ? "bg-blue-100 text-blue-700" :
                  invoice.status === "approved"  ? "bg-emerald-100 text-emerald-700" :
                  invoice.status === "rejected"  ? "bg-red-100 text-red-600" :
                  invoice.status === "submitted" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-600"
                }`}>{invoice.status}</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-300" />

          {/* Line items */}
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left py-1.5 pr-2 font-semibold">Date / Service</th>
                <th className="text-right py-1.5 px-2 font-semibold">Hrs</th>
                <th className="text-right py-1.5 px-2 font-semibold">Rate</th>
                <th className="text-right py-1.5 pl-2 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows: React.ReactElement[] = [];
                let first = true;
                grouped.forEach((items, date) => {
                  if (!first) {
                    rows.push(
                      <tr key={`spacer-${date}`}>
                        <td colSpan={4} className="py-1.5" />
                      </tr>
                    );
                  }
                  first = false;
                  (items as any[]).forEach((item: any) => {
                    const { serviceType, timeRange } = parseLineItem(item);
                    const dateLabel = date ? format(parseISO(date), "dd/MM/yy") : "";
                    const dow = date ? dayLabel(date) : "";
                    const hrsNum = Number(item.hours);
                    const hrsStr = hrsNum % 1 === 0 ? `${hrsNum}hrs` : `${hrsNum.toFixed(1)}hrs`;
                    rows.push(
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-1.5 pr-2">
                          <span className="font-medium">{dateLabel}</span>
                          {dow && <span className="ml-2 text-gray-500">{dow}</span>}
                          {serviceType && <span className="ml-3">{serviceType}</span>}
                          {timeRange && <span className="ml-3 text-gray-500">{timeRange}</span>}
                        </td>
                        <td className="py-1.5 px-2 text-right">{hrsStr}</td>
                        <td className="py-1.5 px-2 text-right text-gray-500">${Number(item.rate).toFixed(0)}</td>
                        <td className="py-1.5 pl-2 text-right font-medium">${Number(item.amount).toFixed(2)}</td>
                      </tr>
                    );
                  });
                });
                return rows;
              })()}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-56 border-t-2 border-gray-800 pt-2">
              <div className="flex justify-between text-sm font-bold">
                <span>Total (GST-free)</span>
                <span>${Number(invoice.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Payment footer */}
          <div className="text-[12px] text-gray-700 leading-relaxed space-y-0.5">
            <p>Invoice to be paid within 5 business days to:</p>
            <p className="font-semibold mt-1">Bendigo Bank Account</p>
            <p>Carters Care Group</p>
            <p>BSB: 633 000</p>
            <p>Account: 209 045 806</p>
          </div>
          <p className="text-[11px] text-gray-500 italic">Please note: all services are gst-free</p>

          {invoice.notes && (
            <div className="rounded bg-gray-50 p-2 text-xs text-gray-600">
              <span className="font-medium">Notes: </span>{invoice.notes}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
