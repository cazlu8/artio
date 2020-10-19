export const getFormattedDateQuery =
  "concat(RTRIM(to_char(start_date, 'Month')), ' ', to_char(start_date, 'DD'), ',', to_char(start_date, 'YYYY'), ' / ', to_char(start_date, 'HH12'), ':', to_char(start_date, 'MI'), to_char(start_date, 'AM'), ' - ', to_char(end_date, 'HH12'), ':', to_char(start_date, 'MI'), to_char(end_date, 'AM'))";
