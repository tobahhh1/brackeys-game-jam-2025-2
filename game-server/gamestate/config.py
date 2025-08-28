from dataclasses import dataclass


@dataclass()
class GameConfig:
    num_suits: int = 4
    num_ranks: int = 13
    initial_hand_size: int = 2  
    max_hand_size: int = 5
    initial_stack: float = 20
    blind: float = 4
    wager_steal: float = 1

