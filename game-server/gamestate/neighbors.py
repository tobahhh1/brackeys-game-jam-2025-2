from typing import Iterable
from gamestate.config import GameConfig
from gamestate.game_action import DiscardAction, PlayerAction, ProtectAction, TakeAction, TakeableCard, TakeableDeck, TakeableDiscard, TakeableGameObject, TakeableWager
from gamestate.game_state import GameState, Player

def get_takeables(player: Player, config: GameConfig) -> Iterable[TakeableGameObject]:
    if player.wager.amount > 0:
        yield TakeableWager(player_id=player.id, amount=min(config.wager_steal, player.wager.amount))
    for i, _ in enumerate(player.hand.cards):
        yield TakeableCard(player_id=player.id, card_order=i)
    yield TakeableDeck()
    yield TakeableDiscard(player_id=player.id)


def get_legal_actions(state: GameState, player_id: str, config: GameConfig) -> set[PlayerAction]:
    player = next(p for p in state.players if p.id == player_id)
    if player.eliminated:
        return set()
    
    # Protect own objects
    legal_actions = set()
    for obj in get_takeables(player, config):
        legal_actions.add(ProtectAction(object_to_protect=obj))

    # Take other players' objects
    for other_player in state.players:
        if other_player.id == player_id or other_player.eliminated:
            continue
        for obj in get_takeables(other_player, config):
            if not isinstance(obj, TakeableWager) and len(player.hand.cards) >= config.max_hand_size:
                continue
            legal_actions.add(TakeAction(object_to_take=obj))
    for i, _ in enumerate(player.hand.cards):
        legal_actions.add(DiscardAction(card_order=i))

    return legal_actions
