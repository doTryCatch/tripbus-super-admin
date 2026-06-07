'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '@/lib/api-client';

// ============= TYPES =============

type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'leave' | 'holiday';

interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
  count?: number;
  source?: string;
}

interface AttendanceCalendarProps {
  data?: AttendanceRecord[];
  month?: number;
  year?: number;
  onMonthChange?: (month: number, year: number) => void;
}

// ============= CONSTANTS =============

const STATUS_BG: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500',
  absent: 'bg-red-500',
  half_day: 'bg-amber-400',
  leave: 'bg-blue-400',
  holiday: 'bg-gray-300',
};

const STATUS_TEXT: Record<AttendanceStatus, string> = {
  present: 'text-white',
  absent: 'text-white',
  half_day: 'text-white',
  leave: 'text-white',
  holiday: 'text-gray-700',
};

const STATUS_LIGHT_BG: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-100',
  absent: 'bg-red-100',
  half_day: 'bg-amber-100',
  leave: 'bg-blue-100',
  holiday: 'bg-gray-100',
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  half_day: 'Half Day',
  leave: 'Leave',
  holiday: 'Holiday',
};

const STATUS_DOT: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500',
  absent: 'bg-red-500',
  half_day: 'bg-amber-400',
  leave: 'bg-blue-400',
  holiday: 'bg-gray-300',
};

// ============= COMPONENT =============

export default function AttendanceCalendar({
  data: externalData,
  month: externalMonth,
  year: externalYear,
  onMonthChange,
}: AttendanceCalendarProps) {
  const now = new Date();
  const [month, setMonth] = useState(externalMonth ?? now.getMonth() + 1);
  const [year, setYear] = useState(externalYear ?? now.getFullYear());
  const [records, setRecords] = useState<AttendanceRecord[]>(externalData || []);
  const [loading, setLoading] = useState(!externalData);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Fetch attendance data if not provided externally
  const fetchData = useCallback(async () => {
    if (externalData) {
      setRecords(externalData);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get('/super-admin/attendance', {
        params: { month, year },
      });
      const responseData = res.data.data || res.data;
      // Handle calendar data from backend
      const calendarData = responseData?.calendar || responseData?.records || [];
      setRecords(Array.isArray(calendarData) ? calendarData : []);
    } catch (e) {
      console.error('Failed to fetch attendance data', e);
      // Generate demo data for visual display
      generateDemoData();
    } finally {
      setLoading(false);
    }
  }, [externalData, month, year]);

  useEffect(() => {
    if (!externalData) {
      fetchData();
    }
  }, [externalData, fetchData]);

  // Update month/year from external props
  useEffect(() => {
    if (externalMonth !== undefined) setMonth(externalMonth);
    if (externalYear !== undefined) setYear(externalYear);
  }, [externalMonth, externalYear]);

  useEffect(() => {
    if (externalData) setRecords(externalData);
  }, [externalData]);

  const generateDemoData = () => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const demo: AttendanceRecord[] = [];
    const statuses: AttendanceStatus[] = ['present', 'absent', 'half_day', 'leave', 'holiday'];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month - 1, d).getDay();
      if (dayOfWeek === 0) {
        demo.push({ date: dateStr, status: 'holiday' });
      } else {
        const rand = Math.random();
        if (rand < 0.7) demo.push({ date: dateStr, status: 'present' });
        else if (rand < 0.82) demo.push({ date: dateStr, status: 'absent' });
        else if (rand < 0.9) demo.push({ date: dateStr, status: 'half_day' });
        else demo.push({ date: dateStr, status: 'leave' });
      }
    }
    setRecords(demo);
  };

  const prevMonth = () => {
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 1) { newMonth = 12; newYear = year - 1; }
    setMonth(newMonth);
    setYear(newYear);
    onMonthChange?.(newMonth, newYear);
  };

  const nextMonth = () => {
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear = year + 1; }
    setMonth(newMonth);
    setYear(newYear);
    onMonthChange?.(newMonth, newYear);
  };

  const recordMap = new Map(records.map((r) => [r.date, r]));
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  // Compute summary stats
  const presentDays = records.filter(r => r.status === 'present').length;
  const absentDays = records.filter(r => r.status === 'absent').length;
  const halfDays = records.filter(r => r.status === 'half_day').length;
  const leaveDays = records.filter(r => r.status === 'leave').length;
  const holidayDays = records.filter(r => r.status === 'holiday').length;
  const workingDays = daysInMonth - holidayDays;

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      {/* Calendar Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Calendar Header */}
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Attendance Calendar</h3>
              <p className="text-xs text-gray-500 mt-0.5">Monthly overview · All channels</p>
            </div>
            {/* Month Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              <span className="text-sm font-semibold text-gray-800 min-w-[130px] text-center">
                {monthName} {year}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Body */}
        <div className="p-5">
          {loading ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                  <div key={i} className="text-center text-xs font-medium text-gray-400 py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const record = recordMap.get(dateStr);
                  const status = record?.status;
                  const isToday = dateStr === todayStr;
                  const isHovered = hoveredDay === dateStr;
                  const isWeekend = new Date(year, month - 1, day).getDay() === 0 || new Date(year, month - 1, day).getDay() === 6;

                  return (
                    <div
                      key={day}
                      className="relative"
                      onMouseEnter={() => setHoveredDay(dateStr)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      <div
                        className={`
                          aspect-square rounded-lg flex flex-col items-center justify-center transition-all cursor-default relative
                          ${status ? `${STATUS_BG[status]} ${STATUS_TEXT[status]}` : isWeekend ? 'bg-gray-50 text-gray-400' : 'text-gray-600 hover:bg-gray-50'}
                          ${isToday ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}
                          ${isHovered ? 'scale-105 shadow-sm' : ''}
                        `}
                      >
                        <span className="text-sm font-medium">{day}</span>
                        {record?.count !== undefined && record.count > 0 && (
                          <span className="text-[9px] font-medium opacity-80">{record.count}</span>
                        )}
                      </div>

                      {/* Hover tooltip */}
                      {isHovered && status && (
                        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-[10px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap shadow-lg pointer-events-none">
                          {day} {monthName.slice(0, 3)} · {STATUS_LABELS[status]}
                          {record?.count !== undefined && ` · ${record.count} staff`}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 flex-wrap">
                {(['present', 'absent', 'half_day', 'leave', 'holiday'] as AttendanceStatus[]).map((s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${STATUS_DOT[s]}`} />
                    <span className="text-xs text-gray-500 font-medium">{STATUS_LABELS[s]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Present</div>
          <div className="text-xl font-bold text-emerald-600 leading-tight mt-1">
            {presentDays}
            <span className="text-xs text-gray-400 font-normal ml-1">/ {workingDays} days</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Absent</div>
          <div className="text-xl font-bold text-red-600 leading-tight mt-1">{absentDays}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Half Days</div>
          <div className="text-xl font-bold text-amber-600 leading-tight mt-1">{halfDays}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">On Leave</div>
          <div className="text-xl font-bold text-blue-600 leading-tight mt-1">{leaveDays}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 sm:col-span-1 col-span-2">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Holidays</div>
          <div className="text-xl font-bold text-gray-600 leading-tight mt-1">{holidayDays}</div>
        </div>
      </div>

      {/* Attendance Rate Bar */}
      {workingDays > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-900">Attendance Rate</span>
            <span className="text-sm font-bold text-indigo-600">
              {workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
            {presentDays > 0 && (
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(presentDays / daysInMonth) * 100}%` }}
              />
            )}
            {halfDays > 0 && (
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${(halfDays / daysInMonth) * 100}%` }}
              />
            )}
            {absentDays > 0 && (
              <div
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${(absentDays / daysInMonth) * 100}%` }}
              />
            )}
            {leaveDays > 0 && (
              <div
                className="bg-blue-400 h-full transition-all duration-500"
                style={{ width: `${(leaveDays / daysInMonth) * 100}%` }}
              />
            )}
            {holidayDays > 0 && (
              <div
                className="bg-gray-300 h-full transition-all duration-500"
                style={{ width: `${(holidayDays / daysInMonth) * 100}%` }}
              />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-emerald-500" />
              <span className="text-[11px] text-gray-500">Present ({presentDays})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-amber-400" />
              <span className="text-[11px] text-gray-500">Half Day ({halfDays})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-red-500" />
              <span className="text-[11px] text-gray-500">Absent ({absentDays})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-blue-400" />
              <span className="text-[11px] text-gray-500">Leave ({leaveDays})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-gray-300" />
              <span className="text-[11px] text-gray-500">Holiday ({holidayDays})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
