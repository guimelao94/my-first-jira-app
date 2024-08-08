/**
 * @jsxRuntime classic
 */
/** @jsx jsx */
import { useContext, useEffect, useState } from 'react';

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
import { fetchAvailableEpics, fetchSelectedEpics, GenerateIssueData, ProcessEpic } from '../store';
import { useDispatch, useSelector } from 'react-redux';
import { useThunk } from '../hooks/useThunk';
import { HandleEpicThunks } from './ThunkHandlers';
import { groupByDevs } from '../Utils/GroupingTools';
import { RefreshDevelopersList } from '../reducers/Functions/Developers';
import { setDevelopers } from '../store/slices/epicSlice';

export const ProductLayout = ({ children }) => {
	const [getAvailableEpics, AvailableEpicsLoading, AvailableEpicsError] = useThunk(fetchAvailableEpics);
	const [getSelectedEpics, SelectedEpicsLoading, SelectedEpicsError] = useThunk(fetchSelectedEpics);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const dispatch = useDispatch();
	const epics = useSelector((state) => {
		return state.epics;
	})

	useEffect(() => {
		// getAvailableEpics();
		// getSelectedEpics();
		// setIsLoading(true);
		HandleEpicThunks(dispatch);
	}, []);

	useEffect(() => {
		// getAvailableEpics();
		// getSelectedEpics();
		// setIsLoading(true);
		if(epics.loaded){
			var devs = groupByDevs(epics.issues, 'dev');
    		RefreshDevelopersList(devs).then((data)=>{
				console.log(data);
				dispatch(setDevelopers(data));
			});
		}	
		
	}, [epics.loaded]);

	useEffect(() => {
		if(epics.loaded){
			console.log(epics);
		}
	}, [epics.Developers]);

if (isLoading) {
	return <div>Loading...</div>
}

if (error) {
	return <div>Error fetching data...</div>
}
return (
	<div>
		<div>{epics.data.length}</div>
		{epics.data && epics.data.map((epic) => (
			<div>
				<p>{epic.EpicKey}</p>
				{epics.issues && epics.issues.map((issue) => (
					<p>{issue.ticketNumber}</p>
				))}
			</div>
		))}
	</div>
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
	return (
		<SideNavigation label="Project navigation" testId="side-navigation">
			<NavigationHeader>
				<Header description="Use this section to indicate how many hours each developer is available to work on the selected epics">Developer Time Allocation</Header>
			</NavigationHeader>
			<Box>
				<DeveloperTable />
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