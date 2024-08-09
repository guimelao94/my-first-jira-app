import React, { useEffect, useState } from 'react';
import { Grid,Box, xcss,Stack, Inline } from '@atlaskit/primitives';
import { media } from '@atlaskit/primitives/responsive';
import { EpicCard, ExampleBox } from './EpicCard/EpicCard';
import ResponsiveGrid from './ResponsiveGrid';
import { EpicList } from './EpicList';
import { useSelector } from 'react-redux';

const cardStyles = xcss({
	borderColor: 'color.border.discovery',
	borderStyle: 'solid',
	borderWidth: 'border.width.0',
	padding: 'space.050',
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


const BasicGrid = ({children}) => {	
	const {Available,Selected,data} = useSelector((state) => {
		return state.epics;
	})
	return (
		<>
		<Grid
			testId="grid-basic"
			gap="space.200"
			alignItems="start"
			templateAreas={[
				'navigation navigation navigation navigation',
				'content content content content',
				'footer footer footer footer',
			]}
		>
			<Box style={{ gridArea: 'navigation'}}>
				{Available && Selected &&<EpicList />}
			</Box>
			<Box style={{ gridArea: 'sidenav',borderWidth:'2px',borderStyle:'solid',borderColor:'purple',display:'none' }}>
				Border becomes narrower at smaller breakpoints. Try it out by resizing the browser window.
			</Box>
			<Box style={{ gridArea: 'content',backgroundColor:'rgba(9, 30, 66, 0.06)' }}>
				<ResponsiveGrid>
					{
                        data && Available && Selected && Selected.map((item, index) => (
                            <EpicCard key={index} epicKey={item} />
                        ))
                    }
				</ResponsiveGrid>
			</Box>
			<Box style={{ gridArea: 'footer',borderWidth:'2px',borderStyle:'solid',borderColor:'purple',display:'none' }}>
				Border becomes narrower at smaller breakpoints. Try it out by resizing the browser window.
			</Box>
		</Grid>


		</>
		
		
	);
};

export default BasicGrid;