export type ReadinessSubject = {
  status?: string | null;
  onboarding_complete?: boolean | null;
  onboarding_status?: string | null;
  funding_type?: string | null;
  ndis_number?: string | null;
  ndis_plan_end?: string | null;
  care_plan_complete?: boolean | null;
  required_documents_complete?: boolean | null;
  policy_acknowledged?: boolean | null;
};

export type ReadinessResult = {
  eligible: boolean;
  reasons: string[];
};

const isTrue = (value: unknown) => value === true || value === "complete" || value === "completed";

export function getClientReadiness(client: ReadinessSubject | null | undefined): ReadinessResult {
  const reasons: string[] = [];
  if (!client) return { eligible: false, reasons: ["Recipient record is unavailable"] };
  if (client.status !== "active") reasons.push("Recipient is not active");
  if (!isTrue(client.onboarding_complete) && client.onboarding_status !== "complete") {
    reasons.push("Recipient onboarding is incomplete");
  }
  if (!client.funding_type) reasons.push("Funding arrangement is missing");
  if (client.funding_type === "ndis" && !client.ndis_number) reasons.push("NDIS participant number is missing");
  if (client.funding_type === "ndis" && client.ndis_plan_end && new Date(client.ndis_plan_end) < new Date()) {
    reasons.push("NDIS plan has expired");
  }
  if (client.care_plan_complete === false) reasons.push("Care/support plan is incomplete");
  if (client.required_documents_complete === false) reasons.push("Required recipient documents are incomplete");
  return { eligible: reasons.length === 0, reasons };
}

export function getStaffReadiness(
  staff: ReadinessSubject | null | undefined,
  records: Array<{ record_type?: string | null; status?: string | null }> = [],
): ReadinessResult {
  const reasons: string[] = [];
  if (!staff) return { eligible: false, reasons: ["Support worker record is unavailable"] };
  if (staff.status !== "active") reasons.push("Support worker is inactive");
  if (!isTrue(staff.onboarding_complete) && staff.onboarding_status !== "complete") {
    reasons.push("Support worker onboarding is incomplete");
  }
  const required = ["worker_screening", "police_check", "first_aid", "cpr"];
  const missing = required.filter((type) => !records.some((record) => record.record_type === type && record.status === "current"));
  if (missing.length) reasons.push(`Missing current compliance records: ${missing.join(", ")}`);
  if (staff.required_documents_complete === false) reasons.push("Required worker documents are incomplete");
  if (staff.policy_acknowledged === false) reasons.push("Required policies have not been acknowledged");
  return { eligible: reasons.length === 0, reasons };
}

export function getShiftReadiness(
  client: ReadinessSubject | null | undefined,
  staff: ReadinessSubject | null | undefined,
  records: Array<{ record_type?: string | null; status?: string | null }> = [],
): ReadinessResult {
  const clientResult = getClientReadiness(client);
  const staffResult = getStaffReadiness(staff, records);
  return { eligible: clientResult.eligible && staffResult.eligible, reasons: [...clientResult.reasons, ...staffResult.reasons] };
}

export function readinessLabel(result: ReadinessResult) {
  return result.eligible ? "Ready for shifts" : "Blocked until onboarding is complete";
}

export const COMPLIANCE_DISCLAIMER = "Operational template only. Review with your privacy officer, NDIS/Aged Care compliance lead and legal adviser before use.";
