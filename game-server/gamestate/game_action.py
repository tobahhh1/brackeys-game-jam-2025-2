from dataclasses import dataclass
from typing import Literal

@dataclass(eq=True, frozen=True)
class TakeableCard:
    player_id: str
    card_order: int
    type: Literal["card"] = "card"

@dataclass(eq=True, frozen=True)
class TakeableWager:
    player_id: str
    amount: float
    type: Literal["wager"] = "wager"

@dataclass(eq=True, frozen=True)
class TakeableDiscard:
    player_id: str
    type: Literal["discard"] = "discard" 

@dataclass(eq=True, frozen=True)
class TakeableDeck:
    type: Literal["deck"] = "deck"

TakeableGameObject = TakeableCard | TakeableWager | TakeableDiscard | TakeableDeck

@dataclass(eq=True, frozen=True)
class TakeAction:
    object_to_take: TakeableGameObject
    type: Literal["take"] = "take"
    
@dataclass(eq=True, frozen=True)
class ProtectAction:
    object_to_protect: TakeableGameObject
    type: Literal["protect"] = "protect"

@dataclass(eq=True, frozen=True)
class DiscardAction:
    card_order: int
    type: Literal["discard"] = "discard"

PlayerAction = TakeAction | ProtectAction | DiscardAction

@dataclass(eq=True)
class GameAction:
    player_actions: tuple[tuple[str, PlayerAction], ...]
