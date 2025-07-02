import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Video, { VideoRef } from 'react-native-video';

interface DiceProps {
  roll: string;
  isRolling: boolean;
  rolled: boolean;
}

const ROLL_VIDEOS = {
  '0': require('../../../assets/rolls/0.webm'),
  '1': require('../../../assets/rolls/1.webm'),
  '2': require('../../../assets/rolls/2.webm'),
  '3': require('../../../assets/rolls/3.webm'),
  '4': require('../../../assets/rolls/4.webm'),
  '5': require('../../../assets/rolls/5.webm'),
  '6': require('../../../assets/rolls/6.webm'),
  '7': require('../../../assets/rolls/7.webm'),
  '8': require('../../../assets/rolls/8.webm'),
  '9': require('../../../assets/rolls/9.webm'),
  A: require('../../../assets/rolls/A.webm'),
  B: require('../../../assets/rolls/B.webm'),
  C: require('../../../assets/rolls/C.webm'),
  D: require('../../../assets/rolls/D.webm'),
  E: require('../../../assets/rolls/E.webm'),
  F: require('../../../assets/rolls/F.webm'),
  SPIN: require('../../../assets/rolls/Spin.webm')
};

export function Dice({ roll, isRolling, rolled }: DiceProps) {
  const videoRef = useRef<VideoRef>(null);
  const [currentSource, setCurrentSource] = useState(ROLL_VIDEOS['0']);

  useEffect(() => {
    if (isRolling) {
      setCurrentSource(ROLL_VIDEOS.SPIN);
    } else {
      const rollKey = roll || '0';
      setCurrentSource(
        ROLL_VIDEOS[rollKey as keyof typeof ROLL_VIDEOS] || ROLL_VIDEOS['0']
      );
    }
  }, [roll, isRolling]);

  useEffect(() => {
    if (videoRef.current && !isRolling) {
      // show last frame with delay to ensure video is loaded
      setTimeout(() => {
        videoRef.current?.seek(9999);
      }, 100);
    }
  }, [isRolling]);

  return (
    <View style={styles.videoContainer}>
      <Video
        ref={videoRef}
        source={currentSource}
        style={styles.video}
        resizeMode="contain"
        repeat={isRolling}
        playInBackground={false}
        playWhenInactive={false}
        onLoad={() => {
          if (!rolled && videoRef.current) {
            videoRef.current.seek(9999);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    marginTop: 32,
    alignItems: 'center'
  },
  video: {
    width: 300,
    height: 300
  }
});
