import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, CalendarCheck, CheckCircle2, Clock3, CreditCard, ShieldCheck,
  ArrowRight, Check, Sparkles,
} from 'lucide-react';
import { useApp } from '@/store';
import { Badge } from '@/components/ui';
import type { Screen } from '@/types';

type NotificationKind = 'appointment' | 'confirmation' | 'schedule' | 'payment' | 'security';

type PatientNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionLabel?: string;
  actionScreen?: Screen;
};

const MOCK_NOTIFICATIONS: PatientNotification[] = [
  {
    id: 'notification-1',
    kind: 'appointment',
    title: 'Recordatorio de cita próxima',
    message: 'Tu cita con el Dr. Carlos Mendoza es el Lun 22 Sep a las 09:00. Llegación recomendada: 10 minutos antes.',
    time: 'Hace 15 min',
    read: false,
    actionLabel: 'Ver mis citas',
    actionScreen: 'misCitas',
  },
  {
    id: 'notification-2',
    kind: 'confirmation',
    title: 'Cita confirmada',
    message: 'El Dr. Miguel Torres confirmó tu solicitud para el Sáb 27 Sep a las 10:00.',
    time: 'Ayer',
    read: false,
    actionLabel: 'Ver detalles',
    actionScreen: 'misCitas',
  },
  {
    id: 'notification-3',
    kind: 'schedule',
    title: 'Cambio de horario',
    message: 'La Dra. Patricia Ruiz movió tu control de ortodoncia al Jue 25 Sep a las 11:30. Revisa la actualización.',
    time: 'Ayer',
    read: false,
    actionLabel: 'Revisar cita',
    actionScreen: 'misCitas',
  },
  {
    id: 'notification-4',
    kind: 'payment',
    title: 'Garantía de reserva registrada',
    message: 'Recibimos el pago de S/ 20.00 de tu garantía. Es 100% reembolsable con 24h de anticipación.',
    time: 'Hace 2 días',
    read: true,
    actionLabel: 'Ver comprobante',
    actionScreen: 'misCitas',
  },
  {
    id: 'notification-5',
    kind: 'security',
    title: 'Acceso seguro verificado',
    message: 'Tu sesión se protegió correctamente. Puedes administrar la biometría de tu ficha médica en Perfil.',
    time: 'Hace 3 días',
    read: true,
    actionLabel: 'Ir a Perfil',
    actionScreen: 'dentistProfile',
  },
];

const notificationConfig: Record<NotificationKind, { icon: typeof Bell; className: string; badge: 'primary' | 'success' | 'accent' }> = {
  appointment: { icon: CalendarCheck, className: 'bg-primary-50 text-primary-600', badge: 'primary' },
  confirmation: { icon: CheckCircle2, className: 'bg-success-50 text-success-600', badge: 'success' },
  schedule: { icon: Clock3, className: 'bg-accent-50 text-accent-600', badge: 'accent' },
  payment: { icon: CreditCard, className: 'bg-primary-50 text-primary-600', badge: 'primary' },
  security: { icon: ShieldCheck, className: 'bg-success-50 text-success-600', badge: 'success' },
};

export default function PatientNotifications() {
  const { setScreen, user } = useApp();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(MOCK_NOTIFICATIONS.filter((notification) => notification.read).map((notification) => notification.id)),
  );

  const notifications = useMemo(
    () => MOCK_NOTIFICATIONS.map((notification) => ({
      ...notification,
      read: readIds.has(notification.id),
    })),
    [readIds],
  );
  const visibleNotifications = notifications.filter((notification) => filter === 'all' || !notification.read);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map((notification) => notification.id)));
  };

  const openAction = (notification: PatientNotification) => {
    setReadIds((current) => new Set([...current, notification.id]));
    if (notification.actionScreen) setScreen(notification.actionScreen);
  };

  return (
    <div className="min-h-screen bg-slatey-50 pb-24">
      <div className="sticky top-0 z-30 border-b border-slatey-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slatey-900 font-display">Notificaciones</h2>
              <p className="text-xs text-slatey-500">{user.fullName || 'Paciente'} · Mantente al día con tu salud bucal</p>
            </div>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-50">
              <Bell className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2">
              <Sparkles className="h-4 w-4 text-primary-600" />
              <p className="text-xs font-semibold text-primary-700">Tienes {unreadCount} notificacion{unreadCount === 1 ? '' : 'es'} sin leer</p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-5 px-4 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex rounded-2xl bg-slatey-100 p-1">
            {([
              { value: 'all', label: 'Todas' },
              { value: 'unread', label: 'Sin leer' },
            ] as const).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  filter === tab.value ? 'bg-white text-primary-600 shadow-sm' : 'text-slatey-500 hover:text-slatey-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-primary-600 hover:bg-primary-50"
            >
              <Check className="h-4 w-4" /> Marcar todas
            </button>
          )}
        </div>

        {visibleNotifications.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slatey-200 bg-white py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-50">
              <Bell className="h-7 w-7 text-success-500" />
            </div>
            <h3 className="text-sm font-bold text-slatey-900">Todo está al día</h3>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slatey-500">
              {filter === 'unread' ? 'No tienes notificaciones sin leer.' : 'Cuando haya actualizaciones importantes, las verás aquí.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleNotifications.map((notification) => {
              const config = notificationConfig[notification.kind];
              const Icon = config.icon;
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-4 transition-all ${
                    notification.read ? 'border-slatey-100 bg-white' : 'border-primary-200 bg-white shadow-sm shadow-primary-500/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${config.className}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slatey-900">{notification.title}</h3>
                            {!notification.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slatey-600">{notification.message}</p>
                          <p className="mt-2 text-[11px] font-medium text-slatey-400">{notification.time}</p>
                        </div>
                        <Badge variant={config.badge} size="sm">
                          {notification.read ? 'Leída' : 'Nueva'}
                        </Badge>
                      </div>
                      {notification.actionLabel && notification.actionScreen && (
                        <button
                          onClick={() => openAction(notification)}
                          className="mt-3 flex items-center gap-1.5 rounded-xl bg-slatey-50 px-3 py-2 text-xs font-bold text-primary-600 transition-colors hover:bg-primary-50"
                        >
                          {notification.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
