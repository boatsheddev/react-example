import React, { useEffect } from 'react';

const OAUTH_STATE_KEY = '__boatshed-oauth2-state';
const OAUTH_RESPONSE = '__boatshed-oauth2-response';

const checkState = (receivedState) => {
	const state = sessionStorage.getItem(OAUTH_STATE_KEY);
	return state === receivedState;
};

const queryToObject = (query) => {
	const parameters = new URLSearchParams(query);
	return Object.fromEntries(parameters.entries());
};

const OAuthPopup = (props) => {
	const {
		Component = (
			<div style={{ margin: '12px' }} data-testid="popup-loading">
				Loading...
			</div>
		),
	} = props;

	// On mount
	useEffect(() => {
		const payload = queryToObject(window.location.search.split('?')[1]);
		const state = payload && payload.state;
		const error = payload && payload.error;

		if (!window.opener) {
			throw new Error('No window opener');
		}

		if (error) {
			window.opener.postMessage({
				type: OAUTH_RESPONSE,
				error: decodeURI(error) || 'OAuth error: An error has occured.',
			});
		} else if (state && checkState(state)) {
			window.opener.postMessage({
				type: OAUTH_RESPONSE,
				payload,
			});
		} else {
			window.opener.postMessage({
				type: OAUTH_RESPONSE,
				error: 'OAuth error: State mismatch.',
			});
		}
	}, []);

	return Component;
};

export default OAuthPopup;
