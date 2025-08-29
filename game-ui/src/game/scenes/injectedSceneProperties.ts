
// Scene properties that can be injected from the outside into the scene

import { IApiClient } from "../../api/client"

// at runtime
export interface IInjectedSceneProperties {
    api_client: IApiClient
    navigate: (path: string) => void
    game_id: string
    player_id: string
}