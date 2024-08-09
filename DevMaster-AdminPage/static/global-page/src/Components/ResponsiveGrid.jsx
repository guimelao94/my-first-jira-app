import React from 'react';

import { Grid, xcss } from '@atlaskit/primitives';
import { media } from '@atlaskit/primitives/responsive';
import { ExampleBox } from './EpicCard/EpicCard';


const responsiveStyles = xcss({
	[media.above.xxs]: { gridTemplateColumns: 'repeat(1, 1fr)' },
	[media.above.xs]: {
		gridTemplateColumns: 'repeat(2, 1fr)',
	},
	[media.above.sm]: {
		gridTemplateColumns: 'repeat(3, 1fr)',
	},
	[media.above.lg]: {
		gridTemplateColumns: 'repeat(3, 1fr)',
	},
    padding: 'space.100'
});

const ResponsiveGrid = ({children}) => {
	return (
		
		<Grid xcss={responsiveStyles} gap="space.200" alignItems="start" >
			{children}
		</Grid>
	);
};

export default ResponsiveGrid;