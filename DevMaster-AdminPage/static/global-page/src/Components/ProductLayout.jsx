/**
 * @jsxRuntime classic
 */
/** @jsx jsx */
import { useEffect, useState } from 'react';

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
import { useDispatch, useSelector } from 'react-redux';
import { HandleEpicThunks } from './ThunkHandlers';
import Spinner from '@atlaskit/spinner';
import BasicGrid from './BasicGrid';
import { EpicCard } from './EpicCard/EpicCard';
import { TimeOffTable } from './TimeOffTable';
import { HolidaysTable } from './HolidaysTable';

export const ProductLayout = ({ children }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const dispatch = useDispatch();
	
	// Memoized selectors to prevent unnecessary re-renders
	const reloadCounter = useSelector((state) => state.epics.reloadCounter);
	const saveDevCounter = useSelector((state) => state.epics.SaveDevCounter);
	const selected = useSelector((state) => state.epics.Selected);
	const data = useSelector((state) => state.epics.data);
	const available = useSelector((state) => state.epics.Available);
	const loaded = useSelector((state) => state.epics.loaded);

	useEffect(() => {
		const currentState = { reloadCounter };
		HandleEpicThunks(dispatch, 'FullRefresh', currentState);
	}, [dispatch, reloadCounter]);

	useEffect(() => {
		if (saveDevCounter > 0) {
			const currentState = { SaveDevCounter: saveDevCounter };
			HandleEpicThunks(dispatch, 'EpicRefresh', currentState);
		}
	}, [dispatch, saveDevCounter]);

	if (isLoading) {
		return <div>Loading...</div>
	}

	if (error) {
		return <div>Error fetching data...</div>
	}
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
				{(selected && selected.length > 0) && <LeftSidebar
					isFixed={false}
					width={450}
					id="project-navigation"
					skipLinkTitle="Project Navigation"
					testId="left-sidebar"
					resizeGrabAreaLabel="Resize Current project sidebar"
					resizeButtonLabel="Current project sidebar"
					valueTextLabel="Width"
				>
					<SideNavigationContent />
				</LeftSidebar>}
				<Main id="main-content" skipLinkTitle="Main Content">
					<BasicGrid>
						{
							data && available && selected && data.map((item) => (
								<EpicCard key={item.EpicKey} epicKey={item.EpicKey} />
							))
						}
					</BasicGrid>
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

const SideNavigationContent = ({ }) => {
	const developers = useSelector((state) => state.epics.Developers);
	const holidays = useSelector((state) => state.epics.Holidays);
	return (
		<SideNavigation label="Project navigation" testId="side-navigation">
			<NavigationHeader>
				<Header description="Use this section to indicate how many hours each developer is available to work on the selected epics">Developer Time Allocation</Header>
			</NavigationHeader>
			<Box>
				{(developers && developers.length > 0) ? <DeveloperTable /> : <Spinner size={'large'} />}
			</Box>

			<NavigationHeader>
				<Header description="Scheduled developer time off">Developer Time Off</Header>
			</NavigationHeader>
			<Box>
				{(developers && developers.length > 0) ? <TimeOffTable /> : <Spinner size={'large'} />}
			</Box>

			<NavigationHeader>
				<Header description="Holidays">Holidays</Header>
			</NavigationHeader>
			<Box>
				{(developers && developers.length > 0) ? <HolidaysTable /> : <Spinner size={'large'} />}
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
		onClick={noop}
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