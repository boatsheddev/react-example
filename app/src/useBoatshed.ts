import { useCallback, useState, useRef } from 'react'; 

const OAUTH_STATE_KEY = '__boatshed-oauth2-state';
const OAUTH_RESPONSE = '__boatshed-oauth2-response';
const POPUP_HEIGHT = 700;
const POPUP_WIDTH = 600;

export const useBoatshed = (props) => {
  const {
      authorizeUrl,
      clientId,
      redirectUri,
      scope = '',
    } = props;

  const popupRef = useRef<Window | null>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const [{ loading, error }, setUI] = useState<{loading: boolean, error: string | null}>({ loading: false, error: null });

  return useCallback(() => {
      setUI({
        loading: true,
        error: null,
      });

      const state = generateState();
      saveState(state);

      popupRef.current = openPopup(
        enhanceAuthorizeUrl(authorizeUrl, clientId, redirectUri, scope, state)
      );

      async function handleMessageListener(message) {
        try {
          const type = message && message.data && message.data.type;
          if (type === OAUTH_RESPONSE) {
            const errorMaybe = message && message.data && message.data.error;
            if (errorMaybe) {
              setUI({
                loading: false,
                error: errorMaybe || 'Unknown Error',
              });
            } else {
              const code = message && message.data && message.data.payload && message.data.payload.code;
              const response = await fetch(
                formatExchangeCodeForTokenServerURL(
                  'http://localhost:1995/token',
                  clientId,
                  code,
                  redirectUri
                )
              );
              if (!response.ok) {
                setUI({
                  loading: false,
                  error: "Failed to exchange code for token",
                });
              } else {
                let payload = await response.json();
                setUI({
                  loading: false,
                  error: null,
                });
                console.log(payload);
              }
            }
          }
        } catch (genericError) {
          console.error(genericError);
          setUI({
            loading: false,
            error: genericError.toString(),
          });
        } finally {
          // Clear stuff ...
          cleanup(intervalRef, popupRef, handleMessageListener);
        }
      }

      window.addEventListener('message', handleMessageListener);

      // Begin interval to check if popup was closed forcefully by the user
      intervalRef.current = setInterval(() => {
        const popupClosed = !popupRef.current || !popupRef.current.window || popupRef.current.window.closed;
        if (popupClosed) {
          // Popup was closed before completing auth...
          setUI((ui) => ({
            ...ui,
            loading: false,
          }));
          console.warn('Warning: Popup was closed before completing authentication.');
          clearInterval(intervalRef.current);
          removeState();
          window.removeEventListener('message', handleMessageListener);
        }
		  }, 250);

      // Remove listener(s) on unmount
      return () => {
        window.removeEventListener('message', handleMessageListener);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [])

}


const generateState = () => {
	const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let array = new Uint8Array(40);
	window.crypto.getRandomValues(array);
	array = array.map((x: number) => validChars.codePointAt(x % validChars.length));
	const randomState = String.fromCharCode.apply(null, array);
	return randomState;
};

const saveState = (state: string) => {
	sessionStorage.setItem(OAUTH_STATE_KEY, state);
};

const removeState = () => {
	sessionStorage.removeItem(OAUTH_STATE_KEY);
};

const openPopup = (url : string) => {
	const top = window.outerHeight / 2 + window.screenY - POPUP_HEIGHT / 2;
	const left = window.outerWidth / 2 + window.screenX - POPUP_WIDTH / 2;
	return window.open(
		url,
		'OAuth2 Popup',
		`height=${POPUP_HEIGHT},width=${POPUP_WIDTH},top=${top},left=${left}`
	);
};

const closePopup = (popupRef) => {
	popupRef.current?.close();
};

const enhanceAuthorizeUrl = (
	authorizeUrl,
	clientId,
	redirectUri,
	scope,
	state
) => {
	return `${authorizeUrl}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
};


const cleanup = (
	intervalRef,
	popupRef,
	handleMessageListener
) => {
	clearInterval(intervalRef.current);
	closePopup(popupRef);
	removeState();
	window.removeEventListener('message', handleMessageListener);
};

const objectToQuery = (object) => {
	return new URLSearchParams(object).toString();
};

const formatExchangeCodeForTokenServerURL = (
	serverUrl,
	clientId,
	code,
	redirectUri
) => {
	return `${serverUrl}?${objectToQuery({
		client_id: clientId,
		code,
		redirect_uri: redirectUri,
	})}`;
}
