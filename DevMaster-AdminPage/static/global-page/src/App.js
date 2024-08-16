import React, { useEffect, useReducer, useState } from 'react';
import BasicGrid from './Components/BasicGrid';
import { ProductLayout } from './Components/ProductLayout';
import {Provider} from 'react-redux';
import {store} from './store';

function App() {

    return (
        <Provider store={store}>
            <ProductLayout>
                
            </ProductLayout>
        </Provider>


    );
}

export default App;
