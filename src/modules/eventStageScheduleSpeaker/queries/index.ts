export const getDay =
  "concat(to_char(schedule.start_date, 'DD'), ' ', RTRIM(to_char(schedule.start_date, 'Month')))";

export const getFormattedDate =
  "concat(to_char(schedule.start_date, 'HH12'), ':', to_char(schedule.start_date, 'MI'), to_char(schedule.start_date, 'AM'), ' to ', to_char(schedule.end_date, 'HH12'), ':', to_char(schedule.end_date, 'MI'), to_char(schedule.end_date, 'AM'))";
