import React, { useEffect, useReducer, useState } from 'react';
import { invoke } from '@forge/bridge';
import BasicGrid from './Components/BasicGrid';
import ResponsiveGrid from './Components/ResponsiveGrid';
import { Stack } from '@atlaskit/primitives';
import {ProductLayout} from './Components/ProductLayout';
import { EpicCard } from './Components/EpicCard/EpicCard';
import { view, requestJira } from '@forge/bridge';

function App() {
    const [SelectedEpics, setSelectedEpics] = useState([]);
    const [AvailableEpics, setAvailableEpics] = useState([]);
    const [loadedSelectedEpics, setLoadedSelectedEpics] = useState(false);
    const [loadedAvailableEpics, setLoadedAvailableEpics] = useState(false);
    const [developersList, setDevelopersList] = useState([]);
    const [, forceRender] = useReducer(x => x + 1, 0);
    const SaveSelectedEpics = async (newArray) => {
        console.log(newArray);
        setSelectedEpics(newArray);
        invoke('Storage.SaveData', { key: 'Cards', value: newArray }).then((returnedData) => {
            console.log(returnedData);
        });
    }

    const SaveDevelopersList = async (newArray) => {
        console.log(newArray);
        setDevelopersList(newArray);
        invoke('Storage.SaveData', { key: 'DevelopersList', value: newArray }).then((returnedData) => {
            console.log(returnedData);
            forceRender();
        });
    }
    const GetEpics = async () => {
        const res = await requestJira(`/rest/api/3/search?jql=issueType=Epic`);

        const data = await res.json();

        var epicList = data.issues.map((item) => ({
            label: item.key,
            value: item.key
        }));
        setAvailableEpics(epicList);
        setLoadedAvailableEpics(true);
        console.log(data);
        console.log(epicList);
    };

    useEffect(() => {
        invoke('Storage.GetData', { key: 'Cards' }).then((returnedData) => {
            console.log(returnedData);
            var newArray = [...returnedData, ...SelectedEpics]
            SaveSelectedEpics(newArray);
            setLoadedSelectedEpics(true);
        });
        GetEpics();
    }, []);

    useEffect(() => {
        console.log('developersList update');
        console.log(developersList);
        forceRender();
    }, [developersList]);

    return (
        <ProductLayout
            developersList={developersList}
            setDevelopersList={SaveDevelopersList}
        >
            <BasicGrid AvailableEpics={AvailableEpics} LoadedEpics={loadedSelectedEpics && loadedAvailableEpics} SelectedEpics={AvailableEpics.filter(x => SelectedEpics.some(y => y == x.value))} UpdateEpics={SaveSelectedEpics}>
                {
                    loadedSelectedEpics && loadedAvailableEpics && SelectedEpics.map((item, index) => (
                        <EpicCard key={index} epicKey={item} developersList={developersList} setDevelopersList={SaveDevelopersList} />
                    ))
                }
            </BasicGrid>
        </ProductLayout>

    );
}

export default App;
