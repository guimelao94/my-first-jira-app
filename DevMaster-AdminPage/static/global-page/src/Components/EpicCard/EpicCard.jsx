import { Box, Inline, Stack, xcss } from '@atlaskit/primitives';
import { media } from '@atlaskit/primitives/responsive';

import { useState, useEffect, memo, useCallback, useContext } from 'react';
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { TopCard_Row } from '../TopCard_Misc';
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
    const [devStackData,setDevStackData] = useState([
        {
            FullName: 'Guimel O Gonzalez',
            TotalHours: 20.5,
            DaysWorth: 12,
            DaysAvailable: 9,
            StartDate: '7/25/2024',
            OnTrack: 'On Track',
            DoneBy: '7/25/2024',
            OverflowHours: 7.5,
            EpicKey: 'DMA-2'
        },
        {
            FullName: 'Julius Cesar',
            TotalHours: 21,
            DaysWorth: 11,
            DaysAvailable: 7,
            StartDate: '7/24/2024',
            OnTrack: 'Off Track',
            DoneBy: '7/27/2024',
            OverflowHours: 2.5,
            EpicKey: 'DMA-2'
        }
    ]);

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
        //HandleEpics(epicKey, setCardData, setStorage, storage)
        
    }, []);

    if (!(epics.loaded) || !epics.data.some(x=>x.EpicKey == epicKey) || !(epics.data.find(x=>x.EpicKey == epicKey).loaded)) {
        return (<Spinner size={'xlarge'} />)
    }

    return (
        <Box xcss={cardStyles} style={style}>
            <Toggle
                id="toggle-controlled"
                onChange={() => setViewDevStack((prev) => !prev)}
                isChecked={viewDevStack}
            />
            <Stack>
                {(viewDevStack && epics.data.some(x=>x.EpicKey == epicKey)) ? <DevStack developers={devStackData}/> : <EpicStack cardData={epics.data.find(x=>x.EpicKey == epicKey)} />}
                {
                    epics.issues.some(x=>x.EpicKey == epicKey) && epics.data.find(x=>x.EpicKey == epicKey).IssueType == 'Epic' && epics.AllIssuesLoaded && <IssuesTable developers={epics.data.find(x=>x.EpicKey == epicKey).Developers} issues={epics.issues.filter(x=>x.EpicKey == epicKey)} />
                }
            </Stack>
        </Box>
    );
}