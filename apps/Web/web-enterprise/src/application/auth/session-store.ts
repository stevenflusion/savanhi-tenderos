import { supabase } from "./supabase-client";

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
