import { Match } from "../types";
import { Calendar } from "lucide-react";

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  matches: Match[];
}

const DatePicker = ({ selectedDate, onDateChange, matches }: DatePickerProps) => {
  // Get unique dates from matches
  const uniqueDates = Array.from(new Set(matches.map(match => match.date))).sort();

  return (
    <div className="flex items-center space-x-2">
      <Calendar className="h-4 w-4 text-primary" />
      <select
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        className="p-2 border rounded-md"
      >
        <option value="all">Semua Tanggal</option>
        {uniqueDates.map((date) => (
          <option key={date} value={date}>
            {new Date(date).toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DatePicker; 