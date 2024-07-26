import { css } from '@emotion/react';


const slotLabelStyles = css({
	textAlign: 'center',
});

const SlotLabel = ({ children, isSmall = false }) => {
	const Component = isSmall ? 'h4' : 'h3';
	return <Component css={slotLabelStyles}>{children}</Component>;
};

export default SlotLabel;