package com.vireocode.backend.http;

import java.util.List;

/** Stable wire representation; feature services own scope, ordering and query consistency. */
public record PageResponse<T>(List<T> items, int page, int size, long totalItems) {
    public PageResponse {
        items = List.copyOf(items);
        if (page < 0 || size < 1 || size > 100 || totalItems < 0) {
            throw new IllegalArgumentException("Invalid page metadata");
        }
    }
}
