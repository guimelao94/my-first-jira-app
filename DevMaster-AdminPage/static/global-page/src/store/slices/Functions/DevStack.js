import { StringToDate } from "../../../Utils/ConversionTools";
import { addWeekdays, getDifferenceInDays, isWeekend, nextWeekday } from "../../../Utils/DateTools";


export const HandleDevStacks = (state) => {
    var today = new Date();
    if(!state.data) return;
    for (let index = 0; index < state.data.length; index++) {
        var currentEpic = state.data[index];
        var prevEpic = index === 0 ? null : state.data[index - 1];

        var developers = currentEpic.Developers.map((d) => {

            return {
                FullName: d.FullName,
                ShortName:d.ShortName,
                TotalHours: d.RemainingWork ? (d.RemainingWork / 3600) + (d.OverflowHours ? d.OverflowHours : 0) : 0,
                OverflowHours: d.OverflowTime ? d.OverflowTime / 3600 : 0,
                EpicKey: currentEpic.EpicKey
            };
        });

        // Optimize: create a map for faster lookups
        const developersMap = new Map(state.Developers.map(dev => [dev.FullName, dev]));
        developers = developers.map((d) => {
            const devData = developersMap.get(d.FullName);
            const devHours = devData?.DevHours || 0;
            return {
                ...d,
                DaysWorth: (d.TotalHours && devHours > 0) ? Math.ceil(d.TotalHours / (devHours / 5)) : 0,
            };
        });

        developers = developers.map((d) => {
            var lastWorkedEpic = GetLastEpic(state, currentEpic, d);

            return {
                ...d,
                StartDate: CalculateStartDate(index, lastWorkedEpic, today, d, state),
            }
        });

        developers = developers.map((d) => {
            var lastWorkedEpic = GetLastEpic(state, currentEpic, d);
            return {
                ...d,
                DaysAvailable: getDifferenceInDays(d.StartDate, currentEpic.DueDate),
                DoneBy: addWeekdays(d.StartDate, d.DaysWorth,state.Holidays,d,state)
            };
        });

        developers = developers.map((d) => {
            return {
                ...d,
                OnTrack: StringToDate(d.DoneBy) <= StringToDate(currentEpic.DueDate) || d.DaysWorth === 0 ? 'On Track' : 'Off Track',
            };
        });

        currentEpic.DevStack = developers;
        state.AllDevStacksLoaded = true;
    }
}

const CalculateStartDate = (index, lastWorkedEpic, today, d, state) => {
    if (index === 0 || !lastWorkedEpic) {
        return nextWeekday(today,state.Holidays,d,state).toLocaleDateString();
    }
    else {
        return addWeekdays(lastWorkedEpic.DevStack.find(x => x.FullName === d.FullName).DoneBy, 1,state.Holidays,d,state);
    }
}

const GetLastEpic = (state, currentEpic, d) => {
    const currentDueDate = new Date(currentEpic.DueDate);
    const workedEpics = state.data.filter(e => 
        e.Developers && 
        e.Developers.some(x => x.FullName === d.FullName && x.RemainingWork > 0) && 
        e.EpicKey !== currentEpic.EpicKey && 
        new Date(e.DueDate) < currentDueDate
    );
    
    if (workedEpics.length === 0) {
        return null;
    }
    
    // Sort by due date descending and get the most recent one
    return workedEpics.sort((a, b) => 
        StringToDate(b.DueDate) - StringToDate(a.DueDate)
    )[0];
}