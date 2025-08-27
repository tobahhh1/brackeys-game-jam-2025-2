from dataclasses import dataclass

@dataclass
class Card:
    suit: int
    rank: int

@dataclass
class Deck:
    cards: set[Card]

@dataclass
class Hand:
    cards: list[Card]

@dataclass
class Player:
    id: str
    hand: Hand
    discard_pile: list[Card]
    wager: float
    stack_value: float

@dataclass
class GameState:
    players: list[Player]
    deck: Deck
