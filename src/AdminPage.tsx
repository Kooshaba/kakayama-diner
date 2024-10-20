import { useState, useEffect } from "react";
import {
  createAddedDay,
  createBlockedDay,
  fetchReservationsAndBlockedDates,
} from "./api";
import { DateTime } from "luxon";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";

export function AdminPage() {
  const [allReservations, setAllReservations] = useState<
    {
      id: number;
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      reservation_date: DateTime;
      reservation_time: DateTime;
      number_of_guests: number;
      special_requests: string;
      allergy: string;
      communication_consent: boolean;
      created_at: DateTime;
    }[]
  >([]);
  const [allBlockedDays, setAllBlockedDays] = useState<
    {
      id: number;
      block_date: DateTime;
    }[]
  >([]);
  const [allAddedDays, setAllAddedDays] = useState<
    {
      id: number;
      added_date: DateTime;
    }[]
  >([]);
  const [selectedBlockedDate, setSelectedBlockedDate] =
    useState<DateTime | null>(null);

  useEffect(() => {
    fetchReservationsAndBlockedDates().then((data) => {
      setAllBlockedDays(data.blockedDays);
      const oneDayAgo = DateTime.now().minus({ days: 1 });
      const filteredReservations = data.reservations.filter(
        (reservation: any) => reservation.reservation_date >= oneDayAgo
      );
      setAllReservations(filteredReservations);
    });
  }, []);

  // Function to determine if a date should be disabled
  const disableDates = ({ date }: { date: Date }) => {
    const luxonDate = DateTime.fromJSDate(date);
    return luxonDate < DateTime.now();
  };

  return (
    <div className="p-4 max-w-screen-sm mx-auto">
      {import.meta.env.MODE === "development" && (
        <div className="bg-yellow-300 text-yellow-800 p-4 rounded mb-4">
          Warning: You are connected to the development API!
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">Admin Page</h1>

      <h2 className="text-xl font-semibold mb-2">Reservations</h2>
      <div className="reservations-container flex flex-wrap gap-4">
        {allReservations.map((reservation) => (
          <div
            key={reservation.id}
            className="reservation-box border border-gray-300 rounded-lg p-4 bg-white shadow-md w-full md:w-1/3"
          >
            <p>
              <strong>Name:</strong> {reservation.customer_name}
            </p>
            <p>
              <strong>Email:</strong> {reservation.customer_email}
            </p>
            <p>
              <strong>Phone:</strong> {reservation.customer_phone}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {reservation.reservation_date.toFormat("yyyy-MM-dd")}
            </p>
            <p>
              <strong>Time:</strong>{" "}
              {reservation.reservation_time.toFormat("HH:mm")}
            </p>
            <p>
              <strong>Guests:</strong> {reservation.number_of_guests}
            </p>
            <p>
              <strong>Special Requests:</strong> {reservation.special_requests}
            </p>
            <p>
              <strong>Allergy:</strong> {reservation.allergy}
            </p>
            <p>
              <strong>Communication Consent:</strong>{" "}
              {reservation.communication_consent ? "Yes" : "No"}
            </p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">Schedule Exceptions</h2>
      <p className="mt-4">
        You can use these to manually add or remove days from the schedule.
      </p>

      <Calendar
        onChange={(value) =>
          setSelectedBlockedDate(DateTime.fromJSDate(value as Date))
        }
        tileDisabled={disableDates}
        locale={"en"}
      />

      <div className="flex justify-between mt-4">
        <button
          onClick={async () => {
            if (selectedBlockedDate) {
              await createBlockedDay(selectedBlockedDate);

              await fetchReservationsAndBlockedDates().then((data) => {
                setAllBlockedDays(data.blockedDays);
              });
            }
          }}
          className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
        >
          Create Blocked Day
        </button>

        <button
          onClick={async () => {
            if (selectedBlockedDate) {
              await createAddedDay(selectedBlockedDate);

              await fetchReservationsAndBlockedDates().then((data) => {
                setAllAddedDays(data.addedDays);
              });
            }
          }}
          className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
        >
          Create Additional Day
        </button>
      </div>

      <ul className="list-disc pl-5 mt-4">
        {allBlockedDays.map((blockedDay) => (
          <li key={blockedDay.id}>
            No reservations on {blockedDay.block_date.toFormat("yyyy-MM-dd")}
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Additional Days</h2>
      <ul className="list-disc pl-5 mt-4">
        {allAddedDays.map((addedDay) => (
          <li key={addedDay.id}>
            Reservations allowed on {addedDay.added_date.toFormat("yyyy-MM-dd")}
          </li>
        ))}
      </ul>
    </div>
  );
}
