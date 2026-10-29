package com.vireocode.backend.crud;

/** An absent, deleted or out-of-scope resource; contains no private identity. */
public final class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException() {
        super("Resource not found");
    }
}
