import { useState } from "react";
import { IApiClient } from "./api/client";
import { createGame, createPlayer } from "./api/api";

interface MainMenuProps {
    navigate(url: string): void;
    apiClient: IApiClient;
}

export const MainMenu = (props: MainMenuProps) => {

    const [loading, setLoading] = useState(false);

    const handleStartGame = async () => {
        setLoading(true);
        const playerRes = await createPlayer(props.apiClient);
        const gameRes = await createGame(props.apiClient, playerRes.player_id);
        if ("error" in gameRes) {
            setLoading(false);
            alert(`Error creating game: ${gameRes.error}`);
            return;
        }
        props.navigate(`/players/${playerRes.player_id}/games/${gameRes.game_id}`);
    }

    const handleJoinGame = () => {
        props.navigate(`/join-game`);
    }

    return (
        <div id="main-menu">
            <h1>Hungry Assassain Poker</h1>
            <button disabled={loading} onClick={handleStartGame}>Start Game</button>
            <button disabled={loading} onClick={handleJoinGame}>Join Game</button>
        </div>
    )
}
