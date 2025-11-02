import Select from '@atlaskit/select';
import React, { memo, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SaveSelectedEpics } from '../store';


export const EpicList = memo(function EpicList(){
    const dispatch = useDispatch();
    const available = useSelector((state) => state.epics.Available);
    const selected = useSelector((state) => state.epics.Selected);

    // Memoize defaultValue calculation
    const defaultValue = React.useMemo(() => {
        if (!available || !selected || selected.length === 0) return [];
        const selectedSet = new Set(selected);
        return available.filter(x => selectedSet.has(x.value));
    }, [available, selected]);

    const handleChange = React.useCallback((e) => {
        const values = Array.isArray(e) ? e.map((item) => item.value) : [];
        dispatch(SaveSelectedEpics(values));
    }, [dispatch]);

    return(
        <Select 
            options={available || []} 
            defaultValue={defaultValue} 
            isMulti 
            onChange={handleChange}
        />
    );
})