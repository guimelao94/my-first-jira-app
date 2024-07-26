import { Box, Inline, Stack, xcss } from '@atlaskit/primitives';
import { media } from '@atlaskit/primitives/responsive';

import { useState, useEffect, memo, useCallback } from 'react';
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { TopCard_Row } from '../TopCard_Misc';
import { IssuesTable } from '../IssuesTable';
import { HandleEpics, RefreshData } from './EpicScripts';
import Lozenge from '@atlaskit/lozenge';
import Spinner from '@atlaskit/spinner';
import Toggle from '@atlaskit/toggle';
import { EpicStack } from './EpicStack';
import { DevStack } from './DevStack';

export const EpicCard = ({ epicKey, style, developersList, setDevelopersList }) => {

    const [cardData, setCardData] = useState({});
    const [issues, setIssues] = useState([]);
    const [developers, setDevelopers] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [storage, setStorage] = useState([]);
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

    useEffect(() => {
        console.log('Pull Data');
        HandleEpics(epicKey, setCardData, setStorage, storage)
    }, []);

    useEffect(() => {
        RefreshData(storage.slice().sort((a, b) => b.idx - a.idx), setDevelopers, setIssues, setLoaded, setCardData, developersList, setDevelopersList,devStackData,setDevStackData)
        console.log('LoadedStorage');
        console.log(storage);
        console.log(cardData);
    }, [storage]);

    if (!(cardData && loaded && storage)) {
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
                {(viewDevStack) ? <DevStack developers={devStackData}/> : <EpicStack cardData={cardData} />}
                {
                    cardData.IssueType == 'Epic' && <IssuesTable developers={developers} issues={issues} />
                }
            </Stack>
        </Box>
    );
}