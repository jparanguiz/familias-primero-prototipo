# Cómo trabajar en equipo en este repositorio

Guía corta para desarrollar entre varias personas sin pisarse, dejando registro de
quién incorporó cada cambio y pudiendo revertir cuando haga falta.

## Primera vez

```bash
git clone https://github.com/jparanguiz/familias-primero-prototipo.git
cd familias-primero-prototipo
npm install
npm run web        # abre el prototipo en el navegador
```

## Flujo de trabajo (ramas + Pull Request)

Trabajamos con una rama por cambio y lo integramos a `main` mediante un Pull Request
(PR). `main` es la rama que se publica automáticamente en GitHub Pages.

```bash
git checkout main
git pull                       # traer lo último antes de empezar
git checkout -b descripcion-corta-del-cambio

# ...editar y probar...
npm run typecheck              # verificar que no haya errores de tipos

git add .
git commit -m "Mensaje claro de qué cambió y por qué"
git push -u origin descripcion-corta-del-cambio
```

Luego, en GitHub, abre un **Pull Request** desde tu rama hacia `main`
(o con la CLI: `gh pr create --fill`). Describe el cambio en la plantilla.
Al fusionar el PR, el sitio se republica solo.

> Regla de oro: antes de empezar a trabajar, `git pull`. Así evitas conflictos.

## Ver quién incorporó qué

- **Historial de commits:** `git log --oneline` o la pestaña *Commits* en GitHub.
- **Autoría línea por línea:** `git blame <archivo>` o el botón *Blame* en GitHub.
- **Listado de cambios integrados:** la pestaña *Pull requests* → *Closed* muestra
  cada cambio con su autor, descripción y fecha.

## Revertir (rollback)

- **Deshacer un PR completo:** en GitHub, abre el PR fusionado y usa el botón
  **Revert**. Crea un PR nuevo que deshace esos cambios dejando constancia.
- **Deshacer un commit puntual:**
  ```bash
  git revert <hash-del-commit>
  git push
  ```
- **Ver el sitio en una versión anterior:** cada commit en `main` quedó publicado;
  se puede volver revirtiendo al punto deseado.

## Despliegue

Cada cambio que llega a `main` (al fusionar un PR) dispara el workflow de
`.github/workflows/deploy.yml`, que reconstruye y publica el sitio en:

https://jparanguiz.github.io/familias-primero-prototipo/
