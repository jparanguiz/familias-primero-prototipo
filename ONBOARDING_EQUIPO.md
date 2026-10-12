# Bienvenido/a al prototipo de Familias Primero 👋

Esta guía te deja operativo/a para editar la app en equipo.

## 1. Clona el repo e instala (una sola vez)

```bash
git clone https://github.com/jparanguiz/familias-primero-prototipo.git
cd familias-primero-prototipo
npm install
```

Requisito: **Node.js 18+**. En Mac, si al correr la app aparece
`EMFILE: too many open files`, instala Watchman: `brew install watchman`.

## 2. Levanta la app en tu navegador

```bash
npm run web
```

Se abre en http://localhost:8081 (la app se ve dentro de un marco de teléfono).

## 3. Para hacer un cambio (ramas + Pull Request)

```bash
git checkout main && git pull
git checkout -b mi-cambio
# ...editas y pruebas...
npm run typecheck            # que no queden errores de tipos
git add . && git commit -m "qué cambió y por qué"
git push -u origin mi-cambio
```

Luego, en GitHub, abre un **Pull Request** desde tu rama hacia `main`
(o con la CLI: `gh pr create --fill`). Al fusionarlo, el sitio público se actualiza
solo.

## Reglas importantes

- **No se puede hacer `push` directo a `main`** (está así a propósito): todo entra por
  Pull Request, para que quede registro de quién incorporó qué y se pueda revertir fácil.
- **Regla de oro:** antes de empezar a trabajar, `git pull`.
- Detalle completo del flujo (ver autoría, hacer rollback) en `CONTRIBUTING.md`.

## Enlaces

- **Sitio publicado para probar:** https://jparanguiz.github.io/familias-primero-prototipo/
- **Repositorio:** https://github.com/jparanguiz/familias-primero-prototipo

¿Dudas? Escríbele a Jorge (jparanguiz). ¡A programar! 🙌
