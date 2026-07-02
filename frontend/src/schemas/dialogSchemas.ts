import { z } from "zod";

export const clientSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Surname is required").max(100),
  preferred_name: z.string().trim().max(100).optional(),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional(),
  date_of_birth: z.string().optional(),
  address: z.string().trim().max(500).optional(),
  ndis_number: z.string().trim().max(20).optional(),
  ndis_plan_start: z.string().optional(),
  ndis_plan_end: z.string().optional(),
  funding_type: z.enum(["ndis", "aged_care", "chsp", "hvp", "home_care", "private", "other"]).optional(),
  primary_disability: z.string().trim().max(200).optional(),
  support_needs: z.string().trim().max(2000).optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
  emergency_contact_name: z.string().trim().max(100).optional(),
  emergency_contact_phone: z.string().trim().max(20).optional(),
  emergency_contact_relationship: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(2000).optional(),
  rate_weekday: z.string().optional(),
  rate_saturday: z.string().optional(),
  rate_sunday: z.string().optional(),
  rate_public_holiday: z.string().optional(),
});

export type ClientForm = z.infer<typeof clientSchema>;

export const staffSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Surname is required").max(100),
  preferred_name: z.string().trim().max(100).optional(),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().max(20).optional(),
  role: z.enum(["support_worker", "team_leader", "coordinator", "admin"]),
  employment_type: z.enum(["full_time", "part_time", "casual", "contractor"]),
  status: z.enum(["active", "inactive"]),
  start_date: z.string().optional(),
  address: z.string().trim().max(500).optional(),
  emergency_contact_name: z.string().trim().max(100).optional(),
  emergency_contact_phone: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type StaffForm = z.infer<typeof staffSchema>;

// For AddStaffDialog only - extends staffSchema with account creation
export const staffWithAccountSchema = staffSchema.extend({
  create_account: z.boolean(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  system_role: z.enum(["admin", "moderator", "user"]).optional(),
}).refine((data) => {
  if (data.create_account && !data.password) return false;
  return true;
}, { message: "Password is required when creating an account", path: ["password"] });

export type StaffWithAccountForm = z.infer<typeof staffWithAccountSchema>;
