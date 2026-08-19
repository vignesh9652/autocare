package com.autocare.adminservice.dto;

/**
 * Wrapper returned by every circuit-breakered downstream call.
 *
 * <p>When the downstream service is healthy we return
 * {@link #of(Object)} with the payload. When the call fails (or the circuit
 * breaker is OPEN) the Resilience4j fallback returns {@link #unavailable()}
 * so the dashboard can keep building a partial response instead of failing
 * entirely.</p>
 *
 * @param <T> the payload type
 */
public class ServiceResult<T> {

    private final boolean available;
    private final T data;

    private ServiceResult(boolean available, T data) {
        this.available = available;
        this.data = data;
    }

    public static <T> ServiceResult<T> of(T data) {
        return new ServiceResult<>(true, data);
    }

    public static <T> ServiceResult<T> unavailable() {
        return new ServiceResult<>(false, null);
    }

    public boolean isAvailable() {
        return available;
    }

    public T getData() {
        return data;
    }
}
