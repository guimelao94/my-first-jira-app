import React, { useEffect, useState } from 'react';
import ForgeReconciler from '@forge/react';
import { invoke, requestJira, view } from '@forge/bridge';
import { Modal, ModalBody, ModalTransition, ModalTitle, ModalFooter, ModalHeader, Button, TextArea, Inline, Textfield, User, UserPicker, Text, xcss, Box } from '@forge/react';

const App = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [timeSpent, setTimeSpent] = useState("");
    const [description, setDescription] = useState("");
    const [developer,setDeveloper] = useState(null);
    const openModal = () => setIsOpen(true);

    const updateDeveloper = async (user) => {
        console.log(user);
        var storageData = await invoke('Storage.GetData', { key: context.extension.issue.key });

        if (Object.values(storageData).length > 0) {
            if(!storageData.Developer){
                storageData = {
                    ...storageData,
                    Developer:{}
                };
            }
            storageData.Developer = {
                FullName:user.name,
                AccountID:user.id
            };
        } else {
            storageData = {
                Developer: {
                    FullName:user.name,
                    AccountID:user.id
                }
            }
        }

        invoke('Storage.SaveData', { key: context.extension.issue.key, value: storageData }).then((returnedData) => {
            console.log(returnedData);
        });

    }

    const closeModal = async () => {
        var resp = await requestJira(`/rest/api/3/user?accountId=${context.accountId}`);
        var Developer = await resp.json();
        var submission = {
            TimeSpent: timeSpent*3600,
            Description: description,
            Developer: Developer.displayName,
            TimeStamp: (new Date()).toLocaleString()
        }
        console.log(Developer);
        var issue = null;
        const storageData = await invoke('Storage.GetData', { key: context.extension.issue.key });

        if (Object.values(storageData).length > 0) {
            if(!storageData.Overflow){
                storageData = {
                    ...storageData,
                    Overflow:[]
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
        setIsOpen(false);
    }
    const [context, setContext] = useState(null);

    const GetDeveloperID = () => {
        if(developer){
            return developer.AccountID;
        }else{
            return "";
        }        
    }
    useEffect(() => {
        console.log('here');
        view.getContext().then(data => {
            setContext(data);
            invoke('Storage.GetData', { key: data.extension.issue.key }).then((returneddata)=>{
                if (Object.values(returneddata).length > 0) {
                    if(returneddata.Developer) {
                        setDeveloper(returneddata.Developer);
                    }
                } else {
                    setDeveloper(null);
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
            <Box xcss={xcss({marginBottom:'space.200'})}>
                <UserPicker
                    label="Developer"
                    placeholder="Select a user"
                    name="dev"
                    defaultValue={GetDeveloperID()}
                    onChange={updateDeveloper}
                />
            </Box>
            <Button appearance="primary" onClick={openModal}>
                Add Overflow
            </Button>

            <ModalTransition>
                {isOpen && (
                    <Modal onClose={closeModal} width="small">
                        <ModalHeader>
                            <ModalTitle>Overflow Submission</ModalTitle>
                        </ModalHeader>
                        <ModalBody>
                            <Inline
                                space="space.050"
                            >
                                <Box xcss={xcss({ width: '40%', backgroundColor: 'black' })}>
                                    <Textfield
                                        appearance="standard"
                                        placeholder="1h 30m = 1.5"
                                        value={timeSpent}
                                        onChange={(e) => { setTimeSpent(e.target.value); }}
                                    />
                                </Box>

                                <Box
                                    xcss={xcss({ width: '60%', marginLeft: 'space.200', position: 'relative', bottom: '3%' })}>
                                    <User accountId={context.accountId} name="user" />
                                </Box>
                            </Inline>
                            <TextArea
                                id="area"
                                placeholder="Description"
                                name="area"
                                onChange={(e) => { setDescription(e.target.value); }}
                                value={description}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button appearance="subtle" onClick={closeModal}>
                                Cancel
                            </Button>
                            <Button appearance="primary" onClick={closeModal}>
                                Submit
                            </Button>
                        </ModalFooter>
                    </Modal>
                )}
            </ModalTransition>
        </>
    );
};

ForgeReconciler.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
