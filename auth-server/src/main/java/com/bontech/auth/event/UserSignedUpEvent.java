package com.bontech.auth.event;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;

public record UserSignedUpEvent(
    String username,
    String externalUserId,
    String phoneNumber,
    String email,
    String tenantId,
    List<String> roles,
    Instant timestamp
) implements Serializable {}
