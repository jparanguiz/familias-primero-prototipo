import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

interface SignaturePadProps {
  /** Devuelve las trazas como path SVG serializado, o '' si está vacío. */
  onChange: (paths: string) => void;
}

type Point = { x: number; y: number };

/**
 * Lienzo de firma dibujada. Funciona con dedo (nativo, vía PanResponder) y
 * con mouse/touch en web (vía eventos de puntero). Emite el trazo serializado
 * en cada movimiento, de modo que el valor queda disponible aunque el gesto
 * de "soltar" no se dispare de forma limpia (típico en navegador).
 */
export function SignaturePad({ onChange }: SignaturePadProps) {
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [current, setCurrent] = useState<Point[]>([]);
  const drawing = useRef(false);

  // Emite todas las trazas (cerradas + la actual en curso) serializadas.
  const emit = useCallback(
    (committed: Point[][], inProgress: Point[]) => {
      const all = inProgress.length > 0 ? [...committed, inProgress] : committed;
      const serialized = all
        .map((s) => pointsToSvgPath(s))
        .filter(Boolean)
        .join(' ');
      onChange(serialized);
    },
    [onChange]
  );

  const start = useCallback((x: number, y: number) => {
    drawing.current = true;
    setCurrent([{ x, y }]);
  }, []);

  const move = useCallback(
    (x: number, y: number) => {
      if (!drawing.current) return;
      setCurrent((prev) => {
        const next = [...prev, { x, y }];
        // Emite en caliente usando el valor más reciente de trazas cerradas.
        setStrokes((committed) => {
          emit(committed, next);
          return committed;
        });
        return next;
      });
    },
    [emit]
  );

  const end = useCallback(() => {
    if (!drawing.current) return;
    drawing.current = false;
    setCurrent((inProgress) => {
      if (inProgress.length === 0) return [];
      setStrokes((committed) => {
        const next = [...committed, inProgress];
        emit(next, []);
        return next;
      });
      return [];
    });
  }, [emit]);

  // --- Nativo (iOS/Android): PanResponder ---
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e: GestureResponderEvent) =>
          start(e.nativeEvent.locationX, e.nativeEvent.locationY),
        onPanResponderMove: (e: GestureResponderEvent) =>
          move(e.nativeEvent.locationX, e.nativeEvent.locationY),
        onPanResponderRelease: end,
        onPanResponderTerminate: end,
      }),
    [start, move, end]
  );

  const clear = useCallback(() => {
    drawing.current = false;
    setStrokes([]);
    setCurrent([]);
    onChange('');
  }, [onChange]);

  const [size, setSize] = useState({ w: 0, h: 170 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  const isEmpty = strokes.length === 0 && current.length === 0;
  const allPaths = [...strokes, current];

  // --- Web: handlers de puntero. Relativos a la caja del lienzo. ---
  const webHandlers =
    Platform.OS === 'web'
      ? {
          onPointerDown: (ev: any) => {
            ev.currentTarget.setPointerCapture?.(ev.pointerId);
            const r = ev.currentTarget.getBoundingClientRect();
            start(ev.clientX - r.left, ev.clientY - r.top);
          },
          onPointerMove: (ev: any) => {
            if (!drawing.current) return;
            const r = ev.currentTarget.getBoundingClientRect();
            move(ev.clientX - r.left, ev.clientY - r.top);
          },
          onPointerUp: end,
          onPointerLeave: end,
          onPointerCancel: end,
        }
      : {};

  const nativeHandlers = Platform.OS === 'web' ? {} : panResponder.panHandlers;

  return (
    <View>
      <View
        style={styles.pad}
        onLayout={onLayout}
        {...nativeHandlers}
        {...(webHandlers as object)}
      >
        {/* El SVG no debe interceptar los eventos de puntero. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={size.w} height={size.h}>
            {allPaths.map((stroke, i) => {
              const d = pointsToSvgPath(stroke);
              if (!d) return null;
              return (
                <Path
                  key={i}
                  d={d}
                  stroke={colors.textPrimary}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              );
            })}
          </Svg>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.hint}>
          {isEmpty ? 'Dibuja tu firma' : 'Firma registrada'}
        </Text>
        <Text style={styles.clear} onPress={clear}>
          Borrar
        </Text>
      </View>
    </View>
  );
}

function pointsToSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    // Un punto: dibuja una micro línea para que se vea.
    return `M ${p.x} ${p.y} L ${p.x + 0.1} ${p.y + 0.1}`;
  }
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
}

const styles = StyleSheet.create({
  pad: {
    height: 170,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    // En web, evita el scroll/selección mientras se dibuja.
    ...(Platform.OS === 'web' ? ({ touchAction: 'none', cursor: 'crosshair' } as object) : {}),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  clear: {
    fontFamily: fonts.medium,
    fontSize: fontSize.small,
    color: colors.blue,
  },
});
