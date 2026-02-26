import { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { PinInput } from '@/components/ui/PinInput';
import { useAuthStore } from '@/domains/auth/store';
import { colors, spacing, typography, radius } from '@/theme';

type Step = 'info' | 'pin';

export default function CreateFamilyScreen() {
  const createFamily = useAuthStore((s) => s.createFamily);

  const [step, setStep] = useState<Step>('info');
  const [familyName, setFamilyName] = useState('');
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = useCallback(() => {
    if (!familyName.trim()) return Alert.alert('알림', '가족 이름을 입력해주세요');
    if (!nickname.trim()) return Alert.alert('알림', '닉네임을 입력해주세요');
    setStep('pin');
  }, [familyName, nickname]);

  const handlePinChange = useCallback(async (newPin: string) => {
    setPin(newPin);
    if (newPin.length === 4) {
      setLoading(true);
      try {
        await createFamily({
          family_name: familyName.trim(),
          owner_nickname: nickname.trim(),
          owner_pin: newPin,
        });
        router.replace('/(main)/(home)');
      } catch (e: any) {
        setPin('');
        Alert.alert('오류', e?.response?.data?.message ?? '가족 생성에 실패했습니다');
      } finally {
        setLoading(false);
      }
    }
  }, [familyName, nickname, createFamily]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer scrollable>
        <View style={styles.container}>
          <Text style={styles.emoji}>🏠</Text>
          <Text style={typography.h2}>새 가족 만들기</Text>

          {step === 'info' && (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>가족 이름</Text>
                <TextInput
                  style={styles.input}
                  value={familyName}
                  onChangeText={setFamilyName}
                  placeholder="예: 김씨 가족"
                  placeholderTextColor={colors.textDisabled}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>내 닉네임</Text>
                <TextInput
                  style={styles.input}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="예: 아빠, 엄마"
                  placeholderTextColor={colors.textDisabled}
                />
              </View>
              <Button label="PIN 설정하기" onPress={handleNext} style={styles.button} />
              <Button
                label="뒤로"
                variant="ghost"
                onPress={() => router.back()}
                style={styles.button}
              />
            </View>
          )}

          {step === 'pin' && (
            <View style={styles.form}>
              <Text style={styles.label}>PIN 4자리 설정</Text>
              <Text style={styles.hint}>로그인할 때 사용할 PIN을 설정하세요</Text>
              <PinInput value={pin} onChange={handlePinChange} />
              {loading && <Text style={styles.hint}>가족 생성 중...</Text>}
              <Button
                label="뒤로"
                variant="ghost"
                onPress={() => { setStep('info'); setPin(''); }}
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
  field: { width: '100%', gap: spacing.xs },
  label: { ...typography.label },
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
