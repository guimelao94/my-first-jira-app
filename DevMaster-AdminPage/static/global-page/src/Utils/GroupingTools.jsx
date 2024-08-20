export const groupByDevs = (array, property) => {
    console.log(array);
    if (array.length == 0 || !array.some(x=>x[property] != undefined)) return [];
    var devs = [...new Set(array.map(obj => obj[property]))];
    console.log(devs);
    var overflowDevs = [];
    devs = devs.filter(dev=>dev != undefined && dev != '');
    for (var issue of array) {
        if(issue.overflowTime && issue.overflowTime.length > 0){
            overflowDevs = [...new Set(issue.overflowTime.map(obj => obj['Developer']))];
            devs = [...new Set([...devs, ...overflowDevs])];
            console.log(overflowDevs);
        }
    }
    var uniqueDevs = removeDuplicates(devs);
    console.log(devs);
    console.log(uniqueDevs);
    console.log(array);
    return uniqueDevs.map(value => {
        const [firstName, lastName] = value.FullName.split(' ');
        const shortName = value == "" ? "" :`${firstName} ${lastName[0]}.`;
        return { 
            FullName: value.FullName, 
            ShortName: shortName,
            AccountID:value.AccountID,
            RemainingWork:array.filter(x=>x[property].FullName == value.FullName).reduce((total, item) => total + (item['remainingTime'] || 0), 0),
            TimeSpent:array.filter(x=>x[property].FullName == value.FullName).reduce((total, item) => total + (item['timespent'] || 0), 0),
            OriginalEstimate:array.filter(x=>x[property].FullName == value.FullName).reduce((total, item) => total + (item['originalestimate'] || 0), 0),
            OverflowTime:array.filter(x=>x.overflowTime && x.overflowTime.some(y=> y.Developer.FullName == value.FullName)).reduce((total, item) => total + SumOverflow(item,value.FullName), 0)
        };
    });
}

const removeDuplicates = (arr) => {
    const uniqueItems = new Set();
    return arr.filter(item => {
        const key = `${item.FullName}:${item.AccountID}`;
        if (uniqueItems.has(key)) {
            return false;
        } else {
            uniqueItems.add(key);
            return true;
        }
    });
}

const SumOverflow =(item,value)=>{
    console.log(item);
    console.log(value);
    if(!item['overflowTime']) return 0;
    const isDevTime = item['overflowTime'].some(x=>x.Developer.FullName == value);
    var devTimePerDev = null;
    if(isDevTime){
        devTimePerDev = item['overflowTime'].filter(x=>x.Developer.FullName == value);
    }
    console.log(isDevTime);
    console.log(devTimePerDev);
    if(!isDevTime) return 0;
    return ( isDevTime ? devTimePerDev.reduce((total, item) => total + (item['TimeSpent'] || 0), 0) : 0 || 0);
}