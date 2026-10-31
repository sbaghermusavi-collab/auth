package com.bontech.auth.service;

import com.bontech.auth.config.RabbitConfig;
import com.bontech.auth.event.UserSignedUpEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final RabbitConfig rabbitConfig;

    public void publishUserSignedUp(UserSignedUpEvent event) {
        try {
            log.info("Publishing user signup event to RabbitMQ for user: {}, tenant: {}", event.username(), event.tenantId());
            rabbitTemplate.convertAndSend(rabbitConfig.getExchange(), rabbitConfig.getRoutingKey(), event);
        } catch (Exception e) {
            log.error("Failed to publish user signup event to RabbitMQ for user: {}", event.username(), e);
        }
    }
}
