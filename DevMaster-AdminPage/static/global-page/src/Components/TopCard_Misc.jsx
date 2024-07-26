import { Inline, xcss } from "@atlaskit/primitives";

export const EpicStack_Row = ({label,value}) => {
    const inlineStyle = xcss({borderWidth:'thin',borderStyle:'solid',borderColor:'#4e83e37a',backgroundColor:'rgb(216 230 255 / 22%)'});
    return(
        <Inline xcss={inlineStyle}>
            <span style={{"padding":".5em","fontSize":"1.2em","fontWeight":"600","width":"80%","backgroundColor":"#4e83e31a"}}>
                {label}
            </span>

            <span style={{"padding":".5em","fontSize":"1.2em","textAlign":"center","width":"100%"}}>
                {value}
            </span>
        </Inline>
    );
}

export const DevStack_Row = ({label,data}) => {
    const inlineStyle = xcss({borderWidth:'thin',borderStyle:'solid',borderColor:'#4e83e37a',backgroundColor:'rgb(216 230 255 / 22%)'});
    return(
        <Inline xcss={inlineStyle}>
            <span style={{"padding":".1em","fontSize":"1em","fontWeight":"600","width":"75px","backgroundColor":"#4e83e31a"}}>
                {label}
            </span>
            {data.map((item)=>(
                <span style={{"padding":".5em","fontSize":"1.2em","textAlign":"center","width":"145px"}}>
                    {item}
                </span>
            ))}
            
        </Inline>
    );
}