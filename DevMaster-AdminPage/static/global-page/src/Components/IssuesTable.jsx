import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { convertToHours } from '../Utils/ConversionTools';
import { Inline, Stack, xcss } from '@atlaskit/primitives';
import Style from './IssuesTable.modules.css'
import Lozenge from '@atlaskit/lozenge';

export const IssuesTable = ({developers,issues }) => {
    console.log(developers);
    console.log(issues);
    const StackStyle = xcss({textAlign: 'center'});
    const HeaderStyle = xcss({justifyContent: 'center'});

    if(issues.some(z=>z.ticketNumber == 'DMA-5')){
        console.log(issues.filter(z=>z.ticketNumber == 'DMA-5'));
        console.log(issues.filter(z=>z.ticketNumber == 'DMA-5')[0].worklogs.find(x=>x.Developer == 'Julius Cesar'));
    }
    
    
    return (
        <TableTree label="Automatically controlled row expansion">
            <Headers>
                <Header width={145}>Ticket #</Header>
                {developers.map((developer) =>(
                    <Header width={145} className={Style.cell}>
                        {developer.ShortName}
                        <span style={{marginLeft:'.3em'}}><Lozenge appearance="new">{convertToHours(developer.RemainingWork)}</Lozenge></span>
                    </Header>
                ))}
            </Headers>
            <Rows
                items={issues}
                render={({ ticketNumber, dev,remainingTime,overflowTime,worklogs,idx }) => (
                    <Row
                        items={[]}
                        hasChildren={false}
                        isDefaultExpanded
                    >
                        <Cell singleLine>{ticketNumber}</Cell>
                        {developers.map((developer) =>(
                            <Cell className={Style.cell}>
                                <Inline>
                                    {developer.FullName == dev&&<span style={{paddingRight:'5px'}}><Lozenge appearance="new">{convertToHours(developer.FullName == dev ? remainingTime:0)}</Lozenge></span>}
                                    {worklogs.some(x=>x.Developer == developer.FullName)&&<span style={{paddingRight:'5px'}}><Lozenge style={{paddingRight:'.5em'}}>{convertToHours(worklogs.length > 0 ? worklogs.find(x=>x.Developer == developer.FullName)?.TimeSpent:0)}</Lozenge></span>}
                                    {developer.FullName == dev&&<span><Lozenge appearance="inprogress">{convertToHours(developer.FullName == dev ? overflowTime:0)}</Lozenge></span>}
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