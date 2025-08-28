from dataclasses import dataclass
from typing import Literal

@dataclass(eq=True, frozen=True)
class TakeableCard:
    type: Literal["card"]
    player_id: str
    card_order: int

@dataclass(eq=True, frozen=True)
class TakeableWager:
    type: Literal["wager"]
    player_id: str
    amount: float

@dataclass(eq=True, frozen=True)
class TakeableDiscard:
    type: Literal["discard"]
    player_id: str

@dataclass(eq=True, frozen=True)
class TakeableDeck:
    type: Literal["deck"]

TakeableGameObject = TakeableCard | TakeableWager | TakeableDiscard | TakeableDeck

@dataclass(eq=True, frozen=True)
class TakeAction:
    type: Literal["take"]
    object_to_take: TakeableGameObject
    
@dataclass(eq=True, frozen=True)
class ProtectAction:
    type: Literal["protect"]
    object_to_protect: TakeableGameObject

@dataclass(eq=True, frozen=True)
class DiscardAction:
    type: Literal["discard"]
    card_order: int

PlayerAction = TakeAction | ProtectAction | DiscardAction

@dataclass(eq=True)
class GameAction:
    player_id_to_action: dict[str, PlayerAction]
