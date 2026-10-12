package com.bontech.auth.dto;

import java.io.Serializable;
import java.util.List;

public class PreAuthSession implements Serializable {
    private String identifier;
    private List<AuthDto.MaskedPhone> candidates;
    private boolean passwordChangeRequired;

    public PreAuthSession() {}

    public PreAuthSession(String identifier, List<AuthDto.MaskedPhone> candidates, boolean passwordChangeRequired) {
        this.identifier = identifier;
        this.candidates = candidates;
        this.passwordChangeRequired = passwordChangeRequired;
    }

    public String identifier() { return identifier; }
    public List<AuthDto.MaskedPhone> candidates() { return candidates; }
    public boolean passwordChangeRequired() { return passwordChangeRequired; }

    public String getIdentifier() { return identifier; }
    public void setIdentifier(String identifier) { this.identifier = identifier; }
    public List<AuthDto.MaskedPhone> getCandidates() { return candidates; }
    public void setCandidates(List<AuthDto.MaskedPhone> candidates) { this.candidates = candidates; }
    public boolean isPasswordChangeRequired() { return passwordChangeRequired; }
    public void setPasswordChangeRequired(boolean passwordChangeRequired) { this.passwordChangeRequired = passwordChangeRequired; }
}
