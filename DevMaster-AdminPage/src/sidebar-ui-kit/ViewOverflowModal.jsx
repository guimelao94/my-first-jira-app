import React from 'react';
import { DynamicTable, Modal, ModalBody, ModalTransition, ModalTitle, ModalFooter, ModalHeader, Button, TextArea, Inline, Textfield, User, xcss, Box, Icon, Link, LinkButton } from '@forge/react';
import { useEffect, useState } from 'react';
import { invoke, requestJira, view } from '@forge/bridge';
import TrashIcon from '@atlaskit/icon/glyph/trash'

export const ViewOverflowModal = ({ IssueKey, closeModal, isOpen }) => {
    const [overflowData, setOverflowData] = useState(null);
    const [removeCount,setRemoveCount] = useState(0);
    console.log('ViewOverflowModal');
    console.log(isOpen);
    console.log(closeModal);
    console.log(IssueKey);

    const removeRecord = async (index) =>{
        console.log(index);
        var data = overflowData;
        data.Overflow.splice(index,1);
        console.log(data);
        await invoke('Storage.SaveData', { key: IssueKey, value: data });
        setOverflowData(data);
        setRemoveCount(removeCount + 1);
    }

    useEffect(() => {
        invoke('Storage.GetData', { key: IssueKey }).then((returneddata) => {
            if (Object.values(returneddata).length > 0) {
                console.log(returneddata)
                setOverflowData(returneddata);
            } else {

            }
        });
    }, []);

    useEffect(()=>{
        console.log(overflowData);
    },[overflowData]);

    return (
        <ModalTransition>
            {isOpen && (
                <Modal onClose={closeModal} width="large">
                    <ModalHeader>
                        <ModalTitle>Overflow Submission List</ModalTitle>
                    </ModalHeader>
                    <ModalBody>
                        {overflowData &&
                            <DynamicTable

                                head={GenerateHeader()}
                                rows={GenerateRows(overflowData.Overflow,removeRecord)}
                                rowsPerPage={5}
                            />
                        }
                    </ModalBody>
                    <ModalFooter>
                        <Button appearance="primary" onClick={closeModal}>
                            Close
                        </Button>
                    </ModalFooter>
                </Modal>
            )}
        </ModalTransition>
    );
}

// applied as rows in the form
const GenerateRows = (data,removeRecord) => {
    console.log(data);
    var rows = data.map((r, index) => ({
        key: `row-${index}-${r.Developer.replace(' ','-')}`,
        cells: [
            {
                key: r.Description,
                content: r.Description,
            },
            {
                key: r.TimeSpent || '' ,
                content: r.TimeSpent ? (r.TimeSpent/3600) + 'H' : '',
            },
            {
                key: r.TimeStamp,
                content: r.TimeStamp,
            },
            {
                key: r.Developer,
                content: r.Developer,
            },
            {
                key: '',
                content: <Button type="button" onClick={(e)=>removeRecord(index)}><Icon glyph="trash" label="TrashIcon" size="small" /></Button>,
            },
        ],
    }));
    console.log(rows);
    return rows;
};

const GenerateHeader = () => {
    return {
        cells: [
            {
                key: "Description",
                content: "Description",
                isSortable: true,
            },
            {
                key: "TimeSpent",
                content: "TimeSpent",
                shouldTruncate: true,
                isSortable: true,
            },
            {
                key: "TimeStamp",
                content: "TimeStamp",
                shouldTruncate: true,
                isSortable: true,
            },
            {
                key: "Developer",
                content: "Developer",
                shouldTruncate: true,
                isSortable: true,
            },
            {
                key: " ",
                content: " "
            },
        ],
    }
};