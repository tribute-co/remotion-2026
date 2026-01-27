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

export const mediaAssets: MediaAsset[] = [
  // Videos
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/15190029_3840_2160_30fps.mp4',
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/Happy_Birthday_and_General.jpg',
    durationInSeconds: 5,
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/ana_(2160p).mp4',
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/In_Memory.jpg',
    durationInSeconds: 7,
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/bbb_baby_intro.mp4',
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/Just_Because_Pink.jpg',
    durationInSeconds: 5,
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/bbb_baby_intro_360p.mp4',
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/Just_Because_Universal.jpg',
    durationInSeconds: 6,
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/bbb_baby_outro.mp4',
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/Mothers_Day.jpg',
    durationInSeconds: 8,
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/bbb_baby_outro_360p.mp4',
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/Ocean_Serenity.jpg',
    durationInSeconds: 10,
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/bbb_wedding_intro.mp4',
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/Pink_Thank_You.jpg',
    durationInSeconds: 5,
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/bbb_wedding_intro_360p.mp4',
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/Something_Fresh.jpg',
    durationInSeconds: 7,
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/Wedding_Background.jpg',
    durationInSeconds: 6,
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/You_and_Me.jpg',
    durationInSeconds: 8,
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/bbb_baby_hero_background.jpg',
    durationInSeconds: 5,
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/bbb_baby_registry_logo.png',
    durationInSeconds: 4,
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/bbb_baby_registry_logo2.png',
    durationInSeconds: 4,
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/bbb_wedding_hero_background.jpg',
    durationInSeconds: 6,
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/bbb_wedding_outro.mp4',
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/bbb_wedding_outro_360p.mp4',
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/bbb_wedding_registry_logo.png',
    durationInSeconds: 4,
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/beach.jpg',
    durationInSeconds: 7,
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/dana_dauderis_(240p).mp4',
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/leaves.jpg',
    durationInSeconds: 6,
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/leaves2.jpg',
    durationInSeconds: 5,
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/magical_ink.mp4',
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/medical_background_photo.jpg',
    durationInSeconds: 8,
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/mongolian_horses_4k.mp4',
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/mountains.jpg',
    durationInSeconds: 9,
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/pexels-alley-chien-2150148608-35747334.jpg',
    durationInSeconds: 5,
  },
  {
    type: 'image',
    src: 'https://tribute-video-assets.tribute.co/pexels-miami302-19296602.jpg',
    durationInSeconds: 10,
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/ramesh_(720p).mp4',
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/sloth_on_train.mp4',
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/tribute_intro_240p.mp4',
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/tribute_intro_jingle_video_7s.mp4',
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/tribute_outro_240p.mp4',
  },
  {
    type: 'video',
    src: 'https://tribute-video-assets.tribute.co/tribute_outro_jingle_video_10s.mp4',
  },
  // R2 bucket assets
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/13227677_3840_2160_24fps.mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/13768551_1920_1080_60fps.mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/14065579_3840_2160_24fps.mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/14169131-uhd_3840_2160_30fps.mp4',
  },
  {
    type: 'image',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/pexels-diana-reyes-227887231-32731474.jpg',
    durationInSeconds: 6,
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/Brian.mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/Vaibhav.mp4',
  },
  {
    type: 'image',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/pexels-i-rem-cevik-978247792-32480606.jpg',
    durationInSeconds: 7,
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/abbey_bradley (720p).mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/blank.mp4',
  },
  {
    type: 'image',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/pexels-musaortac-28845727.jpg',
    durationInSeconds: 8,
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/bles (720p)(1).mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/emily_kollars (720p)(1).mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/emily_kollars (720p).mp4',
  },
  {
    type: 'image',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/pexels-noelace-32608050.jpg',
    durationInSeconds: 5,
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/ilia_korotkine (720p).mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/intro_slide (720p).mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/jan_engelhardt (720p).mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/jim_mcgrew (720p).mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/john_stuart_allen_goldsby (360p).mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/kathy (720p).mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/midda_garcia (480p).mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/nann_and_tony (720p).mp4',
  },
  {
    type: 'image',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/pexels-yelenaodintsova-31421611.jpg',
    durationInSeconds: 7,
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/sydney_einstein (720p).mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/teresa_kageneck (540p).mp4',
  },
  {
    type: 'video',
    src: 'https://pub-bc00aeb1aeab4b7480c2d94365bb62a9.r2.dev/wade (360p).mp4',
  },
];

export const backgroundAudio: AudioAsset = {
  src: 'https://tribute-video-assets.tribute.co/EVOE%20-%20Pearl.mp3',
  volume: 0.5,
};
