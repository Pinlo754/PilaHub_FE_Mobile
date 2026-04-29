import Sound from 'react-native-sound';
import { useRef } from 'react';

Sound.setCategory('Playback');

export const useSoundManager = () => {
    const sounds = useRef<{ [key: string]: Sound }>({});
    const lastPlayed = useRef<string | null>(null);
    const lastTime = useRef<number>(0);

    const loadSounds = () => {

        const createSound = (filename: string) => {
            return new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
                if (error) {
                    console.log(`❌ Load fail: ${filename}`, error);
                } else {
                    console.log(`✅ Loaded: ${filename}`);
                }
            });
        };

        sounds.current = {
            correct: createSound('correct.mp3'),

            elbows: createSound('khuyutay.m4a'),
            hips: createSound('hong.m4a'),
            knees: createSound('daugoi.m4a'),
            neck: createSound('co.m4a'),
            upperarms: createSound('canhtay.m4a'),
            lowerback: createSound('lungduoi.m4a'),
            shoulders: createSound('vai.m4a'),
            upperback: createSound('lungtren.m4a'),
        };

    };

    const play = (key: string) => {
    const now = Date.now();

    if (now - lastTime.current < 2000) {
        return;
    }


    const sound = sounds.current[key];

    if (!sound) {
        return;
    }


    sound.setCurrentTime(0); 
    sound.play((success) => {
    });

    lastPlayed.current = key;
    lastTime.current = now;
};

    return { loadSounds, play };
};