package com.vireocode.backend.crud;

/** A known relationship or business invariant prevents deletion. */
public final class ResourceInUseException extends RuntimeException {

    public ResourceInUseException() {
        super("Resource is in use");
    }
}
