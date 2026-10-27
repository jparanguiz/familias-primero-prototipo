import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppStore } from '@/store/AppStore';
import { useSession } from '@/store/SessionStore';
import { useActiveOrgId } from '@/store/useScope';
import { versionLabel } from '@/domain/retention';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

/**
 * Selector de la versión activa del programa, acotado a la organización activa.
 * Si la versión activa no pertenece a la organización, se reajusta.
 */
export function useActiveVersion() {
  const { versions } = useAppStore();
  const { activeVersionId, setActiveVersionId } = useSession();
  const orgId = useActiveOrgId();

  const orgVersions = useMemo(
    () => (orgId ? versions.filter((v) => v.orgId === orgId) : []),
    [versions, orgId]
  );

  const belongs = orgVersions.some((v) => v.id === activeVersionId);

  useEffect(() => {
    if (orgVersions.length === 0) {
      if (activeVersionId) setActiveVersionId(null);
      return;
    }
    if (!belongs) {
      const sorted = [...orgVersions].sort(
        (a, b) => b.year - a.year || (b.season === 'Invierno' ? 1 : 0) - (a.season === 'Invierno' ? 1 : 0)
      );
      setActiveVersionId(sorted[0].id);
    }
  }, [belongs, orgVersions, activeVersionId, setActiveVersionId]);

  const active = (belongs && orgVersions.find((v) => v.id === activeVersionId)) || orgVersions[0];
  return { active, activeVersionId: active?.id ?? null, setActiveVersionId, orgVersions };
}

export function VersionPicker() {
  const { active, setActiveVersionId, orgVersions } = useActiveVersion();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.chip} onPress={() => setOpen(true)}>
        <Text style={styles.chipLabel}>Versión</Text>
        <Text style={styles.chipValue}>{active ? versionLabel(active) : 'Sin versiones'} ▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Elegir versión</Text>
            <ScrollView>
              {orgVersions.map((v) => {
                const isActive = v.id === active?.id;
                return (
                  <Pressable
                    key={v.id}
                    style={[styles.row, isActive && styles.rowActive]}
                    onPress={() => {
                      setActiveVersionId(v.id);
                      setOpen(false);
                    }}
                  >
                    <Text style={styles.rowText}>{versionLabel(v)}</Text>
                    {isActive ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  chipValue: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.textPrimary },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  rowActive: {},
  rowText: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textPrimary },
  check: { color: colors.green, fontFamily: fonts.semibold, fontSize: fontSize.body },
});
