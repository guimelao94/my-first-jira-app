export const isWeekend = (date) => {
  console.log(date);
  var result = false;
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) { // 0 is Sunday, 6 is Saturday
    result = true;
  }
  console.log(result);
  return result;
}

export const addWeekdays = (startDate, daysToAdd, Holidays,d,state) => {
  let date = new Date(startDate);
  let addedDays = 0;
  var fullDev = state.Developers.find(z => z.FullName === d.FullName);

  while (addedDays < daysToAdd) {
    console.log(daysToAdd);
    date.setDate(date.getDate() + 1);

    if (!isWeekend(date) && (Object.keys(Holidays).length === 0 || !Holidays.includes(date.toISOString().substring(0, 10))) && !(fullDev && fullDev.TimeOff && Object.keys(fullDev.TimeOff).length > 0 && fullDev.TimeOff.includes(date.toISOString().substring(0, 10)))) {
      addedDays++;
    }
  }

  return date.toLocaleDateString();
};

export const nextWeekday = (date,Holidays,d,state) => {
  const nextDate = new Date(date); // Create a new Date object to avoid mutating the original date
  var fullDev = state.Developers.find(z => z.FullName === d.FullName);

  while ((Holidays && Object.keys(Holidays).length > 0 && Holidays.includes(nextDate.toISOString().substring(0, 10))) || (fullDev && fullDev.TimeOff && Object.keys(fullDev.TimeOff).length > 0 && fullDev.TimeOff.includes(nextDate.toISOString().substring(0, 10)))) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  const dayOfWeek = nextDate.getDay(); // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)

  // If the day is Saturday (6), move to Monday (2 days ahead)
  if (dayOfWeek === 6) {
    nextDate.setDate(nextDate.getDate() + 2);
  }
  // If the day is Sunday (0), move to Monday (1 day ahead)
  else if (dayOfWeek === 0) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  return nextDate;
}

export const getDifferenceInDays = (date1Str, date2Str) => {
  const date1 = new Date(date1Str);
  const date2 = new Date(date2Str);

  // Ensure date2 is later than date1
  if (date2 < date1) {
    return 0; // Or handle this case as needed
  }

  let diffInTime = date2.getTime() - date1.getTime();
  const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));

  // Count the number of weekends between the dates
  let weekends = 0;
  for (let i = 0; i < diffInDays; i++) {
    const day = new Date(date1.getTime() + i * (1000 * 3600 * 24)).getDay();
    if (day === 0 || day === 6) {
      weekends++;
    }
  }

  return diffInDays - weekends;
}