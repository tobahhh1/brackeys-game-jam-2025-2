import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import GameObject = Phaser.GameObjects.GameObject;
import { IInjectedSceneProperties } from './injectedSceneProperties';
import { IGameState, IPlayerAction } from '../../state/state';
import { ImageAsset } from '../data/image';
import { FaceUpCard } from '../objects/face_up_card';
import { FaceDownCard } from '../objects/face_down_card';

const Images = {
    background: new ImageAsset('background', 'bg.png'),
    bandit: new ImageAsset('bandit', 'bandit.png'),
    biscuit: new ImageAsset('biscuit', 'biscuit.png'),
    card_back: new ImageAsset('card_back', 'card_back.png'),
    card_front: new ImageAsset('card_front', 'card_front.png'),
    hand: new ImageAsset('hand', 'hand.png'),
    poison_vial: new ImageAsset('poison_vial', 'poison_vial.png'),
}

const GameAssets = {
    images: Images,
}

interface IBound {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

interface IPoint {
    x: number;
    y: number;
}

function center(bound: IBound): IPoint {
    return {
        x: (bound.left + bound.right) / 2,
        y: (bound.top + bound.bottom) / 2
    }
}

// @ts-ignore
function boundWidth(bound: IBound): number {
    return bound.right - bound.left;
}

function boundHeight(bound: IBound): number {
    return bound.bottom - bound.top;
}

export class Game extends Scene {

    height: number = 0;
    width: number = 0;

    gameObjects: {
        deck?: GameObject
        poisonVial?: GameObject
        cards?: GameObject[]
        discardPile?: GameObject
        wager?: GameObject

        opponentPoisonVial?: GameObject
        opponentCards?: GameObject[]
        opponentDiscardPile?: GameObject
        opponentWager?: GameObject
        opponentFace?: GameObject
    } = {}

    // Injected by App.tsx when scene is ready
    injectedSceneProperties: IInjectedSceneProperties

    legalActions: IPlayerAction[] = []

    thisPlayerBound: IBound
    opponentPlayerBound: IBound
    neutralAreaBound: IBound

    constructor() {
        super('Game');
    }

    preload() {
        this.load.setPath('/assets');

        this.width = this.sys.game.config.width as number;
        this.height = this.sys.game.config.height as number;

        for (const key in GameAssets.images) {
            const image = (GameAssets.images as any)[key] as ImageAsset;
            this.load.image(image.key, image.path);
        }

        this.thisPlayerBound = {
            top: 2 * this.height / 3,
            bottom: this.height,
            left: 0,
            right: this.width
        }

        this.opponentPlayerBound = {
            top: 0,
            bottom: this.height / 3,
            left: 0,
            right: this.width
        }

        this.neutralAreaBound = {
            top: this.height / 3,
            bottom: 2 * this.height / 3,
            left: 0,
            right: this.width
        }
    }

    destroyOldGameObjects() {
        for (const obj of Object.values(this.gameObjects)) {
            if (obj) {
                if (Array.isArray(obj)) {
                    for (const o of obj) {
                        o.destroy();
                    }
                }
                else {
                    obj.destroy();
                }
            }
        }
    }

    getThisPlayerState(state: IGameState) {
        return state.players?.find(p => p.id === this.injectedSceneProperties.player_id) || null;
    }

    getOpponentPlayerState(state: IGameState) {
        return state.players?.find(p => p.id !== this.injectedSceneProperties.player_id) || null;
    }


    suitToColor(suit: number): string {
        switch (suit) {
            case 1:
                return 'red';
            case 2:
                return 'black';
            case 3:
                return 'blue';
            case 4:
                return 'green';
            default:
                return ''
        }
    }

    findCardOrderAndPlayerId(card: any): [string, number] {
        const state = (this.injectedSceneProperties as any).currentGameState as IGameState;
        for (const player of state.players) {
            let hand;
            if (player.id === this.injectedSceneProperties.player_id) {
                hand = this.gameObjects.cards;
            } else {
                hand = this.gameObjects.opponentCards;
            }
            if (!hand) {
                continue;
            }
            const index = hand.findIndex(c => c === card);
            if (index !== -1) {
                return [player.id, index];
            }
        }
        return ['', -1];
    }


    renderGameState(state: IGameState) {
        // 0 being falsy is intentional here
        if (state.deck?.cards?.length) {
            this.gameObjects.deck = this.add.image(
                center(this.neutralAreaBound).x,
                center(this.neutralAreaBound).y,
                Images.card_back.key
            ).setScale(1.5)
        }

        if (this.getThisPlayerState(state)) {
            const player = this.getThisPlayerState(state);
            if (player?.discard_pile?.cards?.length) {
                const card = player.discard_pile.cards[player.discard_pile.cards.length - 1];
                this.gameObjects.discardPile = FaceUpCard(
                    this,
                    center(this.neutralAreaBound).x - 100,
                    center(this.neutralAreaBound).y,
                    Images.card_front,
                    card.rank.toString(),
                    this.suitToColor(card.suit)
                )
            }
            this.gameObjects.poisonVial = this.add.image(
                this.thisPlayerBound.left + 100,
                center(this.thisPlayerBound).y,
                Images.poison_vial.key
            )
        }

        if (this.getOpponentPlayerState(state)) {
            const opponent = this.getOpponentPlayerState(state);
            if (opponent?.discard_pile?.cards?.length) {
                const card = opponent.discard_pile.cards[opponent.discard_pile.cards.length - 1];
                this.gameObjects.discardPile = FaceUpCard(
                    this,
                    center(this.neutralAreaBound).x - 100,
                    center(this.neutralAreaBound).y,
                    Images.card_front,
                    card.rank.toString(),
                    this.suitToColor(card.suit)
                )
            }

            this.gameObjects.opponentFace = this.add.image(
                center(this.opponentPlayerBound).x,
                center(this.opponentPlayerBound).y - boundHeight(this.opponentPlayerBound) * 0.2,
                Images.bandit.key
            ).setScale(1.25)
        } else {
            this.add.text(
                center(this.opponentPlayerBound).x,
                center(this.opponentPlayerBound).y,
                `Send this game code to your friend!: ${this.injectedSceneProperties.game_id}`,
                {
                    font: '32px Arial',
                    color: 'black'
                }
            ).setOrigin(0.5, 0.5);
        }

        if (this.getThisPlayerState(state)?.hand?.cards) {
            this.gameObjects.cards = [];
            const hand = this.getThisPlayerState(state)?.hand;
            if (hand) {
                const cardCount = hand.cards.length;
                const spacing = Math.min(150, boundWidth(this.thisPlayerBound) / (cardCount + 1));
                const startX = center(this.thisPlayerBound).x - (spacing * (cardCount - 1)) / 2;
                for (let i = 0; i < cardCount; i++) {
                    const card = FaceUpCard(
                        this,
                        startX + i * spacing,
                        this.thisPlayerBound.bottom - 100,
                        Images.card_front,
                        hand.cards[i].rank.toString(),
                        this.suitToColor(hand.cards[i].suit)
                    )
                    this.gameObjects.cards.push(card);
                }
            }
        }

        if (this.getOpponentPlayerState(state)?.hand?.cards) {
            this.gameObjects.opponentCards = [];
            const hand = this.getOpponentPlayerState(state)?.hand;
            if (hand) {
                const cardCount = hand.cards.length;
                const spacing = Math.min(75, boundWidth(this.opponentPlayerBound) / (cardCount + 1));
                const startX = center(this.opponentPlayerBound).x - (spacing * (cardCount - 1)) / 2;
                for (let i = 0; i < cardCount; i++) {
                    const card = FaceDownCard(
                        this,
                        startX + i * spacing,
                        this.opponentPlayerBound.top + 100,
                        Images.card_back
                    )
                    this.gameObjects.opponentCards.push(card);
                }
            }
        }
    }

    create() {
        EventBus.emit('scene-created', this);
        this.add.image(this.width / 2, this.height / 2, Images.background.key)
        EventBus.on('game-state-updated', (new_state: IGameState) => {
            this.destroyOldGameObjects();
            this.renderGameState(new_state);
        });
        EventBus.on('legal-actions-updated', (legal_actions: IPlayerAction[]) => {
            this.legalActions = legal_actions;
        });
        EventBus.emit('current-scene-ready', this);
    }
}