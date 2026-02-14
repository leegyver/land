import React, { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface YearMonthDayPickerProps {
    value?: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
}

const YearMonthDayPicker = ({
    value,
    onChange,
    className,
    disabled,
}: YearMonthDayPickerProps) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const [selectedYear, setSelectedYear] = useState<string>("");
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [selectedDay, setSelectedDay] = useState<string>("");

    useEffect(() => {
        if (value && value.includes("-")) {
            const [y, m, d] = value.split("-");
            setSelectedYear(parseInt(y).toString());
            setSelectedMonth(parseInt(m).toString());
            setSelectedDay(parseInt(d).toString());
        }
    }, [value]);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month, 0).getDate();
    };

    const days =
        selectedYear && selectedMonth
            ? Array.from(
                { length: getDaysInMonth(parseInt(selectedYear), parseInt(selectedMonth)) },
                (_, i) => i + 1
            )
            : Array.from({ length: 31 }, (_, i) => i + 1);

    const handleYearChange = (year: string) => {
        setSelectedYear(year);
        updateValue(year, selectedMonth, selectedDay);
    };

    const handleMonthChange = (month: string) => {
        setSelectedMonth(month);
        // If current selected day is more than the new month's last day, adjust it
        if (selectedYear && selectedDay) {
            const lastDay = getDaysInMonth(parseInt(selectedYear), parseInt(month));
            if (parseInt(selectedDay) > lastDay) {
                setSelectedDay(lastDay.toString());
                updateValue(selectedYear, month, lastDay.toString());
                return;
            }
        }
        updateValue(selectedYear, month, selectedDay);
    };

    const handleDayChange = (day: string) => {
        setSelectedDay(day);
        updateValue(selectedYear, selectedMonth, day);
    };

    const updateValue = (y: string, m: string, d: string) => {
        if (y && m && d) {
            const formattedValue = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
            onChange(formattedValue);
        }
    };

    return (
        <div className={cn("grid grid-cols-3 gap-2", className)}>
            <Select
                value={selectedYear}
                onValueChange={handleYearChange}
                disabled={disabled}
            >
                <SelectTrigger className="h-11">
                    <SelectValue placeholder="년" />
                </SelectTrigger>
                <SelectContent>
                    {years.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                            {y}년
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={selectedMonth}
                onValueChange={handleMonthChange}
                disabled={disabled}
            >
                <SelectTrigger className="h-11">
                    <SelectValue placeholder="월" />
                </SelectTrigger>
                <SelectContent>
                    {months.map((m) => (
                        <SelectItem key={m} value={m.toString()}>
                            {m}월
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={selectedDay}
                onValueChange={handleDayChange}
                disabled={disabled}
            >
                <SelectTrigger className="h-11">
                    <SelectValue placeholder="일" />
                </SelectTrigger>
                <SelectContent>
                    {days.map((d) => (
                        <SelectItem key={d} value={d.toString()}>
                            {d}일
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default YearMonthDayPicker;
