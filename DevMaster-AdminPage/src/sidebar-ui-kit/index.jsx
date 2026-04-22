import React, { useEffect, useState } from 'react';
import ForgeReconciler from '@forge/react';
import { invoke, requestJira, view } from '@forge/bridge';
import { Button, Inline, UserPicker, xcss, Box } from '@forge/react';
import { AddOverflowModal } from './AddOverflowModal';
import { ViewOverflowModal } from './ViewOverflowModal';
import { Checkbox } from '@forge/react';

const App = () => {
    const [isAddOverflowOpen, setIsAddOverflowOpen] = useState(false);
    const [isViewOverflowOpen, setIsViewOverflowOpen] = useState(false);
    const [timeSpent, setTimeSpent] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Format: YYYY-MM-DD
    const [category, setCategory] = useState("");
    const [overflowError, setOverflowError] = useState("");
    const [developer, setDeveloper] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const updateOverflowField = (setter) => (value) => {
        if (overflowError) {
            setOverflowError('');
        }
        setter(value);
    };
    const updateOverflowTimeSpent = updateOverflowField(setTimeSpent);
    const updateOverflowDescription = updateOverflowField(setDescription);
    const updateOverflowDate = updateOverflowField(setDate);
    const updateOverflowCategory = updateOverflowField(setCategory);
    const resetOverflowForm = () => {
        setTimeSpent('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setCategory('');
        setOverflowError('');
    };
    const openAddOverflowModal = () => {
        resetOverflowForm();
        setIsAddOverflowOpen(true);
    };
    const openViewOverflowModal = () => setIsViewOverflowOpen(true);

    const updateDeveloper = async (user) => {
        console.log(user);
        var storageData = await invoke('Storage.GetData', { key: context.extension.issue.key });

        if (Object.values(storageData).length > 0) {
            if (!storageData.Developer) {
                storageData = {
                    ...storageData,
                    Developer: {}
                };
            }
            storageData.Developer = {
                FullName: user.name,
                AccountID: user.id
            };
        } else {
            storageData = {
                Developer: {
                    FullName: user.name,
                    AccountID: user.id
                }
            }
        }

        invoke('Storage.SaveData', { key: context.extension.issue.key, value: storageData }).then((returnedData) => {
            console.log(returnedData);
        });

    }

    const updateIsCompleted = async (event) => {

        setIsCompleted(event.target.checked);
        var storageData = await invoke('Storage.GetData', { key: context.extension.issue.key });

        storageData.isCompleted = event.target.checked;

        invoke('Storage.SaveData', { key: context.extension.issue.key, value: storageData });

    }
    const closeViewOverflowModal = () =>{
        setIsViewOverflowOpen(false);
    }
    const cancelAddOverflowModal = () => {
        resetOverflowForm();
        setIsAddOverflowOpen(false);
    }
    const submitOverflowModal = async () => {
        const parsedTimeSpent = Number(timeSpent);
        if (!Number.isFinite(parsedTimeSpent) || parsedTimeSpent <= 0) {
            setOverflowError('Enter overflow time as a number of hours greater than 0.');
            return;
        }

        if (!category) {
            setOverflowError('Select an overflow category before submitting.');
            return;
        }

        setOverflowError('');
        var resp = await requestJira(`/rest/api/3/user?accountId=${context.accountId}`);
        var Developer = await resp.json();
        var submission = {
            TimeSpent: parsedTimeSpent * 3600,
            Description: description,
            Category: category,
            Developer: {FullName:Developer.displayName,AccountID:context.accountId},
            Date: date, // Use the selected date instead of timestamp
            TimeStamp: (new Date()).toLocaleString() // Keep for backward compatibility
        }
        console.log(Developer);
        var issue = null;
        var storageData = await invoke('Storage.GetData', { key: context.extension.issue.key });

        if (Object.values(storageData).length > 0) {
            if (!storageData.Overflow) {
                storageData = {
                    ...storageData,
                    Overflow: []
                };
            }
            storageData.Overflow.push(submission);

            issue = storageData;
        } else {
            var OverflowList = [];
            OverflowList.push(submission);
            issue = {
                Overflow: OverflowList
            }
        }

        invoke('Storage.SaveData', { key: context.extension.issue.key, value: issue }).then((returnedData) => {
            console.log(returnedData);
        });

        console.log(storageData);

        console.log(submission);
        resetOverflowForm();
        setIsAddOverflowOpen(false);
    }
    const [context, setContext] = useState(null);

    const GetDeveloperID = () => {
        if (developer) {
            return developer.AccountID;
        } else {
            return "";
        }
    }
    useEffect(() => {
        console.log('here');
        view.getContext().then(data => {
            setContext(data);
            invoke('Storage.GetData', { key: data.extension.issue.key }).then((returneddata) => {
                if (Object.values(returneddata).length > 0) {
                    if (returneddata.Developer) {
                        setDeveloper(returneddata.Developer);
                    }
                    if (returneddata.isCompleted) {
                        setIsCompleted(returneddata.isCompleted);
                    }else{
                        setIsCompleted(false);
                    }
                } else {
                    setDeveloper(null);
                    setIsCompleted(false);
                }
            });
            console.log(data);
        })

    }, []);

    useEffect(() => {
        console.log(context);
    }, [context]);

    if (!context) {
        return;
    }
    return (
        <>
            <Box xcss={xcss({ marginBottom: 'space.200' })}>
                <UserPicker
                    label="Developer"
                    placeholder="Select a user"
                    name="dev"
                    defaultValue={GetDeveloperID()}
                    onChange={updateDeveloper}
                />
            </Box>
            <Box xcss={xcss({ marginBottom: 'space.200' })}>
                <Checkbox value="checked" label="Completed" onChange={updateIsCompleted}  isChecked={isCompleted} />
            </Box>
            <Inline space="space.200">
                <Button appearance="primary" onClick={openAddOverflowModal}>
                    Add Overflow
                </Button>
                <Button appearance="primary" onClick={openViewOverflowModal}>
                    View Overflow
                </Button>
            </Inline>


           {isAddOverflowOpen && <AddOverflowModal timeSpent={timeSpent} description={description} date={date} category={category} validationMessage={overflowError} setTimeSpent={updateOverflowTimeSpent} setDescription={updateOverflowDescription} setDate={updateOverflowDate} setCategory={updateOverflowCategory} context={context} isOpen={isAddOverflowOpen} closeModal={cancelAddOverflowModal} submitModal={submitOverflowModal} />} 
           {isViewOverflowOpen && <ViewOverflowModal IssueKey={context.extension.issue.key} isOpen={isViewOverflowOpen} closeModal={closeViewOverflowModal} />} 

        </>
    );
};

ForgeReconciler.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
