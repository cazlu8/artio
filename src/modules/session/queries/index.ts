// get the day uppercase of week (english)
export const getFormattedDayOfWeek = "trim(to_char(session_date, 'DAY'))";

// (HH24:MM60)
export const getFormattedTime = "to_char(session_date, 'HH24:MI')";

// formatting ("DAY " positionDay-DAYOFWEEK )
export const getSessionDayTitle = `concat('DAY ', DENSE_RANK () OVER (ORDER BY date_trunc('day', session_date) asc), '-', ${getFormattedDayOfWeek})`;

// formatting (1-7)
export const getDayNumberOfWeek = 'extract(isodow from session_date)';
