from dataclasses import replace
from gamestate.game_action import GameAction, ProtectAction, TakeAction, DiscardAction
from gamestate.game_state import GameState


def perform_action(state: GameState, action: GameAction) -> set[GameState]:
    """Returns a set of all possible next game states after performing the given action on the given state."""
    current_possible_gamestates = set()
    # Perform protect actions first
    for (player_id, player_action) in action.player_actions:
        if player_action.type == "protect":
            current_possible_gamestates.update(perform_protect(state, player_id, player_action))
    # If there were no protect actions, then the only possible state is the original state.
    # If there was a protect action, then the original state is not a possible state anymore.
    if len(current_possible_gamestates) == 0:
        current_possible_gamestates.add(state)
    # Then perform take actions, punishing players who tried to take protected objects
    for (player_id, player_action) in action.player_actions:
        if player_action.type == "take":
            for state in current_possible_gamestates.copy():
                current_possible_gamestates.update(perform_take(state, player_id, player_action))

    # If there were no take actions, then the only possible state is the original state.
    # If there was a take action, then the original state is not a possible state anymore.
    if len(current_possible_gamestates) == 0:
        current_possible_gamestates.add(state)

    # Then discard actions. Doing this after take actions prevents players from taking discarded cards.
    for (player_id, player_action) in action.player_actions:
        if player_action.type == "discard":
            for state in current_possible_gamestates.copy():
                current_possible_gamestates.update(perform_discard(state, player_id, player_action))

                
    return {clear_protections(s) for s in current_possible_gamestates}

def clear_protections(state: GameState) -> GameState:
    return replace(state,
        deck=replace(state.deck, protected=False),
        players=tuple(
            replace(p,
                hand=replace(p.hand, protected=False, cards=tuple(replace(c, protected=False) for c in p.hand.cards)),
                discard_pile=replace(p.discard_pile, protected=False),
                wager=replace(p.wager, protected=False)
            )
            for p in state.players
        )
    )

def perform_protect(state: GameState, player_id: str, action: ProtectAction) -> set[GameState]:

    if action.object_to_protect.type == "deck":
        return {
            replace(state,
                deck=replace(state.deck, protected=True)
            )
        }

    protected_player = next(p for p in state.players if p.id == action.object_to_protect.player_id)
    if protected_player is None:
        raise ValueError(f"Player with id {action.object_to_protect.player_id} not found")
    if action.object_to_protect.type == "card":
        try:
            return {
                replace(state,
                    players=tuple(
                        replace(p,
                            hand=replace(p.hand, 
                                        cards=tuple(
                                            replace(c, protected=True) if (p.id == protected_player.id and i == action.object_to_protect.card_order) else c
                                            for i, c in enumerate(p.hand.cards)
                                        )
                            )
                        ) 
                        if p.id == protected_player.id else p
                        for p in state.players
                    )
                )
            }
        except IndexError:
            raise ValueError(f"Player {protected_player.id} does not have a card at order {action.object_to_protect.card_order}")
        return {state}
    elif action.object_to_protect.type == "wager":
        return {
            replace(state,
                players=tuple(
                    replace(p,
                        wager=replace(p.wager, protected=True)
                    ) 
                    if p.id == protected_player.id else p
                    for p in state.players
                )
            )
        }
    elif action.object_to_protect.type == "discard":
        return {
            replace(state,
                players=tuple(
                    replace(p,
                        discard_pile=replace(p.discard_pile, protected=True)
                    ) 
                    if p.id == protected_player.id else p
                    for p in state.players
                )
            )
        }
    else:
        raise ValueError(f"Unknown object to protect type: {action.object_to_protect.type}")

def find_player(state: GameState, player_id: str):
    player = next(p for p in state.players if p.id == player_id)
    if player is None:
        raise ValueError(f"Player with id {player_id} not found")
    return player

def eliminate_player(state: GameState, player_id: str) -> GameState:
    next_state = replace(state)
    replace(find_player(next_state, player_id), eliminated= True)
    return next_state

def perform_take(state: GameState, player_id: str, action: TakeAction) -> set[GameState]:
    if action.object_to_take.type == "deck": 
        if state.deck.protected:
            return {eliminate_player(state, player_id)}
        if len(state.deck.cards) == 0:
            raise ValueError("Cannot take from an empty deck")
        result = set()
        for card in state.deck.cards:
            next_state = replace(state, 
                deck=replace(state.deck, cards=frozenset(c for c in state.deck.cards if c != card))
            )
            result.add(next_state)
        return result
    elif action.object_to_take.type == "card":
        target_player = find_player(state, action.object_to_take.player_id)
        if target_player.hand.protected or target_player.hand.cards[action.object_to_take.card_order].protected:
            return {eliminate_player(state, player_id)}
        return {
            replace(state,
                players=tuple(
                    replace(p,
                        hand=replace(p.hand, 
                                    cards
                                     =  p.hand.cards
                                     + (target_player.hand.cards[action.object_to_take.card_order],))
                    ) 
                    if p.id == player_id else 
                    replace(p,
                            hand=replace(p.hand, 
                                        cards=tuple(
                                            c for i, c in enumerate(p.hand.cards) 
                                            if not (p.id == target_player.id and i == action.object_to_take.card_order)
                                        )
                            )
                    ) 
                    if p.id == target_player.id else p
                    for p in state.players
                )
            )
        }
    elif action.object_to_take.type == "wager":
        target_player = find_player(state, action.object_to_take.player_id)
        if target_player.wager.protected:
            return {eliminate_player(state, player_id)}
        next_state = replace(state,
            players=tuple(
                replace(p,
                    stack=replace(p.stack, value=p.stack.value + action.object_to_take.amount),
                )
                if p.id == player_id else 
                replace(p,
                    wager=replace(p.wager, amount=p.wager.amount - action.object_to_take.amount),
                )
                if p.id == target_player.id else p
                for p in state.players
            )
        )
        return {next_state}
    elif action.object_to_take.type == "discard":
        target_player = find_player(state, action.object_to_take.player_id)
        if target_player.discard_pile.protected:
            return {eliminate_player(state, player_id)}
        if len(target_player.discard_pile.cards) == 0:
            raise ValueError(f"Player {target_player.id} has no cards in their discard pile to take")
        result = set()
        card = target_player.discard_pile.cards[0] # Only allow drawing the top card of the discard pile
        next_state = replace(state,
            players=tuple(
                replace(p,
                    hand=replace(p.hand, 
                                cards
                                 =  p.hand.cards
                                 + (card,))
                ) 
                if p.id == player_id else 
                replace(p,
                        discard_pile=replace(p.discard_pile, 
                                    cards=tuple(
                                        c for c in p.discard_pile.cards 
                                        if c != card
                                    )
                        )
                ) 
                if p.id == target_player.id else p
                for p in state.players
            )
        )
        return {next_state}
    else:
        raise ValueError(f"Unknown object to take type: {action.object_to_take.type}")

def perform_discard(state: GameState, player_id: str, action: DiscardAction) -> set[GameState]:
    player = find_player(state, player_id)
    if action.card_order < 0 or action.card_order >= len(player.hand.cards):
        raise ValueError(f"Player {player.id} does not have a card at order {action.card_order} to discard")
    card_to_discard = player.hand.cards[action.card_order]
    next_state = replace(state,
        players=tuple(
            replace(p,
                hand=replace(p.hand, 
                            cards=tuple(
                                c for i, c in enumerate(p.hand.cards) 
                                if not (p.id == player.id and i == action.card_order)
                            )
                ),
                discard_pile=replace(p.discard_pile, 
                            cards=(card_to_discard,) + p.discard_pile.cards # Discarded cards go on top of the pile
                )
            ) 
            if p.id == player.id else p
            for p in state.players
        )
    )
    return {next_state}

