import { mockUserCredentials } from "../../data/userMock";

export default function MockCredentialsHint() {
  return (
    <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50/70 p-4 text-sm text-slate-700">
      <p className="font-bold text-[#25304a]">Contas mockadas para teste</p>
      <div className="mt-3 grid gap-2">
        {mockUserCredentials.map(({ user, password }) => (
          <div
            key={user.email}
            className="flex flex-col gap-1 rounded-md bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="font-semibold capitalize text-blue-700">
              {user.role}
            </span>
            <span className="text-slate-600">
              <code>{user.email}</code> / <code>{password}</code>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Estes acessos existem apenas no frontend e serão trocados pela API de
        autenticação futuramente.
      </p>
    </div>
  );
}
