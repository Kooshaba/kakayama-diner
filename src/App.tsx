import { useState, useRef, useEffect, useMemo } from "react";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { DateTime } from "luxon";
import { createReservation, fetchReservationsAndBlockedDates } from "./api";

const timeSlots = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
];

function App() {
  const [date, setDate] = useState<DateTime | null>(null);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<
    Record<string, string[]>
  >({});
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [communicationConsent, setCommunicationConsent] = useState(false);
  const [name, setName] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [allergy, setAllergy] = useState("");
  const [other, setOther] = useState("");
  const timesPerPage = 6;
  const formRef = useRef<HTMLFormElement | null>(null);
  const timesRef = useRef<HTMLDivElement | null>(null);
  const [blockedDays, setBlockedDays] = useState<DateTime[]>([]);
  const [addedDays, setAddedDays] = useState<DateTime[]>([]);

  const [numGuestWarning, setNumGuestWarning] = useState<string | null>(null);
  useEffect(() => {
    if (parseInt(numberOfGuests) > 4) {
      setNumGuestWarning(
        "If you have more than 4 guests, please contact us directly on Instagram. / 4人以上のご予約はお断りさせていただいております。"
      );
    } else {
      setNumGuestWarning(null);
    }
  }, [numberOfGuests]);

  useEffect(() => {
    const newBookedTimeSlots: Record<string, string[]> = {};

    fetchReservationsAndBlockedDates().then((data) => {
      data.reservations.forEach((reservation) => {
        if (
          !newBookedTimeSlots[
            reservation.reservation_date.toFormat("yyyy-MM-dd")
          ]
        ) {
          newBookedTimeSlots[
            reservation.reservation_date.toFormat("yyyy-MM-dd")
          ] = [];
        }

        newBookedTimeSlots[
          reservation.reservation_date.toFormat("yyyy-MM-dd")
        ].push(reservation.reservation_time.toFormat("HH:mm"));
      });

      setBookedTimeSlots((existing) => ({
        ...existing,
        ...newBookedTimeSlots,
      }));

      setBlockedDays(
        data.blockedDays.map((blockedDay) => blockedDay.block_date)
      );

      setAddedDays(data.addedDays.map((addedDay) => addedDay.added_date));
    });
  }, []);

  const submitDisabled = useMemo(
    () => !communicationConsent || !name || !email || !tel,
    [communicationConsent, name, email, tel]
  );

  const paginatedTimeSlots = timeSlots.slice(
    currentPage * timesPerPage,
    (currentPage + 1) * timesPerPage
  );

  const totalPages = Math.ceil(timeSlots.length / timesPerPage);

  // Function to determine if a date should be disabled
  const disableDates = ({ date }: { date: Date }): boolean => {
    const luxonDate = DateTime.fromJSDate(date);

    if (addedDays.find((addedDay) => addedDay.hasSame(luxonDate, "day"))) {
      return false;
    }

    return Boolean(
      luxonDate.weekday === 7 ||
        luxonDate.weekday === 1 ||
        luxonDate.weekday === 2 ||
        luxonDate < DateTime.now() ||
        blockedDays.find((blockedDay) => blockedDay.hasSame(luxonDate, "day"))
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedTime && date) {
      setBookedTimeSlots({
        ...bookedTimeSlots,
        [date.toFormat("yyyy-MM-dd")]: [
          ...(bookedTimeSlots[date.toFormat("yyyy-MM-dd")] || []),
          selectedTime,
        ],
      });

      await createReservation({
        customer_name: name,
        customer_email: email,
        customer_phone: tel,
        reservation_date: date.toFormat("yyyy-MM-dd"),
        reservation_time: selectedTime,
        number_of_guests: parseInt(numberOfGuests),
        communication_consent: communicationConsent,
        special_requests: other,
        allergy: allergy,
      });

      // Create a toast notification
      const toast = document.createElement("div");
      toast.textContent = `Reservation confirmed for ${date.toFormat(
        "MMM dd"
      )} @ ${selectedTime} / 予約が確定しました ${date.toFormat(
        "yyyy年MM月dd日"
      )} @ ${selectedTime}`;
      toast.style.position = "fixed";
      toast.style.top = "10px";
      toast.style.left = "50%";
      toast.style.transform = "translateX(-50%)";
      toast.style.backgroundColor = "green";
      toast.style.color = "white";
      toast.style.padding = "10px 20px";
      toast.style.borderRadius = "5px";
      toast.style.zIndex = "1000";
      toast.style.fontSize = "1.2rem";
      toast.style.textAlign = "center";
      document.body.appendChild(toast);

      // Remove the toast after 15 seconds
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 15000);

      // Reset form fields
      setDate(null);
      setCurrentPage(0);
      setSelectedTime(null);
      setCommunicationConsent(false);
      setName("");
      setEmail("");
      setTel("");
      setAllergy("");
      setOther("");
      setNumberOfGuests("");
    }
  };

  useEffect(() => {
    if (selectedTime && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTime]);

  useEffect(() => {
    if (date && timesRef.current) {
      timesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [date]);

  return (
    <div className="p-4 max-w-screen-sm mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        カカヤマダイナー予約 / Kakayama Diner Reservations
      </h1>

      <div className="w-full">
        <Calendar
          className="mx-auto"
          onChange={(value) => {
            setDate(DateTime.fromJSDate(value as Date));
            setCurrentPage(0);
            setSelectedTime(null);
            setCommunicationConsent(false);
          }}
          value={date?.toJSDate()}
          formatDay={(_locale, date) =>
            DateTime.fromJSDate(date).toFormat("dd")
          }
          tileDisabled={disableDates}
          locale={"ja"}
        />
      </div>

      <div className="h-4" />

      {date && (
        <>
          <h3>
            {" "}
            Viewing {date.toFormat("MMM dd")} / {date.toFormat("MM月dd日")}
          </h3>
          <div ref={timesRef}>
            {paginatedTimeSlots.map((time) => (
              <div
                key={time}
                onClick={() => {
                  if (
                    !bookedTimeSlots[date.toFormat("yyyy-MM-dd")]?.includes(
                      time
                    )
                  ) {
                    setSelectedTime(time);
                  }
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f0f0f0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    selectedTime === time ? "#d0d0d0" : "transparent")
                }
                style={{
                  padding: "10px",
                  cursor: bookedTimeSlots[
                    date.toFormat("yyyy-MM-dd")
                  ]?.includes(time)
                    ? "not-allowed"
                    : "pointer",
                  backgroundColor:
                    selectedTime === time
                      ? "#a0a0a0"
                      : bookedTimeSlots[date.toFormat("yyyy-MM-dd")]?.includes(
                          time
                        )
                      ? "#c0c0c0" // Background color for disabled slot
                      : "transparent",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  margin: "5px 0",
                  opacity: bookedTimeSlots[
                    date.toFormat("yyyy-MM-dd")
                  ]?.includes(time)
                    ? 0.5
                    : 1,
                }}
                aria-disabled={bookedTimeSlots[
                  date.toFormat("yyyy-MM-dd")
                ]?.includes(time)}
              >
                {time}
              </div>
            ))}
            <div className="w-full flex justify-around">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                disabled={currentPage === 0}
                className={`px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400`}
              >
                前へ
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
                }
                disabled={currentPage === totalPages - 1}
                className={`px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400`}
              >
                次へ
              </button>
            </div>

            <div className="h-4" />

            {selectedTime && (
              <form
                onSubmit={handleSubmit}
                ref={formRef}
                className="flex flex-col gap-4"
              >
                <h4>ご希望の時間 / Booking Time: {selectedTime}</h4>
                <div className="flex">
                  <span className="text-red-500 mr-2">*</span>
                  <input
                    type="text"
                    placeholder="お名前 / Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  />
                </div>
                <div className="flex">
                  <span className="text-red-500 mr-2">*</span>
                  <input
                    type="number"
                    placeholder="ご予約人数 / Number of Guests"
                    required
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  />
                </div>
                {numGuestWarning && (
                  <div className="text-red-500">{numGuestWarning}</div>
                )}
                <div className="flex">
                  <span className="text-red-500 mr-2">*</span>
                  <input
                    type="email"
                    placeholder="メールアドレス / Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  />
                </div>
                <div className="flex">
                  <span className="text-red-500 mr-2">*</span>
                  <input
                    type="tel"
                    placeholder="電話番号 / Phone Number"
                    required
                    value={tel}
                    onChange={(e) => setTel(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  />
                </div>
                <textarea
                  placeholder="アレルギーをお持ちの方はご記入ください / Allergy (if any)"
                  value={allergy}
                  onChange={(e) => setAllergy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="ほかにご要望があればご記入ください / Other Notes (if any)"
                  className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={other}
                  onChange={(e) => setOther(e.target.value)}
                ></textarea>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="communicationConsent"
                    required
                    className="mr-2"
                    checked={communicationConsent}
                    onChange={(e) => setCommunicationConsent(e.target.checked)}
                  />
                  <label
                    htmlFor="communicationConsent"
                    className="text-gray-700"
                  >
                    ご予約が完了した際にショートメッセージおよびメールでご連絡させていただきます。（ご予約を完了するにはこちらの項目へのチェックが必要です）
                  </label>
                </div>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400`}
                  disabled={submitDisabled}
                >
                  確認 / Confirm <br />
                  {date.toFormat("MMM dd")} @ {selectedTime}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
