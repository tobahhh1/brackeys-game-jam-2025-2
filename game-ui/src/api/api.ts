import { IGameState, IPlayerAction } from "../state/state";
import { IApiClient } from "./client";


export interface IGetGameStateResponse {
    game_id: string;
    state: IGameState;
}

export interface ICreatePlayerResponse {
    player_id: string;
}

export interface ICreateGameResponse {
    game_id: string;
    state: IGameState;
}

export interface IJoinGameResponse {
    game_id: string;
    state: IGameState;
}

export interface IErrorResponse {
    error: string;
}

export type IEvent =
    | { game_id: string; action: any; type: "actions_performed" }
    | { game_id: string; player_id: string; type: "player_joined" };


// --- API Wrappers ---

export async function createPlayer(apiClient: IApiClient): Promise<ICreatePlayerResponse> {
    const res = await fetch(`${apiClient.baseUrl}/players`, { method: "POST" });
    return res.json();
}

export async function createGame(apiClient: IApiClient, playerId: string): Promise<ICreateGameResponse | IErrorResponse> {
    const res = await fetch(`${apiClient.baseUrl}/players/${playerId}/games/create`, { method: "POST" });
    return res.json();
}

export async function joinGame(apiClient: IApiClient, playerId: string, gameId: string): Promise<IJoinGameResponse | IErrorResponse> {
    const res = await fetch(`${apiClient.baseUrl}/players/${playerId}/games/${gameId}/join`, { method: "POST" });
    return res.json();
}

export async function getGameState(apiClient: IApiClient, gameId: string): Promise<IGetGameStateResponse | IErrorResponse> {
    const res = await fetch(`${apiClient.baseUrl}/games/${gameId}`);
    return res.json();
}

export async function getActions(apiClient: IApiClient, playerId: string, state: IGameState): Promise<IPlayerAction[]> {
    const res = await fetch(`${apiClient.baseUrl}/players/${playerId}/actions`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
    });
    return res.json();
}

export async function performAction(
    apiClient: IApiClient,
    playerId: string,
    gameId: string,
    action: IPlayerAction
): Promise<IGameState | IErrorResponse> {
    const res = await fetch(`${apiClient.baseUrl}/players/${playerId}/games/${gameId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
    });
    return res.json();
}

// SSE event stream (returns a stream, not a promise)
export function getEvents(apiClient: IApiClient, playerId: string): EventSource {
    return new EventSource(`${apiClient.baseUrl}/players/${playerId}/events`);
}