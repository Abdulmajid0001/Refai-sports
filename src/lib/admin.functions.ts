import type { User } from "@supabase/supabase-js";

type AdminFunctionInput = {
  target_type: "league" | "team" | "user";
  target_id: string;
  suspended?: boolean;
  reason?: string;
};

type AdminFunctionContext = {
  user: User;
};

type AccountStatus = "pending" | "approved" | "rejected" | "suspended";

export type AdminUserRow = {
  id: string;
  display_name: string | null;
  email: string;
  email_confirmed: boolean;
  account_status: AccountStatus;
};

export async function listUsers(): Promise<AdminUserRow[]> {
  return [];
}

export async function setAccountStatus(
  input: { user_id: string; status: AccountStatus; reason?: string },
  _ctx: AdminFunctionContext
): Promise<{ success: boolean }> {
  console.log("setAccountStatus", input, _ctx);
  return { success: true };
}

export async function deleteUserAccount(
  input: { user_id: string; reason?: string },
  _ctx: AdminFunctionContext
): Promise<{ success: boolean }> {
  console.log("deleteUserAccount", input, _ctx);
  return { success: true };
}

export async function setEntitySuspended(
  input: AdminFunctionInput,
  ctx: AdminFunctionContext
): Promise<{ success: boolean }> {
  console.log("setEntitySuspended", input, ctx);
  return { success: true };
}

export async function deleteEntity(
  input: AdminFunctionInput,
  ctx: AdminFunctionContext
): Promise<{ success: boolean }> {
  console.log("deleteEntity", input, ctx);
  return { success: true };
}

export async function approveUser(
  input: { user_id: string },
  ctx: AdminFunctionContext
): Promise<{ success: boolean }> {
  console.log("approveUser", input, ctx);
  return { success: true };
}

export async function suspendUser(
  input: { user_id: string; reason?: string },
  ctx: AdminFunctionContext
): Promise<{ success: boolean }> {
  console.log("suspendUser", input, ctx);
  return { success: true };
}
