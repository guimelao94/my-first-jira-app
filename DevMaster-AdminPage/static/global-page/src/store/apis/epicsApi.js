import {createApi,fetchBaseQuery} from '@reduxjs/toolkit/query/react'

const epicsApi = createApi({
    reducerPath: 'epics',
    baseQueryPath: fetchBaseQuery({
        baseUrl:''
    }),
    endpoints(builder){
        return {
            fetchEpics:builder.query({
                query:(user)=>{
                    return  {
                        url:'',
                        params: {
                            param1:''
                        },
                        method: ''
                    }
                }
            })    
        };
    }
});

