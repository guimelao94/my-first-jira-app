export const groupByDevs = (array, property) => {
    if (!array || array.length === 0 || !array.some(x => x[property] !== undefined)) {
        return [];
    }
    
    // Collect all developers from property
    let devs = new Set(array.map(obj => obj[property]).filter(Boolean));
    
    // Collect overflow developers
    const overflowDevsSet = new Set();
    for (const issue of array) {
        if (issue.overflowTime && Array.isArray(issue.overflowTime) && issue.overflowTime.length > 0) {
            issue.overflowTime.forEach(item => {
                if (item?.Developer) {
                    overflowDevsSet.add(item.Developer);
                }
            });
        }
    }
    
    // Merge both sets
    overflowDevsSet.forEach(dev => devs.add(dev));
    const uniqueDevs = removeDuplicates(Array.from(devs));
    
    // Optimize: pre-filter arrays for each dev to avoid repeated filtering
    return uniqueDevs.map(value => {
        const [firstName, lastName] = value.FullName.split(' ');
        const shortName = value === "" ? "" : `${firstName} ${lastName?.[0] || ''}.`;
        
        // Pre-filter issues for this dev to improve performance
        const devIssues = array.filter(x => x[property]?.FullName === value.FullName);
        const overflowIssues = array.filter(x => 
            x.overflowTime?.some(y => y.Developer?.FullName === value.FullName)
        );
        
        return { 
            FullName: value.FullName, 
            ShortName: shortName,
            AccountID: value.AccountID,
            RemainingWork: devIssues
                .filter(x => !x.isCompleted)
                .reduce((total, item) => total + (item['remainingTime'] || 0), 0),
            TimeSpent: devIssues.reduce((total, item) => total + (item['timespent'] || 0), 0),
            OriginalEstimate: devIssues.reduce((total, item) => total + (item['originalestimate'] || 0), 0),
            OverflowTime: overflowIssues.reduce((total, item) => total + SumOverflow(item, value.FullName), 0)
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

const SumOverflow = (item, value) => {
    if(!item?.overflowTime || !Array.isArray(item.overflowTime)) return 0;
    
    return item.overflowTime
        .filter(x => x.Developer?.FullName === value)
        .reduce((total, overflowItem) => total + (overflowItem.TimeSpent || 0), 0);
}