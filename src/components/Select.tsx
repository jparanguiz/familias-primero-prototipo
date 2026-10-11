import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FlatList } from 'react-native';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

interface BaseProps {
  label?: string;
  placeholder?: string;
  options: Option[];
  /** Umbral para mostrar búsqueda. */
  searchable?: boolean;
}

interface SingleProps extends BaseProps {
  multiple?: false;
  value: string | null;
  onChange: (value: string) => void;
}

interface MultiProps extends BaseProps {
  multiple: true;
  value: string[];
  onChange: (values: string[]) => void;
}

type Props = SingleProps | MultiProps;

/**
 * Selector escalable (lista desplegable con búsqueda) para una o varias opciones.
 * Reemplaza los "chips" cuando puede haber muchas zonas/instituciones.
 */
export function Select(props: Props) {
  const { label, placeholder = 'Seleccionar…', options } = props;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const searchable = props.searchable ?? options.length > 8;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q)
    );
  }, [options, query]);

  const selectedLabels = useMemo(() => {
    if (props.multiple) {
      const set = new Set(props.value);
      const chosen = options.filter((o) => set.has(o.value));
      if (chosen.length === 0) return '';
      if (chosen.length <= 2) return chosen.map((o) => o.label).join(', ');
      return `${chosen.length} seleccionadas`;
    }
    return options.find((o) => o.value === props.value)?.label ?? '';
  }, [options, props]);

  const isSelected = (value: string) =>
    props.multiple ? props.value.includes(value) : props.value === value;

  const choose = (value: string) => {
    if (props.multiple) {
      const set = new Set(props.value);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      props.onChange([...set]);
    } else {
      props.onChange(value);
      setOpen(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={[styles.triggerText, !selectedLabels && styles.placeholder]} numberOfLines={1}>
          {selectedLabels || placeholder}
        </Text>
        <Text style={styles.caret}>▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label ?? 'Seleccionar'}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={styles.done}>{props.multiple ? 'Listo' : 'Cerrar'}</Text>
              </Pressable>
            </View>

            {searchable ? (
              <TextInput
                style={styles.search}
                placeholder="Buscar…"
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
            ) : null}

            <FlatList
              data={filtered}
              keyExtractor={(o) => o.value}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 380 }}
              renderItem={({ item }) => {
                const sel = isSelected(item.value);
                return (
                  <Pressable style={styles.option} onPress={() => choose(item.value)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionLabel}>{item.label}</Text>
                      {item.sublabel ? <Text style={styles.optionSub}>{item.sublabel}</Text> : null}
                    </View>
                    {props.multiple ? (
                      <View style={[styles.check, sel && styles.checkOn]}>
                        {sel ? <Text style={styles.checkMark}>✓</Text> : null}
                      </View>
                    ) : sel ? (
                      <Text style={styles.single}>✓</Text>
                    ) : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Text style={styles.empty}>Sin resultados.</Text>}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  triggerText: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textPrimary },
  placeholder: { color: colors.textMuted },
  caret: { color: colors.textSecondary, marginLeft: spacing.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sheetTitle: { fontFamily: fonts.medium, fontSize: fontSize.subtitle, color: colors.textPrimary },
  done: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.blue },
  search: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  optionLabel: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textPrimary },
  optionSub: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2 },
  check: {
    width: 22,
    height: 22,
    borderRadius: radius.sm / 2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  checkMark: { color: colors.textOnDark, fontFamily: fonts.semibold, fontSize: 13 },
  single: { color: colors.green, fontFamily: fonts.semibold, fontSize: fontSize.body },
  empty: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textSecondary, padding: spacing.lg },
});
