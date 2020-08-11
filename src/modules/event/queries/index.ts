// (street_number street_name, city, state_acronym, zip_code)
export const getFormattedAddressQuery =
  "concat(street_number, ' ', concat_ws(', ', street_name, city, state_acronym, zip_code))";
// Month startDay(0-31)-endDay(0-31), year (YYYY)
// get the day of week (english) if the event is of the type 'happening now'
export const getFormattedDayOfWeekFromHappeningNow =
  "(case when start_date <= now() and end_date > now() then trim(to_char(now(), 'day')) end)";
// get the day of week (english)
export const getFormattedDayOfWeek = "trim(to_char(start_date, 'day'))";
//  (location_name, city, state_acronym)
export const getFormattedLocationQuery =
  "concat_ws(', ', location_name, city, state_acronym)";

// month numberMonth, YYYY at hour (am/pm)
export const getFormattedDateQuery =
  "concat(to_char(start_date, 'month'), to_char(start_date, 'DD'), ', ', to_char(start_date, 'YYYY')," +
  "' at ', to_char(timezone(timezone, start_date), 'HH24'), ':', to_char(start_date, 'MI'), ' ', '(', timezone, ')')";
