import { Box, Inline, Stack, xcss } from '@atlaskit/primitives';
import { media } from '@atlaskit/primitives/responsive';

import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { EpicStack_Top } from '../TopCard_Misc';
import { IssuesTable } from '../IssuesTable';
import Lozenge from '@atlaskit/lozenge';
import Spinner from '@atlaskit/spinner';
import Toggle from '@atlaskit/toggle';
import { EpicStack } from './EpicStack';
import { DevStack } from './DevStack';
import { useSelector } from 'react-redux';
import  Button  from '@atlaskit/button/new';


export const EpicCard = memo(({ epicKey, style}) => {
    // Memoized selectors to prevent unnecessary re-renders
    const loaded = useSelector((state) => state.epics.loaded);
    const allIssuesLoaded = useSelector((state) => state.epics.AllIssuesLoaded);
    const allDevStacksLoaded = useSelector((state) => state.epics.AllDevStacksLoaded);
    const data = useSelector((state) => state.epics.data);
    const issues = useSelector((state) => state.epics.issues);
    
    const [viewDevStack, setViewDevStack] = useState(true);
    const [showIssues, setShowIssues] = useState(false);

    // Memoize current epic lookup to prevent unnecessary recalculations
    const currentEpic = useMemo(() => {
        return data?.find(x => x.EpicKey === epicKey) || null;
    }, [data, epicKey]);

    // Memoize issues for this epic
    const epicIssues = useMemo(() => {
        return issues?.filter(x => x.EpicKey === epicKey) || [];
    }, [issues, epicKey]);

    const cardStyles = xcss({
        padding: 'space.050',
        backgroundColor: 'white',
        borderRadius: '6px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
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

    useEffect(() => {
        // Update when both flags are true
        if (allIssuesLoaded && allDevStacksLoaded) {
            // Epic data will be updated via useMemo
        }
    }, [allIssuesLoaded, allDevStacksLoaded]);

    const toggleViewDevStack = useCallback(() => {
        setViewDevStack((prev) => !prev);
    }, []);

    const toggleShowIssues = useCallback(() => {
        setShowIssues((prev) => !prev);
    }, []);

    if (!loaded || !currentEpic || !currentEpic.loaded) {
        return (<Spinner size={'xlarge'} />)
    }

    return (
        <Box xcss={cardStyles} style={{ ...style, boxSizing: 'border-box' }}>
            <Inline space="space.200">
                <Toggle
                    id="toggle-controlled"
                    onChange={toggleViewDevStack}
                    isChecked={viewDevStack}
                />
                <EpicStack_Top Epic={epicKey} DueDate={currentEpic.DueDate} Title={currentEpic.Summary}/>
            </Inline>
            <Box xcss={xcss({backgroundColor:"#fafbfc",padding:".2em", width:"max-content",fontSize:"1.1em",marginBottom:"1.2em",marginLeft:"auto",marginRight:"auto"})}>
                <span style={{"textAlign":"center"}}>{currentEpic.Summary}</span>
            </Box>
            <Box xcss={xcss({backgroundColor:"#fafbfc",padding:".2em", width:"max-content",fontSize:"1.1em",marginBottom:"1.2em",marginLeft:"auto",marginRight:"auto"})}>
                <span style={{"textAlign":"center"}}>
                    <Button onClick={toggleShowIssues}>
                        {showIssues ? "Hide Issues" : "Show Issues"}
                    </Button>
                </span>
            </Box>
            <Stack>
                {(viewDevStack && currentEpic) ? <DevStack epicKey={epicKey} showIssues={showIssues}  /> : <EpicStack cardData={currentEpic} />}
                {
                    currentEpic && currentEpic.IssueType === 'Epic' && allIssuesLoaded && allDevStacksLoaded && showIssues && (
                        <IssuesTable developers={currentEpic.Developers} EpicKey={epicKey} issues={epicIssues} />
                    )
                }
            </Stack>
        </Box>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for memo - only re-render if epicKey changes
    return prevProps.epicKey === nextProps.epicKey;
});