export const addWeekdays = (startDate, daysToAdd) => {
    let date = new Date(startDate);
    let addedDays = 0;

    while (addedDays < daysToAdd) {
        date.setDate(date.getDate() + 1);

        // Check if the new date is a weekday (Monday to Friday)
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 is Sunday, 6 is Saturday
            addedDays++;
        }
    }

    return date.toLocaleDateString();
};

export const getDifferenceInDays = (date1Str, date2Str) => {
    const date1 = new Date(date1Str);
    const date2 = new Date(date2Str);

    const diffInTime = date2.getTime() - date1.getTime();
    const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));

    return diffInDays;
}