import React from "react";
import { startOfMonth, endOfMonth, addMonths, isSameMonth, format, eachDayOfInterval } from "date-fns";
import { vi } from "date-fns/locale";
import type { SchoolYear, SchoolYearEvent } from "../../types/school-year.types";
import { EVENT_TYPE_COLORS } from "../../types/school-year.types";

interface CalendarYearViewProps {
  events: SchoolYearEvent[];
  schoolYear: SchoolYear;
}

export const CalendarYearView: React.FC<CalendarYearViewProps> = ({ events, schoolYear }) => {
  const getEventsForMonth = (month: Date) => {
    const monthEvents = events.filter(ev =>
      isSameMonth(new Date(ev.startDate), month) ||
      isSameMonth(new Date(ev.endDate), month) ||
      (new Date(ev.startDate) < month && new Date(ev.endDate) > month)
    );
    return monthEvents;
  };

  // Tính mảng 12 tháng từ start đến end
  const start = startOfMonth(new Date(schoolYear.startDate));
  const end = endOfMonth(new Date(schoolYear.endDate));
  const months: Date[] = [];
  let current = start;
  while (current <= end) {
    months.push(current);
    current = addMonths(current, 1);
  }

  return (
    <div className="grid grid-cols-4 gap-8">
      {months.map((month) => (
        <div key={month.toISOString()} className="border rounded-2xl p-4 bg-white shadow">
          <div className="text-center font-semibold mb-4 text-lg">
            {`Tháng ${format(month, "M yyyy", { locale: vi })}`}
          </div>
          <div className="mb-4">
            <MiniMonthCalendar
              month={month}
              events={events}
            />
          </div>
          {/* Chú thích sự kiện dưới mỗi tháng */}
          <div className="mt-4 text-xs">
            {getEventsForMonth(month).length > 0 ? (
              getEventsForMonth(month).map(ev => (
                <div key={ev._id} className="flex items-center gap-2 mb-1">
                  <span className={`inline-block w-3 h-3 rounded ${EVENT_TYPE_COLORS[ev.type]}`}></span>
                  <span className="font-medium">{format(new Date(ev.startDate), "dd/MM")} - {format(new Date(ev.endDate), "dd/MM")}</span>
                  <span className="italic">{ev.name}</span>
                </div>
              ))
            ) : (
              <div className="text-gray-400 italic">Không có sự kiện</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Component hiển thị 1 tháng nhỏ
const MiniMonthCalendar: React.FC<{ month: Date; events: SchoolYearEvent[] }> = ({ month, events }) => {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const firstDay = start.getDay(); // 0: Chủ nhật, 1: Thứ 2, ...

  // Tạo mảng 7x6 cho lịch
  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
    calendarDays.push(null); // padding đầu tháng
  }
  days.forEach(d => calendarDays.push(d));
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null); // padding cuối tháng
  }

  // Hàm lấy class cho ngày
  const getDayClass = (date: Date) => {
    const ev = events.find(ev => {
      const startDate = new Date(ev.startDate);
      const endDate = new Date(ev.endDate);
      const currentDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      return currentDate >= startDate && currentDate <= endDate;
    });
    if (ev) {
      // Có sự kiện: lấy màu bg theo loại, text trắng
      return `${EVENT_TYPE_COLORS[ev.type]} text-white`;
    }
    // Không có sự kiện: nếu là T7 hoặc CN thì text da cam, còn lại text #002855
    const day = date.getDay(); // 0: CN, 6: T7
    if (day === 0 || day === 6) {
      return 'text-[#F05023]';
    }
    return 'text-[#002855]';
  };

  return (
    <table className="w-full text-xs mb-1">
      <thead>
        <tr>
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
            <th
              key={d}
              className={`font-normal ${d === 'T7' || d === 'CN' ? 'text-[#F05023]' : 'text-gray-500'}`}
            >
              {d}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: calendarDays.length / 7 }).map((_, weekIdx) => (
          <tr key={weekIdx}>
            {calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((date, idx) => (
              <td key={idx} className="text-center p-1">
                {date ? (
                  <span 
                    className={`inline-block w-6 h-6 leading-6 rounded ${getDayClass(date)} text-xs`}
                    title={date ? format(date, 'dd/MM/yyyy') : ''}
                  >
                    {date.getDate()}
                  </span>
                ) : ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
