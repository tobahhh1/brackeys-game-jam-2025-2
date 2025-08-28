from dataclasses import dataclass
protected: bool = False

@dataclass(eq=True, frozen=True)
class Card():
    suit: int
    rank: int
    protected: bool = False

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
