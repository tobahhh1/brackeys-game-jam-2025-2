import random

from gamestate.config import GameConfig
from gamestate.game_state import Card, Deck, DiscardPile, GameState, Hand, NotProtectableCard, Player, Stack, Wager


def create_initial_state(config: GameConfig) -> GameState:
    deck = create_initial_deck(config)
    return GameState(
        players=(),
        deck=deck,
    )

def deal_player_into_game(state: GameState, player_id: str, config: GameConfig) -> GameState:
    if any(p.id == player_id for p in state.players):
        raise ValueError(f"Player with id {player_id} already in game.")
    deck, hand_cards = deal_cards(state.deck, config.initial_hand_size)
    new_player = Player(
        id=player_id,
        hand=Hand(cards=hand_cards),
        discard_pile=DiscardPile(cards=()),
        stack=Stack(value=config.initial_stack),
        wager=Wager(amount=config.initial_wager),
        eliminated=False
    )
    return GameState(
        players=state.players + (new_player,),
        deck=deck,
    )

def deal_cards(deck: Deck, count: int) -> tuple[Deck, tuple[Card, ...]]:
    if count > len(deck.cards):
        raise ValueError("Not enough cards in deck to deal the requested hand size.")
    dealt_cards = random.sample(list(deck.cards), count)
    remaining_deck = Deck(cards=frozenset(deck.cards - frozenset(dealt_cards)))
    return remaining_deck, tuple(
        Card(suit=card.suit, rank=card.rank)
        for card in dealt_cards
    )

def create_initial_deck(config: GameConfig) -> Deck:
    return Deck(cards=frozenset((
        NotProtectableCard(suit=suit, rank=rank)
        for suit in range(1, config.num_suits + 1)
        for rank in range(1, config.num_ranks + 1)
    )))
