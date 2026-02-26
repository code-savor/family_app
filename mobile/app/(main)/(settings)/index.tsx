import { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/domains/auth/store';
import { colors, spacing, typography, radius } from '@/theme';

export default function SettingsScreen() {
  const member = useAuthStore((s) => s.member);
  const logout = useAuthStore((s) => s.logout);
  const [familyName, setFamilyName] = useState('');
  const [members, setMembers] = useState<{ id: string; nickname: string; role: string }[]>([]);

  useEffect(() => {
    if (!member) return;
    apiClient
      .get(endpoints.getFamily(member.family_id))
      .then(({ data }) => {
        setFamilyName(data.name);
        setMembers(data.members);
      })
      .catch(() => {});
  }, [member]);

  const handleInvite = useCallback(async () => {
    if (!member) return;
    try {
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      const { data } = await apiClient.post(
        endpoints.createInviteLink(member.family_id),
        { expires_at: expires.toISOString(), max_uses: 5 },
      );
      Alert.alert(
        '초대 링크',
        `앱 링크:\n${data.invite_url}\n\n가족 ID:\n${member.family_id}`,
        [{ text: '확인' }],
      );
    } catch {
      Alert.alert('오류', '초대 링크 생성에 실패했습니다');
    }
  }, [member]);

  const handleLogout = useCallback(() => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }, [logout]);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Text style={typography.h3}>⚙️ 설정</Text>

      {/* 내 프로필 */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>내 프로필</Text>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {member?.nickname?.slice(0, 1) ?? '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.nickname}>{member?.nickname}</Text>
            <Text style={styles.role}>
              {member?.role === 'OWNER' ? '👑 가족 대표' : '👤 멤버'}
            </Text>
          </View>
        </View>
      </Card>

      {/* 가족 정보 */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>우리 가족 · {familyName}</Text>
        <Text style={styles.familyId}>ID: {member?.family_id}</Text>
        {members.map((m) => (
          <View key={m.id} style={styles.memberRow}>
            <Text style={styles.memberEmoji}>
              {m.role === 'OWNER' ? '👑' : '👤'}
            </Text>
            <Text style={styles.memberName}>{m.nickname}</Text>
          </View>
        ))}
        <Button
          label="🔗 초대 링크 만들기"
          variant="secondary"
          onPress={handleInvite}
          style={styles.button}
        />
      </Card>

      {/* 로그아웃 */}
      <Button
        label="로그아웃"
        variant="ghost"
        onPress={handleLogout}
        style={styles.logoutBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.label, marginBottom: spacing.xs },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: colors.textOnPrimary },
  nickname: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  role: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  familyId: { fontSize: 12, color: colors.textSecondary, fontFamily: 'monospace' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberEmoji: { fontSize: 18 },
  memberName: { fontSize: 15, color: colors.textPrimary },
  button: { marginTop: spacing.xs },
  logoutBtn: { marginTop: spacing.sm },
});
