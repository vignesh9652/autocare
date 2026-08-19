package com.autocare.notificationservice.service;

import com.autocare.notificationservice.model.Notification;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Thread-safe in-memory store of notifications.
 * A production system would persist to a database; this keeps the
 * notification service database-free by design.
 */
@Service
public class NotificationStore {

    private final Map<Long, Notification> notifications = new ConcurrentHashMap<>();
    private final AtomicLong idCounter = new AtomicLong(1);

    public Notification add(Long userId, String type, String title, String message) {
        Notification n = new Notification(idCounter.getAndIncrement(), userId, type, title, message);
        notifications.put(n.getId(), n);
        return n;
    }

    public List<Notification> findByUserId(Long userId) {
        return notifications.values().stream()
                .filter(n -> n.getUserId().equals(userId))
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    public List<Notification> findAll() {
        return notifications.values().stream()
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    public long countUnread(Long userId) {
        return notifications.values().stream()
                .filter(n -> n.getUserId().equals(userId) && !n.isRead())
                .count();
    }

    public boolean markRead(Long id) {
        Notification n = notifications.get(id);
        if (n == null) return false;
        n.setRead(true);
        return true;
    }

    public void markAllRead(Long userId) {
        notifications.values().stream()
                .filter(n -> n.getUserId().equals(userId))
                .forEach(n -> n.setRead(true));
    }
}
