// Media Schema - Central configuration for all video, image, and audio assets

export type MediaType = 'video' | 'image' | 'audio';

export interface MediaAsset {
  type: MediaType;
  src: string;
  durationInSeconds?: number; // For images and audio, specify duration. For videos, it's computed.
}

export interface AudioAsset {
  src: string;
  volume?: number;
}

export const ASSETS_BASE_URL = 'https://tribute-video-assets.tribute.co/remotion/';

export const mediaAssets: MediaAsset[] = [
  {
    type: 'video',
    src: `${ASSETS_BASE_URL}sloth_on_train.mp4`,
  },
  {
    type: 'video',
    src: `${ASSETS_BASE_URL}YTDowncom_YouTube_How-to-talk-to-Anyone-Anytime-Anywhere_Media_P2pGXdqI9s4_002_720p.mp4`,
  },
  {
    type: 'image',
    src: `${ASSETS_BASE_URL}pexels-jean-pixels-427051121-22644127.jpg`,
    durationInSeconds: 5,
  },
  {
    type: 'video',
    src: `${ASSETS_BASE_URL}Firefly%20generate%20a%203%20minute%20video%20of%20a%20white%20woman%20talking%20random%20things%20into%20the%20camera.%20790766.mp4`,
  },
  {
    type: 'image',
    src: `${ASSETS_BASE_URL}pexels-miami302-19296602.jpg`,
    durationInSeconds: 5,
  },
  {
    type: 'video',
    src: `${ASSETS_BASE_URL}15060800_1920_1080_24fps.mp4`,
  },
  {
    type: 'video',
    src: `${ASSETS_BASE_URL}YTDowncom_YouTube_FedEx-commercial-with-John-Moschitta_Media_NeK5ZjtpO-M_001_480p.mp4`,
  },
  {
    type: 'image',
    src: `${ASSETS_BASE_URL}pexels-prayuda-dewantara-2152127933-35742275.jpg`,
    durationInSeconds: 5,
  },
  {
    type: 'video',
    src: `${ASSETS_BASE_URL}mongolian_horses_4k.mp4`,
  },
  {
    type: 'video',
    src: `${ASSETS_BASE_URL}YTDowncom_YouTube_How-To-Talk-To-People-You-Like_Media_9DvQD9b_d_0_002_720p.mp4`,
  },
  {
    type: 'image',
    src: `${ASSETS_BASE_URL}pexels-amel-uzunovic-440739273-35451153.jpg`,
    durationInSeconds: 10,
  },
  {
    type: 'video',
    src: `${ASSETS_BASE_URL}15198001_3840_2160_24fps.mp4`,
  },
  {
    type: 'video',
    src: `${ASSETS_BASE_URL}Firefly%20generate%20a%203%20minute%20video%20of%20a%20woman%20talking%20random%20things%20into%20the%20camera.%20790766.mp4`,
  },
  {
    type: 'image',
    src: `${ASSETS_BASE_URL}pexels-primitive-spaces-2147980412-34719406.jpg`,
    durationInSeconds: 5,
  },
  {
    type: 'video',
    src: `${ASSETS_BASE_URL}magical_ink.mp4`,
  },
  {
    type: 'video',
    src: `${ASSETS_BASE_URL}YTDowncom_YouTube_Memorable-Monologue-Talking-in-the-Third_Media_cQWIlQupXw4_002_360p.mp4`,
  },
  {
    type: 'image',
    src: `${ASSETS_BASE_URL}pexels-omer-sahi-n-2152970019-35750669.jpg`,
    durationInSeconds: 5,
  },
  {
    type: 'image',
    src: `${ASSETS_BASE_URL}pexels-raul-mex-2159043921-35818962.jpg`,
    durationInSeconds: 5,
  },
  {
    type: 'video',
    src: `${ASSETS_BASE_URL}YTDowncom_YouTube_Self-Motivation-Brendan-Clark-TEDxYouth__Media_rLXcLBfDwvE_002_720p.mp4`,
  },
  {
    type: 'image',
    src: `${ASSETS_BASE_URL}pexels-trev-takes-photos-27585623.jpg`,
    durationInSeconds: 5,
  },
  {
    type: 'image',
    src: `${ASSETS_BASE_URL}pexels-alley-chien-2150148608-35747334.jpg`,
    durationInSeconds: 5,
  },
];

/** Background music/ambience – multiple tracks are mixed together. */
export const backgroundAudioTracks: AudioAsset[] = [
  {
    src: `https://tribute-prod-editor-music.tribute.co/Sailors_Lament_128k.mp3`,
    volume: 0.5,
  },
  {
    src: `https://tribute-prod-editor-music.tribute.co/Golden_Days_128k.mp3`,
    volume: 0.5,
  },
];
