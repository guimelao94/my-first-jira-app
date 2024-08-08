export const groupByDevs = (array, property) => {
    console.log(array);
    if (array.length == 0 || !array.some(x=>x[property] != undefined)) return [];
    var devs = [...new Set(array.map(obj => obj[property]))];
    devs = devs.filter(dev=>dev != undefined);
    console.log(devs);
    console.log(array);
    return devs.map(value => {
        const [firstName, lastName] = value.split(' ');
        const shortName = `${firstName} ${lastName[0]}.`;
        return { 
            FullName: value, 
            ShortName: shortName,
            RemainingWork:array.filter(x=>x[property] == value).reduce((total, item) => total + (item['remainingTime'] || 0), 0),
            TimeSpent:array.filter(x=>x[property] == value).reduce((total, item) => total + (item['timespent'] || 0), 0),
            OriginalEstimate:array.filter(x=>x[property] == value).reduce((total, item) => total + (item['originalestimate'] || 0), 0),
            OverflowTime:array.filter(x=>x[property] == value).reduce((total, item) => total + (item['overflowTime'] || 0), 0)
        };
    });
}