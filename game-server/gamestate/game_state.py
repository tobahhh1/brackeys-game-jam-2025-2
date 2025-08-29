from dataclasses import dataclass, field

@dataclass(eq=True, frozen=True)
class Card():
    suit: int
    rank: int
    protected: bool = False
    # If the card has been removed from the hand in the middle of processing a turn.
    # Not exposed to the user of the class, only for internal use.
    _gone: bool = field(default=False, compare=False, repr=False, hash=False)

@dataclass(eq=True, frozen=True)
class NotProtectableCard:
    suit: int
    rank: int

@dataclass(eq=True, frozen=True)
class Deck():
    cards: tuple[NotProtectableCard, ...]
    protected: bool = False

@dataclass(eq=True, frozen=True)
class Hand:
    cards: tuple[Card, ...]
    protected: bool = False

@dataclass(eq=True, frozen=True)
class DiscardPile():
    cards: tuple[Card, ...]
    protected: bool = False

@dataclass(eq=True, frozen=True)
class Wager():
    amount: float
    protected: bool = False

@dataclass(eq=True, frozen=True)
class Stack:
    value: float

@dataclass(eq=True, frozen=True)
class Player:
    id: str
    hand: Hand
    discard_pile: DiscardPile
    stack: Stack
    wager: Wager
    eliminated: bool = False

@dataclass(eq=True, frozen=True)
class GameState:
    players: tuple[Player, ...]
    deck: Deck
