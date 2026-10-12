package com.bontech.auth.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String EXCHANGE = "user.exchange";
    public static final String QUEUE = "user.signup.queue";
    public static final String ROUTING_KEY = "user.signup";

    @Bean
    public Queue userSignupQueue() {
        return new Queue(QUEUE, true);
    }

    @Bean
    public TopicExchange userExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Binding userSignupBinding(Queue userSignupQueue, TopicExchange userExchange) {
        return BindingBuilder.bind(userSignupQueue).to(userExchange).with(ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
