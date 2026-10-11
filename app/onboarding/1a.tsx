import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAppStore } from '@/store/AppStore';
import { useConsentFlow } from '@/store/ConsentFlow';
import { buildConsentDocument } from '@/domain/document';
import { versionLabel } from '@/domain/retention';
import { colors, fonts, fontSize, spacing } from '@/theme';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function Consentimiento1a() {
  const router = useRouter();
  const { studentId } = useConsentFlow();
  const { getStudent, getZone, getVersion } = useAppStore();
  const [showDoc, setShowDoc] = useState(false);

  const student = studentId ? getStudent(studentId) : undefined;

  if (!student) {
    return (
      <Screen>
        <ScreenHeader showBack title="Consentimiento informado" step="Consentimiento 1/4" />
        <Text style={styles.value}>No se encontró el alumno. Vuelve atrás.</Text>
      </Screen>
    );
  }

  const zone = getZone(student.zoneId);
  const version = getVersion(student.versionId);
  const context = `${version ? versionLabel(version) : ''}${zone ? ` · ${zone.name}` : ''}`;
  const fullText = buildConsentDocument(student.name, context);

  return (
    <Screen footer={<Button label="Continuar" onPress={() => router.push('/onboarding/1b')} />}>
      <ScreenHeader
        showBack
        title="Consentimiento informado"
        subtitle="Generado desde la ficha del alumno"
        step="Consentimiento 1/4"
      />

      <Card>
        <Row label="Alumno" value={student.name} />
        <Row label="Programa" value={context} />
        <Row label="Finalidad" value="Registrar asistencia mediante foto del curso" />
        <Row
          label="Conservación"
          value="La foto grupal se conserva hasta un mes después de finalizado el programa; luego se elimina"
        />
        <Row label="Revocación" value="Puedes retirar tu autorización cuando quieras" />
      </Card>

      <Pressable onPress={() => setShowDoc(true)} style={styles.linkWrap}>
        <Text style={styles.link}>Ver documento completo</Text>
      </Pressable>

      <Modal visible={showDoc} animationType="slide" onRequestClose={() => setShowDoc(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Documento completo</Text>
            <Pressable onPress={() => setShowDoc(false)}>
              <Text style={styles.link}>Cerrar</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.docText}>{fullText}</Text>
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { marginBottom: spacing.lg },
  label: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginBottom: 2 },
  value: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textPrimary },
  linkWrap: { marginTop: spacing.lg },
  link: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.blue },
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
  modalBody: { padding: spacing.xl },
  docText: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textPrimary, lineHeight: 22 },
});
