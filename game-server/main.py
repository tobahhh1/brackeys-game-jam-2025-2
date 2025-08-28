from dataclasses import dataclass, replace
from typing import Literal
from fastapi import FastAPI
from starlette.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
import asyncio
import uuid
import yaml
from collections import defaultdict

from gamestate.config import GameConfig
from gamestate.game_action import GameAction, PlayerAction
from gamestate.game_state import GameState
from gamestate.neighbors import get_legal_actions
from gamestate.perform import perform_random_action
from gamestate.initial_state import create_initial_state, deal_player_into_game

config = yaml.safe_load(open("config.yaml"))
game_config = GameConfig(**config["game"])

app = FastAPI()
game_id_to_state: dict[str, GameState] = {}
game_id_to_pending_action: dict[str, GameAction] = {}


@dataclass
class ActionPerformedEvent:
    game_id: str 
    action: GameAction
    type: Literal["actions_performed"] = "actions_performed"

@dataclass
class PlayerJoinedEvent:
    game_id: str 
    player_id: str
    type: Literal["player_joined"] = "player_joined"

Event = ActionPerformedEvent | PlayerJoinedEvent

player_id_to_event_queue: dict[str, asyncio.Queue[Event]] = defaultdict(asyncio.Queue[Event])

async def event_generator(player_id: str):
    queue = player_id_to_event_queue[player_id]
    while True:
        data = await queue.get()
        yield f"data: {data}\n\n"

@app.post("/api/v1/player/{player_id}/game/create")
def create_game(player_id: str):
    game_id = str(uuid.uuid4())
    game_state = create_initial_state(game_config)
    game_state = deal_player_into_game(game_state, player_id, game_config)
    return JSONResponse(content={"game_id": game_id, "state": game_state})

@app.post("/api/v1/player/{player_id}/game/{game_id}/join")
def join_game(player_id: str, game_id: str):
    game_state = game_id_to_state.get(game_id)
    if game_state is None:
        return JSONResponse(content={"error": "Game not found"}, status_code=404)
    try:
        new_state = deal_player_into_game(game_state, player_id, game_config)
        game_id_to_state[game_id] = new_state
        for player in new_state.players:
            if player.id != player_id:
                asyncio.create_task(player_id_to_event_queue[player.id].put(
                    PlayerJoinedEvent(game_id=game_id, player_id=player_id)
                ))
        return JSONResponse(content={"game_id": game_id, "state": new_state})
    except ValueError as e:
        return JSONResponse(content={"error": str(e)}, status_code=400)

@app.get("/api/v1/player/{player_id}/events")
async def get_events(player_id: str):
    return EventSourceResponse(event_generator(player_id))

@app.get("/api/v1/player/{player_id}/actions")
def get_actions(player_id: str, state: GameState):
    return JSONResponse(content=list(get_legal_actions(state, player_id, game_config)))

@app.get("/api/v1/game/{game_id}")
def get_game_state(game_id: str):
    game_state = game_id_to_state.get(game_id)
    if game_state is None:
        return JSONResponse(content={"error": "Game not found"}, status_code=404)
    return JSONResponse(content=game_state)


@app.post("/api/v1/player/{player_id}/game/{game_id}/action")
def perform_action(player_id: str, game_id: str, action: PlayerAction):
    
    game_state = game_id_to_state.get(game_id)
    if game_state is None:
        return JSONResponse(content={"error": "Game not found"}, status_code=404)

    if action not in get_legal_actions(game_state, player_id, game_config):
        return JSONResponse(content={"error": "Illegal action"}, status_code=400)

    game_id_to_pending_action[game_id] = replace(
        game_id_to_pending_action.get(game_id, GameAction(player_actions=())),
        player_actions=game_id_to_pending_action.get(game_id, GameAction(player_actions=())).player_actions + ((player_id, action),)
    )

    if frozenset(player_id for player_id, action in game_id_to_pending_action[game_id].player_actions) == frozenset(player.id for player in game_state.players if not player.eliminated):
        # All players have acted, process the actions
        new_state = perform_random_action(game_state, game_id_to_pending_action[game_id])
        game_id_to_state[game_id] = new_state
        game_action = game_id_to_pending_action.pop(game_id)

        # Notify all players of the new state
        for player in new_state.players:
            asyncio.create_task(player_id_to_event_queue[player.id].put(
                ActionPerformedEvent(action=game_action, game_id=game_id)
            ))
