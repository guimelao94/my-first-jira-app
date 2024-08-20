import { Box, Inline, Stack, xcss } from '@atlaskit/primitives';
import { media } from '@atlaskit/primitives/responsive';

import { useState, useEffect, memo, useCallback, useContext } from 'react';
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { EpicStack_Top, TopCard_Row } from '../TopCard_Misc';
import { IssuesTable } from '../IssuesTable';
import Lozenge from '@atlaskit/lozenge';
import Spinner from '@atlaskit/spinner';
import Toggle from '@atlaskit/toggle';
import { EpicStack } from './EpicStack';
import { DevStack } from './DevStack';
import { useSelector } from 'react-redux';

export const EpicCard = ({ epicKey, style}) => {

    const epics = useSelector((state) => {
		return state.epics;
	})
    const [viewDevStack, setViewDevStack] = useState(false);

    const [currentEpic,setCurrentEpic] = useState(null);

    const cardStyles = xcss({
        padding: 'space.050',
        backgroundColor: 'white',
        borderRadius: '6px',
        [media.above.xs]: {
            padding: 'space.100',
        },
        [media.above.sm]: {
            borderWidth: 'border.width',
            padding: 'space.150',
        },
        [media.above.md]: {
            borderWidth: 'border.width.outline',
            padding: 'space.200',
        },
    });
    console.log('render');
    console.log(epicKey);
    console.log(epics.data.some(x=>x.EpicKey == epicKey));
    console.log(epics.data.find(x=>x.EpicKey == epicKey));
    useEffect(() => {
        console.log('Pull Data');
        
    }, []);

    useEffect(() => {
        console.log('Pull Data');
        //HandleEpics(epicKey, setCardData, setStorage, storage)
        setCurrentEpic(epics.data.find(x=>x.EpicKey == epicKey));
        console.log(currentEpic);
    }, [epics.AllIssuesLoaded && epics.AllDevStacksLoaded]);

    if (!(epics.loaded) || !currentEpic || !(currentEpic.loaded)) {
        return (<Spinner size={'xlarge'} />)
    }

    return (
        <Box xcss={cardStyles} style={style}>
            <Inline space="space.200">
                <Toggle
                    id="toggle-controlled"
                    onChange={() => setViewDevStack((prev) => !prev)}
                    isChecked={viewDevStack}
                />
                <EpicStack_Top Epic={epicKey} DueDate={currentEpic.DueDate} Title={currentEpic.Summary}/>
            </Inline>
            <Box xcss={xcss({backgroundColor:"#fafbfc",padding:".2em", width:"max-content",fontSize:"1.1em",marginBottom:"1.2em",marginLeft:"auto",marginRight:"auto"})}>
                <span style={{"textAlign":"center"}}>{currentEpic.Summary}</span>
            </Box>
            <Stack>
                {(viewDevStack && currentEpic) ? <DevStack epicKey={epicKey}/> : <EpicStack cardData={currentEpic} />}
                {
                    currentEpic && currentEpic.IssueType == 'Epic' && epics.AllIssuesLoaded && epics.AllDevStacksLoaded && <IssuesTable developers={currentEpic.Developers} EpicKey={epicKey} issues={epics.issues.filter(x=>x.EpicKey == epicKey)} />
                }
            </Stack>
        </Box>
    );
}