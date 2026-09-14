# Segurança do repositório

## Incidente de credenciais históricas

O histórico antigo continha um arquivo de segredo JWT e credenciais SMTP de
desenvolvimento. Antes de publicar a versão segura:

1. Revogue as credenciais SMTP no provedor.
2. Gere um novo `JWT_SECRET` longo e aleatório no ambiente de execução.
3. Reescreva todas as branches para remover o arquivo e substituir os valores
   históricos.
4. Verifique todo o repositório antes do force-push.

Nenhum segredo novo deve ser registrado neste documento, em `.env.example` ou
em qualquer arquivo versionado.

## Integração local/main (2026-09-02)

A branch de backup preserva o histórico original, inclusive referências antigas.
A árvore integrada não contém `jwt_secret.env` nem credenciais SMTP embutidas.
Rotação de credenciais e limpeza do histórico continuam pendentes e devem ser
coordenadas separadamente. Esta integração não revoga credenciais, não reescreve
histórico e não faz force-push.

## Depois da reescrita

Todos os colaboradores devem descartar clones antigos e clonar novamente. Não
faça merge de branches ou commits criados antes da limpeza, pois eles podem
reintroduzir o histórico removido.

Forks, caches e referências de pull requests podem continuar retendo objetos
antigos. Se necessário, solicite ao suporte do GitHub a remoção das referências
em cache após a rotação das credenciais.
