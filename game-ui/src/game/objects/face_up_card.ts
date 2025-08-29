import { ImageAsset } from "../data/image";

export const FaceUpCard = (scene: Phaser.Scene, x: number, y: number, image: ImageAsset, face_text: string, face_color: string): Phaser.GameObjects.GameObject => {
    const card = scene.add.container(x, y);
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
    return card;
}