import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import GameObject = Phaser.GameObjects.GameObject;
import { IInjectedSceneProperties } from './injectedSceneProperties';
import { IGameState, IPlayerAction } from '../../state/state';
import { ImageAsset } from '../data/image';
import { FaceUpCard } from '../objects/face_up_card';
import { FaceDownCard } from '../objects/face_down_card';
import { performAction } from '../../api/api';

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

interface IHasImage {
    image: GameObjects.Image
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
        codeText?: GameObject
    } = {}

    // Injected by App.tsx when scene is ready
    injectedSceneProperties: IInjectedSceneProperties

    legalActions: IPlayerAction[] = []
    gameState: IGameState

    thisPlayerBound: IBound
    opponentPlayerBound: IBound
    neutralAreaBound: IBound

    poisonMode: boolean = false;
    waiting: boolean = false;

    submittedActionGameObject: IHasImage | null = null;

    clickableEventHandlers = {
        "pointerover": this.handleHover.bind(this),
        "pointerout": (obj: IHasImage) => { !this.waiting && obj.image.clearTint(); },
        "pointerdown": this.handleClick.bind(this)
    }

    constructor() {
        super('Game');
    }

    preload() {
        this.load.setPath('assets');

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

    findCardOrderAndPlayerId(card: any): [string | null, number] {
        const state = this.gameState;
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
        return [null, -1];
    }


    renderGameState(state: IGameState) {
        // 0 being falsy is intentional here
        if (state.deck?.cards?.length) {
            this.gameObjects.deck = FaceDownCard(
                this,
                center(this.neutralAreaBound).x,
                center(this.neutralAreaBound).y,
                Images.card_back,
                this.clickableEventHandlers
            ).setScale(1.5)
        }

        const player = this.getThisPlayerState(state);
        if (player) {
            if (player?.discard_pile?.cards?.length) {
                const card = player.discard_pile.cards[0];
                this.gameObjects.discardPile = FaceUpCard(
                    this,
                    center(this.neutralAreaBound).x - 100,
                    center(this.neutralAreaBound).y,
                    Images.card_front,
                    card.rank.toString(),
                    this.suitToColor(card.suit),
                    this.clickableEventHandlers,
                ).setScale(0.75)
            }
            const poisonVial = this.add.image(
                this.thisPlayerBound.left + 100,
                center(this.thisPlayerBound).y,
                Images.poison_vial.key
            )
            poisonVial.addListener('pointerdown', () => {
                this.poisonMode = !this.poisonMode;
                if (this.poisonMode) {
                    poisonVial.setTint(0x0F8E01);
                } else {
                    poisonVial.clearTint();
                }
            })
            poisonVial.addListener('pointerout', () => {
                if (this.poisonMode) {
                    poisonVial.setTint(0x0F8E01);
                } else {
                    poisonVial.clearTint();
                }
            })
            poisonVial.addListener('pointerover', () => {
                poisonVial.setTint(0xdddddd);
            })

            poisonVial.setInteractive();
            this.gameObjects.poisonVial = poisonVial;
        }

        if (this.getOpponentPlayerState(state)) {
            const opponent = this.getOpponentPlayerState(state);
            if (opponent?.discard_pile?.cards?.length) {
                const card = opponent.discard_pile.cards[0];
                this.gameObjects.opponentDiscardPile = FaceUpCard(
                    this,
                    center(this.neutralAreaBound).x + 100,
                    center(this.neutralAreaBound).y,
                    Images.card_front,
                    card.rank.toString(),
                    this.suitToColor(card.suit),
                    this.clickableEventHandlers
                ).setScale(0.75)
            }

            this.gameObjects.opponentFace = this.add.image(
                center(this.opponentPlayerBound).x,
                center(this.opponentPlayerBound).y - boundHeight(this.opponentPlayerBound) * 0.2,
                Images.bandit.key
            ).setScale(1.25)
        } else {
            this.gameObjects.codeText = this.add.text(
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
                        this.suitToColor(hand.cards[i].suit),
                        this.clickableEventHandlers
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
                    if (this.gameState.deck?.cards?.length !== 0) {
                        const card = FaceDownCard(
                            this,
                            startX + i * spacing,
                            this.opponentPlayerBound.top + 100,
                            Images.card_back,
                            this.clickableEventHandlers
                        )
                        this.gameObjects.opponentCards.push(card);
                    } else {
                        const card = FaceUpCard(
                            this,
                            startX + i * spacing,
                            this.opponentPlayerBound.top + 100,
                            Images.card_front,
                            hand.cards[i].rank.toString(),
                            this.suitToColor(hand.cards[i].suit),
                            this.clickableEventHandlers
                        )
                        this.gameObjects.opponentCards.push(card);
                    }
                }
            }
        }
    }

    // utility, tells objects to only be highlightable if they map to a legal action
    handleHover(obj: IHasImage) {
        if (this.waiting) {
            return
        }
        if (this.mapToAction(obj)) {
            if (this.poisonMode) {
                // green hue
                obj.image.setTint(0x0F8E01);
            } else {
                // light gray hue
                obj.image.setTint(0xdddddd);
            }

        }
    }

    async handleClick(obj: IHasImage) {
        if (this.waiting) {
            return
        }
        const action = this.mapToAction(obj);
        if (action) {
            this.waiting = true;
            console.log("Performing action:", action);
            if (this.poisonMode) {
                obj.image.setTint(0x0F8E01)
            } else {
                obj.image.setTint(0x999900)
            }
            this.submittedActionGameObject = obj;
            performAction(
                this.injectedSceneProperties.api_client,
                this.injectedSceneProperties.player_id!,
                this.injectedSceneProperties.game_id!,
                action
            );
        }
    }

    mapToAction(gameObject: any): IPlayerAction | null {
        const [player_id, card_order] = this.findCardOrderAndPlayerId(gameObject);
        const this_player_id = this.injectedSceneProperties.player_id;
        const opponent_player_id = this.getOpponentPlayerState(this.gameState)?.id!;
        for (const action of this.legalActions) {
            if (this.poisonMode && action.type === "protect") {
                if (action.object_to_protect.type === "card" && player_id === action.object_to_protect.player_id && card_order === action.object_to_protect.card_order) {
                    return action;
                } else if (action.object_to_protect.type === "deck" && gameObject === this.gameObjects.deck) {
                    return action;
                } else if (action.object_to_protect.type === "discard") {
                    if (action.object_to_protect.player_id === this_player_id && gameObject === this.gameObjects.discardPile) {
                        return action;
                    } else if (action.object_to_protect.player_id === opponent_player_id && gameObject === this.gameObjects.opponentDiscardPile) {
                        return action;
                    }
                }
            } else if (!this.poisonMode && action.type === "discard") {
                if (action.card_order === card_order) {
                    return action;
                }
            } else if (!this.poisonMode && action.type === "take") {
                if (action.object_to_take.type === "deck" && gameObject === this.gameObjects.deck) {
                    return action;
                } else if (action.object_to_take.type === "discard") {
                    if (action.object_to_take.player_id === this_player_id && gameObject === this.gameObjects.discardPile) {
                        return action;
                    } else if (action.object_to_take.player_id === opponent_player_id && gameObject === this.gameObjects.opponentDiscardPile) {
                        return action;
                    }
                } else if (action.object_to_take.type === "wager" && player_id === action.object_to_take.player_id && gameObject === this.gameObjects.wager) {
                    return action;
                } else if (action.object_to_take.type === "card" && player_id === action.object_to_take.player_id && card_order === action.object_to_take.card_order) {
                    return action;
                }
            }
        }
        return null;
    }

    create() {
        EventBus.emit('scene-created', this);
        this.add.image(this.width / 2, this.height / 2, Images.background.key)
        EventBus.on('game-state-updated', (new_state: IGameState) => {
            this.gameState = new_state;
            if (this.getThisPlayerState(new_state)?.eliminated) {
                alert("Oops! They poisoned the thing you tried to take! You lose!");
                this.injectedSceneProperties.navigate("/");
                return;

            }
            if (this.getOpponentPlayerState(new_state)?.eliminated) {
                alert("Yay! Your opponent tried to take the thing you poisoned! You win!");
                this.injectedSceneProperties.navigate("/");
                return;
            }


            if (this.gameState.players && this.gameState.players.length < 2) {
                this.waiting = true;
            }
            this.destroyOldGameObjects();
            this.renderGameState(new_state);

            if (this.gameState.deck?.cards?.length === 0) {
                const thisPlayerHand = this.getThisPlayerState(new_state)?.hand?.cards.map(c => [c.rank, c.suit] as [number, number]) || [];
                const opponentPlayerHand = this.getOpponentPlayerState(new_state)?.hand?.cards.map(c => [c.rank, c.suit] as [number, number]) || [];
                const output = compareHandsWithMessage(thisPlayerHand, opponentPlayerHand)
                alert(output.message)
            }
        });
        EventBus.on('legal-actions-updated', (legal_actions: IPlayerAction[]) => {
            this.legalActions = legal_actions;
        });
        EventBus.on('player_joined', (_: any) => {
            console.log("Player joined event received");
            if (this.gameState.players?.length === 2) {
                this.waiting = false;
            }
        })
        EventBus.on('actions_performed', (_: any) => {
            console.log("Actions performed event received");
            this.submittedActionGameObject?.image.clearTint();
            this.submittedActionGameObject = null;
            this.waiting = false;
        })
        EventBus.emit('current-scene-ready', this);
    }
}