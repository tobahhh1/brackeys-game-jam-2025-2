import { GameObjects, Scene } from "phaser";
import { ImageAsset } from "../data/image";
import { IEventToCallback } from "./interface";

export interface FaceDownCard extends GameObjects.Container {
    image: GameObjects.Image
}

export const FaceDownCard = (scene: Scene, x: number, y: number, image: ImageAsset, event_map: IEventToCallback<FaceDownCard> = {}): FaceDownCard => {
    const card = scene.add.container(x, y) as FaceDownCard;
    const cardImage = scene.add.image(0, 0, image.key);
    card.add(cardImage)
    card.image = cardImage;
    cardImage.setInteractive()
    for (const event_name in event_map) {
        const callback = event_map[event_name];
        cardImage.on(event_name, () => {
            callback(card);
        });
    }
    return card;
}