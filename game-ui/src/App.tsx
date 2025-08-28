import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { Route, Routes, useNavigate } from 'react-router';
import { apiClient } from './api/client';
import { MainMenu } from './MainMenu';
import { JoinGameInputPage } from './JoinGameInputPage';
import { AutoJoinGamePage } from './AutoJoinGamePage';

function App() {

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const navigate = useNavigate();

    return (
        <div id="app">
            <Routes >
                <Route path="/games/:game_id" element={<AutoJoinGamePage navigate={navigate} apiClient={apiClient} />} />
                <Route path="/players/:player_id/games/:game_id" element={<PhaserGame ref={phaserRef} />} />
                <Route path="/join-game" element={<JoinGameInputPage apiClient={apiClient} navigate={navigate} />} />
                <Route path="/" element={<MainMenu navigate={navigate} apiClient={apiClient} />} />
            </Routes>
        </div>
    )
}

export default App