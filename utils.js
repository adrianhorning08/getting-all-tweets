export function loopFromOneDateToAnother() {
  const dates = [];
  // give me a start date of Jan 1, 2010
  // const startDate = new Date(2010, 0, 1); // January 1, 2010
  // give me a start date of July 16 2014
  const startDate = new Date(2014, 6, 16);
  // give me todays date
  const endDate = new Date(); // Today

  const daysToAddToDate = 1;

  for (
    let date = startDate;
    date <= endDate;
    date.setDate(date.getDate() + daysToAddToDate)
  ) {
    // get the month of the year with a leading zero
    const month = String(date.getMonth() + 1).padStart(2, "0");
    // get the day of the month with a leading zero
    const day = String(date.getDate()).padStart(2, "0");
    // get the year
    const year = date.getFullYear();

    const from = `${year}-${month}-${day}`;

    const to = new Date(date);
    to.setDate(to.getDate() + daysToAddToDate);
    // get the month of the year with a leading zero
    const toMonth = String(to.getMonth() + 1).padStart(2, "0");
    // get the day of the month with a leading zero
    const toDay = String(to.getDate()).padStart(2, "0");
    const toYear = to.getFullYear();
    const toFormat = `${toYear}-${toMonth}-${toDay}`;

    dates.push({ from, to: toFormat });
  }
  return dates;
}
