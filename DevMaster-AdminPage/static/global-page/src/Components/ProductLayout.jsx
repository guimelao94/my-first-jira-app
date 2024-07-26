/**
 * @jsxRuntime classic
 */
/** @jsx jsx */
import { useState } from 'react';

import { jsx } from '@emotion/react';

import {
	AtlassianNavigation,
	Create,
	Help,
	PrimaryButton,
	ProductHome,
} from '@atlaskit/atlassian-navigation';
import noop from '@atlaskit/ds-lib/noop';
import { ConfluenceIcon, ConfluenceLogo, JiraIcon, JiraLogo } from '@atlaskit/logo';
import { ButtonItem, MenuGroup, Section } from '@atlaskit/menu';
import Popup from '@atlaskit/popup';
import {
	Header,
	NavigationHeader,
	NestableNavigationContent,
	NestingItem,
	SideNavigation,
} from '@atlaskit/side-navigation';

import { Content, LeftSidebar, Main, PageLayout, TopNavigation } from '@atlaskit/page-layout';
import { Box } from '@atlaskit/primitives';
import { DeveloperTable } from './DeveloperTable';

export const ProductLayout = ({ children,developersList,setDevelopersList }) => {
	return (
		<PageLayout>
			<TopNavigation
				isFixed={true}
				id="confluence-navigation"
				skipLinkTitle="Confluence Navigation"
			>
				<TopNavigationContents />
			</TopNavigation>
			<Content testId="content">
				<LeftSidebar
					isFixed={false}
					width={450}
					id="project-navigation"
					skipLinkTitle="Project Navigation"
					testId="left-sidebar"
					resizeGrabAreaLabel="Resize Current project sidebar"
					resizeButtonLabel="Current project sidebar"
					valueTextLabel="Width"
				>
					<SideNavigationContent developersList={developersList} setDevelopersList={setDevelopersList}/>
				</LeftSidebar>
				<Main id="main-content" skipLinkTitle="Main Content">
					{children}
				</Main>
			</Content>
		</PageLayout>
	);
}

function TopNavigationContents() {
	return (
		<AtlassianNavigation
			label="site"
			moreLabel="More"
			primaryItems={[
				// <PrimaryButton isHighlighted>Item 1</PrimaryButton>,
				// <PrimaryButton>Item 2</PrimaryButton>,
				// <PrimaryButton>Item 3</PrimaryButton>,
				// <PrimaryButton>Item 4</PrimaryButton>,
			]}
		//renderProductHome={ProductHomeExample}
		// renderCreate={DefaultCreate}
		//renderHelp={HelpPopup}
		/>
	);
}

const SideNavigationContent = ({ developersList,setDevelopersList }) => {
	return (
		<SideNavigation label="Project navigation" testId="side-navigation">
			<NavigationHeader>
				<Header description="Use this section to indicate how many hours each developer is available to work on the selected epics">Developer Time Allocation</Header>
			</NavigationHeader>
			<Box>
				<DeveloperTable 
					developersList={developersList}
					setDevelopersList={setDevelopersList}
				/>
			</Box>
		</SideNavigation>
	);
};

/*
 * Components for composing top and side navigation
 */

export const DefaultCreate = () => (
	<Create buttonTooltip="Create" iconButtonTooltip="Create" onClick={noop} text="Create" />
);

const ProductHomeExample = () => (
	<ProductHome
		onClick={console.log}
		icon={JiraIcon}
		logo={JiraLogo}
		siteTitle="Dev Master Hub"
	/>
);

export const HelpPopup = () => {
	const [isOpen, setIsOpen] = useState(false);

	const onClick = () => {
		setIsOpen(!isOpen);
	};

	const onClose = () => {
		setIsOpen(false);
	};

	return (
		<Popup
			placement="bottom-start"
			content={HelpPopupContent}
			isOpen={isOpen}
			onClose={onClose}
			trigger={(triggerProps) => (
				<Help isSelected={isOpen} onClick={onClick} tooltip="Help" {...triggerProps} />
			)}
		/>
	);
};

const HelpPopupContent = () => (
	<MenuGroup>
		<Section title={'Menu Heading'}>
			<ButtonItem>Item 1</ButtonItem>
			<ButtonItem>Item 2</ButtonItem>
			<ButtonItem>Item 3</ButtonItem>
			<ButtonItem>Item 4</ButtonItem>
		</Section>
		<Section title="Menu Heading with separator" hasSeparator>
			<ButtonItem>Item 5</ButtonItem>
			<ButtonItem>Item 6</ButtonItem>
		</Section>
	</MenuGroup>
);