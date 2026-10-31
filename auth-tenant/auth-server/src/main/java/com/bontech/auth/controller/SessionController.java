package com.bontech.auth.controller;

import com.bontech.auth.dto.SessionDto;
import com.bontech.auth.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {
    private final SessionService service;


    @GetMapping("/{username}")
    public SessionDto.ActiveSessionsResponse activeSessions(@PathVariable String username) {
        return service.activeSessions(username);
    }

    @PostMapping("/sign-out-others")
    public void signOutOthers(@RequestBody SessionDto.SignOutOtherSessionsRequest request) {
        service.signOutOtherSessions(request);
    }
}
