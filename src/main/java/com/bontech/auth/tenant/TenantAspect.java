package com.bontech.auth.tenant;

import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.hibernate.Session;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@RequiredArgsConstructor
public class TenantAspect {

    private final TenantResolver tenantResolver;
    private final EntityManager entityManager;

    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *) || within(@org.springframework.stereotype.Controller *)")
    public void controllerPointcut() {}

    @Around("controllerPointcut()")
    public Object applyTenantFilter(ProceedingJoinPoint joinPoint) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        Long tenantId = null;
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            tenantId = tenantResolver.resolveTenantId(request);
        } else {
            tenantId = tenantResolver.getDefaultTenant().getId();
        }

        TenantContext.setTenantId(tenantId);

        try {
            Session session = entityManager.unwrap(Session.class);
            if (session != null && session.isOpen()) {
                session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);
            }
        } catch (Exception ignored) {
            // Ignore if Hibernate Session is unavailable in current context
        }

        try {
            return joinPoint.proceed();
        } finally {
            TenantContext.clear();
        }
    }
}
