import { Box, Inline, xcss } from "@atlaskit/primitives";

export const EpicStack_Row = ({ label, value }) => {
    const inlineStyle = xcss({ color:"#282828" });
    return (
        <Inline xcss={inlineStyle}>
            <span style={{ "borderStyle":"solid","borderColor":"white","borderBottomWidth":"1px", "padding": ".5em", "fontSize": "1.2em", "fontWeight": "600", "width": "80%", "backgroundColor": '#f1f2f4'}}>
                {label}
            </span>

            <span style={{"borderStyle":"solid","borderColor":"white","borderBottomWidth":"1px", "padding": ".5em", "fontSize": "1.2em", "textAlign": "center", "width": "100%", "backgroundColor": '#f1f2f4'}}>
                {value}
            </span>
        </Inline>
    );
}

export const EpicStack_Top = ({ Epic, DueDate, Title}) => {
    const inlineStyle = xcss({ borderWidth: 'thin', borderStyle: 'solid', borderColor: '#4e83e37a', backgroundColor: 'rgb(216 230 255 / 22%)' });
    return (
        <>
            <Inline xcss={xcss({ marginLeft: "auto", marginRight: "5px", width: 'max-content', justifyContent: 'center' })}>
                <span style={{ "padding": ".2em", "fontSize": "1.3em", "fontWeight": "600", "backgroundColor": "#1c2a4c", "borderRadius": "10px", "color": "white" }}>
                    {Epic}
                </span>
                <span style={{ "padding": ".2em", "fontSize": "2em", "fontWeight": "bold", "position": "relative", "bottom": "12px" }}>:</span>
                <span style={{ "padding": ".2em", "fontSize": "1.3em", "textAlign": "center", "backgroundColor": "#f1f2f4","borderRadius": "10px" }}>
                    {DueDate}
                </span>
            </Inline>
            
        </>
    );
}

export const DevStack_Row = ({ label, data }) => {
    const inlineStyle = xcss({ borderWidth: 'thin', borderStyle: 'solid', borderColor: '#4e83e37a', backgroundColor: 'rgb(216 230 255 / 22%)' });
    return (
        <Inline xcss={inlineStyle}>
            <span style={{ "padding": ".1em", "fontSize": "1em", "fontWeight": "600", "width": "75px", "backgroundColor": "#4e83e31a" }}>
                {label}
            </span>
            {data.map((item) => (
                <span style={{ "padding": ".5em", "fontSize": "1.2em", "textAlign": "center", "width": "145px" }}>
                    {item}
                </span>
            ))}

        </Inline>
    );
}