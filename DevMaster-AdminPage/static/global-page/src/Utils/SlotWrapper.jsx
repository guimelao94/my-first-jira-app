import { css} from '@emotion/react';

import { token } from '@atlaskit/tokens';


const slotWrapperStyles = css({
	boxSizing: 'border-box',
	height: '100%',
	padding: token('space.100', '8px'),
	backgroundColor: token('color.background.neutral.subtle'),
	outlineOffset: -4,
	overflowY: 'auto',
});

const extraPaddingStyles = css({
	minWidth: 50,
	padding: `${token('space.100', '8px')} 28px`,
});

const SlotWrapper = ({
	borderColor,
	backgroundColor,
	children,
	className,
	hasExtraPadding,
	minHeight,
	hasHorizontalScrollbar = true,
}) => (
	<div
		className={className}
		css={[slotWrapperStyles, hasExtraPadding && extraPaddingStyles]}
		style={{
			minHeight,
			backgroundColor: backgroundColor,
			outline: borderColor ? `2px dashed ${borderColor}` : 'none',
			overflowX: hasHorizontalScrollbar ? 'auto' : 'hidden',
		}}
	>
		{children}
	</div>
);

export default SlotWrapper;