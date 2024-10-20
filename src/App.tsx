import { useState, useRef, useEffect, useMemo } from "react";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { DateTime } from "luxon";

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
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [allergy, setAllergy] = useState("");
  const [other, setOther] = useState("");
  const timesPerPage = 6;
  const formRef = useRef<HTMLFormElement | null>(null);

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
  const disableDates = ({ date }: { date: Date }) => {
    const luxonDate = DateTime.fromJSDate(date);
    // Disable Sundays (7), Mondays (1), and Tuesdays (2)
    return (
      luxonDate.weekday === 7 ||
      luxonDate.weekday === 1 ||
      luxonDate.weekday === 2 ||
      luxonDate < DateTime.now()
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedTime && date) {
      setBookedTimeSlots({
        ...bookedTimeSlots,
        [date.toFormat("yyyy-MM-dd")]: [
          ...(bookedTimeSlots[date.toFormat("yyyy-MM-dd")] || []),
          selectedTime,
        ],
      });
    }
  };

  useEffect(() => {
    if (selectedTime && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTime]);

  return (
    <div className="p-4">
      <Calendar
        onChange={(value) => setDate(DateTime.fromJSDate(value as Date))}
        value={date?.toJSDate()}
        formatDay={(locale, date) => DateTime.fromJSDate(date).toFormat("dd")}
        tileDisabled={disableDates}
        locale={"ja"}
      />

      <div className="h-4" />

      {date && (
        <>
          <h3>
            {" "}
            Viewing {date.toFormat("MMM dd")} / {date.toFormat("MM月dd日")}
          </h3>
          <div>
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
                    selectedTime === time ? "#d0d0d0" : "transparent",
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
            <div>
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
                <h4>ご希望の時間 / Viewing Time: {selectedTime}</h4>
                <div className="flex">
                  <span className="text-red-500 mr-2">*</span>
                  <input
                    type="text"
                    placeholder="お名前 / Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex">
                  <span className="text-red-500 mr-2">*</span>
                  <input
                    type="email"
                    placeholder="メールアドレス / Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  required
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
