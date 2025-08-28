
export interface INotProtectableCard {
    suit: number;
    rank: number;
}

export interface ICard extends INotProtectableCard {
    protected: boolean;
}

export interface IDeck {
    cards: INotProtectableCard[];
    protected: boolean;
}

export interface IHand {
    cards: ICard[];
    protected: boolean;
}

export interface IDiscardPile {
    cards: ICard[];
    protected: boolean;
}

export interface IWager {
    amount: number;
    protected: boolean;
}

export interface IStack {
    value: number;
}

export interface IPlayer {
    id: string;
    hand: IHand;
    discard_pile: IDiscardPile;
    stack: IStack;
    wager: IWager;
    eliminated: boolean;
}

export interface IGameState {
    players: IPlayer[];
    deck: IDeck;
}

export type IPlayerAction =
    | { type: "take"; object_to_take: any }
    | { type: "protect"; object_to_protect: any }
    | { type: "discard"; card_order: number };

export interface IGameAction {
    player_actions: [string, IPlayerAction][];
}