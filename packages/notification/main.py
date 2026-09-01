import json
import logging
import os
import smtplib
import threading
from contextlib import asynccontextmanager
from email.message import EmailMessage

import pika
from fastapi import FastAPI


logger = logging.getLogger(__name__)
booking_confirmed_queue = "booking.confirmed"


def send_confirmation_email(event: dict[str, object]) -> None:
    email = event.get("email")
    if not isinstance(email, str) or not email:
        raise ValueError("booking confirmation event is missing an email")

    message = EmailMessage()
    message["From"] = os.environ.get("SMTP_FROM", "tickets@example.com")
    message["To"] = email
    message["Subject"] = "Your ticket booking is confirmed"
    message.set_content(
        "Your booking is confirmed. "
        f"Booking reference: {event['bookingId']}\n"
        f"Tickets: {event['quantity']}"
    )

    with smtplib.SMTP(
        os.environ.get("SMTP_HOST", "localhost"),
        int(os.environ.get("SMTP_PORT", "1025")),
        timeout=10,
    ) as smtp:
        smtp.send_message(message)


def consume_booking_confirmations(stop_event: threading.Event) -> None:
    credentials = pika.PlainCredentials(
        os.environ.get("RABBITMQ_USERNAME", "ticket_booking"),
        os.environ.get("RABBITMQ_PASSWORD", "ticket_booking"),
    )
    parameters = pika.ConnectionParameters(
        host=os.environ.get("RABBITMQ_HOST", "localhost"),
        credentials=credentials,
        heartbeat=30,
    )

    while not stop_event.is_set():
        connection = None
        try:
            connection = pika.BlockingConnection(parameters)
            channel = connection.channel()
            channel.queue_declare(queue=booking_confirmed_queue, durable=True)
            channel.basic_qos(prefetch_count=1)

            def handle_message(channel, method, _properties, body):
                try:
                    send_confirmation_email(json.loads(body))
                    channel.basic_ack(method.delivery_tag)
                    logger.info("sent booking confirmation %s", method.delivery_tag)
                except (json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
                    logger.error("discarding invalid booking confirmation: %s", error)
                    channel.basic_ack(method.delivery_tag)
                except (OSError, smtplib.SMTPException) as error:
                    logger.error("email delivery failed; retrying: %s", error)
                    channel.basic_nack(method.delivery_tag, requeue=True)

            channel.basic_consume(queue=booking_confirmed_queue, on_message_callback=handle_message)
            while not stop_event.is_set():
                connection.process_data_events(time_limit=1)
        except pika.exceptions.AMQPError as error:
            logger.warning("RabbitMQ unavailable; retrying: %s", error)
            stop_event.wait(5)
        finally:
            if connection and connection.is_open:
                connection.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    stop_event = threading.Event()
    consumer = threading.Thread(
        target=consume_booking_confirmations,
        args=(stop_event,),
        daemon=True,
    )
    consumer.start()
    yield
    stop_event.set()
    consumer.join(timeout=5)


app = FastAPI(title="Notification Service", lifespan=lifespan)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "notification-service"}