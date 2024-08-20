import React, { useEffect, useState } from 'react';
import ForgeReconciler from '@forge/react';
import { invoke, requestJira, view } from '@forge/bridge';
import { Modal, ModalBody, ModalTransition, ModalTitle, ModalFooter, ModalHeader, Button, TextArea, Inline, Textfield, User, UserPicker, Text, xcss, Box } from '@forge/react';
import { AddOverflowModal } from './AddOverflowModal';
import { ViewOverflowModal } from './ViewOverflowModal';
import { Checkbox } from '@forge/react';

const App = () => {
    const [isAddOverflowOpen, setIsAddOverflowOpen] = useState(false);
    const [isViewOverflowOpen, setIsViewOverflowOpen] = useState(false);
    const [timeSpent, setTimeSpent] = useState("");
    const [description, setDescription] = useState("");
    const [developer, setDeveloper] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const openAddOverflowModal = () => setIsAddOverflowOpen(true);
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
    const closeAddOverflowModal = async () => {
        var resp = await requestJira(`/rest/api/3/user?accountId=${context.accountId}`);
        var Developer = await resp.json();
        var submission = {
            TimeSpent: timeSpent * 3600,
            Description: description,
            Developer: {FullName:Developer.displayName,AccountID:context.accountId},
            TimeStamp: (new Date()).toLocaleString()
        }
        console.log(Developer);
        var issue = null;
        const storageData = await invoke('Storage.GetData', { key: context.extension.issue.key });

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
        setTimeSpent('');
        setDescription('');
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
            <Inline>
                <Box xcss={xcss({ marginLeft: 'space.200', float:'left' })}>
                    <Button appearance="primary" onClick={openAddOverflowModal}>
                        Add Overflow
                    </Button>
                </Box>

                <Box xcss={xcss({ marginLeft: 'space.200', float:'right' })}>
                    <Button appearance="primary" onClick={openViewOverflowModal}>
                        View Overflow
                    </Button>
                </Box>
            </Inline>


           {isAddOverflowOpen && <AddOverflowModal timeSpent={timeSpent} description={description} setTimeSpent={setTimeSpent} setDescription={setDescription} context={context} isOpen={isAddOverflowOpen} closeModal={closeAddOverflowModal} />} 
           {isViewOverflowOpen && <ViewOverflowModal IssueKey={context.extension.issue.key} isOpen={isViewOverflowOpen} closeModal={closeViewOverflowModal} />} 

        </>
    );
};

ForgeReconciler.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
