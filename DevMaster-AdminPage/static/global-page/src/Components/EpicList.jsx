import Select from '@atlaskit/select';
import React, { memo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SaveSelectedEpics, fetchEpicDetails } from '../store';
import { EpicDueDateModal } from './EpicDueDateModal';


export const EpicList = memo(function EpicList(){
    const dispatch = useDispatch();
    const available = useSelector((state) => state.epics.Available);
    const selected = useSelector((state) => state.epics.Selected);
    const loadedEpics = useSelector((state) => state.epics.data);
    const [selectValue, setSelectValue] = React.useState([]);
    const [modalEpic, setModalEpic] = useState(null);

    const mergedOptions = React.useMemo(() => {
        const optionMap = new Map();

        if (Array.isArray(available)) {
            available.forEach((option) => {
                if (option?.value) {
                    optionMap.set(option.value, option);
                }
            });
        }

        if (Array.isArray(loadedEpics)) {
            loadedEpics.forEach((epic) => {
                if (epic?.EpicKey && !optionMap.has(epic.EpicKey)) {
                    optionMap.set(epic.EpicKey, {
                        label: epic.EpicKey,
                        value: epic.EpicKey
                    });
                }
            });
        }

        if (Array.isArray(selected)) {
            selected.forEach((epicKey) => {
                if (epicKey && !optionMap.has(epicKey)) {
                    optionMap.set(epicKey, {
                        label: epicKey,
                        value: epicKey
                    });
                }
            });
        }

        return Array.from(optionMap.values());
    }, [available, loadedEpics, selected]);

    // Sync selectValue with selected epics from Redux
    React.useEffect(() => {
        if (!Array.isArray(mergedOptions)) {
            setSelectValue([]);
            return;
        }
        // Ensure selected is always an array
        const selectedArray = Array.isArray(selected) ? selected : [];
        
        if (selectedArray.length === 0) {
            setSelectValue([]);
            return;
        }
        
        const selectedSet = new Set(selectedArray);
        const currentValue = mergedOptions.filter(x => selectedSet.has(x.value));
        setSelectValue(currentValue);
    }, [mergedOptions, selected]);

    const handleChange = React.useCallback(async (e) => {
        const newSelected = Array.isArray(e) ? e : [];
        const newValues = newSelected.map((item) => item.value);
        const previousValues = (Array.isArray(selected) ? selected : []) || [];

        // Find newly added epics
        const newEpics = newValues.filter(epicKey => !previousValues.includes(epicKey));

        if (newEpics.length === 0) {
            // No new epics, just save the selection
            dispatch(SaveSelectedEpics(newValues));
            return;
        }

        // Check each new epic for due date
        const epicsWithoutDueDate = [];
        for (const epicKey of newEpics) {
            try {
                const epicDetails = await dispatch(fetchEpicDetails(epicKey)).unwrap();
                
                // Check if epic is actually an Epic type and has no due date
                if (epicDetails.issueType === 'Epic' && !epicDetails.dueDate) {
                    epicsWithoutDueDate.push({
                        key: epicDetails.key || epicKey,
                        summary: epicDetails.summary
                    });
                }
            } catch (error) {
                console.error(`Error checking epic ${epicKey}:`, error);
                // If we can't check, we'll allow it through (fail open)
            }
        }

        // If any epics are missing due dates, prevent selection and show modal
        if (epicsWithoutDueDate.length > 0) {
            // Show modal for the first epic without a due date
            setModalEpic(epicsWithoutDueDate[0]);
            
            // Revert to previous selection
            setSelectValue(available.filter(x => previousValues.includes(x.value)));
            return;
        }

        // All new epics have due dates (or aren't Epic type), proceed with saving
        dispatch(SaveSelectedEpics(newValues));
    }, [dispatch, selected, available]);

    const handleCloseModal = useCallback(() => {
        setModalEpic(null);
    }, []);

    return(
        <>
            <Select 
                options={mergedOptions} 
                value={selectValue}
                isMulti 
                onChange={handleChange}
                noOptionsMessage={() => 'No epics available'}
            />
            {modalEpic && (
                <EpicDueDateModal
                    isOpen={!!modalEpic}
                    closeModal={handleCloseModal}
                    epicKey={modalEpic.key}
                    epicSummary={modalEpic.summary}
                />
            )}
        </>
    );
})
