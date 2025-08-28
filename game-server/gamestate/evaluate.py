from gamestate.game_state import GameState

def is_terminal_state(state: GameState) -> bool:
    return sum(1 for player in state.players if not player.eliminated) <= 1
