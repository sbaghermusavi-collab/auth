package com.asanak.proxy.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Set;

public record Permission(
        @JsonIgnore
        @JsonProperty("rsid") String resourceId,
        @JsonProperty("rsname") String resourceName,
        @JsonProperty("scopes") Set<String> scopes
) {}
