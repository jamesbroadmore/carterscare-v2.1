import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const unread = useMemo(() => notifications.filter((item) => !item.read), [notifications]);
  const isSafeInternalLink = (link: unknown): link is string => typeof link === "string" && link.startsWith("/") && !link.startsWith("//");
  const formatNotificationTime = (value: unknown) => {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? "Date unavailable" : formatDistanceToNow(date, { addSuffix: true });
  };
  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user?.id || unread.length === 0) return;
      const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notifications marked as read");
    },
    onError: () => toast.error("We could not update notifications. Please try again."),
  });

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} aria-label="Go back" className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-600">CartersCare</p>
              <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            </div>
          </div>
          <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending || unread.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {markAllRead.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Mark all read
          </button>
        </header>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading && <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading notifications…</div>}
          {isError && <div className="p-12 text-center text-sm text-red-600">Notifications could not be loaded. Please refresh and try again.</div>}
          {!isLoading && !isError && notifications.length === 0 && <div className="flex flex-col items-center gap-3 p-12 text-center"><Bell className="h-8 w-8 text-slate-300" /><p className="font-semibold text-slate-700">You&apos;re all caught up</p><p className="text-sm text-slate-500">New shift, compliance, and timesheet updates will appear here.</p></div>}
          {!isLoading && !isError && notifications.map((notification) => (
            <div key={notification.id} className={`border-b border-slate-100 p-5 last:border-0 ${!notification.read ? "bg-purple-50/50" : ""}`}>
              <button
                type="button"
                disabled={!isSafeInternalLink(notification.link)}
                onClick={() => isSafeInternalLink(notification.link) && navigate(notification.link)}
                className={`block w-full text-left ${isSafeInternalLink(notification.link) ? "hover:bg-slate-50" : "cursor-default"}`}
                aria-label={isSafeInternalLink(notification.link) ? `Open ${notification.title}` : undefined}
              >
              <div className="flex items-start gap-3">
                <Bell className={`mt-0.5 h-5 w-5 shrink-0 ${!notification.read ? "text-purple-600" : "text-slate-400"}`} />
                <div className="min-w-0 flex-1"><p className={`text-sm ${!notification.read ? "font-semibold text-slate-900" : "text-slate-700"}`}>{notification.title}</p><p className="mt-1 text-sm text-slate-600">{notification.message}</p><p className="mt-2 text-xs text-slate-400">{formatNotificationTime(notification.created_at)}</p></div>
                {!notification.read && <span className="mt-1 h-2 w-2 rounded-full bg-purple-600" aria-label="Unread" />}
              </div>
              </button>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
