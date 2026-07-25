import en from '../../../src/i18n/locales/en';
import zh from '../../../src/i18n/locales/zh-CN';

// packages/player/src/locales.ts
const playerPackageEn = {
    localPlayer: 'Local player',
    localLyricsPlayer: 'Local lyrics player',
    playbackProgress: 'Playback progress',
    openPlayer: 'Open player',
    floatingPlayer: 'Floating player',
    fullscreenLyrics: 'Fullscreen lyrics',
    playerViews: 'Player views',
    libraryFolderPath: 'Music folder path',
    volume: 'Volume',
    loopMode: 'Loop mode',
    loopOff: 'Off',
    loopAll: 'All tracks',
    loopOne: 'Current track',
    replayGainOff: 'Off',
    replayGainTrack: 'Track',
    replayGainAlbum: 'Album',
    visualizerMode: 'Lyrics animation',
    visualizerBackground: 'Visualizer background',
    outputDevice: 'Audio output',
    outputDefault: 'System default',
} as const;

const playerPackageZh = {
    localPlayer: '本地播放器',
    localLyricsPlayer: '本地歌词播放器',
    playbackProgress: '播放进度',
    openPlayer: '打开播放器',
    floatingPlayer: '浮动播放器',
    fullscreenLyrics: '全屏歌词',
    playerViews: '播放器视图',
    libraryFolderPath: '音乐文件夹路径',
    volume: '音量',
    loopMode: '循环模式',
    loopOff: '关闭',
    loopAll: '全部循环',
    loopOne: '单曲循环',
    replayGainOff: '关闭',
    replayGainTrack: '按曲目',
    replayGainAlbum: '按专辑',
    visualizerMode: '歌词动画',
    visualizerBackground: '可视化背景',
    outputDevice: '音频输出',
    outputDefault: '系统默认',
} as const;

export const foliaPlayerLocales = {
    en: { ...en, playerPackage: playerPackageEn },
    zh: { ...zh, playerPackage: playerPackageZh },
} as const;
