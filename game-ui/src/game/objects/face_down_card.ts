import { GameObjects, Scene } from "phaser";
import { ImageAsset } from "../data/image";

export const FaceDownCard = (scene: Scene, x: number, y: number, image: ImageAsset): GameObjects.GameObject => {
    const card = scene.add.container(x, y);
    const cardImage = scene.add.image(0, 0, image.key);
    card.add(cardImage)
    return card;
}