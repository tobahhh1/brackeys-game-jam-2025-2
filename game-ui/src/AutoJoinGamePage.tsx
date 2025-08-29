import { useEffect } from "react";
import { IApiClient } from "./api/client";
import { useParams } from "react-router-dom";
import { createPlayer, joinGame } from "./api/api";

class AutoJoinGamePageProps {
    navigate: (url: string) => void;
    apiClient: IApiClient;
}

export const AutoJoinGamePage = (props: AutoJoinGamePageProps) => {

    const { game_id } = useParams()

    useEffect(() => {
        (async () => {
            if (game_id && game_id.length > 0) {
                const playerId = await createPlayer(props.apiClient)
                await joinGame(props.apiClient, playerId.player_id, game_id);
                props.navigate(`/players/${playerId.player_id}/games/${game_id}`);
            } else {
                props.navigate(`/join-game`);
            }
        })()
    }, [game_id])

    return (
        <h1>Joining Game...</h1>
    )
}