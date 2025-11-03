import React from 'react';
import styles from './ResponsiveGrid.module.css';

const ResponsiveGrid = ({children}) => {
	return (
		<div 
			className={styles.gridContainer}
			style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
				gap: '16px',
				width: '100%',
				alignItems: 'start',
				padding: '8px'
			}}
		>
			{children}
		</div>
	);
};

export default ResponsiveGrid;