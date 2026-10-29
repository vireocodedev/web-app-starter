package com.vireocode.backend.crud;

/** The caller's version no longer matches the current resource. */
public final class VersionConflictException extends RuntimeException {

    public VersionConflictException() {
        super("Resource version conflict");
    }
}
