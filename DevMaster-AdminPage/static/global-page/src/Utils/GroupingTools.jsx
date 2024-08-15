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
            OverflowTime:array.filter(x=>x.overflowTime && x.overflowTime.some(y=> y.Developer == value)).reduce((total, item) => total + SumOverflow(item,value), 0)
        };
    });
}

const SumOverflow =(item,value)=>{
    console.log(item);
    console.log(value);
    if(!item['overflowTime']) return 0;
    const isDevTime = item['overflowTime'].some(x=>x.Developer == value);
    var devTimePerDev = null;
    if(isDevTime){
        devTimePerDev = item['overflowTime'].filter(x=>x.Developer == value);
    }
    console.log(isDevTime);
    console.log(devTimePerDev);
    if(!isDevTime) return 0;
    return ( isDevTime ? devTimePerDev.reduce((total, item) => total + (item['TimeSpent'] || 0), 0) : 0 || 0);
}