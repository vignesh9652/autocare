import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';

export function useNotifications(userId?: number | null) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationApi.getMine(userId!),
    enabled: !!userId,
    refetchInterval: 30_000,
  });
}

export function useUnreadCount(userId?: number | null): number {
  const { data } = useQuery({
    queryKey: ['notifications-unread', userId],
    queryFn: () => notificationApi.unreadCount(userId!),
    enabled: !!userId,
    refetchInterval: 30_000,
  });
  return data ?? 0;
}

export function useMarkAllRead(userId?: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(userId!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications', userId] });
      void qc.invalidateQueries({ queryKey: ['notifications-unread', userId] });
    },
  });
}

export function useMarkRead(userId?: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications', userId] });
      void qc.invalidateQueries({ queryKey: ['notifications-unread', userId] });
    },
  });
}
