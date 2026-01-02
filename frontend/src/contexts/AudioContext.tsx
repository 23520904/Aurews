import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { client } from "../api/client";

interface TTSResponse {
  audioContent: string;
}

interface AudioContextType {
  isPlaying: boolean;
  currentTrack: any | null;
  playlist: any[];
  playPost: (post: any) => Promise<void>;
  playRadio: (posts: any[]) => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  nextTrack: () => Promise<void>;
  prevTrack: () => Promise<void>;
  closePlayer: () => void;
  isLoadingAudio: boolean;

  // [NEW] Biến tiến trình (0 -> 1)
  progress: number;
}

// Biến toàn cục giữ Sound Instance
let globalSound: Audio.Sound | null = null;

const AudioContext = createContext<AudioContextType>({} as AudioContextType);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any | null>(null);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // [NEW] State tiến trình
  const [progress, setProgress] = useState(0);

  const currentIndexRef = useRef(-1);
  const playlistRef = useRef<any[]>([]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    return () => {
      if (globalSound) {
        globalSound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  const loadAndPlay = async (post: any) => {
    try {
      setIsLoadingAudio(true);

      if (globalSound) {
        const status = await globalSound.getStatusAsync();
        if (status.isLoaded) {
          await globalSound.unloadAsync();
        }
        globalSound = null;
      }

      setCurrentTrack(post);
      // [NEW] Reset progress khi qua bài mới
      setProgress(0);

      // 1. Lấy nội dung
      let contentToRead = post.text || post.content;
      if (!contentToRead) {
        try {
          const endpoint = post.slug ? `/posts/slug/${post.slug}` : `/posts/${post._id}`;
          const detailRes: any = await client.get(endpoint);
          const realData = detailRes.data || detailRes;
          contentToRead = realData.text || realData.content || "";
        } catch (err) {
          contentToRead = post.description || "";
        }
      }

      const cleanText = contentToRead
        ? contentToRead.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 4000)
        : "";
      const textToSpeak = `${post.title}. ${cleanText}`;

      // 2. Gọi API
      const res = await client.post<TTSResponse>('/posts/speak', { text: textToSpeak });

      // 3. Tạo Sound & Cấu hình interval update
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${res.audioContent}` },
        {
          shouldPlay: true,
          progressUpdateIntervalMillis: 200 // [NEW] Cập nhật mỗi 200ms
        }
      );

      globalSound = newSound;
      setIsPlaying(true);

      // 4. Lắng nghe sự kiện
      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded) {
          // [NEW] Tính toán % tiến trình
          if (status.durationMillis) {
            const currentProgress = status.positionMillis / status.durationMillis;
            setProgress(currentProgress);
          }

          if (status.didJustFinish) {
            const currentIdx = currentIndexRef.current;
            const currentList = playlistRef.current;

            if (currentList.length > 0 && currentIdx < currentList.length - 1) {
              nextTrack();
            } else {
              setIsPlaying(false);
              newSound.unloadAsync();
              globalSound = null;
              setProgress(0);
            }
          }
        }
      });

    } catch (error) {
      console.error("Lỗi Play:", error);
      nextTrack();
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const nextTrack = async () => {
    const nextIdx = currentIndexRef.current + 1;
    const list = playlistRef.current;
    if (nextIdx < list.length) {
      setCurrentIndex(nextIdx);
      await loadAndPlay(list[nextIdx]);
    } else {
      setIsPlaying(false);
    }
  };

  const prevTrack = async () => {
    const prevIdx = currentIndexRef.current - 1;
    const list = playlistRef.current;
    if (prevIdx >= 0) {
      setCurrentIndex(prevIdx);
      await loadAndPlay(list[prevIdx]);
    }
  };

  const playRadio = async (posts: any[]) => {
    if (!posts || posts.length === 0) return;
    if (globalSound) {
      await globalSound.unloadAsync();
      globalSound = null;
    }
    setPlaylist(posts);
    setCurrentIndex(0);
    await loadAndPlay(posts[0]);
  };

  const playPost = async (post: any) => {
    if (globalSound) {
      await globalSound.unloadAsync();
      globalSound = null;
    }
    setPlaylist([post]);
    setCurrentIndex(0);
    await loadAndPlay(post);
  };

  const pauseAudio = async () => {
    if (globalSound) {
      await globalSound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resumeAudio = async () => {
    if (globalSound) {
      await globalSound.playAsync();
      setIsPlaying(true);
    }
  };

  const closePlayer = async () => {
    if (globalSound) {
      await globalSound.stopAsync();
      await globalSound.unloadAsync();
      globalSound = null;
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setPlaylist([]);
    setCurrentIndex(-1);
    setProgress(0); // [NEW] Reset
  };

  return (
    <AudioContext.Provider value={{
      isPlaying, currentTrack, playlist,
      playPost, playRadio, pauseAudio, resumeAudio,
      nextTrack, prevTrack, closePlayer, isLoadingAudio,
      progress // [NEW] Export
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);