package com.autocare.notificationservice.controller;

import com.autocare.notificationservice.model.Notification;
import com.autocare.notificationservice.service.NotificationStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationStore store;

    public NotificationController(NotificationStore store) {
        this.store = store;
    }

    /**
     * List notifications for a user. Pass {@code ?userId=} to filter.
     * Without a filter, returns all (admin convenience).
     */
    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam(required = false) Long userId) {
        List<Notification> result = userId != null
                ? store.findByUserId(userId)
                : store.findAll();
        return ResponseEntity.ok(result);
    }

    /** Unread notification count for the user (badge in the UI). */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(@RequestParam Long userId) {
        return ResponseEntity.ok(Map.of("count", store.countUnread(userId)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markRead(@PathVariable Long id) {
        boolean ok = store.markRead(id);
        return ok
                ? ResponseEntity.ok(Map.of("message", "Notification marked as read", "id", id))
                : ResponseEntity.notFound().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllRead(@RequestParam Long userId) {
        store.markAllRead(userId);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }
}
