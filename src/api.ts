import { DateTime } from "luxon";

const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://kakayama-reservations-api.kooshaba.workers.dev"
    : "http://localhost:8787";

// Function to create a reservation
async function createReservation(reservationData: {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  reservation_date: string;
  reservation_time: string;
  number_of_guests: number;
  special_requests?: string;
  allergy?: string;
  communication_consent: boolean;
}): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reservationData),
  });

  if (!response.ok) {
    throw new Error("Failed to create reservation");
  }

  return response;
}

// Function to fetch all reservations and blocked dates
async function fetchReservationsAndBlockedDates(): Promise<{
  reservations: {
    id: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    reservation_date: DateTime;
    reservation_time: DateTime;
    number_of_guests: number;
    special_requests?: string;
    allergy?: string;
    communication_consent: boolean;
    created_at: DateTime;
  }[];
  blockedDays: {
    id: number;
    block_date: DateTime;
  }[];
  addedDays: {
    id: number;
    added_date: DateTime;
  }[];
}> {
  const reservationsResponse = await fetch(`${API_BASE_URL}/reservations`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!reservationsResponse.ok) {
    throw new Error("Failed to fetch reservations");
  }

  const reservations = (await reservationsResponse.json()).results;
  const formattedReservations = reservations.map((reservation: any) => ({
    ...reservation,
    reservation_date: DateTime.fromISO(`${reservation.reservation_date}`),
    reservation_time: DateTime.fromISO(
      `${reservation.reservation_date}T${reservation.reservation_time}`
    ),
    created_at: DateTime.fromISO(reservation.created_at),
  }));

  const blockedDaysResponse = await fetch(`${API_BASE_URL}/blocked-days`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!blockedDaysResponse.ok) {
    throw new Error("Failed to fetch blocked days");
  }

  const blockedDays = (await blockedDaysResponse.json()).results;
  const formattedBlockedDays = blockedDays.map((blockedDay: any) => ({
    ...blockedDay,
    block_date: DateTime.fromISO(blockedDay.block_date),
  }));

  const addedDaysResponse = await fetch(`${API_BASE_URL}/added-days`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!addedDaysResponse.ok) {
    throw new Error("Failed to fetch added days");
  }

  const addedDays = (await addedDaysResponse.json()).results;
  const formattedAddedDays = addedDays.map((addedDay: any) => ({
    ...addedDay,
    added_date: DateTime.fromISO(addedDay.added_date),
  }));

  return {
    reservations: formattedReservations,
    blockedDays: formattedBlockedDays,
    addedDays: formattedAddedDays,
  };
}

// Function to create a blocked day
async function createBlockedDay(date: DateTime): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}/blocked-days`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ block_date: date.toISO() }),
  });

  return response;
}

// Function to create an added day
async function createAddedDay(date: DateTime): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}/added-days`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ added_date: date.toISO() }),
  });

  return response;
}

export {
  createReservation,
  fetchReservationsAndBlockedDates,
  createBlockedDay,
  createAddedDay,
};
