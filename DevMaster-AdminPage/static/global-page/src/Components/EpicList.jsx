import Select from '@atlaskit/select';
import React, { memo, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SaveSelectedEpics } from '../store';


export const EpicList =memo(function(){
    const dispatch = useDispatch();
	const epics = useSelector((state) => {
		return state.epics;
	})
    console.log(epics.Available);
    console.log(Object.values(epics.Selected).length > 0);
    console.log(epics.Available.filter(x => Object.values(epics.Selected).length > 0 && epics.Selected.some(y => y == x.value)));

    const HandleChange = async (e) =>{
        console.log(e);
        dispatch(SaveSelectedEpics((e.map((item) =>(item.value)))));
    }
    return(
        <Select options={epics.Available} defaultValue={epics.Available.filter(x => Object.values(epics.Selected).length > 0 && epics.Selected.some(y => y == x.value))} isMulti onChange={HandleChange}/>
    );
})