import { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '@/theme';

interface ElapsedTimerProps {
  startTime: string; // ISO string
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}초 전`;
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  return `${hr}시간 전`;
}

export function ElapsedTimer({ startTime }: ElapsedTimerProps) {
  const [elapsed, setElapsed] = useState(() => Date.now() - new Date(startTime).getTime());

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Date.now() - new Date(startTime).getTime());
    }, 10_000); // 10초마다 갱신
    return () => clearInterval(id);
  }, [startTime]);

  return <Text style={styles.text}>{formatElapsed(elapsed)}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
