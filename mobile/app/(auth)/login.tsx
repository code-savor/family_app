import { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { PinInput } from '@/components/ui/PinInput';
import { useAuthStore } from '@/domains/auth/store';
import { colors, spacing, typography, radius } from '@/theme';

type Step = 'family_id' | 'nickname' | 'pin';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);

  const [step, setStep] = useState<Step>('family_id');
  const [familyId, setFamilyId] = useState('');
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = useCallback(() => {
    if (step === 'family_id') {
      if (!familyId.trim()) return Alert.alert('알림', '가족 ID를 입력해주세요');
      setStep('nickname');
    } else if (step === 'nickname') {
      if (!nickname.trim()) return Alert.alert('알림', '닉네임을 입력해주세요');
      setStep('pin');
    }
  }, [step, familyId, nickname]);

  const handlePinChange = useCallback(async (newPin: string) => {
    setPin(newPin);
    if (newPin.length === 4) {
      setLoading(true);
      try {
        await login({ family_id: familyId.trim(), nickname: nickname.trim(), pin: newPin });
        router.replace('/(main)/(home)');
      } catch (e: any) {
        setPin('');
        Alert.alert('로그인 실패', e?.response?.data?.message ?? '닉네임 또는 PIN을 확인해주세요');
      } finally {
        setLoading(false);
      }
    }
  }, [familyId, nickname, login]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer scrollable>
        <View style={styles.container}>
          <Text style={styles.emoji}>🍚</Text>
          <Text style={typography.h2}>밥먹자</Text>
          <Text style={styles.subtitle}>가족과 함께하는 밥상</Text>

          {step === 'family_id' && (
            <View style={styles.form}>
              <Text style={styles.label}>가족 ID</Text>
              <TextInput
                style={styles.input}
                value={familyId}
                onChangeText={setFamilyId}
                placeholder="가족 ID를 입력하세요"
                placeholderTextColor={colors.textDisabled}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button label="다음" onPress={handleNext} style={styles.button} />
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>또는</Text>
                <View style={styles.line} />
              </View>
              <Button
                label="새 가족 만들기"
                variant="secondary"
                onPress={() => router.push('/(auth)/create-family')}
                style={styles.button}
              />
            </View>
          )}

          {step === 'nickname' && (
            <View style={styles.form}>
              <Text style={styles.label}>닉네임</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor={colors.textDisabled}
                autoCorrect={false}
              />
              <Button label="다음" onPress={handleNext} style={styles.button} />
              <Button
                label="뒤로"
                variant="ghost"
                onPress={() => setStep('family_id')}
                style={styles.button}
              />
            </View>
          )}

          {step === 'pin' && (
            <View style={styles.form}>
              <Text style={styles.label}>PIN 4자리</Text>
              <Text style={styles.hint}>{nickname}님의 PIN을 입력해주세요</Text>
              <PinInput value={pin} onChange={handlePinChange} />
              {loading && <Text style={styles.hint}>로그인 중...</Text>}
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
  emoji: { fontSize: 64 },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: spacing.lg,
  },
  form: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
  },
  label: {
    ...typography.label,
    alignSelf: 'flex-start',
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 13,
  },
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  line: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { color: colors.textSecondary, fontSize: 13 },
});
