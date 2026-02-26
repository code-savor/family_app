import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QuickResponseButton } from '@/components/meal-call/QuickResponseButton';
import { ResponseStatusList } from '@/components/meal-call/ResponseStatusList';
import { ElapsedTimer } from '@/components/meal-call/ElapsedTimer';
import { useMealCallStore } from '@/domains/meal-call/store';
import { useAuthStore } from '@/domains/auth/store';
import { mealCallApi } from '@/domains/meal-call/api';
import { colors, spacing, typography, radius } from '@/theme';
import type { MealCall, ResponseType } from '@/domains/meal-call/types';

const POLL_INTERVAL = 10_000;

export default function MealCallDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { respond, remind, complete } = useMealCallStore(
    useShallow((s) => ({
      respond: s.respond,
      remind: s.remind,
      complete: s.complete,
    })),
  );
  const member = useAuthStore((s) => s.member);

  const [mealCall, setMealCall] = useState<MealCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ResponseType | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const mc = await mealCallApi.getById(id);
      setMealCall(mc);
      // 기존 응답 복원
      const myResponse = mc.responses.find((r) => r.member_id === member?.id);
      if (myResponse) {
        setSelectedType(myResponse.response_type);
        if (myResponse.custom_message) setCustomMessage(myResponse.custom_message);
      }
    } catch {
      Alert.alert('오류', '데이터를 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [id, member?.id]);

  // 마운트 + 10초 폴링
  useEffect(() => {
    fetchData();
    const pollId = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(pollId);
  }, [fetchData]);

  const handleRespond = useCallback(async (type: ResponseType) => {
    if (!id || !mealCall) return;
    if (type === 'CUSTOM') {
      setSelectedType('CUSTOM');
      return;
    }
    setActionLoading(true);
    try {
      await respond(id, type);
      setSelectedType(type);
      await fetchData();
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.message ?? '응답 전송에 실패했습니다');
    } finally {
      setActionLoading(false);
    }
  }, [id, mealCall, respond, fetchData]);

  const handleCustomSubmit = useCallback(async () => {
    if (!id || !customMessage.trim()) return;
    setActionLoading(true);
    try {
      await respond(id, 'CUSTOM', customMessage.trim());
      await fetchData();
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.message ?? '응답 전송에 실패했습니다');
    } finally {
      setActionLoading(false);
    }
  }, [id, customMessage, respond, fetchData]);

  const handleRemind = useCallback(async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const msg = await remind(id);
      Alert.alert('재알림 전송', msg);
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.message ?? '재알림 전송에 실패했습니다');
    } finally {
      setActionLoading(false);
    }
  }, [id, remind]);

  const handleComplete = useCallback(async () => {
    if (!id) return;
    Alert.alert('밥먹자 완료', '밥먹자를 완료하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '완료',
        onPress: async () => {
          setActionLoading(true);
          try {
            await complete(id);
            router.replace('/(main)/(home)');
          } catch {
            Alert.alert('오류', '완료 처리에 실패했습니다');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  }, [id, complete]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!mealCall) return null;

  const isActive = mealCall.status === 'ACTIVE';
  const isCaller = mealCall.caller_id === member?.id;
  const hasPending = mealCall.pending_member_ids.length > 0;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 헤더 */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={typography.h3}>🍚 밥먹자!</Text>
          <ElapsedTimer startTime={mealCall.created_at} />
        </View>
        <Text style={styles.callerText}>
          <Text style={styles.bold}>{mealCall.caller_nickname}</Text>
          {'이(가) 불렀어요'}
        </Text>
        {mealCall.menus.length > 0 && (
          <View style={styles.menuRow}>
            {mealCall.menus.map((m) => (
              <Text key={m.id} style={styles.menuBadge}>
                {m.emoji_icon} {m.name}
              </Text>
            ))}
          </View>
        )}
        {mealCall.message ? (
          <Text style={styles.message}>💬 {mealCall.message}</Text>
        ) : null}
        {!isActive && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {mealCall.status === 'COMPLETED' ? '✅ 완료' : '❌ 취소'}
            </Text>
          </View>
        )}
      </Card>

      {/* 응답 버튼 (활성 상태일 때만) */}
      {isActive && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>어떻게 할까요?</Text>
          <View style={styles.responseGrid}>
            <QuickResponseButton
              type="COMING_NOW"
              selected={selectedType === 'COMING_NOW'}
              onPress={handleRespond}
            />
            <QuickResponseButton
              type="COMING_5MIN"
              selected={selectedType === 'COMING_5MIN'}
              onPress={handleRespond}
            />
          </View>
          <View style={styles.responseGrid}>
            <QuickResponseButton
              type="NOT_EATING"
              selected={selectedType === 'NOT_EATING'}
              onPress={handleRespond}
            />
            <QuickResponseButton
              type="CUSTOM"
              selected={selectedType === 'CUSTOM'}
              onPress={handleRespond}
            />
          </View>

          {/* 자유 입력 */}
          {selectedType === 'CUSTOM' && (
            <View style={styles.customInput}>
              <TextInput
                style={styles.textInput}
                value={customMessage}
                onChangeText={setCustomMessage}
                placeholder="메시지를 입력하세요"
                placeholderTextColor={colors.textDisabled}
                returnKeyType="send"
                onSubmitEditing={handleCustomSubmit}
              />
              <Button
                label="전송"
                onPress={handleCustomSubmit}
                loading={actionLoading}
                size="sm"
                style={styles.sendBtn}
              />
            </View>
          )}
        </View>
      )}

      {/* 응답 현황 */}
      <Card style={styles.section}>
        <ResponseStatusList mealCall={mealCall} />
      </Card>

      {/* 호출자 전용 액션 */}
      {isActive && isCaller && (
        <View style={styles.callerActions}>
          {hasPending && (
            <Button
              label={`⏰ 재알림 (${mealCall.pending_member_ids.length}명)`}
              variant="secondary"
              onPress={handleRemind}
              loading={actionLoading}
            />
          )}
          <Button
            label="✅ 밥먹자 완료"
            variant="ghost"
            onPress={handleComplete}
            loading={actionLoading}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerCard: { gap: spacing.sm },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callerText: { fontSize: 14, color: colors.textSecondary },
  bold: { fontWeight: '700', color: colors.textPrimary },
  menuRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  menuBadge: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    fontSize: 13,
    color: colors.textPrimary,
    overflow: 'hidden',
  },
  message: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.divider,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.label },
  responseGrid: { flexDirection: 'row', gap: spacing.sm },
  customInput: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  sendBtn: { minWidth: 60 },
  callerActions: { gap: spacing.sm },
});
