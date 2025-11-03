/**
 * @jsxRuntime classic
 */
/** @jsx jsx */
import React, { useEffect, useState } from 'react';

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
import { Box, xcss } from '@atlaskit/primitives';
import { DeveloperTable } from './DeveloperTable';
import { useDispatch, useSelector } from 'react-redux';
import { HandleEpicThunks } from './ThunkHandlers';
import { fetchCurrentUser, fetchUserRole } from '../store';
import Spinner from '@atlaskit/spinner';
import { TimeOffTable } from './TimeOffTable';
import { HolidaysTable } from './HolidaysTable';
import RoleBasedView from './RoleBasedView';

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
	const currentUser = useSelector((state) => state.epics.currentUser);
	const userRole = useSelector((state) => state.epics.userRole);
	const isUserLoading = useSelector((state) => state.epics.isUserLoading);

	// Fetch user info on mount
	useEffect(() => {
		let isMounted = true;
		const initializeUser = async () => {
			try {
				setIsLoading(true);
				setError(null);
				// Fetch user first - wait for it to complete
				const userResult = await dispatch(fetchCurrentUser());
				// Only fetch role if we got a valid user with accountId
				if (isMounted && userResult?.payload?.accountId) {
					await dispatch(fetchUserRole());
				}
			} catch (err) {
				if (isMounted) {
					console.error('Error initializing user:', err);
					setError(err.message || 'Failed to initialize user');
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};
		initializeUser();
		return () => {
			isMounted = false;
		};
	}, [dispatch]);

	useEffect(() => {
		// Only fetch epics after user is loaded and has accountId
		if (currentUser?.accountId && !isUserLoading) {
			const currentState = { reloadCounter };
			HandleEpicThunks(dispatch, 'FullRefresh', currentState, currentUser.accountId);
		}
	}, [dispatch, reloadCounter, currentUser?.accountId, isUserLoading]);

	useEffect(() => {
		if (saveDevCounter > 0) {
			const currentState = { SaveDevCounter: saveDevCounter };
			HandleEpicThunks(dispatch, 'EpicRefresh', currentState, currentUser?.accountId);
		}
	}, [dispatch, saveDevCounter, currentUser]);

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
				{(Array.isArray(selected) && selected.length > 0 && currentUser?.accountId && !isUserLoading) && <LeftSidebar
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
					{error ? (
						<Box xcss={xcss({ padding: 'space.400', textAlign: 'center' })}>
							<p>Error: {error}</p>
							<p>Please refresh the page.</p>
						</Box>
					) : isUserLoading ? (
						<Box xcss={xcss({ padding: 'space.400', display: 'flex', justifyContent: 'center' })}>
							<Spinner size="large" />
						</Box>
					) : (
						<RoleBasedView />
					)}
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
	const userRole = useSelector((state) => state.epics.userRole);
	const isAdmin = userRole === 'Admin';
	const isManager = userRole === 'Manager';
	
	return (
		<SideNavigation label="Project navigation" testId="side-navigation">
			{isAdmin && (
				<>
					<NavigationHeader>
						<Header description="Use this section to indicate how many hours each developer is available to work on the selected epics">Developer Time Allocation</Header>
					</NavigationHeader>
					<Box>
						{(developers && developers.length > 0) ? <DeveloperTable /> : <Spinner size={'large'} />}
					</Box>
				</>
			)}

			<NavigationHeader>
				<Header description="Scheduled developer time off">Developer Time Off</Header>
			</NavigationHeader>
			<Box>
				{(developers && developers.length > 0) ? <TimeOffTable readOnly={isManager} /> : <Spinner size={'large'} />}
			</Box>

			<NavigationHeader>
				<Header description="Holidays">Holidays</Header>
			</NavigationHeader>
			<Box>
				{(developers && developers.length > 0) ? <HolidaysTable readOnly={isManager} /> : <Spinner size={'large'} />}
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