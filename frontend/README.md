# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Uso atual do localStorage no frontend

O frontend ainda não usa uma autenticação real com backend para manter o usuário logado. No momento, o login é validado contra um usuário mockado e, quando a validação dá certo, os dados desse usuário são salvos no `localStorage`.

Esse fluxo existe apenas para simular uma sessão enquanto a integração com o backend não está pronta.

### Chave usada

A chave atual do `localStorage` é:

```txt
ead.auth.user
```

Ela é definida em:

```txt
src/services/userService.tsx
```

### Formato salvo

Depois do login com sucesso, o frontend salva um JSON com os dados do usuário autenticado:

```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao.silva@exemplo.com",
  "avatar": "https://images.unsplash.com/...",
  "senha": "123456"
}
```

Importante: esse formato ainda vem do `mockUser`. Em uma integração real, o frontend não deve salvar a senha do usuário no navegador. O backend deve retornar somente dados públicos do usuário e, se necessário, um token de autenticação.

### Funções responsáveis

As funções que controlam esse armazenamento estão em `src/services/userService.tsx`:

- `loginUser(email, password)`: valida o login usando o `mockUser`.
- `saveAuthenticatedUser(user)`: salva o usuário autenticado no `localStorage`.
- `getAuthenticatedUser()`: lê o usuário salvo e retorna `null` se não existir sessão.
- `clearAuthenticatedUser()`: remove o usuário salvo do `localStorage`.

### Onde isso é usado

O fluxo atual funciona assim:

1. `src/components/forms/LoginForm.tsx` chama `loginUser()`.
2. Se o login der certo, chama `saveAuthenticatedUser(user)`.
3. O usuário é redirecionado para `/home`.
4. `src/pages/userHome.tsx` chama `getAuthenticatedUser()`.
5. A `Navbar` recebe esse usuário.
6. Se existir usuário, aparece `Meu Desempenho` e o avatar.
7. Se não existir usuário, aparecem `Login` e `Cadastre-se`.

A mesma leitura de sessão também é usada em `src/pages/CourseView.tsx`, para manter a navbar consistente dentro da tela do curso.

### Como isso deve ser ligado ao backend depois

Quando o backend estiver pronto, o ideal é trocar a validação local por uma chamada HTTP real. O `loginUser()` deve enviar email e senha para uma rota como:

```txt
POST /auth/login
```

Exemplo de corpo da requisição:

```json
{
  "email": "joao.silva@exemplo.com",
  "password": "123456"
}
```

Exemplo de resposta recomendada:

```json
{
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao.silva@exemplo.com",
    "avatar": "https://images.unsplash.com/..."
  },
  "token": "jwt-ou-token-de-sessao"
}
```

Depois disso, o frontend deve salvar algo mais próximo deste formato:

```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao.silva@exemplo.com",
  "avatar": "https://images.unsplash.com/..."
}
```

E o token deve ser salvo separadamente ou, preferencialmente, gerenciado por cookie HTTP-only configurado pelo backend.

### Pontos importantes para a integração

- Remover `senha` dos dados salvos no navegador.
- Substituir a validação contra `mockUser` por `fetch()` para o backend.
- Criar uma rota de logout que chame `clearAuthenticatedUser()`.
- Proteger rotas como `/home` e `/course` quando não houver usuário/token válido.
- Criar futuramente um `AuthContext` para centralizar usuário logado, token e logout.
- Se o backend usar JWT no `localStorage`, enviar o token nas requisições protegidas com `Authorization: Bearer <token>`.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## Migrando os mocks para um backend

Esta aplicação ainda usa dados mockados para autenticação. O login atual valida `email` e `senha` contra o objeto `mockUser` em `src/data/userMock.ts`.

### 1) O que está mockado hoje

- `src/data/userMock.ts`: contém o usuário estático usado para login.
- `src/services/userService.tsx`: `loginUser()` valida localmente contra `mockUser`.
- `src/components/forms/LoginForm.tsx`: chama `loginUser()` e redireciona para `/home` quando o login é bem-sucedido.

### 2) Primeiro passo: criar a rota de backend

No backend você deve expor uma rota de autenticação, por exemplo:

- `POST /auth/login` ou `POST /user/login`

O corpo da requisição deve ser:

```json
{
  "email": "joao.silva@exemplo.com",
  "password": "123456"
}
```

### 3) Implementar validação do usuário no backend

No servidor, a lógica deve ser:

1. Buscar o usuário pelo email no banco de dados.
2. Comparar a senha recebida com a senha armazenada.
   - Em produção, a senha deve ser armazenada como hash seguro (`bcrypt`, `argon2`, etc.).
3. Se a autenticação falhar, devolver `401 Unauthorized`.
4. Se der certo, devolver dados do usuário e um token de sessão/JWT.

Exemplo de resposta de sucesso:

```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao.silva@exemplo.com",
  "avatar": "https://...",
  "token": "eyJhbGciOi..."
}
```

### 4) Atualizar o serviço frontend para usar a API real

Substitua a lógica mock de `loginUser()` por uma chamada real ao backend em `src/services/userService.tsx`.

No futuro, a função deverá ficar parecida com:

```ts
export async function loginUser(email: string, password: string) {
  const response = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Email ou senha incorretos");
  }

  return response.json();
}
```

### 5) Guardar o usuário e token no frontend

Depois de receber a resposta do backend, você deve:

- salvar o token em `localStorage`, `sessionStorage` ou cookie seguro;
- armazenar os dados do usuário em um contexto global (`AuthContext`) ou estado compartilhado;
- usar o token para autorizar outras requisições.

### 6) Proteger rotas privadas

Rotas como `/home` devem ser protegidas para usuários autenticados.

- Antes de renderizar `/home`, verifique se existe um token válido.
- Se não houver, redirecione para `/login`.

### 7) Migrar o registro também

A mesma abordagem vale para registro:

- criar `POST /auth/register` ou `POST /user`
- enviar `name`, `email` e `password`
- validar e salvar no banco
- retornar usuário e token

### 8) Como testar a migração

1. Faça o backend rodando localmente.
2. Altere `src/services/userService.tsx` para apontar para o URL do backend.
3. Teste login com o mesmo usuário mockado.
4. Confirme que `/home` abre apenas quando o login retorna sucesso.

### 9) Sugestão de evolução

- Crie um `AuthContext` para colocar o usuário autenticado e token.
- Implemente logout e refresh token.
- Substitua o `mockUser` por um serviço real de `GET /me` ou `GET /profile`.

---

Esta documentação serve como guia para migrar do fluxo mockado existente para um backend real, mantendo a mesma experiência de login e permitindo evolução segura para produção.
