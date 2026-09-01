package com.ticketbooking.booking;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EventsController {
  private final JdbcClient jdbcClient;

  public EventsController(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  @GetMapping("/events")
  public List<EventResponse> getEvents() {
    List<EventRecord> events = jdbcClient.sql("""
        SELECT id, title, event_type, image_url
        FROM events
        ORDER BY created_at, title
        """).query((resultSet, rowNumber) -> new EventRecord(
        resultSet.getObject("id", UUID.class),
        resultSet.getString("title"),
        resultSet.getString("event_type"),
        resultSet.getString("image_url"))).list();

    Map<UUID, List<ShowingResponse>> showingsByEventId = jdbcClient.sql("""
        SELECT id, event_id, starts_at, capacity
        FROM showings
        ORDER BY starts_at
        """).query((resultSet, rowNumber) -> new ShowingRecord(
        resultSet.getObject("id", UUID.class),
        resultSet.getObject("event_id", UUID.class),
        resultSet.getObject("starts_at", OffsetDateTime.class),
        resultSet.getInt("capacity"))).list().stream().collect(java.util.stream.Collectors.groupingBy(
            ShowingRecord::eventId,
            java.util.stream.Collectors.mapping(
                showing -> new ShowingResponse(showing.id(), showing.startsAt(), showing.capacity()),
                java.util.stream.Collectors.toList())));

    return events.stream().map(event -> new EventResponse(
        event.id(), event.title(), event.eventType(), event.imageUrl(),
        showingsByEventId.getOrDefault(event.id(), List.of()))).toList();
  }

  private record EventRecord(UUID id, String title, String eventType, String imageUrl) {}

  private record ShowingRecord(UUID id, UUID eventId, OffsetDateTime startsAt, int capacity) {}

  public record EventResponse(UUID id, String title, String eventType, String imageUrl, List<ShowingResponse> showings) {}

  public record ShowingResponse(UUID id, OffsetDateTime startsAt, int capacity) {}
}