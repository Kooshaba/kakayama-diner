import { useState, useEffect } from "react";
import {
  createAddedDay,
  createBlockedDay,
  fetchReservationsAndBlockedDates,
  unblockDay,
  deleteAddedDay,
} from "./api";
import { DateTime } from "luxon";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Link } from "react-router-dom";

// Add this CSS at the top of the file or in your CSS file
const calendarStyles = `
  .blocked-day {
    background-color: rgba(255, 0, 0, 0.1) !important;
  }
  .added-day {
    background-color: rgba(0, 255, 0, 0.1) !important;
  }
`;

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
      special_requests?: string;
      allergy?: string;
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
        (reservation: { reservation_date: DateTime }) =>
          reservation.reservation_date >= oneDayAgo
      );
      setAllReservations(filteredReservations);
      setAllAddedDays(data.addedDays);
    });
  }, []);

  const refreshDates = () => {
    fetchReservationsAndBlockedDates().then((data) => {
      setAllBlockedDays(data.blockedDays);
      setAllAddedDays(data.addedDays);
    });
  };

  // Function to determine if a date should be disabled
  const disableDates = ({ date }: { date: Date }) => {
    const luxonDate = DateTime.fromJSDate(date);
    return luxonDate < DateTime.now();
  };

  const isDateBlocked = (date: DateTime) => {
    return allBlockedDays.some((blockedDay) =>
      blockedDay.block_date.hasSame(date, "day")
    );
  };

  const isDateAdded = (date: DateTime) => {
    return allAddedDays.some((addedDay) =>
      addedDay.added_date.hasSame(date, "day")
    );
  };

  const getTileClassName = ({ date }: { date: Date }) => {
    const luxonDate = DateTime.fromJSDate(date);

    if (
      allBlockedDays.some((blockedDay) =>
        blockedDay.block_date.hasSame(luxonDate, "day")
      )
    ) {
      return "blocked-day";
    }

    if (
      allAddedDays.some((addedDay) =>
        addedDay.added_date.hasSame(luxonDate, "day")
      )
    ) {
      return "added-day";
    }

    return "";
  };

  return (
    <div className="p-4 max-w-screen-sm mx-auto">
      {/* Add the styles */}
      <style>{calendarStyles}</style>

      {import.meta.env.MODE === "development" && (
        <div className="bg-yellow-300 text-yellow-800 p-4 rounded mb-4">
          Warning: You are connected to the development API!
        </div>
      )}

      <Link to="/" className="bg-blue-500 text-white py-2 px-4 rounded mb-4">
        Back to Main Page
      </Link>

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
              <strong>Special Requests:</strong>{" "}
              {reservation.special_requests || "-"}
            </p>
            <p>
              <strong>Allergy:</strong> {reservation.allergy || "-"}
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
        tileClassName={getTileClassName}
        locale={"en"}
      />

      <div className="flex justify-between mt-4">
        <button
          onClick={async () => {
            if (selectedBlockedDate) {
              if (isDateBlocked(selectedBlockedDate)) {
                // Unblock the date
                await unblockDay(selectedBlockedDate);
                refreshDates();
              } else {
                // Block the date
                await createBlockedDay(selectedBlockedDate);
                refreshDates();
              }

              await fetchReservationsAndBlockedDates().then((data) => {
                setAllBlockedDays(data.blockedDays);
              });
            }
          }}
          className={`px-4 py-2 text-white rounded hover:opacity-90 ${
            selectedBlockedDate && isDateBlocked(selectedBlockedDate)
              ? "bg-green-500" // Green for unblock
              : "bg-red-500" // Red for block
          }`}
        >
          {selectedBlockedDate && isDateBlocked(selectedBlockedDate)
            ? "Unblock Date"
            : "Create Blocked Day"}
        </button>

        <button
          onClick={async () => {
            if (selectedBlockedDate) {
              if (isDateAdded(selectedBlockedDate)) {
                // Delete the added day
                await deleteAddedDay(selectedBlockedDate);
              } else {
                // Create a new added day
                await createAddedDay(selectedBlockedDate);
              }
              refreshDates();
            }
          }}
          className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
        >
          {selectedBlockedDate && isDateAdded(selectedBlockedDate)
            ? "Delete Additional Day"
            : "Create Additional Day"}
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
