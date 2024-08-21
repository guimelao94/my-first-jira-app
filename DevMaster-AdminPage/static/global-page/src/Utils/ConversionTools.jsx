
export const convertToHours = (seconds) => {
    //console.log(seconds);
    if (seconds == undefined || seconds == null) {
        return "0h";
    }
    var hours = seconds / 3600
    return `${hours.toFixed(2)}h`;
}
export const convertToCustom = (seconds) => {
    //console.log(seconds);
    if (seconds == undefined || seconds == null) {
        return "";
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h${minutes}m`;
}

export const StringToDate = (str) => {
    if (str.indexOf("/") >= 0) {
        const [month, day, year] = str.split(/[\/\-]/).map(Number);
        return new Date(year, month - 1, day);
    } else {
        const [year, month, day] = str.split(/[\/\-]/).map(Number);
        return new Date(year, month - 1, day);
    }

}
