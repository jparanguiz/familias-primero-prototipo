import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, ScreenHeader, FakeStatusBar } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Banner } from '@/components/Banner';
import { Card } from '@/components/Card';
import { useAppStore } from '@/store/AppStore';
import { useSession } from '@/store/SessionStore';
import { useAttendanceFlow } from '@/store/AttendanceFlow';
import { formatDate } from '@/domain/format';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function Revision() {
  const router = useRouter();
  const { session } = useSession();
  const { getStudent, getUser, confirmAttendance } = useAppStore();
  const { versionId, zoneId, detectedCount, entries, unassigned, toggleStatus, assignUnidentified, reset, photoTaken } =
    useAttendanceFlow();

  const [assignOpen, setAssignOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [savedUntil, setSavedUntil] = useState<string | null>(null);
  const [capMsg, setCapMsg] = useState<string | null>(null);

  const confirmedBy = (session?.userId && getUser(session.userId)?.name) || 'Tutor del programa';

  const total = entries.length;
  const present = useMemo(() => entries.filter((e) => e.status === 'presente').length, [entries]);

  // Tope de presentes = rostros detectados (incluye los sin asignar).
  // present ya cuenta solo los marcados; los 'sin identificar' ocupan cupos
  // restantes, por eso el tope efectivo para marcar a mano es detectedCount - unassigned.
  const presentCap = Math.max(0, detectedCount - unassigned);

  /** Alterna el estado respetando el tope de rostros detectados. */
  const handleToggle = (studentId: string, currentlyPresent: boolean) => {
    if (!currentlyPresent && present >= presentCap) {
      setCapMsg(
        `La foto detectó ${detectedCount} rostro${detectedCount === 1 ? '' : 's'}. ` +
          `Para marcar a alguien más como presente, primero marca ausente a otro` +
          (unassigned > 0 ? ' o asigna el rostro sin identificar.' : '.')
      );
      return;
    }
    setCapMsg(null);
    toggleStatus(studentId);
  };

  const assignCandidates = entries
    .filter((e) => e.status === 'ausente')
    .map((e) => getStudent(e.studentId))
    .filter(Boolean);

  if (!photoTaken && !confirmed) {
    return (
      <Screen footer={<Button label="Ir a tomar la foto" onPress={() => router.replace('/asistencia/foto')} />}>
        <ScreenHeader showBack backLabel="Foto" onBack={() => router.replace('/asistencia/foto')} title="Revisar resultados" step="Revisión" />
        <Banner tone="warning" text="Primero toma la foto del grupo." />
      </Screen>
    );
  }

  const handleConfirm = () => {
    if (!versionId || !zoneId) return;
    const record = confirmAttendance({
      versionId,
      zoneId,
      entries: entries.map((e) => ({ studentId: e.studentId, status: e.status })),
      confirmedBy,
    });
    setSavedUntil(record.photoRetainedUntil ?? null);
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <Screen footer={<Button label="Volver al inicio" onPress={() => { reset(); router.replace('/'); }} />}>
        <FakeStatusBar />
        <Text style={styles.doneTitle}>Asistencia confirmada</Text>
        <View style={styles.checkWrap}>
          <View style={styles.checkCircle}><Text style={styles.checkMark}>✓</Text></View>
        </View>
        <Text style={styles.doneLead}>{present} de {total} presentes</Text>
        <Card style={{ marginTop: spacing.xl }}>
          <Text style={styles.cardLabel}>Confirmado por</Text>
          <Text style={styles.cardValue}>{confirmedBy}</Text>
          <View style={{ height: spacing.md }} />
          <Text style={styles.cardLabel}>Conservación de la foto grupal</Text>
          <Text style={styles.cardValue}>
            {savedUntil
              ? `La foto se conserva hasta el ${formatDate(savedUntil)} y luego se elimina.`
              : 'La foto se conserva según el plazo de retención del programa.'}
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label="Confirmar asistencia" onPress={handleConfirm} />}>
      <ScreenHeader
        showBack
        backLabel="Foto"
        onBack={() => router.replace('/asistencia/foto')}
        title="Revisar resultados"
        subtitle={`${present} de ${total} presentes · ${detectedCount} rostros detectados`}
        step="Revisión"
      />

      {capMsg ? <Banner tone="warning" text={capMsg} /> : null}

      {entries.map((e) => {
        const student = getStudent(e.studentId);
        const presente = e.status === 'presente';
        return (
          <View key={e.studentId}>
            <View style={styles.row}>
              <Text style={styles.name}>{student?.name ?? 'Alumno'}</Text>
              <Pressable onPress={() => handleToggle(e.studentId, presente)} style={styles.statusChip}>
                <Text style={[styles.statusText, { color: presente ? colors.green : colors.red }]}>
                  {presente ? 'Presente' : 'Ausente'}
                </Text>
              </Pressable>
            </View>
            <View style={styles.divider} />
          </View>
        );
      })}

      {unassigned > 0 ? (
        <>
          <View style={styles.row}>
            <Text style={styles.name}>Sin identificar</Text>
            <Pressable onPress={() => setAssignOpen(true)} style={styles.statusChip}>
              <Text style={[styles.statusText, { color: colors.textPrimary }]}>Asignar</Text>
            </Pressable>
          </View>
          <View style={styles.divider} />
          <Banner tone="warning" text={`${unassigned} rostro sin identificar. Asígnalo a mano.`} />
        </>
      ) : null}

      <Banner
        tone="neutral"
        text="Toca un estado para alternarlo. La foto grupal se conserva hasta un mes después del término del programa."
      />

      <Modal visible={assignOpen} animationType="slide" onRequestClose={() => setAssignOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Asignar rostro a…</Text>
            <Pressable onPress={() => setAssignOpen(false)}><Text style={styles.link}>Cerrar</Text></Pressable>
          </View>
          <ScrollView>
            {assignCandidates.length === 0 ? (
              <Text style={styles.emptyAssign}>No hay alumnos ausentes para asignar.</Text>
            ) : (
              assignCandidates.map((s) => (
                <Pressable key={s!.id} style={styles.pickRow} onPress={() => { assignUnidentified(s!.id); setAssignOpen(false); }}>
                  <Text style={styles.pickName}>{s!.name}</Text>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  name: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textPrimary, flex: 1 },
  statusChip: {
    minWidth: 86,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  statusText: { fontFamily: fonts.medium, fontSize: fontSize.caption },
  divider: { height: 1, backgroundColor: colors.borderSoft },
  doneTitle: { fontFamily: fonts.medium, fontSize: fontSize.title, color: colors.textPrimary, marginTop: spacing.lg },
  checkWrap: { alignItems: 'center', marginTop: spacing.xl },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.greenBg, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: colors.green, fontSize: 40, fontFamily: fonts.semibold, lineHeight: 46 },
  doneLead: { fontFamily: fonts.medium, fontSize: fontSize.subtitle, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.xl },
  cardLabel: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary },
  cardValue: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textPrimary, marginTop: 2 },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  modalTitle: { fontFamily: fonts.medium, fontSize: fontSize.subtitle, color: colors.textPrimary },
  link: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.blue },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  pickName: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textPrimary },
  chevron: { fontSize: 24, color: colors.textMuted },
  emptyAssign: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textSecondary, padding: spacing.xl },
});
