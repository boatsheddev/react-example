import logo from './logo.svg';
import './App.css';
import {useBoatshed} from './useBoatshed.ts';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import  OAuthPopup  from './Oauth2Popup.tsx';

const Router = () => (
	<BrowserRouter>
		<Routes>
			<Route element={<OAuthPopup />} path="/callback" />
			<Route element={<App />} path="/" />
		</Routes>
	</BrowserRouter>
);


function App() {

  // boatshedURL is the Boatshed URL. Unless you're on a non production version this will be boatshed.io.
  // const boatshedURL = "alpha.boatshed.io"
  const boatshedURL = "https://alpha.boatshed.io"
  const boatshedClientID = "6efdcda7e4c5dbfc9417094fedb6b73bc0ea8a913ac4d6aa35d144aa95952997"
  const redirectURI = "https://alpha.boatshed.io/auth-sessions/example-callback"
  const scope = "bank:account bank:balance"


  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          The Boatshed React demo app.
        </p>
        <a onClick={useBoatshed({
          authorizeUrl: boatshedURL+"/api/authorize",
          clientId: boatshedClientID,
          redirectUri: redirectURI,
          scope: scope,

        })}

          className="App-link"
        >
          Start Consent Flow
        </a>
      </header>
    </div>
  );
}

export default Router;
