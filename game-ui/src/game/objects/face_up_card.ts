import { ImageAsset } from "../data/image";
import { IEventToCallback } from "./interface";

export interface FaceUpCard extends Phaser.GameObjects.Container {
    image: Phaser.GameObjects.Image,
    text: Phaser.GameObjects.Text
}

export const FaceUpCard = (scene: Phaser.Scene, x: number, y: number, image: ImageAsset, face_text: string, face_color: string, event_map: IEventToCallback<FaceUpCard> = {}): FaceUpCard => {
    const card = scene.add.container(x, y) as FaceUpCard;
    const cardImage = scene.add.image(0, 0, image.key);
    const cardText = scene.add.text(0, 0, face_text, {
        fontFamily: 'Arial',
        fontSize: '100px',
        color: face_color,
        align: 'center',
        wordWrap: { width: 100 }
    });
    cardText.setOrigin(0.5, 0.5);
    card.add(cardImage);
    card.add(cardText);
    card.image = cardImage;
    card.text = cardText;
    for (const event_name in event_map) {
        const callback = event_map[event_name];
        cardImage.on(event_name, () => {
            callback(card);
        });
    }
    return card;
}