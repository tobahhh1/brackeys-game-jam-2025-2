import { GameObjects, Scene } from "phaser";
import { ImageAsset } from "../data/image";

export const FaceDownCard = (scene: Scene, x: number, y: number, image: ImageAsset): GameObjects.GameObject => {
    const card = new GameObjects.Container(scene, x, y);
    const cardImage = new GameObjects.Image(scene, 0, 0, image.key);
    card.add(cardImage)
    return card;
}