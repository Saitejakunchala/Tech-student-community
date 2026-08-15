import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { formatRelative } from '@/lib/utils';
import type { Notification } from '@/lib/types';
import { Bell, CheckCircle2, XCircle, UserPlus, UserCheck, MessageSquare, Check } from 'lucide-react';

export function NotificationsPage() {
  const { profile, loading } = useAuth();
  const { navigate } = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const loadData = async () => {
    if (!profile) return;
    const { data } = await supabase.from('notifications').select('*').eq('recipient_id', profile.id).order('created_at', { ascending: false });
    setNotifications((data || []) as Notification[]);
    setPageLoading(false);
  };

  useEffect(() => { if (profile) loadData(); }, [profile]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    loadData();
  };

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', profile.id).eq('is_read', false);
    loadData();
  };

  const handleAccept = async (notif: Notification) => {
    if (!notif.related_id) return;
    setActing(notif.id);
    // Find the join request related to this notification
    const { data: req } = await supabase.from('join_requests').select('*').eq('requirement_id', notif.related_id).eq('status', 'pending').maybeSingle();
    if (req) {
      await supabase.rpc('accept_join_request', { p_request_id: req.id });
    }
    await markAsRead(notif.id);
    setActing(null);
    loadData();
  };

  const handleReject = async (notif: Notification) => {
    if (!notif.related_id) return;
    setActing(notif.id);
    const { data: req } = await supabase.from('join_requests').select('*').eq('requirement_id', notif.related_id).eq('status', 'pending').maybeSingle();
    if (req) {
      await supabase.rpc('reject_join_request', { p_request_id: req.id });
    }
    await markAsRead(notif.id);
    setActing(null);
    loadData();
  };

  if (loading || pageLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8" /></div>;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
            <p className="text-slate-600 mt-1">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
          </div>
          {unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllRead}><Check className="w-4 h-4" /> Mark all read</Button>}
        </div>

        {notifications.length === 0 ? (
          <Card><EmptyState icon={<Bell className="w-8 h-8" />} title="No notifications yet" description="You'll see team requests and updates here." /></Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <Card key={notif.id} className={notif.is_read ? '' : 'border-teal-200 bg-teal-50/30'}>
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      {notif.type === 'join_request' ? <UserPlus className="w-5 h-5" /> : notif.type === 'request_accepted' ? <UserCheck className="w-5 h-5 text-emerald-600" /> : notif.type === 'request_rejected' ? <XCircle className="w-5 h-5 text-red-500" /> : <Bell className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm">{notif.title}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{notif.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatRelative(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-2" />}
                  </div>
                  {notif.type === 'join_request' && !notif.is_read && (
                    <div className="flex gap-2 mt-3 ml-13">
                      <Button size="sm" onClick={() => handleAccept(notif)} disabled={!!acting}><CheckCircle2 className="w-3.5 h-3.5" /> Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(notif)} disabled={!!acting}><XCircle className="w-3.5 h-3.5" /> Reject</Button>
                      <Button size="sm" variant="ghost" onClick={() => markAsRead(notif.id)}>Dismiss</Button>
                    </div>
                  )}
                  {notif.type !== 'join_request' && !notif.is_read && (
                    <div className="mt-3 ml-13">
                      <Button size="sm" variant="ghost" onClick={() => markAsRead(notif.id)}>Mark as read</Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
