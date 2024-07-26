import Select from '@atlaskit/select';
import React, { useEffect, useState } from 'react';


export const EpicList = ({AvailableEpics,SelectedEpics,UpdateEpics}) =>{
    console.log('render');
    console.log(AvailableEpics);
    console.log(SelectedEpics);

    const HandleChange =(e) =>{
        console.log(e);
        UpdateEpics(e.map((item) =>(item.value)));
    }
    return(
        <Select options={AvailableEpics} defaultValue={SelectedEpics} isMulti onChange={HandleChange}/>
    );
}