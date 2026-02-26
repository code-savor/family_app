import { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { PinInput } from '@/components/ui/PinInput';
import { useAuthStore } from '@/domains/auth/store';
import { colors, spacing, typography, radius } from '@/theme';

type Step = 'nickname' | 'pin';

export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const joinFamily = useAuthStore((s) => s.joinFamily);

  const [step, setStep] = useState<Step>('nickname');
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = useCallback(() => {
    if (!nickname.trim()) return Alert.alert('알림', '닉네임을 입력해주세요');
    setStep('pin');
  }, [nickname]);

  const handlePinChange = useCallback(async (newPin: string) => {
    setPin(newPin);
    if (newPin.length === 4) {
      setLoading(true);
      try {
        await joinFamily({ token: token!, nickname: nickname.trim(), pin: newPin });
        router.replace('/(main)/(home)');
      } catch (e: any) {
        setPin('');
        Alert.alert('가입 실패', e?.response?.data?.message ?? '가입에 실패했습니다');
      } finally {
        setLoading(false);
      }
    }
  }, [token, nickname, joinFamily]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer scrollable>
        <View style={styles.container}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={typography.h2}>가족에 합류하기</Text>

          {step === 'nickname' && (
            <View style={styles.form}>
              <Text style={styles.label}>닉네임</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="예: 엄마, 큰딸"
                placeholderTextColor={colors.textDisabled}
                autoCorrect={false}
              />
              <Button label="PIN 설정하기" onPress={handleNext} style={styles.button} />
            </View>
          )}

          {step === 'pin' && (
            <View style={styles.form}>
              <Text style={styles.label}>PIN 4자리 설정</Text>
              <Text style={styles.hint}>로그인할 때 사용할 PIN을 설정하세요</Text>
              <PinInput value={pin} onChange={handlePinChange} />
              {loading && <Text style={styles.hint}>가입 중...</Text>}
              <Button
                label="뒤로"
                variant="ghost"
                onPress={() => { setStep('nickname'); setPin(''); }}
                style={styles.button}
              />
            </View>
          )}
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  emoji: { fontSize: 56 },
  form: { width: '100%', gap: spacing.md, alignItems: 'center' },
  label: { ...typography.label, alignSelf: 'flex-start' },
  hint: { color: colors.textSecondary, fontSize: 13 },
  input: {
    width: '100%',
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  button: { width: '100%' },
});
