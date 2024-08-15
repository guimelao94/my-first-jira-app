
export const convertToHours = (seconds) =>{
    console.log(seconds);
    if(seconds == undefined || seconds == null){
        return "0h";
    }
    var hours = seconds/3600
    return `${hours}h`;
}
export const convertToCustom = (seconds) =>{
    console.log(seconds);
    if(seconds == undefined || seconds == null){
        return "";
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h${minutes}m`;
}

