import { useState } from "react";
import { IApiClient } from "./api/client";

interface JoinGameProps {
    navigate(url: string): void;
    apiClient: IApiClient;
}

export const JoinGameInputPage = (props: JoinGameProps) => {

    const [gameCode, setGameCode] = useState('');

    const [loading, setLoading] = useState(false);

    const handleJoinGame = async () => {
        setLoading(true);
        props.navigate(`/games/${gameCode}`);
    }

    return (
        <div>
            <h1>Join Game</h1>
            <label htmlFor="game-code-input">Game Code:</label>
            <input id="game-code-input" type="text" placeholder="Enter Game Code" value={gameCode} onChange={(e) => setGameCode(e.target.value)} />
            <button onClick={handleJoinGame} disabled={loading || gameCode.length !== 4}>Join Game</button>
        </div>
    )

}