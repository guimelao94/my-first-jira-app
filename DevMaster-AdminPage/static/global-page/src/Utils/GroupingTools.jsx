export const groupByDevs = (array, property) => {
    console.log(array);
    if (array.length == 0 || !array.some(x=>x[property] != undefined)) return [];
    var devs = [...new Set(array.map(obj => obj[property]))];
    var overflowDevs = [];
    devs = devs.filter(dev=>dev != undefined && dev != '');
    for (var issue of array) {
        if(issue.overflowTime && issue.overflowTime.length > 0){
            overflowDevs = [...new Set(issue.overflowTime.map(obj => obj['Developer']))];
            devs = [...new Set([...devs, ...overflowDevs])];
            console.log(overflowDevs);
        }
    }
    console.log(devs);
    console.log(array);
    return devs.map(value => {
        const [firstName, lastName] = value.split(' ');
        const shortName = value == "" ? "" :`${firstName} ${lastName[0]}.`;
        return { 
            FullName: value, 
            ShortName: shortName,
            RemainingWork:array.filter(x=>x[property] == value).reduce((total, item) => total + (item['remainingTime'] || 0), 0),
            TimeSpent:array.filter(x=>x[property] == value).reduce((total, item) => total + (item['timespent'] || 0), 0),
            OriginalEstimate:array.filter(x=>x[property] == value).reduce((total, item) => total + (item['originalestimate'] || 0), 0),
            OverflowTime:array.filter(x=>x[property] == value).reduce((total, item) => total + (item['overflowTime'].some(x=>x.Developer == value) ? item['overflowTime'].filter(x=>x.Developer == value).reduce((total, item) => total + (item['TimeSpent'] || 0), 0) : 0 || 0), 0)
        };
    });
}