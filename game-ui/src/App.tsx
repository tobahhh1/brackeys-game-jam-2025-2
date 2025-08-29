import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { Route, Routes, useNavigate } from 'react-router';
import { apiClient } from './api/client';
import { MainMenu } from './MainMenu';
import { JoinGameInputPage } from './JoinGameInputPage';
import { AutoJoinGamePage } from './AutoJoinGamePage';
import { getActions, getEvents, getGameState } from './api/api';
import { IInjectedSceneProperties } from './game/scenes/injectedSceneProperties';
import { EventBus } from './game/EventBus';


function App() {

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const navigate = useNavigate();

    const destroyPhaserGame = () => {
        phaserRef.current?.game?.destroy(false)
        if (phaserRef.current) {
            phaserRef.current.game = null;
        }
        EventBus.destroy();
    }


    const onSceneReady = async (scene_instance: Phaser.Scene) => {
        // Fetch the game state, then have the scene render it
        if (!("injectedSceneProperties" in scene_instance)) {
            return;
        }
        const scene_properties = scene_instance.injectedSceneProperties as IInjectedSceneProperties
        let game_state = await getGameState(apiClient, scene_properties.game_id!)
        // Keep trying if there's an error (e.g. game not found yet)
        if ("error" in game_state) {
            alert("Game not found. Maybe try another code?")
            destroyPhaserGame();
            navigate("/join-game");
            return;
        }

        console.debug("Fetched game state:", game_state);

        const game_actions = await getActions(apiClient, scene_properties.player_id, scene_properties.game_id);
        if ("error" in game_actions) {
            alert("Error fetching actions. Maybe the game was ended?")
            destroyPhaserGame();
            navigate("/")
            return;
        }

        EventBus.emit('game-state-updated', game_state.state);
        EventBus.emit('legal-actions-updated', game_actions);

        const events = await getEvents(apiClient, scene_properties.player_id);
        events.addEventListener('message', async (event) => {
            const data = JSON.parse(event.data);
            console.debug("Received event:", data);

            // Fetch the updated game state
            let updated_game_state = await getGameState(apiClient, scene_properties.game_id)
            if ("error" in updated_game_state) {
                alert("Game not found. Maybe it was ended?")
                destroyPhaserGame();
                navigate("/")
                return;
            }

            let updated_legal_actions = await getActions(apiClient, scene_properties.player_id, scene_properties.game_id);
            if ("error" in updated_legal_actions) {
                alert("Error fetching actions. Maybe the game was ended?")
                destroyPhaserGame();
                navigate("/")
                return;
            }

            console.debug("Fetched updated game state:", updated_game_state);
            console.debug("Fetched updated legal actions:", updated_legal_actions);
            EventBus.emit('game-state-updated', updated_game_state.state);
            EventBus.emit('legal-actions-updated', updated_legal_actions);
            EventBus.emit(data.type, data)
        })
    }


    return (
        <div id="app">
            <Routes >
                <Route path="/games/:game_id" element={<AutoJoinGamePage navigate={navigate} apiClient={apiClient} />} />
                <Route path="/players/:player_id/games/:game_id" element={<PhaserGame ref={phaserRef} onSceneReady={onSceneReady} />} />
                <Route path="/join-game" element={<JoinGameInputPage apiClient={apiClient} navigate={navigate} />} />
                <Route path="/" element={<MainMenu navigate={navigate} apiClient={apiClient} />} />
            </Routes>
        </div>
    )
}

export default App