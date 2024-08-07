import React, { useEffect, useReducer, useState } from 'react';
import { invoke } from '@forge/bridge';
import BasicGrid from './Components/BasicGrid';
import ResponsiveGrid from './Components/ResponsiveGrid';
import { Stack } from '@atlaskit/primitives';
import { ProductLayout } from './Components/ProductLayout';
import {Provider} from 'react-redux';
import {store} from './store';
import { EpicCard } from './Components/EpicCard/EpicCard';
import { view, requestJira } from '@forge/bridge';
import { GlobalContextProvider } from './context/GlobalContext';

function App() {
    const [, forceRender] = useReducer(x => x + 1, 0);

    return (
        <Provider store={store}>
            <ProductLayout>
                {/* <BasicGrid AvailableEpics={AvailableEpics} LoadedEpics={loadedSelectedEpics && loadedAvailableEpics} SelectedEpics={AvailableEpics.filter(x => SelectedEpics.some(y => y == x.value))} UpdateEpics={SaveSelectedEpics}>
                    {
                        loadedSelectedEpics && loadedAvailableEpics && SelectedEpics.map((item, index) => (
                            <EpicCard key={index} epicKey={item} developersList={developersList} setDevelopersList={SaveDevelopersList} />
                        ))
                    }
                </BasicGrid> */}
            </ProductLayout>
        </Provider>


    );
}

export default App;
