import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import StartGame from './game/main';
import { EventBus } from './game/EventBus';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from './api/client';

export interface IRefPhaserGame {
    game: Phaser.Game | null;
    scene: Phaser.Scene | null;
}

interface IProps {
    onSceneReady?: (scene_instance: Phaser.Scene) => void
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(function PhaserGame({ onSceneReady: onSceneReady }, ref) {
    const game = useRef<Phaser.Game | null>(null!);

    const navigate = useNavigate();

    const handleNavigate = (path: string) => {
        game.current?.destroy(true);
        if (game.current !== null) {
            game.current = null;
        }
        EventBus.destroy();
        navigate(path);
    }

    const params = useParams();

    useLayoutEffect(() => {
        if (game.current === null) {

            game.current = StartGame("game-container");

            if (typeof ref === 'function') {
                ref({ game: game.current, scene: null });
            } else if (ref) {
                ref.current = { game: game.current, scene: null };
            }

        }

        return () => {
            if (game.current) {
                game.current.destroy(true);
                if (game.current !== null) {
                    game.current = null;
                }
            }
        }
    }, [ref]);

    useEffect(() => {
        EventBus.on('current-scene-ready', (scene_instance: Phaser.Scene) => {
            if (onSceneReady && typeof onSceneReady === 'function') {

                onSceneReady(scene_instance);

            }

            if (typeof ref === 'function') {
                ref({ game: game.current, scene: scene_instance });
            } else if (ref) {
                ref.current = { game: game.current, scene: scene_instance };
            }

        });
        return () => {
            EventBus.removeListener('current-scene-ready');
        }
    }, [onSceneReady, ref]);

    useEffect(() => {
        EventBus.on('scene-created', (scene_instance: Phaser.Scene) => {
            if ("injectedSceneProperties" in scene_instance) {
                scene_instance.injectedSceneProperties = {
                    api_client: apiClient,
                    navigate: handleNavigate,
                    game_id: params.game_id!,
                    player_id: params.player_id!,
                }
            }
        })
    }, [])

    return (
        <div id="game-container"></div>
    );

});