package com.bontech.auth.config;

import com.bontech.auth.dto.PreAuthSession;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {
    @Bean
    public ObjectMapper objectMapper(){
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        return mapper;
    }

    @Bean
    public RedisTemplate<String, PreAuthSession> preAuthSessionRedisTemplate(RedisConnectionFactory connectionFactory,
                                                                             ObjectMapper mapper) {
        RedisTemplate<String, PreAuthSession> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        
        Jackson2JsonRedisSerializer<PreAuthSession> serializer = new Jackson2JsonRedisSerializer<>(mapper, PreAuthSession.class);
        template.setValueSerializer(serializer);
        template.afterPropertiesSet();
        return template;
    }
}
