import React, { useEffect, useReducer, useState } from 'react';
import BasicGrid from './Components/BasicGrid';
import { ProductLayout } from './Components/ProductLayout';
import ErrorBoundary from './Components/ErrorBoundary';
import {Provider} from 'react-redux';
import {store} from './store';

function App() {

    return (
        <Provider store={store}>
            <ErrorBoundary>
                <ProductLayout>
                    
                </ProductLayout>
            </ErrorBoundary>
        </Provider>
    );
}

export default App;
