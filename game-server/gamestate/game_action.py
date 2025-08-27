from dataclasses import dataclass
from typing import Literal

@dataclass
class TakeableCard:
    type: Literal["card"]
    player_id: str
    card_order: int

@dataclass
class TakeableWager:
    type: Literal["wager"]
    player_id: str
    amount: float

@dataclass
class TakeableDiscard:
    type: Literal["discard"]
    player_id: str

@dataclass
class TakeableDeck:
    type: Literal["deck"]

TakeableGameObject = TakeableCard | TakeableWager | TakeableDiscard

@dataclass
class TakeAction:
    object_to_take: TakeableGameObject
    
@dataclass
class ProtectAction:
    object_to_protect: TakeableGameObject

PlayerAction = TakeAction | ProtectAction

@dataclass
class GameAction:
    player_id_to_action: dict[str, PlayerAction]
