import { EpicStack_Row } from '../TopCard_Misc';
import Lozenge from '@atlaskit/lozenge';

export const EpicStack = ({cardData}) => {
    console.log(cardData);
    return(
        <div style={{"marginBottom":".5em"}}>
            <EpicStack_Row label={"Time Remaining:"} value={<Lozenge appearance="new">{cardData.TimeRemaining}</Lozenge>}/>
            <EpicStack_Row label={"Time Spent:"} value={<Lozenge>{cardData.TimeSpent}</Lozenge>}/>
            <EpicStack_Row label={"Original Estimate:"} value={cardData.OriginalEstimate}/>
            <EpicStack_Row label={"Overflow Time:"} value={<Lozenge appearance="inprogress">{cardData.OverflowTime}</Lozenge>}/>
        </div>
    );
}