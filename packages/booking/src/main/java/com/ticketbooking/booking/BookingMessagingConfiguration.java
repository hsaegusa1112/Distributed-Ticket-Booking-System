package com.ticketbooking.booking;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BookingMessagingConfiguration {
  public static final String BOOKING_CONFIRMED_QUEUE = "booking.confirmed";

  @Bean
  Queue bookingConfirmedQueue() {
    return new Queue(BOOKING_CONFIRMED_QUEUE, true);
  }

  @Bean
  MessageConverter messageConverter() {
    return new Jackson2JsonMessageConverter();
  }
}
