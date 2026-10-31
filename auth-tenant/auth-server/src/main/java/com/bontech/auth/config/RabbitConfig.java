package com.bontech.auth.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    @Value("${auth.user.signup.exchange:user.exchange}")
    private String exchange;

    @Value("${auth.user.signup.queue:user.signup.queue}")
    private String queue;

    @Value("${auth.user.signup.routing-key:user.signup}")
    private String routingKey;

    public String getExchange() {
        return exchange;
    }

    public String getRoutingKey() {
        return routingKey;
    }

    @Bean
    public Queue userSignupQueue() {
        return new Queue(queue, true);
    }

    @Bean
    public TopicExchange userExchange() {
        return new TopicExchange(exchange, true, false);
    }

    @Bean
    public Binding userSignupBinding(Queue userSignupQueue, TopicExchange userExchange) {
        return BindingBuilder.bind(userSignupQueue).to(userExchange).with(routingKey);
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
