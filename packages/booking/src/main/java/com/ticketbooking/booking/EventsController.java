package com.ticketbooking.booking;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

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
      SELECT showings.id, showings.event_id, showings.starts_at,
         showings.capacity,
         COALESCE(SUM(bookings.quantity) FILTER (WHERE bookings.status = 'confirmed'), 0) AS booked_amount
      FROM showings
      LEFT JOIN bookings ON bookings.showing_id = showings.id
      GROUP BY showings.id, showings.event_id, showings.starts_at, showings.capacity
        ORDER BY starts_at
        """).query((resultSet, rowNumber) -> new ShowingRecord(
        resultSet.getObject("id", UUID.class),
        resultSet.getObject("event_id", UUID.class),
        resultSet.getObject("starts_at", OffsetDateTime.class),
        resultSet.getInt("capacity"),
        resultSet.getInt("booked_amount"))).list().stream().collect(java.util.stream.Collectors.groupingBy(
            ShowingRecord::eventId,
            java.util.stream.Collectors.mapping(
          showing -> new ShowingResponse(showing.id(), showing.startsAt(), showing.capacity(), showing.bookedAmount()),
                java.util.stream.Collectors.toList())));

    return events.stream().map(event -> new EventResponse(
        event.id(), event.title(), event.eventType(), event.imageUrl(),
        showingsByEventId.getOrDefault(event.id(), List.of()))).toList();
  }

  @PostMapping("/bookings")
  @Transactional
  public BookingResponse createBooking(@RequestBody CreateBookingRequest request) {
    if (request.showingId() == null || request.customerId() == null || request.email() == null || request.email().isBlank() || request.quantity() == null || request.quantity() < 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "showingId, customerId, email, and a positive quantity are required");
    }

    Integer capacity = jdbcClient.sql("SELECT capacity FROM showings WHERE id = :showingId FOR UPDATE")
        .param("showingId", request.showingId())
        .query(Integer.class)
        .optional()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "showing not found"));
    Integer bookedQuantity = jdbcClient.sql("""
        SELECT COALESCE(SUM(quantity), 0)
        FROM bookings
        WHERE showing_id = :showingId AND status = 'confirmed'
        """)
        .param("showingId", request.showingId())
        .query(Integer.class)
        .single();

    if (request.quantity() > capacity - bookedQuantity) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "not enough tickets remaining");
    }

    UUID bookingId = UUID.randomUUID();
    jdbcClient.sql("""
        INSERT INTO bookings (id, showing_id, customer_id, email, quantity, status)
        VALUES (:id, :showingId, :customerId, :email, :quantity, 'confirmed')
        """)
        .param("id", bookingId)
        .param("showingId", request.showingId())
        .param("customerId", request.customerId())
        .param("email", request.email())
        .param("quantity", request.quantity())
        .update();

    return new BookingResponse(bookingId, capacity, bookedQuantity + request.quantity());
  }

  private record EventRecord(UUID id, String title, String eventType, String imageUrl) {}

  private record ShowingRecord(UUID id, UUID eventId, OffsetDateTime startsAt, int capacity, int bookedAmount) {}

  public record EventResponse(UUID id, String title, String eventType, String imageUrl, List<ShowingResponse> showings) {}

  public record ShowingResponse(UUID id, OffsetDateTime startsAt, int capacity, int bookedAmount) {}

  public record CreateBookingRequest(UUID showingId, UUID customerId, String email, Integer quantity) {}

  public record BookingResponse(UUID id, int capacity, int bookedAmount) {}
}