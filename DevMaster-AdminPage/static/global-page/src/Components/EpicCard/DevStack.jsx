import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { Inline, Stack, xcss } from '@atlaskit/primitives';
import Style from './DevStack.module.css';
import Lozenge from '@atlaskit/lozenge';

export const DevStack = ({developers }) => {
    
    return (
        <TableTree label="Automatically controlled row expansion">
            <Headers>
                <Header className={Style.HeaderCell} width={145}>Totals</Header>
                {developers.map((developer) => (
                    <Header width={145} className={Style.HeaderCell}>
                        {developer.TotalHours}
                    </Header>
                ))}
            </Headers>
            <Rows
                items={[
                    { Label: 'Days Worth of Work', Property: 'DaysWorth' },
                    { Label: 'Days available after prev release', Property: 'DaysAvailable' },
                    { Label: 'Day To Begin Dev Work', Property: 'StartDate' },
                    { Label: 'Due Date', Property: 'OnTrack' },
                    { Label: 'Done by', Property: 'DoneBy' },
                    { Label: 'Overflow Hours', Property: 'OverflowHours' }
                ]}
                render={({ Label, Property }) => (
                    <Row
                        items={[]}
                        hasChildren={false}
                        isDefaultExpanded
                    >
                        <Cell className={Style.BodyLabel} width={145}>{Label}</Cell>
                        {developers.map((developer) => (
                            <Cell width={145} className={Style.BodyCell}>
                                <Inline>
                                    <span style={{}}>{developer[Property]}</span>
                                </Inline>
                            </Cell>
                        ))
                        }
                    </Row>
                )}
            />
        </TableTree>
    );
}