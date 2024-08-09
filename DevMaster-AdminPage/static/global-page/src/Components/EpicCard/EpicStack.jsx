import { EpicStack_Row } from '../TopCard_Misc';
import Lozenge from '@atlaskit/lozenge';

export const EpicStack = ({cardData}) => {
    console.log(cardData);
    return(
        <>
            <EpicStack_Row label={"Epic Key:"} value={cardData.EpicKey}/>
            <EpicStack_Row label={"Time Remaining:"} value={<Lozenge appearance="new">{cardData.TimeRemaining}</Lozenge>}/>
            <EpicStack_Row label={"Time Spent:"} value={<Lozenge>{cardData.TimeSpent}</Lozenge>}/>
            <EpicStack_Row label={"Original Estimate:"} value={cardData.OriginalEstimate}/>
            <EpicStack_Row label={"Overflow Time:"} value={<Lozenge appearance="inprogress">{cardData.OverflowTime}</Lozenge>}/>
            <EpicStack_Row label={"Due Date:"} value={cardData.DueDate}/>
            <EpicStack_Row label={"Issue Type:"} value={cardData.IssueType}/>  
        </>
    );
}